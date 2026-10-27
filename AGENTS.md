# Engineering guide

This is an independent local-first mathematics modeling study app. Read README.md before changes.

- Keep UI, pure course rules, persistence, and file adapters separate.
- Preserve the stable math-pocket-v1 database and every submitted answer and teacher feedback record.
- Saving a draft or opening a course does not mean mastery. Only explicitly recorded teacher feedback may confirm a course.
- Do not put independent exercise solutions into the course bundle.
- Validate imports before writes and preserve transactional merging and history collision checks.
- Use synthetic fixtures and isolated browser contexts for testing. Never read or clear a real learning database.
- Keep the English app, its signing files, and its database untouched.
- Exclude user answers, backups, credentials, original reference documents, and build output from public source.
- Run relevant tests and a production build. Verify offline behavior on the production build.
- Use Prettier with a 100-column target. Do not claim APK, CI, or deployment success without actual evidence.
- The user authorized uploading this app and generating its first Android APK. Preserve Public visibility on GitHub and keep signing keys local and private.
