---
name: push
description: Stage, commit, and push all current changes to the remote repository
disable-model-invocation: true
argument-hint: "[commit message]"
---

Commit and push the current changes to the remote repository.

## Steps

1. Run `git status` to see all changed/untracked files
2. Run `git diff --staged` and `git diff` to review the actual changes
3. Stage all relevant files (exclude secrets, .env files, large binaries)
4. Create a commit:
   - If `$ARGUMENTS` is provided, use it as the commit message
   - Otherwise, write a concise descriptive commit message based on the changes
   - Always append `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` to the message
5. Push to origin: `git push -u origin main`
6. Verify the push succeeded with `git status`

## Commit message guidelines

- Start with a verb: Add, Update, Fix, Remove, Refactor
- Reference the feature/component affected
- Keep the first line under 72 characters
- Use the HEREDOC format for multi-line messages
