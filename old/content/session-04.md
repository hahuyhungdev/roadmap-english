---
sessionNumber: 4
title: Technical Debt and Change Management
topic: Balancing Delivery Speed and Long-Term Code Health
phase: PHASE 1 - TECH & BUSINESS
level: B2
description: Discuss technical debt with evidence and explain safe change plans using scope, rollout, rollback triggers, and business risk.
---

# Session 4: Technical Debt and Change Management

**Level:** B2

**Focus:** Explain debt as delivery risk, not just "messy code", and propose safe change plans that stakeholders can trust.

<details open>
<summary><strong>1) Vocabulary</strong></summary>

- **technical debt** /ˈtɛknɪkəl dɛt/ (n) - shortcuts or design problems that make future work slower or riskier
  - _Example 1:_ The technical debt was visible because small form changes kept creating bugs.
  - _Example 2:_ We accepted some debt to launch, but we documented the cleanup plan.
  - _Example 3:_ Debt is easier to discuss when it is connected to delivery pain.

- **debt signal** /dɛt ˈsɪɡnəl/ (n) - visible symptom that debt is hurting the team
  - _Example 1:_ Repeated bugs in the same flow were a strong debt signal.
  - _Example 2:_ Slow QA sign-off can be a debt signal if the same area breaks often.
  - _Example 3:_ A debt signal is stronger than saying "the code feels ugly."

- **legacy module** /ˈlɛɡəsi ˈmɑːdʒuːl/ (n) - old system part still used in production
  - _Example 1:_ The legacy module worked, but nobody wanted to touch it before release.
  - _Example 2:_ We isolated the legacy module before changing the checkout flow.
  - _Example 3:_ Legacy code needs extra tests before refactor.

- **refactor scope** /riːˈfæktər skoʊp/ (n) - exact boundary of what a refactor will and will not change
  - _Example 1:_ We kept refactor scope limited to validation logic.
  - _Example 2:_ Clear scope stopped the cleanup from becoming a rewrite.
  - _Example 3:_ Small scope makes change easier to review and test.

- **regression risk** /rɪˈɡrɛʃən rɪsk/ (n) - chance that old behavior breaks after a change
  - _Example 1:_ Regression risk was high because the component was shared across five pages.
  - _Example 2:_ We added tests to reduce regression risk.
  - _Example 3:_ The riskiest refactor is one that changes behavior without tests.

- **maintenance burden** /ˈmeɪntənəns ˈbɝːdən/ (n) - ongoing effort needed to keep old or complex code working
  - _Example 1:_ The old validation layer created a high maintenance burden.
  - _Example 2:_ Maintenance burden slowed every new campaign launch.
  - _Example 3:_ Reducing burden can be a business benefit if it speeds delivery.

- **change brief** /tʃeɪndʒ briːf/ (n) - short note explaining what changes, why, risk, tests, and rollback
  - _Example 1:_ The change brief listed affected screens and rollback triggers.
  - _Example 2:_ QA used the brief to focus on the riskiest paths.
  - _Example 3:_ A brief makes risky changes less emotional.

- **rollout plan** /ˈroʊlˌaʊt plæn/ (n) - staged plan for releasing a change safely
  - _Example 1:_ The rollout plan started with 10% of users.
  - _Example 2:_ We paused the rollout when error rate increased.
  - _Example 3:_ A staged rollout is useful when impact is uncertain.

- **rollback trigger** /ˈroʊlˌbæk ˈtrɪɡər/ (n) - agreed condition that tells the team to revert or disable a change
  - _Example 1:_ A 5% payment error increase was our rollback trigger.
  - _Example 2:_ Clear triggers prevent panic decisions.
  - _Example 3:_ Good rollback triggers use user impact, not only logs.

- **stability window** /stəˈbɪləti ˈwɪndoʊ/ (n) - period when risky changes are avoided before important traffic or events
  - _Example 1:_ We set a stability window before the holiday campaign.
  - _Example 2:_ During the window, only low-risk fixes were allowed.
  - _Example 3:_ Stability windows protect critical business periods.

**Additional useful terms:**

- **cleanup plan** - practical plan to pay down debt later
- **test coverage gap** - missing tests in a risky area
- **blast radius** - how much of the product can be affected by a change
- **feature freeze** - period where new changes are limited
- **deprecation plan** - safe process for retiring old code or APIs

</details>

<details open>
<summary><strong>2) Grammar & Useful Patterns (B2)</strong></summary>

- **Cause and effect**
  Because validation logic was duplicated, small updates created repeated regressions.

- **Evidence-based debt**
  The strongest evidence was five reopened bugs in the same flow.

- **Prioritization**
  We prioritized this debt because it affected checkout and slowed QA every sprint.

- **Risk framing**
  This refactor is small, but regression risk is high because the component is shared.

- **Rollout condition**
  If payment error rate increases above 5%, we will roll back the feature flag.

- **Balanced trade-off**
  The cleanup slows one sprint, but it reduces repeated rework in future releases.

### Useful Sentence Patterns

- The debt signal was...
- The cost of doing nothing is...
- We prioritized this because...
- The refactor scope is limited to...
- The rollout plan includes...
- Our rollback trigger is...
- The business value is...
- The follow-up owner is...

</details>

<details open>
<summary><strong>3) Collocations, Chunking & Phrasal Verbs</strong></summary>

### Strong Collocations

- identify debt signals
- prioritize high-risk debt
- limit refactor scope
- reduce regression risk
- lower maintenance burden
- write a change brief
- define rollback triggers
- protect a stability window
- measure cleanup impact
- track debt ownership
- reduce blast radius
- plan phased migration

### Useful Chunking & Sentence Starters

- We first noticed debt when...
- The strongest evidence was...
- The risky area is...
- The safest first step is...
- To control blast radius, we...
- We are not rewriting everything; we are...
- The cleanup pays off because...
- If leadership asks why now, I would say...

### Useful Phrasal Verbs

- **clean up** -> We cleaned up duplicated validation rules.
- **roll back** -> We rolled back after the error rate crossed the trigger.
- **phase out** -> We phased out the old module over two releases.
- **patch up** -> We patched up the urgent bug before the deeper refactor.
- **lock down** -> We locked down risky changes before the campaign.

</details>

<details open>
<summary><strong>4) Dialogues</strong></summary>

### Dialogue 1 - Explaining Debt To Product

**PM:** Why do we need time for this cleanup?

**You:**
The issue is not just code style. This validation logic caused four reopened bugs last sprint and slowed QA on two releases.

If we clean up this specific area, we can reduce regression risk and make future checkout changes faster.

### Dialogue 2 - Safe Refactor Plan

**Tech Lead:** How would you refactor this without blocking delivery?

**You:**
I would limit the scope to one shared component first. The change brief should include affected screens, test cases, owner, and rollback trigger.

We can release behind a feature flag and expand only if error rate and QA results stay stable.

### Dialogue 3 - Leadership Pushback

**Leadership:** Can this cleanup wait?

**You:**
It can wait if we accept the risk, but the cost is repeated QA rework and slower campaign changes. My suggestion is not a full cleanup sprint.

I would take one high-risk debt item and pair it with the next related feature so the cleanup has immediate product value.

</details>

<details open>
<summary><strong>5) Debate Prompt</strong></summary>

**When deadlines are tight, should teams prioritize feature delivery or technical debt cleanup?**

**Side A:** Feature delivery should come first. Users and business teams need visible progress.

**Side B:** Some cleanup must happen even under pressure because debt can create repeated incidents and slower future releases.

_Your turn: What kind of debt is safe to delay, and what kind should not be delayed?_

</details>

<details open>
<summary><strong>6) Reading Text</strong></summary>

Technical debt is not only a code problem. It is a delivery problem when it creates repeated bugs, slow QA, risky releases, or fear of changing important flows. If you explain debt only as "messy code", stakeholders may not understand why it matters.

A practical debt story needs evidence. You can mention reopened bugs, release delays, support tickets, regression risk, or time spent on manual checks. Then you can propose a small change plan: limited scope, tests, rollout stages, rollback trigger, and owner.

In 2026, debt can also come from AI-generated code, rushed integrations, provider-specific shortcuts, analytics scripts, and feature flags that never get removed. The solution is not always a big rewrite. Often the best first step is making the debt visible and reducing the riskiest part.

</details>

<details open>
<summary><strong>7) Questions & Practice Ideas</strong></summary>

### Core Questions (must-practice)

1. What debt signal appears most often in your recent work?
2. How do you choose which debt item to fix first?
3. What should every change brief include?
4. Which rollback trigger would you use for a critical feature?

### High-Value Discussion Questions

5. What are the benefits and limits of running cleanup sprints?
6. How does debt management differ for beginner versus experienced engineers?
7. When is it reasonable to accept debt for faster delivery?

### Follow-up Questions (Challenge Assumptions)

8. You said debt cleanup helps stability. How do you prove business value quickly?
9. You said small refactors are safer. What if the root issue is architectural?
10. If leadership rejects cleanup time, how do you respond practically?

### Reflection Questions

11. Which debt-related phrase is hardest for you to say naturally in English?
12. What one habit from this lesson can improve your next sprint?
13. Over five years, will your career reward speed or sustainable quality more?

**Tips for speaking practice:**

- Use one real debt signal, not a vague complaint about code.
- Keep structure: signal -> risk -> small plan -> rollback -> outcome.
- Mention business value in terms of speed, stability, QA time, or support load.
- Avoid asking for "cleanup time" without a focused scope.

</details>
