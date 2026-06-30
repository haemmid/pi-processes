# Manual QA

## Process tool actions

Use `test/prompts/process-tool-qa.md` as the prompt to send to the agent when validating the process tool in Pi.

### Notes

- The prompt uses the repo's existing shell scripts under `test/` so no extra fixture setup is required.
- Background process start remains LLM-only; the user should not run shell commands manually.
- The `process` tool now supports force-kill directly with `force=true`.
