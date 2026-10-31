# Video fixed master Host candidate

This source candidate targets DSH `0.2.2-alpha.2.vh.1.local.20261031.1`, derived from the fixed official master commit selected by Video. The combined source uses a new `0.28.2-vh.4` artifact identity.

The normal two-parent merge retains master Host/model-selection source `05c0fdeb6100f4f70a12f55447b687c7c5c04cd9` and maintained develop `f6e771973d3880b44e80d552179237f885f725b5`, including safety/lifecycle commit `8d2f49833499a683be7936c98baf989d12581ccb`. Raw HTML stays sandboxed, and pending, loaded and parked viewers retire when their exact registration is revoked. The three merge conflicts were version-only declarations and resolve to vh.4; neither behavior is dropped.

Side-chat model changes use `Agent.model.select()`, which owns the durable `model/selection` event. The removed `ModelSelectionRef` and its registry are not retained. The reminder hook is installed in the unpublished create/resume setup before preset mounting; the loop restores persisted model choices on resume. Existing native inbox clearing and inherited-image boundaries remain unchanged.

The source peer ranges explicitly support `^0.2.2-alpha.2` and Cordis `^4.0.6-alpha.1`; development dependencies bind the exact Video family and matching vendor packages. The product artifact producer converts those supported ranges into the installed Host's exact peers and must verify one physical runtime instance.

The following source observations belong to the earlier vh.3 tree, before this merge: typecheck and build passed; the primary full Vitest run passed 2837 tests and skipped 17, with its sole registry-manifest version failure corrected in a targeted rerun. Those results do not qualify vh.4. The combined source requires its own focused safety/model tests, complete source checks and new artifact receipts.

## Combined vh.4 source checks

The merged source was checked on native macOS on 2026-10-31 with Node `24.15.0` and pnpm `11.9.0`. The unchanged dependency lock passed a frozen install with lifecycle scripts ignored; no dependency policy or version resolution was changed for the merge. Typecheck, lint and a clean production build passed. Eleven focused suites covering raw HTML responses, viewer revocation, native model selection, sidebar registration and package metadata passed 291 tests. The complete single-worker Vitest run passed all 233 files: 2852 tests passed and 17 platform/optional cases were skipped. The existing browser-only consumer declaration check also passed under its documented scope.

The installed SDK's missing source-map warning and controlled crash-fixture diagnostics remain in the raw logs. These source checks do not establish a real mounted Profile, browser or Windows/Linux runtime result. The artifact producer and Video consumer still require new repeat-pack receipts, installed runtime checks and lifecycle verification for vh.4 before publication/admission.

Artifact production, final installed-Video singleton checks and browser verification remain separate gates. Earlier SDK and plugin qualification records retain their original identities and do not qualify these new bytes.

独立安装器与社区 CI 的 npx 下限固定在官方 `0.2.2-alpha.2`；
Video 开发和正式归档则精确绑定 `0.2.2-alpha.2.vh.1.local.20261031.1`，不把本地候选当成公共 npm 输入。
