import type { SwarmResult } from './orchestrator';
import type { UserContext } from '../assistant/personalization';

export type ReasoningTrace = {
  source: 'synthesizer' | 'fallback' | 'override_concede' | 'override_anyway';
  overridden: boolean;
  agentPositions: {
    efficiency: string;
    wellbeing: string;
    consequence: string;
  } | null;
  contextUsed: UserContext | null;
  contextRationale: string | null;
  timestamps: {
    submitted: number;
    resolved: number;
  };
};

export function buildReasoningTrace(
  swarmResult: SwarmResult | null,
  overridden: boolean,
  source: ReasoningTrace['source']
): ReasoningTrace {
  return {
    source,
    overridden,
    agentPositions: swarmResult
      ? {
          efficiency: swarmResult.positions.efficiency.reasoning,
          wellbeing: swarmResult.positions.wellbeing.reasoning,
          consequence: swarmResult.positions.consequence.reasoning,
        }
      : null,
    contextUsed: swarmResult?.userContext ?? null,
    contextRationale: swarmResult?.verdict.contextRationale ?? null,
    timestamps: {
      submitted: Date.now(),
      resolved: Date.now(),
    },
  };
}