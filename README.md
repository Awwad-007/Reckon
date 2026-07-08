# Reckon

**The AI that argues with itself — then holds you to it.**

Built for the Open Swarm Build Jam: Bengaluru Edition (July 18, 2026).

---

## What is this?

Most AI assistants take a request and quietly hand back an answer. Reckon doesn't do that. Give it a real daily dilemma — too many deadlines, not enough hours, competing obligations — and instead of one opinion, you get three agents that genuinely disagree, a verdict that shows its work (including what it rejected and why), an automatically rewritten task list, and an Enforcer that pushes back if you try to override the verdict without a good reason.

It's not an assistant that advises. It's one that argues, decides, acts, and holds you accountable.

## How it works

1. **You submit a dilemma** — typed or spoken — along with your current task list.
2. **Three agents argue independently and in parallel:**
   - **Efficiency Agent** — argues for whatever maximizes productive output today
   - **Wellbeing Agent** — argues for whatever protects your health and relationships, informed by your recent behavioral patterns
   - **Consequence Agent** — argues based on downstream impact 1–4 weeks out, ignoring what's convenient today
3. **A Synthesizer agent** reads all three positions, picks a verdict, and — critically — keeps the *rejected* positions visible rather than hiding them once a decision is made. It also rewrites your task list to reflect the verdict.
4. **If you try to override the verdict**, an **Enforcer agent** steps in. It pushes back using your own historical patterns — unless your stated reason is genuinely specific and strong, in which case it concedes gracefully instead of being stubborn for its own sake.

## Why a swarm, not a single prompt

A single LLM call can simulate an opinion. It can't produce genuine structured disagreement, a synthesis that transparently shows its rejected alternatives, and a separate accountability layer that references behavioral history — without that behavior being visibly scripted rather than actually orchestrated. Reckon's value is structural: each agent is a distinct call with a distinct, sometimes conflicting mandate, and the disagreement stays visible even after the verdict is reached.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Orchestration | Custom lightweight orchestrator (`src/agents/orchestrator.ts`) |
| LLM backend | Swappable — Groq API (OpenAI-compatible) pre-event, OpenSwarm on-site (see [Architecture](#architecture)) |
| Voice | Native Web Speech API (`SpeechRecognition` + `SpeechSynthesis`) — no external voice service |
| State | In-memory React state only — no database, no persistence |

## Layer Architecture

```
Reasoning Layer
---------------
Input:
    User dilemma

Output:
    FinalDecision

Knows:
    Efficiency Agent, Wellbeing Agent, Consequence Agent, Synthesizer, Enforcer, Override flow

Never knows:
    Automation, Notifications, Calendar, Timeline, Personalization


Assistant Layer
---------------
Input:
    FinalDecision

Output:
    Executed plan

Knows:
    Timeline, Notifications, Personalization, Scheduling

Never knows:
    Efficiency Agent, Wellbeing Agent, Synthesizer, Enforcer, Override flow, or that any of them exist
```

The Reasoning Layer is not "the Synthesizer." The Synthesizer is one participant inside the Reasoning Layer, alongside the three position agents and the Enforcer. The Reasoning Layer as a whole is responsible for resolving all of that internal activity into one `FinalDecision`. The Assistant only ever sees the output of that resolution.

### API Boundary

The entire app talks to exactly one function for all LLM calls:

```javascript
// src/agents/apiClient.ts
export async function callAgent(systemPrompt: string, userMessage: string): Promise<string> { }
```

Nothing else in the codebase calls an API directly. This means the backend powering the agents can be swapped — from a direct API call to the OpenSwarm platform, for instance — by editing the inside of this one function, with zero changes required anywhere else in the app.

### Data Flow

```
User Input (text or voice)
        │
        ▼
 Reasoning Layer
    ├── Efficiency Agent ──┐
    ├── Wellbeing Agent ───┼──► (parallel calls)
    └── Consequence Agent ─┘
        │
    Synthesizer — verdict + rejected reasoning + rewritten task list
        │
    (on override attempt)
    Enforcer — pushback or concession
        │
        ▼
   FinalDecision { decision, taskList, confidence, rationale }
        │
        ▼
 Assistant Layer
    ├── Timeline builder
    ├── Browser notification
    ├── .ics calendar export
    └── Personalization (override-pattern tracking)
```

## Project Structure

```
src/
  components/
    DilemmaInput.tsx     — text/voice input for the daily dilemma
    AgentCard.tsx         — renders one agent's position
    VerdictCard.tsx        — renders the synthesized verdict + visible rejected options
    TaskListDiff.tsx       — before/after view of the task list
    OverrideModal.tsx      — override flow + Enforcer pushback UI
    AssistantPanel.tsx     — execution layer: timeline, notifications, .ics export
  agents/
    apiClient.ts          — the ONLY file that calls an LLM API
    prompts.ts            — system prompts for all 5 agents
    orchestrator.ts       — runSwarm() and runEnforcer() pipeline logic
    finalDecision.ts      — FinalDecision type and factory (output contract for Assistant)
    reasoningTrace.ts     — debug/logging object (Assistant never imports this)
    fallbackData.ts       — seed tasks, seed behavioral history, hardcoded fallback verdict
  assistant/
    automation.ts        — buildTimeline, generateReminder, fireBrowserNotification, generateICS, downloadICS
    personalization.ts   — override tracking, session-based personalization notes
  App.tsx
  main.tsx
```

## Running Locally

```bash
npm install
npm run dev
```

No environment variables or API keys need to be configured manually in the local dev flow described in this repo's build guide — see the build guide for exact setup details.

## Reliability & Fallback Behavior

If the LLM backend fails or returns malformed output, the app does not crash or show a blank screen — it falls back to a hardcoded verdict (`FALLBACK_VERDICT` in `fallbackData.ts`) so the product remains demoable even under network or API instability.

## Known Scope Boundaries

This is a hackathon-scoped prototype. Deliberately out of scope:
- Real calendar/email integration (simulated via an in-app task list)
- Persistent multi-day memory across sessions (behavioral history is seeded, not tracked live)
- Real-time duplex voice conversation or live interruption handling — voice is an input/output wrapper around a text-based pipeline, not a live conversational agent
- Authentication, multi-user support, and deployment hardening

## Team

Built by a 3-person team for the Open Swarm Build Jam, Bengaluru — frontend/backend build, end-to-end testing & hardening, and voice layer integration handled as parallel workstreams ahead of the event, with OpenSwarm platform integration completed on-site.

## License

Hackathon prototype — no license specified.
