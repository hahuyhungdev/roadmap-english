---
sessionNumber: 2
title: System and Stakeholders
topic: Explaining Architecture and Team Communication
phase: PHASE 1 - TECH & BUSINESS
level: B2
description: Explain system flow, dependencies, risk, and stakeholder updates in simple product-friendly English.
---

# Session 2: System and Stakeholders

**Level:** B2

**Focus:** Explain how a feature works end to end and adapt the same technical reality for PM, QA, support, design, and engineering.

<details open>
<summary><strong>1) Vocabulary</strong></summary>

- **system flow** /ˈsɪstəm floʊ/ (n) - how actions and data move through a product
  - _Example 1:_ I explain system flow from the user journey first, then add technical layers.
  - _Example 2:_ The system flow starts with checkout, then moves through order validation and payment.
  - _Example 3:_ A clear flow helps QA test the right states.

- **user journey** /ˈjuːzər ˈdʒɝːni/ (n) - the steps a user takes to complete a goal
  - _Example 1:_ The user journey starts when a customer selects a plan and clicks subscribe.
  - _Example 2:_ We found confusion in the journey after the payment step.
  - _Example 3:_ Starting with the journey makes architecture easier for non-engineers.

- **API contract** /ˌeɪ piː ˈaɪ ˈkɑntrækt/ (n) - agreement about request data, response shape, and error behavior
  - _Example 1:_ We confirmed the API contract before connecting the frontend.
  - _Example 2:_ A contract mismatch caused the UI to show the wrong error message.
  - _Example 3:_ Stable contracts reduce integration stress.

- **dependency risk** /dɪˈpɛndənsi rɪsk/ (n) - risk caused by another team, service, or vendor you rely on
  - _Example 1:_ Our biggest dependency risk was the payment provider sandbox.
  - _Example 2:_ I flagged the risk before it became a release blocker.
  - _Example 3:_ Dependency risk should be visible early, not discovered during final QA.

- **handoff note** /ˈhændˌɔːf noʊt/ (n) - short document that transfers context to another person or team
  - _Example 1:_ I wrote a handoff note with screenshots, expected behavior, and open questions.
  - _Example 2:_ Support used the note to answer users after release.
  - _Example 3:_ Good handoff notes reduce repeated Slack questions.

- **UI state** /ˌjuːˈaɪ steɪt/ (n) - visible condition in the interface such as loading, empty, success, or error
  - _Example 1:_ We documented loading, empty, error, and permission states.
  - _Example 2:_ Missing UI states are a common cause of frontend rework.
  - _Example 3:_ QA needs UI states more than implementation details.

- **status update** /ˈsteɪtəs ˈʌpˌdeɪt/ (n) - short progress message with blockers, risk, and next step
  - _Example 1:_ My update includes done, blocked, risk, owner, and next action.
  - _Example 2:_ A good status update helps people know whether they need to act.
  - _Example 3:_ Silence creates more risk than an imperfect update.

- **risk visibility** /rɪsk ˌvɪzəˈbɪləti/ (n) - making important risks clear early
  - _Example 1:_ We improved risk visibility by tracking unresolved API questions.
  - _Example 2:_ PM appreciated seeing the timeline risk before release week.
  - _Example 3:_ Risk visibility is not panic; it is planning.

- **audience-aware language** /ˈɔːdiəns əˈwɛr ˈlæŋɡwɪdʒ/ (n) - choosing words based on what the listener needs
  - _Example 1:_ For PM, I talk about timeline and impact.
  - _Example 2:_ For QA, I talk about expected behavior and edge cases.
  - _Example 3:_ For support, I talk about what users see and what answer they can give.

- **escalation path** /ˌɛskəˈleɪʃən pæθ/ (n) - agreed route for raising urgent issues to the right owner
  - _Example 1:_ We created an escalation path for payment failures.
  - _Example 2:_ A clear escalation path reduced confusion during launch.
  - _Example 3:_ Escalation should include evidence, impact, and next decision.

**Additional useful terms:**

- **mock API** - fake API response used before the real service is ready
- **source of truth** - the place or document everyone treats as the official answer
- **edge case** - unusual but possible situation the system should handle
- **release readiness** - whether the feature is safe enough to launch
- **open question** - unresolved point that may affect implementation or testing

</details>

<details open>
<summary><strong>2) Grammar & Useful Patterns (B2)</strong></summary>

- **Sequencing a flow**
  First the user submits the form, then the frontend calls the API, and finally the UI shows success or error.

- **Audience adaptation**
  For PM, I would explain timeline risk; for QA, I would explain edge cases.

- **Dependency language**
  The frontend is ready, but final testing depends on the payment API response.

- **Risk without panic**
  This is not blocked yet, but it could affect release readiness if the contract changes again.

- **Status update structure**
  Done: UI states are implemented. Risk: real payment errors are not tested yet. Next: backend confirms error codes today.

- **Clarifying uncertainty**
  We know the happy path works, but we still need to verify slow responses and permission errors.

### Useful Sentence Patterns

- At a high level, the flow works like this...
- The user starts by...
- The frontend is responsible for...
- The backend/service is responsible for...
- The main dependency is...
- The risk is not urgent yet, but...
- For PM/QA/support, I would explain it as...
- The next decision we need is...

</details>

<details open>
<summary><strong>3) Collocations, Chunking & Phrasal Verbs</strong></summary>

### Strong Collocations

- explain an end-to-end flow
- map the user journey
- clarify API contracts
- document UI states
- track dependency risk
- send concise updates
- align stakeholder expectations
- raise blockers early
- keep one source of truth
- confirm release readiness
- translate technical risk
- reduce repeated questions

### Useful Chunking & Sentence Starters

- The simplest way to explain it is...
- From the user's point of view...
- From the frontend side...
- The risky part is...
- The open question is...
- For support, the key message is...
- For QA, the key scenario is...
- I would escalate this if...

### Useful Phrasal Verbs

- **map out** -> We mapped out the flow before implementation.
- **sync up with** -> I synced up with QA on error states.
- **flag up** -> I flagged up the API contract risk early.
- **hand off to** -> I handed off screenshots and notes to support.
- **follow through on** -> I followed through on the open API questions.

</details>

<details open>
<summary><strong>4) Dialogues</strong></summary>

### Dialogue 1 - System Flow

**Designer:** Can you explain how this subscription flow works?

**You:**
At a high level, the user selects a plan, enters payment details, and confirms the subscription. The frontend collects the form data, validates simple errors, and sends the request to the backend.

The backend checks the plan, talks to the payment provider, and returns success, pending, or failure. The frontend then shows the right UI state so users know what happened.

### Dialogue 2 - Stakeholder Update

**PM:** Are we ready for release?

**You:**
The main UI is ready, and QA has tested the happy path. The open risk is payment failure handling because the provider sandbox returned different error codes from the contract.

Next step: backend will confirm the final error codes today. If they change again, we may need one more QA pass before release.

### Dialogue 3 - Support Handoff

**Support:** What should we tell users if payment is stuck?

**You:**
Tell them their payment is still pending and they should not retry immediately. We show a pending state when the provider has not confirmed the result yet.

I will share a short handoff note with screenshots, user-facing wording, and the cases that should be escalated to engineering.

</details>

<details open>
<summary><strong>5) Debate Prompt</strong></summary>

**Should engineers share one full technical explanation with everyone, or tailor the message by audience?**

**Side A:** One full explanation keeps everyone on the same facts and avoids hidden context.

**Side B:** Tailored communication is more useful because PM, QA, support, and engineers need different details to act.

_Your turn: What should stay the same for everyone, and what should change by audience?_

</details>

<details open>
<summary><strong>6) Reading Text</strong></summary>

Strong engineers do not only understand systems. They can explain systems clearly to different people. A PM may need scope, timeline, and business risk. QA may need edge cases and expected behavior. Support may need user-facing wording and escalation rules. Backend may need request and response details.

A useful system explanation usually starts with the user journey. After that, you can add the technical layers: frontend responsibility, backend responsibility, external services, UI states, and failure paths. This order keeps the explanation natural and prevents technical overload.

Good stakeholder communication also makes risk visible early. A short update like "UI is done, but payment failure states still need real API testing" is more useful than saying "almost done." Clear risk language helps the team make better decisions before release pressure becomes too high.

</details>

<details open>
<summary><strong>7) Questions & Practice Ideas</strong></summary>

### Core Questions (must-practice)

1. How would you explain your current system flow in under 90 seconds?
2. Which stakeholder is hardest for you to communicate with, and why?
3. What dependency risk have you faced in a real project?
4. What should a good status update include?

### High-Value Discussion Questions

5. What are the benefits and limits of one communication style for all stakeholders?
6. How does stakeholder communication differ between beginner and experienced engineers?
7. When should teams escalate risk early, even before full evidence exists?

### Follow-up Questions (Challenge Assumptions)

8. You said short updates are better. What important detail might be missed?
9. You said mock APIs help. What quality risks can this create?
10. If stakeholders disagree on priority, how do you choose the final direction?

### Reflection Questions

11. Which part of system explanation is hardest for you in English?
12. What communication habit will you improve this month?
13. In the future, will technical depth or stakeholder clarity matter more in senior roles?

**Tips for speaking practice:**

- Start from the user journey, then add technical layers.
- Use one real dependency case and one real stakeholder update.
- Say what is done, what is risky, who owns it, and the next action.
- Practice explaining the same issue once for PM, once for QA, and once for support.

</details>
