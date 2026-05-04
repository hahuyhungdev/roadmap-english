---
sessionNumber: 8
title: Root Cause Analysis & Impact
topic: Diagnosing Incidents with Clear Business Impact
phase: PHASE 2 - ANALYTICAL THINKING IN IT
level: B2
description: Explain real production incidents with evidence, timeline, user impact, and practical prevention, including modern AI and platform dependencies.
---

# Session 8: Root Cause Analysis & Impact

**Level:** B2
**Focus:** Structured diagnosis + practical impact explanation.
**Scope:** Explain real production incidents with evidence, timeline, root cause, affected users, revenue or trust risk, and prevention actions.

<details open>
<summary><strong>1) Vocabulary </strong></summary>

- **root cause** /rˈut kˈɑz/ (n) - the main reason a failure happened
  - _Example 1:_ The root cause was not "the API failed"; it was a validation change that rejected valid checkout requests.
  - _Example 2:_ We confirmed the root cause by comparing failed requests before and after the release.
  - _Example 3:_ A useful RCA explains the cause with evidence, not guesses.

- **timeline** /ˈtaɪmˌlaɪn/ (n) - clear sequence of what happened and when
  - _Example 1:_ We built a timeline from alerts, deploy logs, provider status pages, and support reports.
  - _Example 2:_ It showed the first failures started six minutes after a feature flag changed.
  - _Example 3:_ A clear timeline helped product understand when users were actually affected.

- **log review** /lˈɔɡ rɪvjˈu/ (n) - checking logs to find patterns and errors
  - _Example 1:_ Log review showed that failed users all hit the same payment validation path.
  - _Example 2:_ We reviewed backend logs beside browser errors and provider response codes.
  - _Example 3:_ Shared logs reduced debate because frontend, backend, and platform teams used the same evidence.

- **hypothesis** /haɪpˈɑθəsəs/ (n) - testable explanation of what might be wrong
  - _Example 1:_ Our first hypothesis was a model provider timeout, but traces showed the delay happened before the model call.
  - _Example 2:_ We tested each hypothesis with one clear piece of evidence.
  - _Example 3:_ Good debugging means changing your hypothesis when the data changes.

- **reproduction steps** /rˌiprədˈʌkʃən stˈɛps/ (n) - repeatable steps to trigger the issue
  - _Example 1:_ QA wrote reproduction steps for one coupon, one browser, and one payment method.
  - _Example 2:_ These steps helped engineers verify that the rollback fixed the customer flow.
  - _Example 3:_ Reproduction steps are especially useful when the issue affects only one segment of users.

- **impact window** /ˈɪmpækt wˈɪndoʊ/ (n) - exact time period users were affected
  - _Example 1:_ The impact window was from 10:12 to 10:54 AM.
  - _Example 2:_ This helped support answer customer complaints accurately.
  - _Example 3:_ Impact window is clearer than saying "about one hour".

- **affected users** /əfˈɛktɪd ˈjuːzɚz/ (n) - number of users impacted by a failure
  - _Example 1:_ We estimated about 2,400 affected users during the incident window.
  - _Example 2:_ Product used this number to decide whether customer communication was needed.
  - _Example 3:_ I mention affected users because error rate alone does not show the human impact.

- **business impact** /ˈbɪznəs ˈɪmpækt/ (n) - measurable effect on users, revenue, or support load
  - _Example 1:_ Business impact included checkout drop, failed trials, and a spike in support tickets.
  - _Example 2:_ For an AI assistant issue, impact may be lower trust, not immediate lost revenue.
  - _Example 3:_ Even rough impact estimates improve decision quality when they are honest.

- **mitigation** /mˌɪtɪɡˈeɪʃən/ (n) - short-term action to reduce damage fast
  - _Example 1:_ Our first mitigation was disabling the faulty feature flag.
  - _Example 2:_ Mitigation restored the main flow before the final fix was ready.
  - _Example 3:_ We separate mitigation from the final fix so temporary work does not become permanent.

- **corrective action** /kɚˈɛktɪv ˈækʃən/ (n) - long-term change that removes the root weakness
  - _Example 1:_ Corrective action included better contract tests, provider-limit alerts, and safer rollout rules.
  - _Example 2:_ We assigned owners and due dates for each corrective action.
  - _Example 3:_ Corrective actions matter only if the team actually tracks them after the meeting.

**Additional useful terms:**

- **error rate** /ˈɛrɚ reɪt/ (n) - percentage of requests that fail
- **provider status** /prəvˈaɪdɚ stˈeɪtəs/ (n) - availability or incident page from an external service
- **evidence** /ˈɛvədəns/ (n) - facts that support your conclusion
- **confidence level** /kˈɑnfədəns lˈɛvəl/ (n) - certainty of your diagnosis
- **fallback path** /fˈɔlbæk pˈæθ/ (n) - backup behavior when the normal service fails
- **RCA summary** /ˌɑɹ si ˈeɪ sˈʌmɚi/ (n) - short final report of cause, impact, and actions

</details>

<details open>
<summary><strong>2) Grammar & Useful Patterns (B2)</strong></summary>

- **Past Simple for incident story**
  The issue started at 10:12 AM after we enabled a new checkout rule.

- **Past Continuous for ongoing failure**
  Users were seeing payment errors while the backend was rejecting valid orders.

- **Cause and effect**
  Because one feature flag changed validation behavior, valid requests started failing.

- **Quantification language**
  The issue affected about 18% of checkout attempts in the first 36 minutes.

- **Sequence connectors**
  First we rolled back the flag, then we confirmed the root cause, and finally we added a contract test.

- **Future prevention language**
  We will add provider-limit alerts so the same issue is detected before users report it.

### Useful Sentence Patterns

- The incident started when...
- The root cause was...
- We confirmed it by...
- The impact window was...
- The clearest user impact was...
- Business impact was...
- Our immediate mitigation was...
- One alternative cause we ruled out was...
- To prevent this again, we...

</details>

<details open>
<summary><strong>3) Collocations, Chunking & Phrasal Verbs</strong></summary>

### Strong Collocations

- identify root cause
- build incident timeline
- compare product and technical signals
- review logs, metrics, traces, and provider status
- test one hypothesis at a time
- reproduce the affected user flow
- quantify impact window
- estimate affected users
- estimate revenue or trust risk
- explain business impact in plain language
- apply short-term mitigation
- define corrective actions
- document evidence
- assign action owners

**Examples (real work):**

- In one AI assistant incident, we first checked user complaints, then compared traces, queue depth, and model-provider latency.
- That sequence helped us avoid blaming the provider too early and quantify the real customer impact.

### Useful Chunking & Sentence Starters

- At first, we thought...
- The first signal was...
- After comparing logs and traces, we found...
- The main impact window was...
- Our first mitigation was...
- We ruled out...
- The corrective action was...
- Evidence showed that...
- A key lesson was...
- Next time, we will...

**Examples (using starters):**

- "After comparing logs and traces, we found the request was delayed in our queue before it reached the model provider."
- "The corrective action was adding queue-depth alerts and a fallback message when response time is too high."

### Useful Phrasal Verbs

- **trace back** -> We traced back the error spike to one feature flag change.
- **rule out** -> We ruled out cache issues after checking hit-rate metrics.
- **narrow down** -> We narrowed down the failure to one endpoint, one customer segment, and one browser.
- **roll back** -> We rolled back the release before investigating the deeper cause.
- **follow up** -> We followed up with a contract test and a monitoring change.
- **write up** -> I wrote up RCA findings with impact numbers and owners.

</details>

<details open>
<summary><strong>4) Dialogues</strong></summary>

### Dialogue 1 - Structured Incident Explanation

**Teammate:** What actually happened with checkout yesterday?

**You:**
Checkout failed for some users for 36 minutes after we enabled a new validation rule. At first, it looked like a payment provider issue, but provider status was normal.

We compared failed requests with successful ones and found that our backend was sending malformed payment data only for one discount flow. We rolled back the flag first, then added a contract test for that flow.

### Dialogue 2 - Quantifying Impact

**Product Manager:** How big was the impact?

**You:**
The impact window was 10:12 to 10:48. During that time, around 2,400 checkout attempts happened, and 620 failed. Based on normal order value, the revenue at risk was around $18,000, but some users may retry later.

I would describe it as medium customer impact and high urgency because it affected payment, not just a secondary feature.

### Dialogue 3 - AI Feature RCA

**Engineering Lead:** Was the AI provider the root cause?

**You:**
Not directly. The provider was slower than usual, but our traces showed most delay happened in our retrieval step before the model call. We were sending too many documents to the assistant after a prompt update.

The mitigation was reducing retrieved documents and showing a fallback message when response time passed eight seconds. The corrective action is adding prompt-size checks and latency alerts for retrieval, queue, and provider time separately.

</details>


<details open>
<summary><strong>5) Debate Prompt</strong></summary>

**When a production system breaks, should the team restore service first or understand the root cause first?**

**Side A:** Restore service first. If users cannot pay, log in, or use a critical AI feature, a safe rollback or feature flag change is more useful than a perfect theory.

**Side B:** Understand enough before changing anything. A rushed mitigation can hide the real cause, create privacy or data issues, or move the failure to another service.

_Your turn: Where is the line between a smart mitigation and a risky guess?_

</details>

<details open>
<summary><strong>6) Reading Text</strong></summary>

Root cause analysis is not only about finding who made a mistake. It is about understanding the full chain: user symptom, trigger, weak point, impact, mitigation, and prevention. A good RCA makes the system easier to trust after something goes wrong.

In modern products, the root cause is not always inside one code change. It may involve a feature flag, CDN rule, third-party auth service, payment provider, queue backlog, model API, prompt update, or data retrieval step. That is why strong teams compare product signals with technical signals. They look at the customer journey first, then use logs, metrics, traces, and provider status to explain what failed.

Impact also needs more than one number. Saying "it was bad" is not enough. You can share the impact window, affected users, failed transactions, revenue at risk, support load, and confidence level. For AI features, you may also need to explain trust risk or accuracy risk, not only downtime.

A good RCA summary should be practical: what users experienced, what evidence confirmed the cause, what the team fixed immediately, and which corrective actions already have owners.

</details>

<details open>
<summary><strong>7) Questions & Practice Ideas</strong></summary>

### Core Questions (must-practice)

1. How do you run RCA step by step after a production failure?
2. Which logs, metrics, and traces do you check first, and why?
3. How do you quantify impact window, affected transactions, and revenue risk?
4. How do you write an RCA summary that is honest without creating blame?

### High-Value Discussion Questions

5. What are the benefits and limits of deep diagnosis before choosing a fix?
6. When is a fast mitigation acceptable, and when does it create bigger long-term risk?
7. How do AI features and third-party platforms change the way you investigate incidents?

### Follow-up Questions (Challenge Assumptions)

8. You said your root cause is clear. Which alternative cause did you rule out, and how?
9. If business impact looked low at first but grew later, what did your analysis miss?
10. How do you avoid blaming the wrong team when evidence is incomplete?

### Reflection Questions

11. Which part of RCA is hardest for you to explain in English?
12. What debugging habit most improved your diagnosis quality?
13. What makes an RCA actually useful after the incident is over?

**Tips for speaking practice:**

- Use a clear sequence: signal -> analysis -> impact -> action.
- Include at least two numbers: impact window and affected users or transactions.
- Separate mitigation and corrective action in your answer.
- Say what you ruled out, not only what you confirmed.

---

</details>
