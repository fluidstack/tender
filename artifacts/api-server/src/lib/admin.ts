import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

export function getAdminUserIds(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function isAdminUserId(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return getAdminUserIds().has(userId);
}

function isValidAdminToken(req: Request): boolean {
  const expected = process.env.INGESTION_ADMIN_TOKEN;
  if (!expected) return false;
  const header = req.headers["x-admin-token"];
  return typeof header === "string" && header === expected;
}

/** Cross-user admin data (PII): MUST be a signed-in Clerk admin user. */
export function requireAdminUser(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!isAdminUserId(auth.userId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

/** Privileged ops (ingestion): Clerk admin user OR INGESTION_ADMIN_TOKEN header. */
export function requireAdminUserOrToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);
  if (auth?.userId && isAdminUserId(auth.userId)) {
    next();
    return;
  }
  if (isValidAdminToken(req)) {
    next();
    return;
  }
  res.status(403).json({ error: "Forbidden" });
}
