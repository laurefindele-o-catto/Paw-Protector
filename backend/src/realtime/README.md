# Realtime

Socket.IO server for anything that should feel instant—typing indicators, live updates, “saved” toasts, etc.

Files
- `socketServer.js`: Creates the Socket.IO instance, handles connection auth (when enabled), and defines core events/rooms.

Conventions
- Authenticate connections when events depend on user identity.
- Use rooms like `user:<id>` so you can target a specific user: `io.to('user:1').emit('event', data)`.
