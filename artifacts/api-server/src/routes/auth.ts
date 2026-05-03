import { Router, type IRouter } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { requireAuth } from "../lib/auth";
import { isAdminUserId } from "../lib/admin";

const router: IRouter = Router();

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const isAdmin = isAdminUserId(userId);
  try {
    const user = await clerkClient.users.getUser(userId);
    res.json({
      userId,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      imageUrl: user.imageUrl ?? null,
      isAdmin,
    });
  } catch {
    res.json({
      userId,
      email: null,
      firstName: null,
      lastName: null,
      imageUrl: null,
      isAdmin,
    });
  }
});

export default router;
