import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import authRoutes from "../routes/auth.routes";
import clientRoutes from "../routes/client.routes";
import moduleRoutes from "../routes/module.routes";
import planRoutes from "../routes/plan.routes";
import systemRoutes from "../routes/system.routes";
import invoiceRoutes from "../routes/invoice.routes";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/systems", systemRoutes);
app.use("/api/invoices", invoiceRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
