---
sessionNumber: 3
title: Tech Stack and Trade-offs
topic: Tools, Decisions, and Business Reasons
phase: PHASE 1 - TECH & BUSINESS
level: B1-B2
description: Explain your stack choices and the trade-offs behind technical decisions in simple business language.
---

# Session 3: Tech Stack and Trade-offs

**Level:** B1-B2  
**Focus:** Describe what tools you use and why, with practical trade-offs linked to cost, speed, and reliability.

<details open>
<summary><strong>1) Vocabulary </strong></summary>

- **tech stack** /tɛk stæk/ (n) - main technologies used in a project  
  _Example 1:_ Our stack is Next.js, Node.js, PostgreSQL, and Redis.  
  _Example 2:_ We reviewed the stack after one release had high database timeout rates.  
  _Example 3:_ In interviews, I explain stack choice with business reasons, not trends.

- **scalability** /ˌskeɪləˈbɪləti/ (n) - ability to handle growth  
  _Example 1:_ We needed scalability for flash-sale traffic spikes.  
  _Example 2:_ We added queue processing to protect API stability at peak hours.  
  _Example 3:_ Scalability planning helped us avoid emergency hotfixes on weekends.

- **consistency** /kənˈsɪstənsi/ (n) - keeping UI behavior and design patterns the same across screens  
  _Example 1:_ We improved consistency by using one shared button and form pattern.  
  _Example 2:_ Better consistency reduced UI bugs during cross-page navigation.  
  _Example 3:_ In interviews, I explain consistency as predictability for users.

- **time-to-market** /ˌtaɪm tə ˈmɑːrkɪt/ (n) - how fast a product can launch  
  _Example 1:_ We chose a managed auth service to improve time-to-market.  
  _Example 2:_ It sped up launch, but later we spent time adapting custom role logic.  
  _Example 3:_ Time-to-market wins only matter if quality stays acceptable.

- **maintainability** /meɪnˌteɪnəˈbɪləti/ (n) - how easy code is to update, read, and debug over time  
  _Example 1:_ We improved maintainability by removing repeated form logic.  
  _Example 2:_ Better maintainability reduced time spent on small bug fixes.  
  _Example 3:_ I treat maintainability as a delivery speed multiplier, not optional cleanup.

- **vendor lock-in** /ˈvɛndər lɑːk ɪn/ (n) - dependence on one provider that makes switching expensive  
  _Example 1:_ We avoided vendor lock-in by keeping business logic separate from the cloud SDK.  
  _Example 2:_ The team chose an open-source auth library to reduce vendor lock-in risk.  
  _Example 3:_ In interviews, I explain this trade-off: managed services are fast to start but lock-in costs can grow.

- **proof of concept** /pruːf əv ˈkɑːnsɛpt/ (n) - a small test to check if an idea will work before building the full solution  
  _Example 1:_ We built a two-day proof of concept before committing to the new state library.  
  _Example 2:_ The proof of concept revealed a performance issue in the data-fetching layer.  
  _Example 3:_ Without a proof of concept, we would have built the wrong foundation.

- **backward compatibility** /ˈbækwərd kəmˌpætəˈbɪləti/ (n) - new code still works correctly with older versions or systems  
  _Example 1:_ We kept the old API endpoint to preserve backward compatibility for mobile clients.  
  _Example 2:_ Breaking backward compatibility caused a major incident when iOS users could not log in.  
  _Example 3:_ I always check backward compatibility before removing a shared utility.

- **deployment** /dɪˈplɔɪmənt/ (n) - process of releasing software  
  _Example 1:_ We improved deployment by adding migration checks in CI.  
  _Example 2:_ Canary deployment helped us catch issues before full rollout.  
  _Example 3:_ Better deployment flow reduced on-call stress after release.

- **bundle size** /ˈbʌndəl saɪz/ (n) - total size of frontend code sent to users  
  _Example 1:_ We cut bundle size by lazy-loading heavy chart components.  
  _Example 2:_ Smaller bundle size improved load time on low-end mobile devices.  
  _Example 3:_ In planning, we compare feature value with bundle size cost.

**Additional useful terms:**

- **boilerplate** /ˈbɔɪlərˌpleɪt/ (n) - repeated setup code
- **integration** /ˌɪntəˈɡreɪʃən/ (n) - connecting tools or systems
- **migration** /maɪˈɡreɪʃən/ (n) - moving to a new tool or system
- **benchmark** /ˈbɛntʃˌmɑːrk/ (n) - measured performance comparison
- **fallback** /ˈfɔːlbæk/ (n) - backup option when plan A fails

</details>

<details open>
<summary><strong>2) Grammar & Useful Patterns (B2)</strong></summary>

- **Reason language (because / since)**  
  We chose PostgreSQL because we needed reliable transactions.

- **Comparison language (better than / more than)**  
  This framework was better than our old one for team speed.

- **Concession (although / even though)**  
  Although the tool is powerful, setup takes longer.

- **Conditionals for trade-offs**  
  If we choose speed now, we may pay with more bugs later.

- **Passive voice for decisions**  
  The final stack was selected after a short proof of concept.

- **Past Simple for case explanation**  
  We switched libraries after two failed deployments.

### Useful Sentence Patterns

- We chose... over... because...
- The main trade-off was... versus...
- It helped us..., but it also...
- For this release, we prioritized...
- In the long term, this decision...
- If I did it again, I would...

</details>

<details open>
<summary><strong>3) Collocations, Chunking & Phrasal Verbs</strong></summary>

### Strong Collocations

- choose the right stack
- balance speed and quality
- reduce bundle size
- reduce deployment risk
- handle scaling needs
- improve maintainability
- plan a gradual migration
- run performance benchmarks
- reduce regression risk
- clean up technical debt
- support fast onboarding
- match tools to business goals

**Examples (real work):**

- In one project, we chose managed services to launch faster, then paid down integration debt in the next sprint.
- After adding API contract checks, deployment failures dropped and cross-team handoff became smoother.

### Useful Chunking & Sentence Starters

- We picked this tool because...
- A key reason was...
- The downside was...
- To reduce risk, we...
- In practice, the team needed...
- For this project, good enough meant...
- We reviewed the decision after...
- The business impact was...

**Examples (using starters):**

- "The downside was tighter coupling to one provider, so we documented an exit path from day one."
- "For this project, good enough meant stable release behavior, not perfect architecture purity."

### Useful Phrasal Verbs

- **go with** -> We went with a simple caching layer first.
- **switch to** -> We switched to a managed database service.
- **break down** -> We broke down the migration into small steps.
- **set up** -> I set up CI checks for each pull request.
- **phase out** -> We phased out the old library after stable release.

</details>

<details open>
<summary><strong>4) Dialogues</strong></summary>

### Dialogue 1 - Stack Choice

**Interviewer:** Why did your team choose your current stack?

**You:**  
We chose React and TypeScript because our team needed fast development with fewer runtime mistakes. For data, we chose PostgreSQL because consistency was important for billing.

It was not the easiest setup, but it reduced bugs in release week.

### Dialogue 2 - Real Trade-off

**Interviewer:** Tell me about a technical trade-off.

**You:**  
We had to choose between a full rewrite and a smaller refactor. A rewrite looked cleaner, but it would delay new features for months.

We did a focused refactor instead. We moved faster, but we accepted some old code for now.

### Dialogue 3 - Decision Review

**Interviewer:** Have you ever changed a stack decision later?

**You:**  
Yes. We used a logging tool that was cheap at first, but search was slow when traffic grew. On-call response became harder.

We migrated to a better tool. It cost more, but incident handling improved a lot.

</details>


<details open>
<summary><strong>5) Debate Prompt</strong></summary>

**Should you pick the best technical tool for the job, even if the team doesn't know it yet?**

**Side A:** Using the tool the team already knows is safer and faster. Learning a new tool takes time, and during that time you ship less and make more mistakes.

**Side B:** If you always pick the familiar tool, your team stops growing. Sometimes the right tool really does save months of pain, and the learning cost is worth it.

_Your turn: Which side do you agree with more? Why?_

</details>

<details open>
<summary><strong>6) Reading Text</strong></summary>

Good engineers do not choose tools only because they are popular. They choose tools that fit team size, product goals, and risk level. A strong answer in interviews explains both the benefit and the cost.

In real projects, there is no perfect choice. One option may be faster now but harder to maintain later. Another may be stable but slower to build. Clear trade-off language helps non-technical stakeholders understand why a decision makes sense.

When possible, show one real case from your team. That sounds natural and credible.

</details>

<details open>
<summary><strong>7) Questions & Practice Ideas</strong></summary>

### Core Questions (must-practice)

1. What is your current stack, and why did your team choose it?
2. Which stack decision gave the biggest practical benefit in the last 6 months?
3. How do you explain build vs buy in one real case?
4. How did API contract decisions affect your integration speed?

### High-Value Discussion Questions

5. What are the benefits and limits of using proven tools over newer tools?
6. When does standardizing OpenAPI/Swagger improve delivery, and when can it slow teams down?
7. How do stack decisions influence what juniors and seniors learn over time?

### Follow-up Questions (Challenge Assumptions)

8. You chose the faster tool. What long-term maintenance cost did you accept?
9. If your API contract looked clear but integration still failed, what assumption was wrong?
10. If stakeholders ask for speed only, how do you defend reliability work?

### Reflection Questions

11. Which tool choice do you still doubt, and what would you test next?
12. What trade-off language helps you sound credible in interviews?
13. In the long term, will engineers be judged more by tool knowledge or decision quality?

**Tips for speaking practice:**

- Use one real migration or integration story in every long answer.
- State one benefit and one hidden cost for each choice.
- Explain OpenAPI/Swagger terms in plain language before details.

---

</details>
