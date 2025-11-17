# Contributing Guidelines

1. Fork the repository.
2. Add upstream remote:
   ```
   git remote add upstream https://github.com/Pritom2357/Paw-Protector
   ```
3. Create a feature branch:
   git checkout -b feature/<short-topic>
4. Make changes; commit with clear messages (Conventional Commit optional: feat:, fix:, docs:).
5. Push to your fork.
6. Open a Pull Request to main (describe scope + testing steps).

## PR Checklist
- Env secrets NOT committed.
- Runs locally (frontend + backend).
- Swagger docs updated if new endpoints.
- No hardcoded keys.
- Screenshots if UI changes.

## Issues
Open an issue for bugs / enhancements before large work.
Also , there are a lot of beginner-level issues in the Issues tab on github. Check them out.

## Environment
Copy backend `src/.env.example` → `src/.env`. Same for frontend root.

Thanks from the PawPal Team 😊