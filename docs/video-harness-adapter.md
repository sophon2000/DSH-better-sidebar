# Video Harness adapter

This fork keeps `main` as an upstream mirror and carries the product adapter on
`develop`, as requested by its owner. The upstream development/release branch
instructions in AGENTS.md do not change that fork policy.

Version `0.28.2-vh.1` starts at upstream
`b0e0fab50e68f54b07a1fc1e7898030409c7d979` (0.28.2). It targets the existing
Video Harness SDK `0.2.1-rc.2.vh.11.local.20261026.1`; the source peer ranges
continue to describe the upstream public API. Product artifact assembly pins
the shipped peers to the exact Host and records its source and file digests.
Do not install a second SDK or use a floating source dependency in the product.
Version `0.28.2-vh.2` adds raw HTML isolation and viewer-revocation cleanup
without changing Host APIs, native file-routing policy, or the SDK target.
Version `0.28.2-vh.4` combines that maintained-develop security/lifecycle work
with the master Host and native model-selection adaptation from
`05c0fdeb6100f4f70a12f55447b687c7c5c04cd9`. Its other merge parent is
`f6e771973d3880b44e80d552179237f885f725b5`, which contains the reviewed
`8d2f49833499a683be7936c98baf989d12581ccb` fixes. It targets the exact
DSH `0.2.2-alpha.2.vh.1.local.20261031.1` family. Earlier vh.2/vh.3 artifacts
remain unchanged and do not qualify the new combined source.
CSS Modules export keys are sorted by code unit before serialization because
Lightning CSS's map order otherwise changes identical builds' bundle digests.

The native file editor yields MP4/M4V/MOV/WebM to Video Harness. It claims
MP3/WAV only while `matchFileViewer(path)` selects the enabled companion
`dsh-audio-preview:audio` viewer. If that companion is missing, disabled or
removed, those formats return to Video Harness. Other audio formats retain the
normal viewer matching behavior. Consumers check `getTab('editor')`,
`isTabEnabled('editor')` and the matching viewer at click time; service presence
alone does not imply that the editor is enabled.

The fork publishes fixed Host archives only. The inherited npm release workflow
is manual-only and retains its exact upstream repository identity guard. A fork
Release therefore schedules no Actions workflow and never publishes the upstream
npm package. License and upstream source remain in the distributed artifact.
