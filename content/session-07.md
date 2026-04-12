---
sessionNumber: 7
title: Root Cause Analysis & Problem Framing
topic: Diagnosing Technical Problems & Business Impact
phase: PHASE 2 — PROBLEM-SOLVING
level: B2+
description: Diagnose technical problems with a clear narrative: symptom, investigation, root cause, impact, and prevention.
---

# Session 7: Root Cause Analysis & Problem Framing

**Level:** B2+  
**Focus:** Speaking in a B2+/C1 interview style about how you identify problems, validate hypotheses, and explain impact to technical and non-technical audiences.

<details open>
<summary><strong>1) Vocabulary </strong></summary>

- **symptom** (n) – the first visible sign of a deeper issue  
  _Example:_ High timeout rates were the first symptom we noticed.

- **root cause** (n) – the fundamental reason the issue happened  
  _Example:_ The root cause was a cache invalidation bug, not API latency.

- **hypothesis** (n) – a possible explanation tested with evidence  
  _Example:_ Our initial hypothesis was incorrect, so we tested another path.

- **reproduce** (v) – to trigger the issue consistently  
  _Example:_ Once we reproduced the bug locally, debugging became much faster.

- **blast radius** (n) – the scope of users/systems affected  
  _Example:_ The blast radius was limited to enterprise accounts using one feature.

- **telemetry** (n) – logs, traces, and metrics used for diagnosis  
  _Example:_ Telemetry data helped us confirm when the regression started.

- **bottleneck** (n) – the slowest point that limits overall performance  
  _Example:_ The bottleneck was client-side rendering, not network calls.

- **workaround** (n) – temporary fix before permanent solution  
  _Example:_ We deployed a workaround to reduce user impact immediately.

- **regression** (n) – something that worked before but now fails  
  _Example:_ The incident was caused by a regression from the latest release.

- **business impact** (n) – measurable effect on revenue, cost, or productivity  
  _Example:_ The issue increased support tickets and delayed internal operations.

**Additional useful terms:**
- **MTTD** (n) – mean time to detect
- **MTTR** (n) – mean time to recovery
- **edge case** (n) – unusual but valid scenario
- **false positive** (n) – alert that appears critical but is not
- **preventive action** (n) – change made to avoid recurrence

</details>

<details open>
<summary><strong>2) Grammar & Useful Patterns (B2+ / C1-lite)</strong></summary>

- **Sequencing for clear storytelling**  
  First, we confirmed the symptom. Then we tested hypotheses. Finally, we isolated the root cause.

- **Hedging when evidence is incomplete**  
  It appeared that the API was the issue, but logs suggested otherwise.

- **Cause-and-effect with precision**  
  The bug occurred because stale cache entries were reused after deployment.

- **Contrast for correction**  
  We initially suspected network latency; however, the actual bottleneck was rendering.

- **Impact framing for non-technical audiences**  
  This meant users needed more time per task, so operational productivity dropped.

### Useful Sentence Patterns
- The first symptom we noticed was...
- Our initial hypothesis was..., but the data showed...
- After reproducing the issue, we confirmed...
- The root cause was..., which led to...
- The blast radius included...
- To prevent recurrence, we introduced...

</details>

<details open>
<summary><strong>3) Collocations, Chunking & Phrasal Verbs</strong></summary>

### Strong Collocations
- identify the root cause
- narrow down the scope
- reproduce the bug reliably
- correlate logs and traces
- quantify user impact
- estimate business impact
- deploy a temporary workaround
- document incident findings
- define preventive actions
- reduce recurrence risk

### Useful Chunking & Sentence Starters
- At first glance, it looked like...
- After correlating metrics and logs,...
- One key signal was...
- The issue was isolated to...
- From a business standpoint, this caused...

### Useful Phrasal Verbs
- **look into** → We looked into error spikes before touching the code.
- **narrow down** → We narrowed down the issue to one release window.
- **rule out** → We ruled out backend latency after trace analysis.
- **follow up on** → We followed up on prevention actions in the next sprint.

</details>

<details open>
<summary><strong>4) Typical Dialogues</strong></summary>

### Dialogue 1 – Technical Interview Style

**Teacher:** Describe a serious technical problem you faced and how you diagnosed it.

**You:**  
We observed a sudden increase in page timeout complaints after a release. The first symptom was a spike in front-end error rates and slower task completion time.

Our initial hypothesis was API latency, but trace data did not support that. After reproducing the issue with production-like data, we confirmed the root cause: repeated client-side re-renders triggered by a state synchronization bug.

The blast radius was significant for heavy dashboard users, and support tickets increased. We deployed a workaround first, then implemented a permanent fix with stronger render guards.

### Dialogue 2 – Explaining to a Non-Technical Manager

**Teacher:** How would you explain this incident to a non-technical stakeholder?

**You:**  
In simple terms, the system was doing the same work many times unnecessarily, so pages became slow. That increased user frustration and support workload. We stabilized it quickly with a temporary fix, then resolved the deeper cause in the next release. We also added monitoring to catch similar patterns earlier.

### Dialogue 3 – Reflection Under Uncertainty

**Teacher:** What if you cannot find the root cause quickly?

**You:**  
I separate response into two tracks: impact reduction and diagnosis. First, we reduce user impact through rollback or feature flags. In parallel, we continue structured investigation with clear hypotheses and evidence. This keeps service stable while we search for the real cause.

</details>

<details open>
<summary><strong>5) Reading Text</strong></summary>

Strong engineers do not jump directly to fixes. They first frame the problem clearly: what changed, what broke, who is affected, and how severe the impact is. This framing helps teams prioritize response and avoid costly assumptions.

Root-cause analysis is not only technical work; it is communication work. Teams need to explain uncertainty, share progress, and align on next steps while pressure is high. When communication is clear, decisions are faster and trust remains high.

The best outcome is not only recovery, but learning. Teams that convert incident lessons into preventive actions improve reliability over time.

</details>

<details open>
<summary><strong>6) List of Questions + Ideas</strong></summary>

### Core Questions (must-practice)
1. What technical problem did you face, and what was the first visible symptom?
2. How did you test and validate your hypotheses?
3. How did you confirm the root cause with evidence?
4. How did you communicate impact to technical and non-technical stakeholders?

### High-Value Case Questions
5. Describe a case where your first assumption was wrong. What changed your mind?
6. Share a problem that had both user impact and business impact.
7. Tell me about a recurring issue and what prevention mechanism you added.

### Critical Discussion Questions
8. Is quick mitigation more important than immediate root-cause analysis during an incident?
9. In your opinion, do incidents come more from code, process, or communication?
10. How should teams split effort between prevention and fast recovery?

**Tips for speaking practice:**
- Keep your narrative in this order: symptom -> diagnosis -> cause -> impact -> prevention.
- Use plain language first, then add technical depth.
- Add one metric (time, error rate, affected users) for credibility.

---

</details>
