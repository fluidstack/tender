import { logger } from "../logger";
import type { OcdsSearchResponse } from "./types";

const DEFAULT_BASE_URL =
  "https://api.tenders.gov.au/ocds/findByDates/published";
const DEFAULT_LM_BASE_URL =
  "https://api.tenders.gov.au/ocds/findByDates/lastModified";

export interface AusTenderClientOptions {
  baseUrl?: string;
  lastModifiedBaseUrl?: string;
  apiKey?: string;
  qps?: number;
  maxRetries?: number;
  fetchImpl?: typeof fetch;
}

export class AusTenderClient {
  private readonly baseUrl: string;
  private readonly lmBaseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly minIntervalMs: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;
  private lastRequestAt = 0;

  constructor(opts: AusTenderClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? DEFAULT_BASE_URL;
    this.lmBaseUrl = opts.lastModifiedBaseUrl ?? DEFAULT_LM_BASE_URL;
    this.apiKey = opts.apiKey ?? process.env.AUSTENDER_API_KEY;
    this.minIntervalMs = Math.max(1, Math.floor(1000 / Math.max(opts.qps ?? 2, 0.1)));
    this.maxRetries = opts.maxRetries ?? 4;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const wait = this.lastRequestAt + this.minIntervalMs - now;
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    this.lastRequestAt = Date.now();
  }

  private async request<T>(url: string): Promise<T> {
    let attempt = 0;
    let lastErr: unknown;
    while (attempt <= this.maxRetries) {
      await this.throttle();
      try {
        const headers: Record<string, string> = {
          accept: "application/json",
          "user-agent": "TenderAI-Ingest/0.1 (+https://tenderai.example)",
        };
        if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
        const res = await this.fetchImpl(url, {
          method: "GET",
          headers,
          signal: AbortSignal.timeout(60_000),
        });
        if (res.status === 429 || res.status >= 500) {
          throw new TransientError(
            `austender ${res.status} on ${url}`,
            res.status,
          );
        }
        if (!res.ok) {
          throw new Error(
            `austender ${res.status} ${res.statusText} on ${url}`,
          );
        }
        return (await res.json()) as T;
      } catch (err) {
        lastErr = err;
        const transient =
          err instanceof TransientError ||
          (err instanceof Error && /fetch failed|ETIMEDOUT|ECONN/i.test(err.message));
        if (!transient || attempt === this.maxRetries) break;
        const backoff = Math.min(30_000, 500 * Math.pow(2, attempt));
        logger.warn(
          { err: String(err), url, attempt },
          "austender request failed, retrying",
        );
        await new Promise((r) => setTimeout(r, backoff));
        attempt += 1;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  async *searchByPublished(
    start: Date,
    end: Date,
  ): AsyncGenerator<OcdsSearchResponse> {
    const interval = `${start.toISOString()}/${end.toISOString()}`;
    let url = `${this.baseUrl}?dateRange=${encodeURIComponent(interval)}&limit=100`;
    while (url) {
      const page: OcdsSearchResponse = await this.request(url);
      yield page;
      url = page.links?.next ?? "";
    }
  }

  async *searchByLastModified(
    start: Date,
    end: Date,
  ): AsyncGenerator<OcdsSearchResponse> {
    const interval = `${start.toISOString()}/${end.toISOString()}`;
    let url = `${this.lmBaseUrl}?dateRange=${encodeURIComponent(interval)}&limit=100`;
    while (url) {
      const page: OcdsSearchResponse = await this.request(url);
      yield page;
      url = page.links?.next ?? "";
    }
  }
}

class TransientError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "TransientError";
  }
}
