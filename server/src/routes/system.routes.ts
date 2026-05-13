import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getSystems,
  getSystemById,
  createSystem,
  updateSystem,
  deleteSystem,
} from "../controllers/system.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getSystems);
router.post("/", createSystem);
router.get("/:id", getSystemById);
router.put("/:id", updateSystem);
router.delete("/:id", deleteSystem);

export default router;
