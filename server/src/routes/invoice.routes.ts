import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  generateInvoice,
  getInvoicesByClient,
  getPublicInvoice,
  updateInvoice,
} from "../controllers/invoice.controller";
import type { AuthRequest } from "../middleware/auth.middleware";

const router = Router();

// Public: no auth (must be before auth middleware on other routes)
router.get("/public/:token", (req: Request, res: Response) =>
  getPublicInvoice(req, res)
);

router.use(authMiddleware);

router.post("/generate", (req, res) => generateInvoice(req as AuthRequest, res));
router.get("/", (req, res) => getInvoicesByClient(req as AuthRequest, res));
router.patch("/:id", (req, res) => updateInvoice(req as AuthRequest, res));

export default router;
