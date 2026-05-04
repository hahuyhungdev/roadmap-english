---
sessionNumber: 3
title: Tech Stack and Trade-offs
topic: Tools, Decisions, and Business Reasons
phase: PHASE 1 - TECH & BUSINESS
level: B2
description: Explain stack choices with practical trade-offs around speed, maintainability, integration risk, cost, and team capability.
---

# Session 3: Tech Stack and Trade-offs

**Level:** B2

**Focus:** Justify technical choices with real constraints, not trend-based opinions.

<details open>
<summary><strong>1) Vocabulary</strong></summary>

- **tech stack** /tɛk stæk/ (n) - the main technologies used to build and run a product
  - _Example 1:_ Our stack includes Next.js, PostgreSQL, and a managed auth provider.
  - _Example 2:_ We chose the stack based on product needs, not only popularity.
  - _Example 3:_ A good stack is something the team can actually maintain.

- **maintainability** /meɪnˌteɪnəˈbɪləti/ (n) - how easy code is to update, debug, and extend
  - _Example 1:_ We chose a boring library because maintainability mattered more than novelty.
  - _Example 2:_ Maintainability improved after we removed custom one-off patterns.
  - _Example 3:_ A tool is not maintainable if only one engineer understands it.

- **time-to-market** /ˌtaɪm tə ˈmɑːrkɪt/ (n) - how quickly a team can ship a usable product
  - _Example 1:_ Managed auth improved time-to-market for the first release.
  - _Example 2:_ Faster time-to-market helped us validate demand before building too much.
  - _Example 3:_ Speed is useful when the team also protects critical quality.

- **integration risk** /ˌɪntəˈɡreɪʃən rɪsk/ (n) - risk that separate systems may not work together correctly
  - _Example 1:_ Integration risk increased after the payment API changed its error format.
  - _Example 2:_ We reduced integration risk with contract tests.
  - _Example 3:_ Frontend decisions should include API behavior, not only UI code.

- **vendor lock-in** /ˈvɛndər lɑːk ɪn/ (n) - dependence on one provider that is costly to leave later
  - _Example 1:_ The managed service was fast, but vendor lock-in was a real concern.
  - _Example 2:_ We isolated provider-specific code to reduce lock-in.
  - _Example 3:_ Lock-in is acceptable only when the benefit is clear and the exit path is understood.

- **proof of concept** /pruːf əv ˈkɑːnsɛpt/ (n) - small test build used to check whether an idea works
  - _Example 1:_ We ran a proof of concept before adopting the charting library.
  - _Example 2:_ The POC exposed one performance issue on low-end mobile devices.
  - _Example 3:_ A POC gives evidence without full commitment.

- **migration path** /maɪˈɡreɪʃən pæθ/ (n) - plan for moving from the current system to a new one safely
  - _Example 1:_ We needed a migration path before replacing the old checkout flow.
  - _Example 2:_ A clear migration path included rollback, monitoring, and staged rollout.
  - _Example 3:_ Without a migration path, a stack decision becomes risky.

- **backward compatibility** /ˈbækwərd kəmˌpætəˈbɪləti/ (n) - keeping new changes working with older clients or systems
  - _Example 1:_ We preserved backward compatibility for older mobile app versions.
  - _Example 2:_ Breaking compatibility caused login failures in a previous release.
  - _Example 3:_ Compatibility checks are part of release safety.

- **bundle size** /ˈbʌndəl saɪz/ (n) - total JavaScript/CSS size sent to users in a frontend app
  - _Example 1:_ We rejected one UI library because it increased bundle size too much.
  - _Example 2:_ Bundle size affected users on slow networks and low-end phones.
  - _Example 3:_ Smaller bundles can improve first-load experience.

- **decision record** /dɪˈsɪʒən ˈrɛkərd/ (n) - short note explaining why a technical choice was made
  - _Example 1:_ The decision record listed options, trade-offs, risk, and fallback.
  - _Example 2:_ New teammates used the record to understand why we chose the tool.
  - _Example 3:_ Decision records prevent the same debate from repeating.

**Additional useful terms:**

- **fallback option** - backup plan if the first approach fails
- **benchmark** - measured comparison of performance or quality
- **team familiarity** - how comfortable the team is with a tool
- **operational cost** - effort needed to run, monitor, and support a system
- **exit strategy** - plan for leaving a tool or provider later

</details>

<details open>
<summary><strong>2) Grammar & Useful Patterns (B2)</strong></summary>

- **Reason-giving**
  We chose this provider because it reduced setup time and handled common auth flows.

- **Trade-off framing**
  The trade-off was faster launch versus higher vendor dependency.

- **Comparison**
  Option A was easier for the team, while Option B offered more control.

- **Conditionals**
  If we optimize only for speed, migration cost may become expensive later.

- **Evidence-based decision**
  We validated the choice with a small POC and one performance benchmark.

- **Reflection**
  In hindsight, I would document the fallback plan earlier.

### Useful Sentence Patterns

- We had two realistic options...
- We chose this because...
- The constraint was...
- The trade-off was...
- We reduced the risk by...
- The hidden cost was...
- I would revisit this decision if...
- In hindsight, I would...

</details>

<details open>
<summary><strong>3) Collocations, Chunking & Phrasal Verbs</strong></summary>

### Strong Collocations

- evaluate stack options
- compare trade-offs
- reduce migration risk
- protect backward compatibility
- isolate provider-specific code
- run a proof of concept
- document decision rationale
- optimize bundle size
- improve developer experience
- reduce operational cost
- prepare fallback options
- balance speed and control

### Useful Chunking & Sentence Starters

- From a delivery perspective...
- From a maintenance perspective...
- The safest option was...
- The fastest option was...
- The option we ruled out was...
- We accepted this risk because...
- To avoid lock-in, we...
- The final decision was practical because...

### Useful Phrasal Verbs

- **weigh up** -> We weighed up speed, cost, and maintainability.
- **rule out** -> We ruled out one library because of bundle size.
- **stick with** -> We stuck with the current framework for stability.
- **phase in** -> We phased in the new stack one section at a time.
- **build on** -> We built on existing components instead of rewriting everything.

</details>

<details open>
<summary><strong>4) Dialogues</strong></summary>

### Dialogue 1 - Choosing A Stack

**Tech Lead:** Why did you choose this framework?

**You:**
We chose it because it solved the product problem with less custom setup. The team needed routing, SEO support, and faster first load for customer-facing pages.

The trade-off was learning some new patterns, so we started with one section first instead of migrating the whole app.

### Dialogue 2 - Managed Service Decision

**PM:** Why not build authentication ourselves?

**You:**
For this stage, managed auth gives us faster time-to-market and fewer security mistakes. It lets the team focus on the core product experience.

The risk is provider dependency, so we should keep business logic outside provider-specific code and document the exit path.

### Dialogue 3 - Handling A Trendy Tool

**Engineer:** This new library looks popular. Should we switch?

**You:**
I would not switch only because it is popular. I would run a small POC with one real flow, check bundle size, debugging experience, and team familiarity.

If the result is not clearly better, I would stick with the current tool and avoid migration cost.

</details>

<details open>
<summary><strong>5) Debate Prompt</strong></summary>

**When choosing a tech stack, should teams prioritize fast launch or long-term maintainability?**

**Side A:** Fast launch is critical. Early delivery gives feedback, revenue, and momentum.

**Side B:** Maintainability is critical. Poor stack decisions create repeated bugs, slow delivery, and expensive migration later.

_Your turn: What type of product or team would change your answer?_

</details>

<details open>
<summary><strong>6) Reading Text</strong></summary>

A good stack decision is not about using the newest tool. It is about choosing what the team can deliver, support, and change under real constraints. A tool can be technically strong but still wrong if the team cannot maintain it.

Strong teams compare options with evidence. They run small proof-of-concepts, estimate migration cost, check team familiarity, and document why they chose one option. They also think about fallback options before the release becomes risky.

In 2026, stack choices often include managed services, AI APIs, analytics tools, and cloud platforms. These tools can help teams move faster, but they also create dependency, cost, privacy, and operational risk. Good trade-off language helps engineers explain these choices clearly without sounding trend-driven.

</details>

<details open>
<summary><strong>7) Questions & Practice Ideas</strong></summary>

### Core Questions (must-practice)

1. What is one recent stack decision your team made, and why?
2. Which trade-off was hardest in that decision?
3. How do you evaluate maintainability before choosing a tool?
4. What fallback option do you prepare for risky migrations?

### High-Value Discussion Questions

5. What are the benefits and limits of choosing managed services for speed?
6. How do tool choices differ for beginner teams versus experienced teams?
7. When is technical debt acceptable in stack decisions?

### Follow-up Questions (Challenge Assumptions)

8. You said launch speed is critical. What if quality drops after launch?
9. You said maintainability matters most. What if market timing is urgent?
10. If benchmark results are mixed, how do you make the final call?

### Reflection Questions

11. Which stack term is hardest for you to explain in spoken English?
12. What decision habit from this lesson can improve your real work now?
13. In your future career, will you value technical elegance or delivery reliability more?

**Tips for speaking practice:**

- Use one real stack decision and one clear trade-off.
- Explain short-term gain, long-term cost, and fallback option.
- Avoid saying a tool is good only because it is modern or popular.
- Practice one 90-second decision explanation with evidence.

</details>
