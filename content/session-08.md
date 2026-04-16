---
sessionNumber: 8
title: Root Cause Analysis & Impact
topic: Diagnosing Incidents with Clear Business Impact
phase: PHASE 2 - ANALYTICAL THINKING IN IT
level: B1-B2
description: Explain incident investigation steps (logs, timeline, root cause) and quantify impact with numbers like downtime, users affected, and business loss.
---

# Session 8: Root Cause Analysis & Impact

**Level:** B1-B2  
**Focus:** Structured debugging + impact quantification.
**Scope:** Explain incident investigation steps (logs, timeline, root cause) and quantify impact with numbers like downtime, users affected, and business loss.

<details open>
<summary><strong>1) Vocabulary </strong></summary>

- **root cause** /rˈut kˈɑz/ (n) - the main reason a failure happened  
  _Example 1:_ The root cause was a missing index on a high-traffic query.  
  _Example 2:_ We confirmed root cause by comparing query plans before and after deploy.  
  _Example 3:_ In interviews, I explain root cause with evidence, not guesses.

- **timeline** /ˈtaɪmˌlaɪn/ (n) - clear sequence of what happened and when  
  _Example 1:_ We built a timeline from deployment logs and alert timestamps.  
  _Example 2:_ It showed the first failure happened four minutes after migration.  
  _Example 3:_ A clear timeline helped leadership understand impact quickly.

- **log review** /lˈɔɡ rɪvjˈu/ (n) - checking logs to find patterns and errors  
  _Example 1:_ Log review linked API timeouts to one database lock.  
  _Example 2:_ We reviewed backend logs with payment gateway response codes side by side.  
  _Example 3:_ It reduced debate because all teams looked at the same evidence.

- **hypothesis** /haɪpˈɑθəsəs/ (n) - testable explanation of what might be wrong  
  _Example 1:_ Our first hypothesis was cache failure, but metrics disproved it.  
  _Example 2:_ We tested each hypothesis in order of impact and probability.  
  _Example 3:_ Good debugging means changing hypotheses when data changes.

- **reproduction steps** /rˌiprədˈʌkʃən stˈɛps/ (n) - repeatable steps to trigger the issue  
  _Example 1:_ QA wrote reproduction steps for one specific coupon flow.  
  _Example 2:_ These steps helped engineers verify the fix quickly.  
  _Example 3:_ We now require reproduction steps in every RCA note.

- **impact window** /ˈɪmpækt wˈɪndoʊ/ (n) - exact time period users were affected  
  _Example 1:_ The impact window was from 10:12 to 10:54 AM.  
  _Example 2:_ This number helped support answer customer complaints accurately.  
  _Example 3:_ Impact window is clearer than saying "about one hour".

- **affected users** /əfˈɛktɪd ˈjuːzɚz/ (n) - number of users impacted by a failure  
  _Example 1:_ We estimated about 8,000 affected users during the incident window.  
  _Example 2:_ Product used this number to plan customer communication.  
  _Example 3:_ I always mention affected users when explaining impact.

- **business impact** /ˈbɪznəs ˈɪmpækt/ (n) - measurable effect on users, revenue, or support load  
  _Example 1:_ Business impact included checkout drop and a spike in support tickets.  
  _Example 2:_ Sharing impact clearly helped leadership prioritize response.  
  _Example 3:_ Even rough impact estimates improve decision quality.

- **mitigation** /mˌɪtɪɡˈeɪʃən/ (n) - short-term action to reduce damage fast  
  _Example 1:_ Our first mitigation was disabling one faulty validation branch.  
  _Example 2:_ Mitigation restored partial service before full fix deployment.  
  _Example 3:_ We separate mitigation from final fix in all incident reviews.

- **corrective action** /kɚˈɛktɪv ˈækʃən/ (n) - long-term change that removes the root weakness  
  _Example 1:_ Corrective action included query optimization and migration checks in CI.  
  _Example 2:_ We assigned owners and due dates for each corrective action.  
  _Example 3:_ Corrective actions matter more than long discussions in post-incident meetings.

**Additional useful terms:**

- **error rate** /ˈɛrɚ reɪt/ (n) - percentage of requests that fail
- **status update** /ˈsteɪtəs ˈʌpˌdeɪt/ (n) - short progress message during incident response
- **evidence** /ˈɛvədəns/ (n) - facts that support your conclusion
- **confidence level** /kˈɑnfədəns lˈɛvəl/ (n) - certainty of your diagnosis
- **RCA summary** /ˌɑɹ si ˈeɪ sˈʌmɚi/ (n) - short final report of cause, impact, and actions

</details>

<details open>
<summary><strong>2) Grammar & Useful Patterns (B2)</strong></summary>

- **Past Simple for incident story**  
  The issue started at 10:12 AM after deployment.

- **Past Continuous for ongoing failure**  
  Users were seeing payment errors during checkout.

- **Cause and effect**  
  Because one cache key expired early, requests failed.

- **Quantification language**  
  The issue affected about 18% of traffic.

- **Sequence connectors**  
  First we mitigated, then we identified root cause, and finally we deployed a fix.

- **Future prevention language**  
  We will add monitoring so the same issue is detected faster.

### Useful Sentence Patterns

- The incident started when...
- The root cause was...
- We confirmed it by...
- Business impact was...
- Our immediate mitigation was...
- To prevent this again, we...

</details>

<details open>
<summary><strong>3) Collocations, Chunking & Phrasal Verbs</strong></summary>

### Strong Collocations

- identify root cause
- build incident timeline
- review logs and metrics
- test debugging hypotheses
- reproduce issue steps
- quantify impact window
- estimate affected users
- explain business impact
- apply short-term mitigation
- define corrective actions
- document evidence
- assign action owners

**Examples (real work):**

- In one payment incident, we first built the timeline, then reviewed API and database logs.
- That sequence helped us stop guessing and quantify impact with numbers leadership could act on.

### Useful Chunking & Sentence Starters

- At first, we thought...
- After log analysis, we found...
- The main impact window was...
- Our first mitigation was...
- The corrective action was...
- Evidence showed that...
- A key lesson was...
- Next time, we will...

**Examples (using starters):**

- "After log analysis, we found lock contention started right after one schema change."
- "The corrective action was adding migration guardrails and query performance alerts."

### Useful Phrasal Verbs

- **trace back** -> We traced back the error spike to one deployment step.
- **rule out** -> We ruled out cache issues after checking hit-rate metrics.
- **narrow down** -> We narrowed down the failure to one endpoint and one query.
- **patch up** -> We patched up the query path before full refactor.
- **write up** -> I wrote up RCA findings with impact numbers and owners.

</details>

<details open>
<summary><strong>4) Dialogues</strong></summary>

### Dialogue 1 - Structured Incident Explanation

**Interviewer:** Tell me about a serious bug you investigated.

**You:**  
We had a payment incident after a release. Users got timeout errors during checkout. We checked logs, compared old and new queries, and found an index issue as the root cause.

We rolled back first, then shipped a safer fix. It restored service quickly, but many users were affected before mitigation.

### Dialogue 2 - Quantifying Impact

**Interviewer:** How did you explain business impact?

**You:**  
I shared three numbers: downtime, affected users, and estimated lost revenue per hour. This helped product and leadership understand urgency.

Technical detail mattered, but business numbers helped faster decisions.

### Dialogue 3 - Prevention

**Interviewer:** What did you change after the incident?

**You:**  
We added query performance alerts and a pre-release load test for high-risk endpoints. We also improved runbook steps for on-call.

It took extra effort, but our detection time became much faster.

</details>


<details open>
<summary><strong>5) Debate Prompt</strong></summary>

**When a production system breaks, should you find the root cause before fixing anything, or fix it first?**

**Side A:** You have to fix the immediate problem first. Every minute of downtime costs real money or hurts real users. Understand the root cause after you restore service, not during.

**Side B:** If you fix the symptom without understanding the cause, the problem will come back, sometimes worse. A quick fix that fails again is more damaging than taking a few extra minutes to diagnose properly.

_Your turn: Which side do you agree with more? Why?_

</details>

<details open>
<summary><strong>6) Reading Text</strong></summary>

Root cause analysis is not only about finding who made a mistake. It is about understanding the full chain: trigger, weak point, impact, and recovery. Calm, structured communication is very important in this process.

Strong teams quantify impact with clear numbers. Saying "it was bad" is not enough. You can share affected users, downtime, and estimated business loss. This helps teams prioritize fixes and prevention.

A good post-mortem should be practical: what happened, what we fixed, and what actions are already tracked.

</details>

<details open>
<summary><strong>7) Questions & Practice Ideas</strong></summary>

### Core Questions (must-practice)

1. How do you run RCA step by step after a production failure?
2. Which logs, metrics, and traces do you check first, and why?
3. How do you quantify impact window, affected transactions, and revenue risk?
4. How do you present RCA findings to non-technical stakeholders?

### High-Value Discussion Questions

5. What are the benefits and limits of deep diagnosis before choosing a fix?
6. When is a fast mitigation acceptable, and when does it create bigger long-term risk?
7. How should RCA depth differ between beginner and experienced engineers?

### Follow-up Questions (Challenge Assumptions)

8. You said your root cause is clear. Which alternative cause did you rule out, and how?
9. If business impact looked low at first but grew later, what did your analysis miss?
10. If teams disagree on evidence, who makes the final RCA decision and why?

### Reflection Questions

11. Which part of RCA is hardest for you to explain in English?
12. What debugging habit most improved your diagnosis quality?
13. In the long term, will engineers be judged more by recovery speed or diagnosis quality?

**Tips for speaking practice:**

- Use a clear sequence: signal -> analysis -> impact -> action.
- Include at least two numbers: impact window and affected transactions.
- Separate mitigation and corrective action in your answer.

---

</details>
