# Security dependency remediation, 2026-10-22

This draft updates the default-branch lock, not an attested production installation. Next 15.5.28, MCP SDK 1.32.0, Auth.js beta32, Drizzle ORM 0.45.2/Kit 0.31.11 and Blob 2.8.2 replace affected dependencies. The patched supported Node engine and Docker 24.22.1 base are declared; Docker is unavailable here, so the container image has not been rebuilt.

The build command is now only `next build`. It previously ran `drizzle-kit push` before compilation. Schema changes remain an explicit separate command and must not execute automatically during preview/build validation. No migration or database push was run.

This application is an MCP client, not an SDK HTTP server, so server `maxToolInputElements` configuration is not applicable here. Its actual client wrapper now validates arguments as an object or omitted value before sending them to the SDK. Public next-themes types replace a removed internal import. Dead cleanup referencing an undeclared keepalive timer is removed.

## Validation and limitations

- Clean frozen pnpm 9 installation with scripts disabled passes on Node 24.22.1.
- `npm run test:security` passes against actual route/client source and installed libraries: unauthorized/missing/invalid MIME/over-5-MiB uploads reject; an accepted upload forwards the existing storage contract to a mock. The real MCP SDK initializes, lists/caches tools and executes one synthetic tool through mocked HTTP. Invalid null, array and scalar arguments reject before transport. No real storage, MCP, search or provider calls occur.
- Standalone TypeScript still reports 43 diagnostics in prototype chat, authentication/schema, provider response shapes and undeclared Neon modules. The baseline source already passed a user table containing only id/email/password to the adapter, but the baseline dependency compiler has not been reproduced. The adapter error is not claimed to be a verified baseline failure, and no database columns were invented to hide it.
- The complete production build passes with a fonts-only outbound allowlist and synthetic loopback database URLs. No database command is part of that build.
- Existing Next configuration sets `ignoreBuildErrors: true`; a successful build therefore cannot prove type safety. No additional suppression or source exclusion was added. Read-only Next lint cannot start because no ESLint configuration exists. The mutating `--write --unsafe` package lint command was not run.

Corrected local advisory matching finds 0 critical, 2 high, 4 moderate and 3 low matches. The remaining high findings are no-fixed braces in development glob tooling and jsondiffpatch 0.6.0 prototype pollution owned by AI SDK 4. An owning AI migration must update the chat/artifact stream contracts together, rather than overriding a transitive major blindly. Tooling also retains old esbuild and selector-parser matches. Development classification is not reachability proof.

## Release and rollback

This draft is not release-ready. The production build also warns that JOSE references CompressionStream/DecompressionStream unsupported in Edge; authentication/middleware behavior needs isolated runtime acceptance. Anonymous built-server login/health smoke is not yet complete. Resolve the standalone type errors and lint setup, complete the owning AI migration or an explicit reviewed exposure decision, and test authentication, upload and synthetic chat/artifact flows in an isolated preview. Rebuild the container and attest actual deployed Node/framework/SDK versions after separate release approval.

Branch CI or automatic previews may run; no production release is authorized by this change. Release a reviewed pinned commit through normal CI only after the gates pass. Rollback restores the previous artifact and reverts manifests, lock, Docker/client/theme changes together; avoid executing the old build command's database push during rollback. No database migration is part of this patch.
