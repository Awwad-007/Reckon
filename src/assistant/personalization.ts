// --- User Context (Context Injection) ---
//
// Static profile facts live here as a plain object — no database needed.
// Edit USER_PROFILE directly as your projects/role change. `currentFocus`
// is the one dynamic field: derived at call time so the "friend" framing
// doesn't go stale mid-session without you having to update anything.

export interface ProjectContext {
  name: string;
  description: string;
}

export interface UserContext {
  name: string;
  role: string;
  activeProjects: ProjectContext[];
  currentFocus: string;
}

// Edit these as your situation changes — this is the only place that needs it.
const USER_PROFILE: Omit<UserContext, 'currentFocus'> = {
  name: 'Awwad',
  role: '2nd-year CS student',
  activeProjects: [
    { name: 'Smart Grid', description: 'energy distribution optimization project' },
    { name: 'RedFlag', description: 'safety-focused detection/reporting app' },
  ],
};

function deriveCurrentFocus(): string {
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 5) return 'Deep Work — late-night coding, minimal interruptions preferred';
  if (hour < 12) return 'Planning & triage — structuring the day ahead';
  if (hour < 18) return 'Deep Work — active build/debug time on current projects';
  return 'Wind-down — light tasks, review, and catch-up';
}

/** Returns the current user context. Called fresh each time — no caching, no DB. */
export function getUserContext(): UserContext {
  return { ...USER_PROFILE, currentFocus: deriveCurrentFocus() };
}

/**
 * Renders a UserContext into a short block appendable to any agent system
 * prompt. Kept as plain text (not JSON) since these prompts are already
 * plain-text instructions — consistent with the rest of prompts.ts.
 */
export function formatContextForPrompt(context: UserContext): string {
  const projects = context.activeProjects.map(p => `${p.name} (${p.description})`).join('; ');
  return [
    `User context: ${context.name}, ${context.role}.`,
    `Active projects: ${projects}.`,
    `Current focus: ${context.currentFocus}.`,
    'Weave this in only when genuinely relevant to the dilemma or task at hand (e.g. a task that touches one of these projects, or a deadline pattern this role implies) — do not force a reference into every response, and never just restate this block back to the user verbatim.',
  ].join(' ');
}

let sessionLog = {
  overrideAttempts: 0,
  wellbeingOverrides: 0,
  concedes: 0,
};

export function recordOverrideOutcome({ relevantAgentKey, outcome }: { relevantAgentKey: string; outcome: 'conceded' | 'overrode_anyway' }): void {
  sessionLog.overrideAttempts += 1;
  if (relevantAgentKey === 'wellbeing') sessionLog.wellbeingOverrides += 1;
  if (outcome === 'conceded') sessionLog.concedes += 1;
}

export function getPersonalizationNote(): string {
  if (sessionLog.wellbeingOverrides >= 1) {
    return "You've pushed back on wellbeing-driven calls twice this session — I'll weight health and relationship factors slightly higher in the next ruling.";
  }
  if (sessionLog.overrideAttempts === 0) {
    return "No overrides yet this session — rulings are being followed as given.";
  }
  if (sessionLog.concedes > sessionLog.overrideAttempts / 2) {
    return "You've conceded to the swarm's reasoning more often than not this session — it seems to be reading your priorities correctly.";
  }
  return "Noted your recent override pattern — factoring it into how strongly the next ruling is argued.";
}

export function resetSessionLog(): void {
  sessionLog = { overrideAttempts: 0, wellbeingOverrides: 0, concedes: 0 };
}