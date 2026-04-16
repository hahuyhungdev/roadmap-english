#!/usr/bin/env python3
"""
Insert Debate Prompt sections into all 26 session files.
Also renames sections to match prompt.md exactly.
"""
import os, re

CONTENT_DIR = os.path.join(os.path.dirname(__file__), '..', 'content')

DEBATES = {
    1: """\
**Should engineers learn to speak in business language, or is that the PM's job?**

**Side A:** Engineers should focus on writing good code. Explaining business value is what product managers are paid to do. When engineers try to speak "business language," they often say things that are inaccurate or oversimplified.

**Side B:** When an engineer can explain why their work matters in business terms, they get more support, better priorities, and more trust from leadership. It takes practice, but it changes how people see your work.

_Your turn: Which side do you agree with more? Why?_""",

    2: """\
**When talking to non-engineers, should you simplify the technical details or keep them accurate?**

**Side A:** If you oversimplify, people make wrong decisions because they don't understand the real constraints. It's better to spend more time explaining things correctly than to be misunderstood.

**Side B:** Most non-engineers don't need every detail. If you keep it simple and focused on impact, they understand faster and trust you more. Too many technical terms just confuse people.

_Your turn: Which side do you agree with more? Why?_""",

    3: """\
**Should you pick the best technical tool for the job, even if the team doesn't know it yet?**

**Side A:** Using the tool the team already knows is safer and faster. Learning a new tool takes time, and during that time you ship less and make more mistakes.

**Side B:** If you always pick the familiar tool, your team stops growing. Sometimes the right tool really does save months of pain, and the learning cost is worth it.

_Your turn: Which side do you agree with more? Why?_""",

    4: """\
**Should you stop and fix technical debt before adding new features, or ship first and fix later?**

**Side A:** Technical debt slows down every sprint. If you keep adding features on top of bad code, bugs multiply and the team gets slower. Fix it before it gets worse.

**Side B:** Customers don't care about clean code. They care about new features. You can refactor in small steps while still shipping. Stopping everything to clean up is hard to justify to stakeholders.

_Your turn: Which side do you agree with more? Why?_""",

    5: """\
**Do AI coding tools make engineers more productive, or do they make engineers weaker over time?**

**Side A:** AI tools help engineers skip the boring parts and focus on harder problems. A developer who uses AI well can do more in a day than one who refuses to use it.

**Side B:** When you rely on AI to write your code, you stop training your own problem-solving skills. Over time, you lose the ability to work without it, and that's a real risk.

_Your turn: Which side do you agree with more? Why?_""",

    6: """\
**Is writing documentation really part of an engineer's job, or is it someone else's responsibility?**

**Side A:** Engineers write the code, so only they understand it well enough to document it correctly. If they skip docs, onboarding takes longer and bugs are harder to fix. It's part of the job.

**Side B:** Good engineers should spend their time solving hard technical problems, not writing text. That's what technical writers and PMs are for. Documentation takes time away from what engineers do best.

_Your turn: Which side do you agree with more? Why?_""",

    7: """\
**In an interview walkthrough, should you focus more on your technical decisions or the business impact?**

**Side A:** Interviewers at tech companies care most about how you think technically — your architecture choices, how you handled edge cases, and why you made certain tradeoffs. Business impact is secondary.

**Side B:** Hundreds of candidates can describe their architecture. If you connect your work to a real business result — fewer errors, faster load time, higher conversion — your story stands out and is easier to remember.

_Your turn: Which side do you agree with more? Why?_""",

    8: """\
**When a production system breaks, should you find the root cause before fixing anything, or fix it first?**

**Side A:** You have to fix the immediate problem first. Every minute of downtime costs real money or hurts real users. Understand the root cause after you restore service, not during.

**Side B:** If you fix the symptom without understanding the cause, the problem will come back, sometimes worse. A quick fix that fails again is more damaging than taking a few extra minutes to diagnose properly.

_Your turn: Which side do you agree with more? Why?_""",

    9: """\
**During a production incident, should you send status updates every few minutes, or focus on fixing and explain later?**

**Side A:** Stakeholders and teammates need to know what is happening. Regular updates — even short ones — prevent panic, stop people from interrupting you, and show you have control of the situation.

**Side B:** Sending updates every few minutes during an active incident wastes critical time and can spread the wrong information before you fully understand what is wrong. Fix it first, explain it clearly after.

_Your turn: Which side do you agree with more? Why?_""",

    10: """\
**When a stakeholder pushes back on your technical decision, should you defend it or adapt quickly?**

**Side A:** If you genuinely believe your decision is correct, you should defend it with clear reasoning and data. Changing your position just because someone pushed back is not good engineering.

**Side B:** Adapting your position when someone challenges you is not weakness. Relationships with stakeholders matter more than winning technical arguments, and a small compromise often moves things forward faster.

_Your turn: Which side do you agree with more? Why?_""",

    11: """\
**When you make a mistake at work, should you admit it immediately or wait until you fully understand what happened?**

**Side A:** Admit it quickly, even if you don't have all the answers yet. Waiting makes it look like you are hiding something. People trust you more when you are honest early and take responsibility.

**Side B:** If you speak too soon, you may give wrong information and look unprepared. Take the time to understand what happened fully, then explain clearly. A careful explanation is more useful than a rushed apology.

_Your turn: Which side do you agree with more? Why?_""",

    12: """\
**Is burnout mainly the company's fault, or is it the individual's responsibility to manage?**

**Side A:** Companies set the deadlines, the workload, and the team size. If those are unrealistic, burnout is inevitable no matter how well you manage yourself. The company has to fix the root cause.

**Side B:** No company will protect your energy for you. You have to learn to set limits, say no to extra work, and take breaks. If you wait for the company to fix it, you will keep burning out.

_Your turn: Which side do you agree with more? Why?_""",

    13: """\
**Is comparing yourself to stronger engineers a useful way to grow, or does it mostly just hurt you?**

**Side A:** Seeing what better engineers can do shows you exactly where your gaps are. It motivates you to practice more and set higher standards for yourself. Competition is useful.

**Side B:** Comparing yourself to others mainly makes you feel like you are not good enough. It damages your confidence and distracts you from your own real progress. You grow faster when you focus on yourself.

_Your turn: Which side do you agree with more? Why?_""",

    14: """\
**Is it okay to present a polished, curated version of yourself online, or is it dishonest?**

**Side A:** Everyone puts their best work online. That is just how personal branding works. Choosing what to share is not lying — it is showing what you are proud of and what you want to be known for.

**Side B:** If your online profile shows skills you don't really have, it will catch up with you in interviews or on the job. A gap between your profile and your real ability destroys trust fast.

_Your turn: Which side do you agree with more? Why?_""",

    15: """\
**When you see a teammate being excluded or treated unfairly, should you speak up, or is it safer to stay out of it?**

**Side A:** If you stay silent when someone is being treated badly, you are part of the problem. Speaking up — even quietly and carefully — makes the team safer for everyone, including yourself.

**Side B:** Speaking up without real power or support can backfire badly. You might become a target yourself, and the person you tried to help might not even want you involved. Read the situation carefully first.

_Your turn: Which side do you agree with more? Why?_""",

    16: """\
**Should you prioritize your family's expectations about income and career status, or follow your own goals?**

**Side A:** If your family sacrificed so you could have an education and a career, meeting their basic expectations is a fair responsibility. Completely ignoring what matters to them is not freedom — it is selfishness.

**Side B:** Choosing a job to satisfy your family instead of yourself leads to long-term unhappiness and resentment. You will perform worse and grow less. In the end, that hurts your family too.

_Your turn: Which side do you agree with more? Why?_""",

    17: """\
**Should companies block distracting apps during work hours, or trust engineers to manage their own attention?**

**Side A:** Deep technical work needs long blocks of focus. If apps like social media are one click away, most people will check them constantly. A company that removes the temptation protects everyone's output.

**Side B:** Blocking apps treats engineers like children who can't make their own decisions. Engineers do their best work when they feel trusted, not monitored. Forced restrictions create resentment, not focus.

_Your turn: Which side do you agree with more? Why?_""",

    18: """\
**Does remote work hurt your career growth, even if you feel productive day to day?**

**Side A:** In-office workers have conversations at lunch, pick up context from passing conversations, and are more visible to leadership. Over time, that informal access compounds into faster promotions and better opportunities.

**Side B:** Remote work is fine for career growth if you are proactive about communication. You can build real relationships over video calls and chat. What slows your career is being passive, not being remote.

_Your turn: Which side do you agree with more? Why?_""",

    19: """\
**Is it ever acceptable to bend a company rule if you believe the outcome is clearly better?**

**Side A:** Rules are not always written for every situation. Sometimes bending a small process rule to help a real user or fix a real problem is the right thing to do, and a good manager will understand that.

**Side B:** Once you start deciding which rules to follow and which to bend, you lose your team's trust. Rules exist for reasons you may not fully understand, and breaking them — even with good intentions — can have serious consequences.

_Your turn: Which side do you agree with more? Why?_""",

    20: """\
**When you have a conflict with a difficult colleague, should you talk to them directly first, or involve your manager early?**

**Side A:** Always try to talk directly to the person first. Going to management immediately damages the relationship before you give it a real chance. Most conflicts can be solved with one honest conversation.

**Side B:** Some people will not change behavior through a direct conversation. If the situation is affecting your work, escalating early saves time and prevents the problem from getting worse.

_Your turn: Which side do you agree with more? Why?_""",

    21: """\
**Should engineers take initiative and work beyond their assigned scope, or focus strictly on what they are given?**

**Side A:** Taking ownership beyond your title is how you grow into a senior role. If you only do what you are assigned, you stay invisible and miss chances to make a real difference.

**Side B:** Going outside your assigned work creates confusion, steps on other people's areas, and can break things you don't fully understand. Doing your own job very well is more valuable than trying to do everyone's.

_Your turn: Which side do you agree with more? Why?_""",

    22: """\
**When you don't have all the information you need, is it better to wait for more data or decide now?**

**Side A:** Acting on incomplete data leads to costly mistakes. A few extra hours or days of research can change the whole decision. Patience here is not weakness — it is discipline.

**Side B:** Waiting for perfect information is just avoiding the decision. In most real situations, you already have enough to act. Delaying a clear decision when data is "good enough" wastes time and slows the team.

_Your turn: Which side do you agree with more? Why?_""",

    23: """\
**Is it better to stay at one company long-term, or change jobs every two to three years?**

**Side A:** Staying at one company lets you go deeper, build real trust, and take on larger responsibilities. Senior roles are often given to people who have proved themselves over time in the same place.

**Side B:** Changing jobs every few years is the fastest way to grow your salary and see how different teams work. Most engineers in top companies got there by moving around, not staying put.

_Your turn: Which side do you agree with more? Why?_""",

    24: """\
**Should you always negotiate a salary offer, or is it sometimes better to accept without negotiating?**

**Side A:** Always negotiate. Companies expect it and usually leave room in the offer. The worst outcome is they say no and the offer stays the same. Never accepting the first number is just good financial sense.

**Side B:** If the offer is already fair and you really want the job, negotiating can feel awkward and start the relationship on a transactional note. Sometimes the goodwill of a clean acceptance is worth more than a small raise.

_Your turn: Which side do you agree with more? Why?_""",

    25: """\
**In an interview, is it better to pause and think carefully before answering, or respond quickly even if the answer is not perfect?**

**Side A:** Taking a moment to structure your thoughts shows that you are careful and methodical, not reactive. A well-organized answer delivered after a short pause is far more impressive than a rushed, jumbled one.

**Side B:** Long silences make interviewers uncomfortable and signal uncertainty. A confident response that is 80% right and delivered quickly feels better than a perfect answer that takes 30 seconds of silence to start.

_Your turn: Which side do you agree with more? Why?_""",

    26: """\
**In your final interview prep, should you focus on fixing your weakest areas or strengthening what you already do well?**

**Side A:** Your weakest area is the most likely reason you won't get the offer. Fix the gap first. One bad answer in a critical area can cancel out ten good ones.

**Side B:** Two days before the interview is not enough time to turn a weak area into a strength. Focus on what you do well, build your confidence, and show up sharp. Patching every gap at the last minute creates anxiety, not readiness.

_Your turn: Which side do you agree with more? Why?_""",
}

DEBATE_BLOCK_TEMPLATE = """\
</details>

<details open>
<summary><strong>5) Debate Prompt</strong></summary>

{debate_content}

</details>

<details open>
<summary><strong>6) Reading Text</strong></summary>"""

OLD_READING_HEADER = """\
</details>

<details open>
<summary><strong>5) Reading Text</strong></summary>"""

def process_file(filepath, session_num):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Insert Debate Prompt before Reading Text
    debate_content = DEBATES[session_num]
    new_reading_header = DEBATE_BLOCK_TEMPLATE.format(debate_content=debate_content)

    if '5) Debate Prompt' in content:
        print(f'  [SKIP] Session {session_num:02d}: Debate Prompt already exists.')
    else:
        content = content.replace(OLD_READING_HEADER, new_reading_header, 1)

    # 2. Rename "6) List of Questions + Ideas" → "7) Questions & Practice Ideas"
    content = content.replace(
        '<summary><strong>6) List of Questions + Ideas</strong></summary>',
        '<summary><strong>7) Questions & Practice Ideas</strong></summary>'
    )

    # 3. Rename "4) Typical Dialogues" → "4) Dialogues"
    content = content.replace(
        '<summary><strong>4) Typical Dialogues</strong></summary>',
        '<summary><strong>4) Dialogues</strong></summary>'
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'  [OK]   Session {session_num:02d}: updated.')

def main():
    for i in range(1, 27):
        filename = f'session-{i:02d}.md'
        filepath = os.path.join(CONTENT_DIR, filename)
        if not os.path.exists(filepath):
            print(f'  [MISS] {filename} not found, skipping.')
            continue
        process_file(filepath, i)

if __name__ == '__main__':
    main()
