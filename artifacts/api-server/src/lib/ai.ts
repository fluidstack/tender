import { openai } from "@workspace/integrations-openai-ai-server";

const MODEL = "gpt-5.4";

function safeParseJson<T>(text: string): T | null {
  if (!text) return null;
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const arrStart = cleaned.indexOf("[");
    const first =
      start === -1 ? arrStart : arrStart === -1 ? start : Math.min(start, arrStart);
    if (first === -1) return null;
    const last = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (last <= first) return null;
    try {
      return JSON.parse(cleaned.slice(first, last + 1)) as T;
    } catch {
      return null;
    }
  }
}

export async function aiJson<T>(opts: {
  system: string;
  user: string;
  fallback: T;
}): Promise<T> {
  try {
    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      response_format: { type: "json_object" },
    });
    const text = resp.choices[0]?.message?.content ?? "";
    const parsed = safeParseJson<T>(text);
    if (parsed != null) return parsed;
    return opts.fallback;
  } catch {
    return opts.fallback;
  }
}

export async function aiText(opts: {
  system: string;
  user: string;
  fallback: string;
}): Promise<string> {
  try {
    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    });
    return resp.choices[0]?.message?.content?.trim() || opts.fallback;
  } catch {
    return opts.fallback;
  }
}

export function truncate(text: string, maxChars = 18000): string {
  if (!text) return "";
  return text.length > maxChars ? text.slice(0, maxChars) + "\n[truncated]" : text;
}
