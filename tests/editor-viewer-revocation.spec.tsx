// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest'
import { useEffect, useState } from 'react'
import { act } from 'react-dom/test-utils'
import type { Context } from '../src/context-types.ts'
import { EditorHost } from '../src/client/EditorHost.tsx'
import { api } from '../src/client/api.ts'
import { isEditorDirty } from '../src/client/editor-dirty.ts'
import { createBetterSidebarService, type FileViewerDescriptor, type FileViewerProps } from '../src/client/service.ts'
import { allLeaves, createSidebarStore } from '../src/client/state.ts'
import { retargetPathTabs } from '../src/client/tree-mutations.ts'
import { renderRoot, setupReactAct } from './test-utils.ts'

vi.mock('../src/client/api.ts', () => ({
  api: { fsRead: vi.fn() }, mediaUrl: () => '/sidebar/file', downloadUrl: () => '/sidebar/file',
}))
vi.mock('../src/client/ops-stream.ts', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/client/ops-stream.ts')>()
  const snapshot = { revision: 0, touched: new Map() }
  return { ...actual, useFileOpStream: () => snapshot }
})
setupReactAct()
let sequence = 0
beforeEach(() => { localStorage.clear(); vi.mocked(api.fsRead).mockReset() })

function probeViewer() {
  const mounted = vi.fn()
  const disposed = vi.fn()
  function Viewer(props: FileViewerProps) {
    useEffect(() => { mounted(); return disposed }, [])
    return <div data-viewer="old">{String(props.customData ?? 'old')}</div>
  }
  return { component: Viewer, mounted, disposed }
}

function mountWithViewer(viewer: FileViewerDescriptor, sniff = false, visible = true) {
  const sessionId = `viewer-revocation-${++sequence}`
  const store = createSidebarStore()
  const service = createBetterSidebarService(store)
  service.registerTab({ id: 'editor', title: 'Editor', component: () => null })
  service.registerFileViewer({ id: 'fallback', exts: [], priority: -100, fetchStrategy: sniff ? 'fsRead' : 'none', component: () => <div data-viewer="fallback" /> })
  const removeViewer = service.registerFileViewer(viewer)
  store.setSession(sessionId)
  service.openTab({ type: 'editor', title: 'file.wav', path: '/tmp/file.wav', meta: { treeOpen: false } })
  const tab = () => allLeaves(store.getSnapshot().state!.bottomSplits).flatMap(leaf => leaf.tabs).find(tab => tab.type === 'editor')!
  const sessionsSnapshot = { byId: { [sessionId]: { cwd: '/tmp' } }, current: sessionId }
  const ctx = {
    betterSidebar: service, get: (name: string) => name === 'betterSidebar' ? service : undefined,
    sessions: { list: { subscribe: () => () => {}, getSnapshot: () => sessionsSnapshot } },
  } as unknown as Context
  const element = () => <EditorHost ctx={ctx} store={store} scope={{ sessionId, cwd: '/tmp' }} tab={tab()} visible={visible} expanded={[]} revealed={[]} onToggleDir={() => {}} onReferenceFile={() => {}} />
  const mounted = renderRoot(element())
  const disable = () => store.setPrefs({ ...store.getPrefs(), viewersEnabled: { ...store.getPrefs().viewersEnabled, [viewer.id]: false } })
  return { ...mounted, ctx, store, service, sessionId, tab, removeViewer, disable, rerender: () => mounted.rerender(element()) }
}

const flush = async () => { await act(async () => { await Promise.resolve() }) }

it.each(['remove', 'disable'] as const)('retires a loaded viewer on %s, including a parked editor', async action => {
  const probe = probeViewer()
  let signal: AbortSignal | undefined
  const mounted = mountWithViewer({ id: 'audio', exts: ['wav'], priority: 50, fetchStrategy: 'custom', load: async (_path, _scope, received) => { signal = received; return 'old' }, component: probe.component }, false, false)
  try {
    await flush()
    expect(mounted.container.querySelector('[data-viewer="old"]')).not.toBeNull()
    act(() => { if (action === 'remove') mounted.removeViewer(); else mounted.disable() })
    expect(signal?.aborted).toBe(true)
    expect(probe.disposed).toHaveBeenCalledOnce()
    expect(mounted.container.querySelector('[data-viewer="old"]')).toBeNull()
    expect(mounted.container.querySelector('[data-viewer="fallback"]')).not.toBeNull()
  } finally { mounted.unmount() }
})

it.each(['remove', 'disable'] as const)('aborts a pending viewer on %s and ignores its late result', async action => {
  const probe = probeViewer()
  let resolve!: (data: unknown) => void
  const pending = new Promise(resolvePending => { resolve = resolvePending })
  let signal: AbortSignal | undefined
  const mounted = mountWithViewer({ id: 'audio', exts: ['wav'], priority: 50, fetchStrategy: 'custom', load: (_path, _scope, received) => { signal = received; return pending }, component: probe.component })
  try {
    expect(signal?.aborted).toBe(false)
    act(() => { if (action === 'remove') mounted.removeViewer(); else mounted.disable() })
    expect(signal?.aborted).toBe(true)
    await act(async () => { resolve('late-old'); await pending })
    expect(probe.mounted).not.toHaveBeenCalled()
    expect(mounted.container.querySelector('[data-viewer="fallback"]')).not.toBeNull()
  } finally { mounted.unmount() }
})

it.each([false, true])('replaces the descriptor object with the same id (pending=%s)', async pendingOld => {
  const probe = probeViewer()
  let resolve!: (data: unknown) => void
  const pending = new Promise(resolvePending => { resolve = resolvePending })
  const mounted = mountWithViewer({ id: 'audio', exts: ['wav'], priority: 50, fetchStrategy: 'custom', load: () => pendingOld ? pending : Promise.resolve('old'), component: probe.component })
  const newLoad = vi.fn(async () => 'new')
  try {
    await flush()
    act(() => {
      mounted.removeViewer()
      mounted.service.registerFileViewer({ id: 'audio', exts: ['wav'], priority: 50, fetchStrategy: 'custom', load: newLoad, component: () => <div data-viewer="new" /> })
    })
    await flush()
    expect(newLoad).toHaveBeenCalledOnce()
    expect(mounted.container.querySelector('[data-viewer="new"]')).not.toBeNull()
    await act(async () => { resolve('late-old'); await pending })
    expect(mounted.container.querySelector('[data-viewer="old"]')).toBeNull()
    expect(probe.mounted).toHaveBeenCalledTimes(pendingOld ? 0 : 1)
    expect(probe.disposed).toHaveBeenCalledTimes(pendingOld ? 0 : 1)
  } finally { mounted.unmount() }
})

it.each(['custom', 'none'] as const)('tracks the actual head-sniffed viewer (%s)', async strategy => {
  const probe = probeViewer()
  vi.mocked(api.fsRead).mockResolvedValue({ kind: 'binary', size: 3, head: btoa('abc') })
  let signal: AbortSignal | undefined
  const mounted = mountWithViewer({ id: 'sniffer', exts: [], detect: (_path, head) => head[0] === 97, priority: 50, fetchStrategy: strategy, load: async (_path, _scope, received) => { signal = received; return 'old' }, component: probe.component }, true)
  try {
    await flush()
    expect(probe.mounted).toHaveBeenCalledOnce()
    act(() => mounted.removeViewer())
    await flush()
    if (strategy === 'custom') expect(signal?.aborted).toBe(true)
    expect(probe.disposed).toHaveBeenCalledOnce()
    expect(mounted.container.querySelector('[data-viewer="old"]')).toBeNull()
    expect(api.fsRead).toHaveBeenCalledTimes(2)
  } finally { mounted.unmount() }
})

it('does not reload or lose a dirty draft on unrelated registry and preference pulses', async () => {
  const mountedSpy = vi.fn()
  const disposed = vi.fn()
  function Draft({ content, onToolbarState }: FileViewerProps) {
    const [text, setText] = useState(content)
    useEffect(() => { mountedSpy(); return disposed }, [])
    useEffect(() => { onToolbarState?.({ modes: false, mode: 'edit', dirty: text !== content, editable: true, saveState: 'idle' }) }, [onToolbarState, content, text])
    return <button data-draft onClick={() => setText('unsaved-draft')}>{text}</button>
  }
  vi.mocked(api.fsRead).mockResolvedValue({ kind: 'text', content: 'original', size: 8 })
  const mounted = mountWithViewer({ id: 'code', exts: ['wav'], priority: 50, fetchStrategy: 'fsRead', component: Draft })
  try {
    await flush()
    act(() => mounted.container.querySelector<HTMLButtonElement>('[data-draft]')!.click())
    let disposeHigherPriority!: () => void
    act(() => {
      const disposeViewer = mounted.service.registerFileViewer({ id: 'other', exts: ['other'], fetchStrategy: 'none', component: () => null })
      const disposeTab = mounted.service.registerTab({ id: 'other-tab', title: 'Other', component: () => null })
      const disposeIcon = mounted.service.registerFileIcon({ id: 'other-icon', exts: ['wav'], icon: () => null })
      disposeHigherPriority = mounted.service.registerFileViewer({ id: 'higher-priority', exts: ['wav'], priority: 100, fetchStrategy: 'none', component: () => null })
      mounted.store.setPrefs({ ...mounted.store.getPrefs(), viewersEnabled: { other: false } })
      disposeViewer(); disposeTab(); disposeIcon()
    })
    await flush()
    expect(mounted.container.querySelector('[data-draft]')!.textContent).toBe('unsaved-draft')
    expect(api.fsRead).toHaveBeenCalledOnce()
    expect(mountedSpy).toHaveBeenCalledOnce()
    expect(disposed).not.toHaveBeenCalled()
    expect(isEditorDirty(mounted.tab().id, mounted.sessionId)).toBe(true)
    act(() => disposeHigherPriority())
    await flush()
    expect(mounted.container.querySelector('[data-draft]')!.textContent).toBe('unsaved-draft')
    expect(api.fsRead).toHaveBeenCalledOnce()
    expect(mountedSpy).toHaveBeenCalledOnce()
    expect(disposed).not.toHaveBeenCalled()
    act(() => retargetPathTabs(mounted.ctx, mounted.store, '/tmp/file.wav', '/tmp/renamed.wav'))
    mounted.rerender()
    expect(mounted.container.querySelector('[data-draft]')!.textContent).toBe('unsaved-draft')
    expect(api.fsRead).toHaveBeenCalledOnce()
    act(() => mounted.disable())
    expect(disposed).toHaveBeenCalledOnce()
    expect(mounted.container.querySelector('[data-viewer="fallback"]')).not.toBeNull()
    expect(isEditorDirty(mounted.tab().id, mounted.sessionId)).toBe(false)
  } finally { mounted.unmount() }
})
