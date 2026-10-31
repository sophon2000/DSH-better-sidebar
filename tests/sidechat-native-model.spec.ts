/** Sidechat model changes use the native persisted projection after cold resume. */
import { Context } from '@deepseek-ai/cordis'
import {
  AgentModel,
  modelSelectionProjectionDefinition,
  type Agent,
  type AgentOptions,
  type ResumeAgentOptions,
} from '@deepseek-ai/dsh-agent'
import { ReasoningEffortId } from '@deepseek-ai/dsh-llm'
import SessionStore, { Session, SessionId } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import { expect, it, onTestFinished, vi } from 'vitest'
import type { Context as SidebarContext, SidebarSessionPersistenceService } from '../src/context-types.ts'
import { buildSidechatApi } from '../src/sidechat-routes.ts'

it('restores the native selection and records a model change once without adding live effects', async () => {
  const host = new Context()
  onTestFinished(() => host.fiber.dispose())
  await host.plugin(SessionStore)
  await host.plugin(SessionProjectionRegistry)
  const projection = await host.sessionProjections.register(modelSelectionProjectionDefinition)
  const stored = host.sessions.create(SessionId('sidechat-native-model'))
  const persisted = { provider: 'saved-provider', model: 'saved-model', reasoningEffort: ReasoningEffortId('low') }
  stored.append('model/selection', persisted)
  const events = stored.snapshotEvents()
  const options: AgentOptions = { provider: 'default-provider', model: 'default-model' }
  const agentContext = new Context()
  onTestFinished(() => agentContext.fiber.dispose())
  const registrations = vi.spyOn(agentContext, 'on')
  const runtime: { live?: Agent } = {}
  const unused = (): never => { throw new Error('the native-model fixture does not run the Agent') }
  const mount = vi.fn(async (ctx: Context, preset: string) => {
    expect(ctx).toBe(agentContext)
    expect(preset).toBe('saved-preset')
    expect(registrations).toHaveBeenCalledWith('agent/pre-step', expect.any(Function), { prepend: true })
    expect(runtime.live).toBeUndefined()
  })
  const persistence: SidebarSessionPersistenceService = {
    async open(id, access) {
      expect(id).toBe(stored.id)
      expect(access).toBe('read')
      return {
        header: { ...stored.header, agentPreset: 'saved-preset' },
        inheritedEventCount: 0,
        read: async () => ({ events: events.map(event => ({ ...event, data: { ...event.data } })) }),
        close: vi.fn(async () => {}),
      }
    },
  }
  const resume = vi.fn(async ({ resumeSessionId, setup }: ResumeAgentOptions) => {
    expect(resumeSessionId).toBe(stored.id)
    const session = Session.create(resumeSessionId, events, stored.header)
    const model = new AgentModel(() => projection.stateOf(session), session, options)
    const agent: Agent = {
      id: session.id, session, ctx: agentContext, options, model, status: 'idle',
      get inbox() { return unused() },
      cancel: unused, whenIdle: unused, runMaintenance: unused,
      send: unused, followup: unused, steer: unused, inject: unused,
    }
    expect(agent.model.current()).toEqual(persisted)
    await setup?.(agentContext, agent)
    runtime.live = agent
    return { agent, dispose: async () => { runtime.live = undefined } }
  })
  const services: Record<string, unknown> = {
    agents: { get: (id: string) => id === runtime.live?.id ? runtime.live : undefined, resume },
    sessionPersistence: persistence,
    agentPresets: { resolve: async () => ({ id: 'saved-preset' }), mount },
  }
  const routes = new Context()
  onTestFinished(() => routes.fiber.dispose())
  Object.defineProperty(routes, 'get', { value: (name: string) => services[name] })
  const api = buildSidechatApi(routes as SidebarContext)
  onTestFinished(async () => { await api['sidechat.dispose']({ childId: stored.id }) })
  const selected = { provider: 'next-provider', model: 'next-model', reasoningEffort: 'high' }

  await expect(api['sidechat.model']({ childId: stored.id, ...selected })).resolves.toEqual({
    accepted: true, selection: selected,
  })
  expect(resume).toHaveBeenCalledOnce()
  expect(mount).toHaveBeenCalledOnce()
  expect(runtime.live?.model.current()).toEqual(selected)
  expect(runtime.live?.session.snapshotEvents().filter(event => event.type === 'model/selection').map(event => event.data))
    .toEqual([persisted, selected])
  expect(registrations).toHaveBeenCalledOnce()

  registrations.mockClear()
  await api['sidechat.model']({ childId: stored.id, ...selected })
  expect(resume).toHaveBeenCalledOnce()
  expect(runtime.live?.model.current()).toEqual(selected)
  expect(runtime.live?.session.snapshotEvents().filter(event => event.type === 'model/selection').map(event => event.data))
    .toEqual([persisted, selected])
  expect(registrations).not.toHaveBeenCalled()
})
