# Events

Lightweight in‑process pub/sub so features don’t have to know about each other.

Files
- `eventBus.js`: A single EventEmitter instance shared across the app.
- `eventsNames.js`: Central list of event names so we don’t typo strings everywhere.

How we use it
- Controllers and models emit events (e.g., `USER_PROFILE_UPDATED`, `CARE_PLAN_GENERATED`).
- Listeners in notifications or analytics subscribe and react—send an email, emit a socket event, update a cache, etc.

Tip
- If you later scale to multiple server instances, swap EventEmitter with Redis Pub/Sub or a message queue and keep the same event names.
