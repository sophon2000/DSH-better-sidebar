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

The native file editor yields MP4/M4V/MOV/WebM to Video Harness. It claims
MP3/WAV only while `matchFileViewer(path)` selects the enabled companion
`dsh-audio-preview:audio` viewer. If that companion is missing, disabled or
removed, those formats return to Video Harness. Other audio formats retain the
normal viewer matching behavior. Consumers check `getTab('editor')`,
`isTabEnabled('editor')` and the matching viewer at click time; service presence
alone does not imply that the editor is enabled.

The fork publishes fixed Host archives only. The upstream npm release workflow
is guarded by the exact upstream repository identity, so publishing a fork
archive does not attempt to publish the upstream npm package. License and
upstream source remain in the distributed artifact.
