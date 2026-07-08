# Reckon

**The AI Smart Assistant that argues with itself — then acts on the verdict.**

Most AI assistants take a request and quietly hand back an answer. Reckon doesn't. Give it a real daily dilemma, and instead of one opinion, you get a transparent swarm of specialized agents that genuinely disagree, a verdict that shows its work, an assistant that turns that verdict into a real schedule, and a system that pushes back if you try to override its reasoning without a good enough cause.

It's not an assistant that advises. It's one that reasons, decides, acts, and holds you to it.

---

## What it does

1. **You describe a dilemma** — typed or spoken — along with your current task list.
2. **Three agents argue independently, in parallel, from genuinely different mandates:**
   - **Efficiency Agent** — argues purely for whatever maximizes productive output today, regardless of cost to anything else
   - **Wellbeing Agent** — argues purely for whatever protects health and relationships, informed by observed behavioral patterns, even at a real cost to productivity
   - **Consequence Agent** — argues purely based on downstream impact over the next 1–4 weeks, ignoring what's convenient today
   Each agent is instructed never to soften its position toward consensus — reaching a compromise is not their job.
3. **A Synthesizer** reads all three positions, resolves the actual conflict, and produces a verdict. Rejected positions are never hidden — they stay visible on the record, struck through but legible, alongside the reasoning for why they lost.
4. **If you contest the verdict**, an Enforcer agent responds. It pushes back using your own recent behavioral patterns — unless your stated reason is genuinely specific and strong, in which case it concedes gracefully rather than resisting for its own sake.
5. **A Smart Assistant layer takes the final, accepted decision and executes it** — reordering today's tasks into an optimized timeline, firing a reminder, generating a downloadable calendar file, and adapting its personalization notes based on how you've responded to past rulings in the session.

## Why a swarm, not a single prompt

A single LLM call can simulate an opinion. It can't produce genuine structured disagreement, a synthesis that transparently shows its rejected alternatives, and a separate accountability layer that references real behavioral history, without all of that being scripted rather than actually reasoned through. Reckon's value is structural: each agent holds a distinct, sometimes conflicting mandate, argues it fully, and the disagreement stays visible even after a decision is reached.

## Architecture

Reckon is built around a single, deliberately strict boundary between two systems:

```
Reasoning Layer
---------------
Input:   User dilemma
Output:  FinalDecision

Knows:      Efficiency Agent, Wellbeing Agent, Consequence Agent, Synthesizer, Enforcer, override handling
Never knows: Automation, notifications, calendar, timeline, personalization


Smart Assistant Layer
---------------------
Input:   FinalDecision
Output:  An executed plan

Knows:      Timeline construction, notifications, personalization, scheduling
Never knows: That an Efficiency Agent, Wellbeing Agent, Synthesizer, or Enforcer even exist
```

The **Reasoning Layer** is not just "the Synthesizer" — it's the entire process of the three agents arguing, the Synthesizer resolving them, and (if contested) the Enforcer resolving an override. All of that internal activity collapses into one object:

```typescript
type FinalDecision = {
  decision: string;    // the accepted decision in plain language
  taskList: Task[];    // the task list to execute against
  confidence: number;  // a lightweight heuristic, not a calibrated probability
  rationale: string;   // why this decision was reached, in plain language
};
```

This object carries no information about *how* it was produced — no flag for whether it came directly from the Synthesizer or after a contested override. The **Smart Assistant Layer** receives only this object and executes against it. It has no branching logic based on the reasoning process's internal path, and it never imports anything from the reasoning layer's code. This means the two systems can evolve independently: the reasoning pipeline can change entirely and the assistant never needs to know.

```
User Dilemma
      │
      ▼
Natural Language Understanding
      │
      ▼
Reasoning Layer
 ├── Efficiency Agent   ─┐
 ├── Wellbeing Agent    ─┼── argue in parallel
 └── Consequence Agent  ─┘
      │
      ▼
 Synthesizer — verdict + visible rejected reasoning
      │
      ▼
 (if contested) Enforcer — pushback or graceful concession
      │
      ▼
 FinalDecision
      │
      ▼
Smart Assistant Layer
 ├── Timeline construction & task reordering
 ├── Reminders / browser notifications
 ├── Downloadable calendar export
 └── Session-adaptive personalization
```

## Interaction model

- **Text or voice input.** Speak your dilemma; the transcript appears editable before submission, so a misheard word never derails a decision.
- **Visible disagreement, not a black box.** All three agent positions render simultaneously, each with its own reasoning, before any verdict appears.
- **Nothing gets erased.** Rejected alternatives remain on the record after a verdict is reached, with the reasoning for why they lost.
- **Contestable, not just informative.** You can push back on a ruling; the system either holds its position with a cited reason or concedes if your counter-argument is genuinely strong.
- **The verdict becomes a plan, not just a sentence.** Once accepted, the Assistant visibly works through several distinct actions — schedule optimization, reminder preparation, timeline construction, personalization — before handing you an executable result.
- **Optional spoken verdict.** The final decision can be read aloud, without requiring a full spoken conversation.

## Personalization

Personalization lives entirely in the Smart Assistant layer, not inside the reasoning agents. The reasoning layer stays objective — its agents don't accumulate memory or bias toward the user over time. Instead, the Assistant observes behavior *after* decisions are made: how often a ruling is accepted outright, how often it's contested, and how often a contested ruling is upheld versus overridden. That observation shapes future personalization notes (e.g., weighting wellbeing-related factors more heavily if health-driven rulings are frequently contested), without ever touching how the agents themselves reason.

## Reliability

If any part of the reasoning pipeline fails or returns malformed output, the system does not surface a blank or broken state — it falls back to a predefined, coherent verdict so the product remains fully functional even under backend instability.

## Known Scope Boundaries

Reckon is intentionally scoped as a focused prototype, not a full production system:
- Task and calendar data are simulated within the app rather than synced to real external calendars or email.
- Behavioral history used for personalization is session-based, not tracked persistently across days.
- Voice interaction is a simple input/output layer — speak, review the transcript, submit, optionally hear the verdict — not a live, interruptible conversation with the agents.
- There is no user authentication or multi-user support; the experience is single-session.

## The core idea, in one line

Most assistants tell you what to do. Reckon tells you what its own reasoning disagreed about first — then does something about it.