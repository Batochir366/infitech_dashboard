import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/client.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getClients);
router.post("/", createClient);
router.get("/:id", getClientById);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

export default router;
