---
sessionNumber: 4
title: Technical Debt and Change Management
topic: Balancing Delivery Speed and Long-Term Code Health
phase: PHASE 1 - TECH & BUSINESS
level: B1-B2
description: Discuss technical debt in simple language and explain how you align refactor work with product goals.
---

# Session 4: Technical Debt and Change Management

**Level:** B1-B2  
**Focus:** Explain how you handle legacy code, convince stakeholders, and balance short-term delivery with long-term stability.

<details open>
<summary><strong>1) Vocabulary </strong></summary>

- **technical debt** /ˈtɛknɪkəl dɛt/ (n) - old code problems caused by past shortcuts  
  _Example 1:_ We spent too much time patching old checkout logic every sprint.  
  _Example 2:_ I showed debt cost using incident count and support hours.  
  _Example 3:_ Debt became easier to discuss after we attached numbers, not opinions.

- **legacy code** /ˈlɛɡəsi koʊd/ (n) - older code still in use  
  _Example 1:_ The login flow still depends on legacy code from our old monolith.  
  _Example 2:_ One tiny change in legacy code broke two downstream services.  
  _Example 3:_ We mapped risky legacy areas before planning new features.

- **refactor** /ˌriːˈfæktər/ (v/n) - improve structure without changing feature behavior  
  _Example 1:_ We planned a small refactor in payment validation before scale-up.  
  _Example 2:_ We split the refactor into three low-risk pull requests.  
  _Example 3:_ Refactor slowed one sprint, but reduced bug-fix load later.

- **maintenance** /ˈmeɪntənəns/ (n) - ongoing fixes and updates  
  _Example 1:_ Maintenance cost became too high for our order state module.  
  _Example 2:_ We measured maintenance by counting repeated bug categories.  
  _Example 3:_ Better maintenance planning gave us fewer emergency fixes.

- **hotfix** /ˈhɑːtˌfɪks/ (n) - quick fix for urgent production issues  
  _Example 1:_ We shipped a hotfix at midnight to fix duplicate payment capture.  
  _Example 2:_ Too many hotfixes signaled we were ignoring core debt.  
  _Example 3:_ After that, we added hotfix root-cause review to sprint retro.

- **regression** /rɪˈɡrɛʃən/ (n) - old behavior breaks after a change  
  _Example 1:_ We added integration tests to catch regression in discount logic.  
  _Example 2:_ A missed regression delayed release by two days last month.  
  _Example 3:_ Now regression risk is reviewed in every rollout checklist.

- **backlog** /ˈbækˌlɔːɡ/ (n) - list of future work items  
  _Example 1:_ We tracked debt items in backlog with risk level and owner.  
  _Example 2:_ Product accepted backlog cleanup after seeing release incident trends.  
  _Example 3:_ Backlog visibility made debt conversations less emotional.

- **risk** /rɪsk/ (n) - chance of a negative outcome  
  _Example 1:_ Releasing without cleanup increased rollback risk significantly.  
  _Example 2:_ We labeled risk by impact and probability before launch decisions.  
  _Example 3:_ Risk language helped non-engineers understand why cleanup mattered.

- **downtime** /ˈdaʊnˌtaɪm/ (n) - period when system is unavailable  
  _Example 1:_ Legacy query issues caused downtime twice during peak traffic.  
  _Example 2:_ We prioritized fixes based on downtime impact, not developer preference.  
  _Example 3:_ Reducing downtime was the main argument for refactor time.

- **change plan** /tʃeɪndʒ plæn/ (n) - step-by-step approach for updates  
  _Example 1:_ We proposed a change plan with canary rollout and rollback checkpoints.  
  _Example 2:_ The plan included test scope, owner, and communication timing.  
  _Example 3:_ A clear change plan reduced panic during release day.

**Additional useful terms:**

- **code review** /koʊd rɪˈvjuː/ (n) - peer check before merge
- **test coverage** /tɛst ˈkʌvərɪdʒ/ (n) - amount of code protected by tests
- **rollback** /ˈroʊlˌbæk/ (n/v) - return to previous stable version
- **cleanup sprint** /ˈkliːnˌʌp sprɪnt/ (n) - sprint focused on fixes and refactor
- **stability** /stəˈbɪləti/ (n) - reliability over time

</details>

<details open>
<summary><strong>2) Grammar & Useful Patterns (B2)</strong></summary>

- **Present Perfect for ongoing issues**  
  We have seen repeated bugs in this part of the system.

- **Past Simple for one project story**  
  We paused one feature and cleaned up the payment module.

- **Cause and effect**  
  Because the code was tightly coupled, small changes created new bugs.

- **Concession language**  
  Even though refactor takes time, it reduces incident risk.

- **Conditionals for planning**  
  If we do not fix this now, release risk will keep growing.

- **Persuasion structures**  
  I explained that one week of cleanup could save many support hours.

### Useful Sentence Patterns

- This part is hard to maintain because...
- We had a lot of bugs here, so...
- We decided to fix it before adding new features.
- I showed the team that...
- It delayed delivery a bit, but...
- The long-term result was...

</details>

<details open>
<summary><strong>3) Collocations, Chunking & Phrasal Verbs</strong></summary>

### Strong Collocations

- manage technical debt
- refactor legacy code
- reduce regression risk
- improve release stability
- prioritize bug fixes
- build stakeholder trust
- estimate cleanup effort
- plan phased changes
- reduce on-call noise
- protect critical paths
- avoid repeated hotfixes
- align engineering and product

**Examples (real work):**

- In one sprint, we paused a low-impact feature to stabilize a debt-heavy payment module.
- After phased cleanup, incident alerts dropped and release confidence improved.

### Useful Chunking & Sentence Starters

- We saw the same bug again and again...
- The main issue was...
- To explain it to product, I said...
- Our short-term plan was..., then...
- We accepted a delay because...
- One risk we could not ignore was...
- After cleanup, we noticed...
- If we had skipped this, ...

**Examples (using starters):**

- "To explain it to product, I showed one chart: bug recurrence by module over the last three sprints."
- "We accepted a delay because rollback risk in the current state was too high."

### Useful Phrasal Verbs

- **clean up** -> We cleaned up the oldest part of the checkout code.
- **break up** -> We broke up the refactor into small tickets.
- **slow down** -> We slowed down feature work for one sprint.
- **pay off** -> The cleanup paid off during the next release.
- **fall back** -> We prepared a rollback plan to fall back safely.

</details>

<details open>
<summary><strong>4) Typical Dialogues</strong></summary>

### Dialogue 1 - Explain Technical Debt

**Interviewer:** Can you share a case of technical debt?

**You:**  
Yes. Our checkout module had many quick fixes from past deadlines. We had a lot of bugs there, and on-call alerts were frequent.

We set aside one sprint to refactor the core validation logic. It slowed new feature work, but incident count dropped.

### Dialogue 2 - Convincing Stakeholders

**Interviewer:** How did you convince product to allow refactor time?

**You:**  
I showed data: bug count, support hours, and failed releases from that module. I explained that one week of cleanup could save time every sprint.

We agreed on a phased plan. We kept one small feature, but delayed two low-impact items.

### Dialogue 3 - Balancing Speed and Health

**Interviewer:** How do you balance delivery and code quality?

**You:**  
I try to ship in small steps. If the risk is low, we can move fast. If a module is unstable, we fix core problems first.

This approach is not always fastest today, but it avoids bigger delays later.

</details>

<details open>
<summary><strong>5) Reading Text</strong></summary>

Technical debt is normal in real projects, especially when deadlines are tight. The problem starts when teams keep adding new features without fixing old weak areas. Then small changes become risky, and bug fixing takes too much time.

Change management means making this work visible and practical. Engineers can explain the cost in simple terms: incidents, support load, release delays, and stress on on-call. This helps managers understand why refactor work has business value.

Good teams use a balanced plan: fix high-risk code first, keep some feature delivery, and track progress in backlog.

</details>

<details open>
<summary><strong>6) List of Questions + Ideas</strong></summary>

### Core Questions (must-practice)

1. What does technical debt look like in your current codebase?
2. How do you explain debt impact to PMs in business language?
3. When do you choose debt cleanup over new feature delivery?
4. How do you make a safe change plan before refactor starts?

### High-Value Discussion Questions

5. What are the benefits and limits of doing debt cleanup every sprint?
6. How do migration checklists and rollback plans reduce risk in real releases?
7. How does debt management affect engineering learning and team stress?

### Follow-up Questions (Challenge Assumptions)

8. You delayed refactor to hit deadline. What risk did the team accept explicitly?
9. If cleanup work had no visible user impact, how would you defend it to leadership?
10. If a rollback happened anyway, which part of your change brief was missing?

### Reflection Questions

11. Which debt area do you avoid because it feels too risky?
12. What habit helped you discuss debt without sounding defensive?
13. In five years, should teams reward feature speed and debt reduction equally?

**Tips for speaking practice:**

- Anchor answers in one real release, not generic statements.
- Use one checklist item and one rollback step in your explanation.
- Keep the trade-off explicit: short-term roadmap speed vs long-term stability.

---

</details>
