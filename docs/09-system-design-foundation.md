# ReviewNatin System Design Foundation

This app is not ready for sharding, custom load balancers, or microservices yet. The correct scale work for the current stage is to make the existing Expo + Supabase architecture reliable under mobile conditions: flaky networks, offline study, repeated reads, and queued writes.

## Current Decisions

### Caching

Use mobile-side stale fallback for read-heavy, low-risk data:

- Exam catalog and subject lists
- Published question counts
- Mock exam list metadata
- Review materials and cheat sheets
- Flashcard counts

Do not cache server-authoritative flows that must remain fresh:

- Answer grading
- Entitlement access decisions
- Purchase fulfillment
- Daily limit enforcement
- Question randomization RPC results

### Queues

Use durable AsyncStorage queues for user-generated writes that must not be lost:

- Offline quiz sessions and answers
- Content/question/flashcard/material reports

Queued writes must be idempotent, bounded, and retried with exponential backoff. Failed writes stay queued unless the error is deterministic, such as permission or constraint failure.

### Consistency

ReviewNatin chooses availability for study UX and consistency for money/progress:

- Offline practice can continue and sync later.
- Reports can be accepted locally and submitted later.
- Entitlements are checked from Supabase and should not grant paid access from stale cache.
- Server triggers/RPCs remain the source of truth for grading, XP, mastery, and subscriptions.

### Database Access Paths

Before considering sharding, keep hot reads indexed:

- Active exam lookup by slug
- Subject/topic navigation by exam
- Published question selection by topic
- Flashcard and review material joins by topic
- Mock exam list and ordered questions
- Quiz session daily-limit/progress reads
- User/admin content report queues

## Deferred Until Real Production Scale

- Database sharding
- Custom read replicas
- Custom load balancers
- Microservice split
- Dedicated message broker

Revisit these only after production telemetry shows Supabase limits, slow query plans, or queue volume that cannot be solved with indexes, RPC cleanup, and Edge Function scheduling.
