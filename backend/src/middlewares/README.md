# Middlewares

Cross‑cutting Express glue. Kept small and composable.

Files
- `authenticateToken.js`: Verifies the JWT access token and attaches `req.user = { id, roles, ... }` so controllers can trust it.

Usage
- Protect a route: `router.get('/path', auth.authenticateToken, controller.fn)`
- Clients must send `Authorization: Bearer <accessToken>`.
