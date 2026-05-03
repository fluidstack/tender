import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storageRouter from "./storage";
import profileRouter from "./profile";
import tendersRouter from "./tenders";
import analysisRouter from "./analysis";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(storageRouter);
router.use(profileRouter);
router.use(tendersRouter);
router.use(analysisRouter);
router.use(dashboardRouter);

export default router;
