---
sessionNumber: 5
title: AI Tools and the Changing Developer Role
topic: Daily AI Usage, Limits, and Practical Trade-offs
phase: PHASE 1 - TECH & BUSINESS
level: B1-B2
description: Explain how you use AI tools in daily engineering work, where they help, and where you still rely on human checks.
---

# Session 5: AI Tools and the Changing Developer Role

**Level:** B1-B2  
**Focus:** Speak clearly about practical AI usage in software teams, including speed gains, risks, and clear boundaries.

<details open>
<summary><strong>1) Vocabulary </strong></summary>

- **code assistant** /koʊd əˈsɪstənt/ (n) - AI tool that suggests code  
  _Example 1:_ I use a code assistant to scaffold React form components and test stubs.  
  _Example 2:_ We reduced setup time, but still reviewed every suggestion before merge.  
  _Example 3:_ In interviews, I explain code assistant as support, not replacement.

- **boilerplate** /ˈbɔɪlərˌpleɪt/ (n) - repeated code patterns  
  _Example 1:_ AI is useful for boilerplate in API handlers and validation schemas.  
  _Example 2:_ Boilerplate generation saved time during sprint kickoff.  
  _Example 3:_ We still enforce lint and review to keep boilerplate quality consistent.

- **unit test** /ˈjuːnɪt tɛst/ (n) - small test for one function or component  
  _Example 1:_ We ask AI for unit test drafts, then add edge cases manually.  
  _Example 2:_ Missing unit tests caused a pricing bug to reach staging last month.  
  _Example 3:_ Better unit test coverage reduced rework in code review.

- **debugging** /diˈbʌɡɪŋ/ (n) - finding and fixing problems  
  _Example 1:_ AI helps me summarize long logs during debugging.  
  _Example 2:_ It speeds up hypothesis generation, but root cause still needs human checks.  
  _Example 3:_ I use debugging notes to explain issues clearly in stand-up.

- **prompt** /prɑːmpt/ (n) - instruction given to an AI tool  
  _Example 1:_ A clear prompt gives better output and fewer random suggestions.  
  _Example 2:_ Our prompt template includes context, expected format, and constraints.  
  _Example 3:_ Better prompts reduced time spent rewriting AI output.

- **hallucination** /həˌluːsəˈneɪʃən/ (n) - incorrect AI output that sounds confident  
  _Example 1:_ We saw hallucination in an authentication snippet, so we checked official docs.  
  _Example 2:_ One hallucinated function name caused integration delay for half a day.  
  _Example 3:_ Now we mark uncertain AI output before using it in production code.

- **security-critical** /sɪˈkjʊrəti ˈkrɪtɪkəl/ (adj) - related to sensitive security logic  
  _Example 1:_ We never paste security-critical code or customer tokens into external AI tools.  
  _Example 2:_ Security-critical modules always require senior review and threat checks.  
  _Example 3:_ This rule slows us down, but protects production systems.

- **compliance** /kəmˈplaɪəns/ (n) - following legal or company rules  
  _Example 1:_ Compliance rules limit what customer data can appear in prompts.  
  _Example 2:_ We anonymize logs before AI-assisted analysis to stay compliant.  
  _Example 3:_ Compliance checks are part of our pull request template.

- **review** /rɪˈvjuː/ (n/v) - checking code quality and correctness  
  _Example 1:_ Human review is still mandatory before merge.  
  _Example 2:_ Review catches logic gaps that AI-generated tests may miss.  
  _Example 3:_ We require one reviewer to check maintainability, not only correctness.

- **regression** /rɪˈɡrɛʃən/ (n) - new change breaks old behavior  
  _Example 1:_ AI suggestions can cause regression if we skip domain-specific tests.  
  _Example 2:_ One regression passed unit tests but failed in real checkout flow.  
  _Example 3:_ Regression prevention now includes contract tests and manual smoke checks.

**Additional useful terms:**

- **context window** /ˈkɑːntɛkst ˈwɪndoʊ/ (n) - amount of text AI can process at once
- **autocomplete** /ˌɔːtoʊkəmˈpliːt/ (n) - automatic code suggestions
- **false positive** /ˌfɔːls ˈpɑːzətɪv/ (n) - warning that looks real but is not
- **policy** /ˈpɑːləsi/ (n) - internal rule for tool usage
- **fallback plan** /ˈfɔːlbæk plæn/ (n) - backup process when AI output is wrong

</details>

<details open>
<summary><strong>2) Grammar & Useful Patterns (B2)</strong></summary>

- **Present Simple for routine use**  
  I use AI tools for first drafts and repetitive coding tasks.

- **Present Perfect for change over time**  
  AI tools have reduced time spent on basic setup.

- **Contrast language (but / however)**  
  AI is fast, but I never trust output without checks.

- **Rules and boundaries (must / should not)**  
  We must review AI-generated code before deployment.

- **Conditionals for risk**  
  If we copy code blindly, we can introduce security bugs.

- **Past case explanation**  
  Last sprint, AI helped us generate tests, but we rewrote many assertions.

### Useful Sentence Patterns

- I use AI mostly for..., not for...
- It saves time, but...
- A real example is...
- We still rely on human review because...
- Our team policy says...
- The best use case for me is...

</details>

<details open>
<summary><strong>3) Collocations, Chunking & Phrasal Verbs</strong></summary>

### Strong Collocations

- generate test drafts
- speed up debugging
- review AI output
- catch logic errors
- avoid blind copy-paste
- protect sensitive code
- follow compliance rules
- validate against documentation
- reduce repetitive work
- improve developer workflow
- prevent security regressions
- set clear usage boundaries

**Examples (real work):**

- In one sprint, AI helped us draft tests quickly, but manual review removed several risky assumptions.
- We saved coding time overall, yet added stricter verification before production deployment.

### Useful Chunking & Sentence Starters

- In my daily workflow, I use AI to...
- A good use case is...
- One bad use case is...
- We got faster results when...
- We still had to check...
- The trade-off is speed versus...
- To stay safe, we...
- In production code, I always...

**Examples (using starters):**

- "A good use case is generating initial test cases, then adapting them to real business rules."
- "To stay safe, we never copy AI output directly into security-sensitive modules."

### Useful Phrasal Verbs

- **speed up** -> AI can speed up test setup.
- **check over** -> I always check over generated code.
- **leave out** -> Sometimes AI leaves out edge cases.
- **lock down** -> We lock down access for sensitive repositories.
- **fall back** -> If output is weak, we fall back to manual coding.

</details>

<details open>
<summary><strong>4) Typical Dialogues</strong></summary>

### Dialogue 1 - Daily Use

**Interviewer:** How do you use AI tools at work?

**You:**  
I use them for repetitive tasks like test templates, simple refactor suggestions, and writing commit message drafts. In one sprint, this saved me about two to three hours.

It helps speed, but I still verify logic and run tests before merge.

### Dialogue 2 - Clear Boundaries

**Interviewer:** What do you never use AI for?

**You:**  
I do not use AI for security-critical code or compliance-sensitive business logic. We also avoid sharing private customer data in prompts.

AI is useful for support tasks, but ownership stays with the engineer.

### Dialogue 3 - Trade-off Case

**Interviewer:** Has AI ever caused problems in your team?

**You:**  
Yes. We accepted a generated helper function too quickly, and it caused a regression in edge cases. We found it in QA and fixed it before release.

So now we move faster with AI, but quality checks are stricter.

</details>

<details open>
<summary><strong>5) Reading Text</strong></summary>

AI tools are now part of many developer workflows. They help with boilerplate, test ideas, and quick debugging support. This can reduce routine work and let engineers focus on harder tasks.

But teams still need clear rules. AI output can be wrong, outdated, or insecure. That is why strong teams treat AI output as a draft, not as final code. Review, testing, and documentation checks are still required.

In interviews, practical answers are best: explain where AI saves time, where it creates risk, and how your team controls that risk.

</details>

<details open>
<summary><strong>6) List of Questions + Ideas</strong></summary>

### Core Questions (must-practice)

1. How do you use AI in one real daily workflow from start to finish?
2. Which tasks do you still do manually, and why?
3. How do you package context before writing a prompt?
4. What verification steps do you run before accepting AI output?

### High-Value Discussion Questions

5. What are the benefits and limits of prompt-based coding support?
6. How do speed gains from AI compare with quality and security risks?
7. How does heavy AI usage change learning paths for beginners vs experienced engineers?

### Follow-up Questions (Challenge Assumptions)

8. You said AI saves time. Where did rework increase later?
9. If a prompt gives clean code but wrong logic, what failed in your process?
10. If AI output passes tests but hurts maintainability, should you still merge it?

### Reflection Questions

11. Which part of your workflow became better because of AI, and which part got worse?
12. What personal rule helps you stay responsible when using AI?
13. In the long term, will prompt quality become as important as coding quality?

**Tips for speaking practice:**

- Use one concrete prompt example and explain your context clearly.
- Always include one risk-control step (review, test, or security check).
- Keep answers grounded in decisions, not tool hype.

---

</details>
