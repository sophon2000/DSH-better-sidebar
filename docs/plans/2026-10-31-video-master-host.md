# Video fixed master Host candidate

This source candidate targets DSH `0.2.2-alpha.2.vh.1.local.20261031.1`, derived from the fixed official master commit selected by Video. It retains the plugin feature set and uses a new `0.28.2-vh.3` artifact identity.

Side-chat model changes use `Agent.model.select()`, which owns the durable `model/selection` event. The removed `ModelSelectionRef` and its registry are not retained. The reminder hook is installed in the unpublished create/resume setup before preset mounting; the loop restores persisted model choices on resume. Existing native inbox clearing and inherited-image boundaries remain unchanged.

The source peer ranges explicitly support `^0.2.2-alpha.2` and Cordis `^4.0.6-alpha.1`; development dependencies bind the exact Video family and matching vendor packages. The product artifact producer converts those supported ranges into the installed Host's exact peers and must verify one physical runtime instance.

Source checks on 2026-10-31 use the immutable new Host packages. Typecheck and build pass. The primary full Vitest run passed 2837 tests and skipped 17; its sole failure was registry manifest version drift, corrected to this candidate identity and covered by a targeted manifest rerun. Focused tests cover the real native model projection after cold resume and duplicate selection deduplication, native registration, source baseline, metadata and public Host icon sprite geometry.

Artifact production, final installed-Video singleton checks and browser verification remain separate gates. Earlier SDK and plugin qualification records retain their original identities and do not qualify these new bytes.

独立安装器与社区 CI 的 npx 下限固定在官方 `0.2.2-alpha.2`；
Video 开发和正式归档则精确绑定 `0.2.2-alpha.2.vh.1.local.20261031.1`，不把本地候选当成公共 npm 输入。
