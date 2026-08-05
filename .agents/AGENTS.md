# Antigravity Workspace Agent Directives & Rules

> [!CAUTION]
> ## STRICT GIT & DEPLOYMENT PUSH PROTOCOL
> 1. **EXPLICIT KEYWORD MANDATE**: You are STRICTLY FORBIDDEN from invoking `git push`, `cli.py push`, or creating `.forgesync_push_token` UNLESS the USER'S CURRENT PROMPT literally contains one of these exact words: `"push"`, `"commit"`, or `"deploy"`.
> 2. **NEGATIVE EXAMPLES (DO NOT PUSH ON THESE)**: Conversational affirmations or implicit agreements—including but not limited to: `"yes"`, `"yes please"`, `"sure"`, `"ok"`, `"do it"`, `"go ahead"`, `"looks good"`, `"update it"`, `"apply changes"`, `"make the fix"`—MUST NEVER trigger a push or token creation.
> 3. **NO ASSUMED PERMISSION**: Previous permission to push NEVER carries over to subsequent messages or turns. Each push requires fresh, explicit human approval with a mandatory keyword in the current prompt.
> 4. **MANDATORY RESPONSES ON IMPLICIT APPROVAL**: If the user responds with an implicit approval (e.g., `"yes"`, `"go ahead"`), finish your work locally and reply:
>    > *"I have completed the changes locally. If you would like me to push these changes to GitHub, please explicitly type 'push' or 'deploy'."*
> 5. **SINGLE-USE TOKEN CREATION**: Only when the user explicitly includes `"push"`, `"commit"`, or `"deploy"` in their CURRENT prompt, create `.forgesync_push_token` in the project root before running `cli.py push --user-approved`. `cli.py` will automatically consume and delete this token.
