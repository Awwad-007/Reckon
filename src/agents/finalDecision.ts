import type { Task } from './fallbackData';

export type FinalDecision = {
  decision: string;
  taskList: Task[];
  confidence: number;
  rationale: string;
};

export function buildFinalDecision({
  decision,
  taskList,
  confidence,
  rationale,
}: {
  decision: string;
  taskList: Task[];
  confidence: number;
  rationale: string;
}): FinalDecision {
  return { decision, taskList, confidence, rationale };
}