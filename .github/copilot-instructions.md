# Copilot Agent Instructions

## Agent Loop Protocol

Before EVERY step, you MUST:

1. **Read** `.copilot/plan.json` — understand the current plan and your position in it.
2. **Check** `.copilot/PAUSED` — if this file exists, STOP immediately. Do NOT proceed.
3. **Check** `.copilot/inject.md` — if this file exists, read the human instruction, follow it, then DELETE the file.
4. **Update** `.copilot/plan.json` — set the current step status to `"running"` before you start, and `"done"` or `"error"` when finished.

## Plan Format

If no plan exists, create `.copilot/plan.json` with this structure:

```json
{
  "task": "Short description of the overall task",
  "created_at": "ISO timestamp",
  "current_step": 1,
  "steps": [
    {
      "id": 1,
      "action": "create-file",
      "target": "src/component.tsx",
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

## Step Statuses

- `pending` — not started yet
- `running` — currently executing
- `done` — completed successfully
- `error` — failed (set `error` field with reason)
- `paused` — waiting for human
- `skipped` — skipped by human instruction

## Rules

- NEVER skip the PAUSED check.
- NEVER proceed without updating plan.json.
- If a step fails, set status to `"error"`, write the reason, and STOP.
- If `requires_confirmation` is true, pause and wait for human approval.
- Keep steps small and atomic — one file or one logical change per step.
