# Contributing Guide — Team workflow (local)

We use Pull Requests (PRs) only. Do not push directly to main.

## 1) One-time setup
- Clone the repo:
  - git clone <repo-url>
  - cd "d:\My Workspace\Hackathons\Paw_Protector"
- Frontend deps:
  - cd frontend (or cd backend)
  - npm install

## 2) Start a new task (make a branch)
- From repo root:
  - git switch main
  - git pull
  - git switch -c feature/<short-name>   // or fix/<short-name>, chore/<short-name>

Branch name examples:
- feature/vet-map
- fix/image-upload
- chore/update-readme

## 3) Run the app locally (while coding)
- cd frontend
- npm run dev
- App: http://localhost:5173

## 4) Commit and push your work
- Stage and commit small, focused changes:
  - git add -A
  - git commit -m "feat: add vet list with distance"
- Push the branch:
  - git push -u origin feature/<short-name>

Use simple Conventional Commits: feat, fix, chore, docs, refactor.

## 5) Open a Pull Request (PR)
- On GitHub: compare = your branch, base = main (in the pull request tab on header)
- Add a clear title/description, screenshots if UI
- Request reviewers
- Wait for CI checks to pass (if any)

## 6) Keep your PR up to date (when main changes)
Option A — rebase (clean history):
- git fetch origin
- git rebase origin/main
- Resolve conflicts → git add <files> → git rebase --continue
- Push updated branch:
  - git push -f origin feature/<short-name>   // force-push is OK on your feature branch

Option B — merge (simpler if rebase is confusing): (Do not use option A unless necessary, use merge)
- git fetch origin
- git merge origin/main
- Resolve conflicts → git add <files> → git commit
- git push

Follow your reviewer’s preference; rebase may be required if linear history is enabled.

## 7) Address review comments
- Make changes → commit → push
- Mark conversations as resolved
- Repeat until approved

## 8) Merge and clean up
- Merge via “Squash and merge” on GitHub (delete branch after merge)
- Update local:
  - git switch main
  - git pull
  - git branch -d feature/<short-name>

## 9) Quick cheat sheet
- Create branch: git switch -c feature/<name>
- See status: git status
- See changes: git diff
- Undo unstaged file changes: git restore <file>
- Undo last commit (keep changes): git reset --soft HEAD~1
- Discard local branch (not merged): git branch -D feature/<name>