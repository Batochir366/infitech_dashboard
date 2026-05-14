import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { InvoiceStatus } from "../generated/prisma/enums";
import prisma from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";

export function getCompanyFromEnv() {
  return {
    name: "INFITECH LLC",
    address:
      "Улаанбаатар, Сүхбаатар дүүрэг, 9-р хороо, Хоймор оффис 4-р давхарт 408 тоот",
    phone: "60605440",
    bank: "Худалдаа хөгжлийн банк MN880004000 453256871",
  };
}

function formatInvoiceDatePrefix(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function nextInvoiceNumber(issuedAt: Date): Promise<string> {
  const prefix = formatInvoiceDatePrefix(issuedAt);
  const existing = await prisma.invoice.findMany({
    where: { invoiceNumber: { startsWith: prefix } },
    select: { invoiceNumber: true },
  });
  let maxSeq = 0;
  for (const row of existing) {
    const suffix = row.invoiceNumber.slice(prefix.length);
    const n = parseInt(suffix, 10);
    if (!Number.isNaN(n) && n > maxSeq) maxSeq = n;
  }
  const next = maxSeq + 1;
  return `${prefix}${String(next).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export const generateInvoice = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { clientId, day, month, year } = req.body as {
    clientId?: number;
    day?: number;
    month?: number;
    year?: number;
  };

  if (
    clientId == null ||
    day == null ||
    month == null ||
    year == null ||
    typeof clientId !== "number" ||
    typeof day !== "number" ||
    typeof month !== "number" ||
    typeof year !== "number"
  ) {
    res
      .status(400)
      .json({ message: "clientId, day, month, year are required" });
    return;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    res.status(400).json({ message: "Invalid month or day" });
    return;
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      system: { select: { id: true, name: true, photo: true } },
      paymentSchedules: true,
    },
  });

  if (!client) {
    res.status(404).json({ message: "Харилцагч олдсонгүй" });
    return;
  }

  if (client.status !== "active") {
    res.status(403).json({
      message: "Идэвхгүй харилцагчид шинэ нэхэмжлэх үүсгэх боломжгүй",
    });
    return;
  }

  const schedule = client.paymentSchedules.find((ps) => ps.day === day);
  if (!schedule) {
    res.status(400).json({ message: "Энэ өдөрт төлбөрийн хуваарь байхгүй" });
    return;
  }

  const issuedAt = new Date();
  const invoiceNumber = await nextInvoiceNumber(issuedAt);
  const dueDate = addDays(issuedAt, 1);
  const domainPart = client.domain ? `${client.domain}` : client.name;
  const systemPart = client.system?.name || "систем";
  const paymentLabel =
    client.paymentType === "rent" ? "түрээс төлбөр" : "төлбөр";
  const description = `${domainPart} - ${systemPart} ${paymentLabel} ${month} сар`;

  try {
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        publicToken: randomUUID(),
        clientId: client.id,
        amount: schedule.amount,
        description,
        status: "pending",
        issuedAt,
        dueDate,
        scheduleDay: day,
        scheduleMonth: month,
        scheduleYear: year,
      },
      include: {
        client: {
          include: {
            system: { select: { id: true, name: true, photo: true } },
          },
        },
      },
    });

    res.status(201).json({
      invoice,
      company: getCompanyFromEnv(),
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const existing = await prisma.invoice.findFirst({
        where: {
          clientId,
          scheduleYear: year,
          scheduleMonth: month,
          scheduleDay: day,
        },
        include: {
          client: {
            include: {
              system: { select: { id: true, name: true, photo: true } },
            },
          },
        },
      });
      res.status(409).json({
        message: "Энэ сарын энэ өдрийн нэхэмжлэх аль хэдийн үүссэн байна",
        invoice: existing,
        company: getCompanyFromEnv(),
      });
      return;
    }
    throw e;
  }
};

export const getInvoicesByClient = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const clientIdRaw = req.query.clientId as string | undefined;
  if (!clientIdRaw) {
    res.status(400).json({ message: "clientId is required" });
    return;
  }
  const clientId = parseInt(clientIdRaw, 10);
  if (Number.isNaN(clientId)) {
    res.status(400).json({ message: "Invalid clientId" });
    return;
  }

  const data = await prisma.invoice.findMany({
    where: { clientId },
    orderBy: { issuedAt: "desc" },
    take: 50,
    include: {
      client: {
        include: {
          system: { select: { id: true, name: true, photo: true } },
        },
      },
    },
  });

  res.json({ data, company: getCompanyFromEnv() });
};

export const getPublicInvoice = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tokenParam = req.params.token;
  const token = typeof tokenParam === "string" ? tokenParam : tokenParam?.[0];
  if (!token) {
    res.status(400).json({ message: "Token required" });
    return;
  }

  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: token },
    include: {
      client: {
        include: {
          system: { select: { id: true, name: true, photo: true } },
        },
      },
    },
  });

  if (!invoice) {
    res.status(404).json({ message: "Нэхэмжлэх олдсонгүй" });
    return;
  }

  res.json({
    invoice,
    company: getCompanyFromEnv(),
  });
};

export const updateInvoice = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const idParam = req.params.id;
  const id = parseInt(
    typeof idParam === "string" ? idParam : (idParam?.[0] ?? ""),
    10,
  );
  const body = req.body as {
    status?: InvoiceStatus;
    description?: string | null;
    amount?: number;
    dueDate?: string;
  };

  if (Number.isNaN(id)) {
    res.status(400).json({ message: "Invalid id" });
    return;
  }

  const existing = await prisma.invoice.findUnique({
    where: { id },
    include: { client: { select: { status: true } } },
  });
  if (!existing) {
    res.status(404).json({ message: "Нэхэмжлэх олдсонгүй" });
    return;
  }

  if (!existing.client || existing.client.status !== "active") {
    res.status(403).json({
      message:
        "Идэвхгүй харилцагчийн нэхэмжлэхийг засах боломжгүй (түүхээр л харагдана)",
    });
    return;
  }

  const allowed: InvoiceStatus[] = ["pending", "paid", "overdue", "cancelled"];
  const hasStatus = body.status !== undefined;
  const hasDescription = body.description !== undefined;
  const hasAmount = body.amount !== undefined;
  const hasDueDate = body.dueDate !== undefined;

  if (!hasStatus && !hasDescription && !hasAmount && !hasDueDate) {
    res.status(400).json({ message: "Шинэчлэх талбар байхгүй байна" });
    return;
  }

  if (hasStatus && !allowed.includes(body.status!)) {
    res.status(400).json({ message: "Invalid status" });
    return;
  }

  if (hasAmount) {
    if (
      typeof body.amount !== "number" ||
      body.amount < 0 ||
      Number.isNaN(body.amount)
    ) {
      res.status(400).json({ message: "Invalid amount" });
      return;
    }
  }

  let dueDateParsed: Date | undefined;
  if (hasDueDate) {
    dueDateParsed = new Date(body.dueDate!);
    if (Number.isNaN(dueDateParsed.getTime())) {
      res.status(400).json({ message: "Invalid dueDate" });
      return;
    }
  }

  const data: {
    status?: InvoiceStatus;
    paidAt?: Date | null;
    description?: string | null;
    amount?: number;
    dueDate?: Date;
  } = {};

  if (hasDescription) {
    data.description =
      body.description === "" || body.description === null
        ? null
        : String(body.description);
  }
  if (hasAmount) data.amount = body.amount;
  if (hasDueDate) data.dueDate = dueDateParsed!;

  if (hasStatus) {
    data.status = body.status;
    data.paidAt = body.status === "paid" ? new Date() : null;
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data,
    include: {
      client: {
        include: {
          system: { select: { id: true, name: true, photo: true } },
        },
      },
    },
  });

  res.json(invoice);
};
