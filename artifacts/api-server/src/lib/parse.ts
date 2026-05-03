import mammoth from "mammoth";
import { ObjectStorageService } from "./objectStorage";

const storage = new ObjectStorageService();

export async function fetchObjectBuffer(objectPath: string): Promise<Buffer> {
  const file = await storage.getObjectEntityFile(objectPath);
  const [buf] = await file.download();
  return buf;
}

export async function parseDocument(
  objectPath: string,
  contentType: string,
  filename: string,
): Promise<{ text: string; pageCount: number | null }> {
  const buf = await fetchObjectBuffer(objectPath);
  const lowerName = filename.toLowerCase();
  const lowerType = (contentType || "").toLowerCase();

  if (lowerName.endsWith(".pdf") || lowerType.includes("pdf")) {
    const mod = (await import("pdf-parse")) as unknown as {
      default: (b: Buffer) => Promise<{ text: string; numpages: number }>;
    };
    const data = await mod.default(buf);
    return { text: data.text || "", pageCount: data.numpages ?? null };
  }
  if (
    lowerName.endsWith(".docx") ||
    lowerType.includes("officedocument.wordprocessingml")
  ) {
    const result = await mammoth.extractRawText({ buffer: buf });
    return { text: result.value || "", pageCount: null };
  }
  if (lowerName.endsWith(".txt") || lowerType.startsWith("text/")) {
    return { text: buf.toString("utf-8"), pageCount: null };
  }
  throw new Error(`Unsupported file type for ${filename}`);
}
