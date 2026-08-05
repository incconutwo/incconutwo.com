# Antigravity Workspace Agent Directives & Rules

> [!CAUTION]
> ## STRICT GIT & DEPLOYMENT PUSH PROTOCOL
> 1. **NEVER AUTO-PUSH**: You are STRICTLY FORBIDDEN from invoking `git push` or `cli.py push` unless the USER'S CURRENT PROMPT explicitly contains the word "push", "commit", or "deploy".
> 2. **NO ASSUMED PERMISSION**: Previous permission to push NEVER carries over to subsequent messages or turns. Each push requires fresh, explicit human approval in the current prompt.
> 3. **SINGLE-USE TOKEN CREATION**: Only when the user explicitly instructs you to push in their CURRENT prompt, you MUST create the single-use token file `.forgesync_push_token` in the project root before running `cli.py push --user-approved`. `cli.py` will automatically consume and delete this token during execution.
> 4. **WORK COMPLETION**: When completing coding, debugging, or optimization tasks without explicit push requests, finish your work, summarize modified files, and ask the user: *"Would you like me to push these changes to GitHub?"*
