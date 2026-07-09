import { callAgent } from './apiClient';
import { SEED_TASKS, type Task } from './fallbackData';

const EXTRACTION_PROMPT = `You extract structured tasks from a person's natural-language description of their day or situation. Given their input, identify distinct actionable tasks they mentioned or clearly implied.

Respond ONLY with valid JSON, no markdown fences, no preamble, in exactly this shape:
[
  { "id": "t1", "title": "string", "urgency": "low" | "med" | "high", "estTimeMin": number, "status": "pending" }
]

Rules:
- Extract 2 to 6 tasks. If the input describes fewer distinct tasks, extract fewer -- do not invent tasks that weren't mentioned or reasonably implied.
- Assign urgency based on stated or implied deadlines/stakes, not assumptions about the task type.
- Assign a realistic estTimeMin based on the nature of the task (e.g., a phone call is short, finishing a project is long) -- use your best reasonable estimate, don't default everything to the same number.
- Every task starts with status "pending".
- ids are simply "t1", "t2", "t3" in order of mention.`;

export async function extractTasks(dilemmaText: string): Promise<Task[]> {
  try {
    const raw = await callAgent(EXTRACTION_PROMPT, dilemmaText);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Extraction returned empty or non-array result');
    }
    const valid = parsed.every((t: unknown) =>
      typeof (t as Record<string, unknown>).id === 'string' &&
      typeof (t as Record<string, unknown>).title === 'string' &&
      ['low', 'med', 'high'].includes((t as Record<string, unknown>).urgency as string) &&
      typeof (t as Record<string, unknown>).estTimeMin === 'number'
    );
    if (!valid) throw new Error('Extracted tasks failed shape validation');

    return parsed;
  } catch (err) {
    console.error('Task extraction failed, falling back to seed tasks:', err);
    return SEED_TASKS;
  }
}