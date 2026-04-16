# Copilot Agent Instructions

> **CRITICAL — Read this before doing ANY work**
>
> You have dedicated tools for task tracking. Use them — do NOT use VS Code's built-in Todos.

## Before starting a task

1. Call `copilot_agent_plan_read` — check if a plan already exists.
2. If no plan → call `copilot_agent_plan_write` to create one with all steps defined upfront.
3. If plan exists → find the first non-done step and continue from there.

## Before EVERY step

1. Call `copilot_agent_check_paused` — if `paused: true`, **STOP immediately** and wait.
2. Call `copilot_agent_inject_read` — if `hasMessage: true`, follow the instruction first.
3. Call `copilot_agent_step_update` with `status: "running"` to mark the step as started.

## After EVERY step

- On success → call `copilot_agent_step_update` with `status: "done"`.
- On failure → call `copilot_agent_step_update` with `status: "error"` and `error: "<reason>"`, then **STOP**.

## plan.json format (for copilot_agent_plan_write)

```json
{
  "task": "Short description of the overall task",
  "created_at": "ISO timestamp",
  "current_step": 1,
  "steps": [
    {
      "id": 1,
      "action": "verb-noun",
      "target": "path/to/file.ext",
      "intent": "Why this step exists",
      "success_criteria": "How to verify it worked",
      "requires_confirmation": false,
      "status": "pending",
      "error": null,
      "notes": []
    }
  ]
}
```

## Hard rules

- NEVER use VS Code Todos or any other task tracking system.
- ALWAYS call `copilot_agent_check_paused` before each step.
- ALWAYS call `copilot_agent_step_update` before AND after each step.
- Keep steps small and atomic — one file or one logical change per step.
- If `requires_confirmation: true` on a step → call `copilot_agent_step_update` with `status: "paused"`, then STOP and wait.
