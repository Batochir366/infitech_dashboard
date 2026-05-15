import { Request, Response } from "express";

import prisma from "../lib/prisma";
import { ClientStatus, PaymentType } from "../generated/prisma/enums";

export const clientDetailInclude = {
  system: { select: { id: true, name: true, photo: true } },
  rentalAgreement: {
    include: { paymentSchedules: { orderBy: { day: "asc" as const } } },
  },
  purchaseAgreement: {
    include: { installments: { orderBy: { sortOrder: "asc" as const } } },
  },
} as const;

type PaymentScheduleInput = { day: number; amount: number };
type RentalBody = {
  leaseStartAt?: string;
  rentDurationMonths?: number;
  paymentSchedules: PaymentScheduleInput[];
};
type InstallmentInput = { dueDate: string; amount: number };
type PurchaseBody = {
  totalPrice: number;
  installments: InstallmentInput[];
};

function parseRentalBody(raw: unknown): RentalBody | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const schedulesRaw = o.paymentSchedules;
  if (!Array.isArray(schedulesRaw)) return null;
  const paymentSchedules: PaymentScheduleInput[] = schedulesRaw.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      day: Number(r.day),
      amount: Number(r.amount),
    };
  });
  return {
    leaseStartAt:
      typeof o.leaseStartAt === "string" ? o.leaseStartAt : undefined,
    rentDurationMonths:
      o.rentDurationMonths != null ? Number(o.rentDurationMonths) : undefined,
    paymentSchedules,
  };
}

function parsePurchaseBody(raw: unknown): PurchaseBody | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const instRaw = o.installments;
  if (!Array.isArray(instRaw)) return null;
  const installments: InstallmentInput[] = instRaw.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      dueDate: String(r.dueDate),
      amount: Number(r.amount),
    };
  });
  return {
    totalPrice: Number(o.totalPrice),
    installments,
  };
}

function validateRental(r: RentalBody): string | null {
  if (!r.paymentSchedules.length) {
    return "Түрээсийн төлбөрийн хуваарь оруулна уу";
  }
  for (const ps of r.paymentSchedules) {
    if (!Number.isFinite(ps.day) || ps.day < 1 || ps.day > 31) {
      return "Төлбөрийн өдөр 1–31 хооронд байх ёстой";
    }
    if (!Number.isFinite(ps.amount) || ps.amount < 0) {
      return "Дүн зөв оруулна уу";
    }
  }
  const months = r.rentDurationMonths ?? 12;
  if (!Number.isFinite(months) || months < 1 || months > 600) {
    return "Түрээсийн сар 1–600 хооронд байх ёстой";
  }
  return null;
}

function validatePurchase(p: PurchaseBody): string | null {
  if (!Number.isFinite(p.totalPrice) || p.totalPrice < 0) {
    return "Нийт үнэ зөв оруулна уу";
  }
  if (!p.installments.length) {
    return "Хуваан төлбөрийн мөр оруулна уу";
  }
  let sum = 0;
  for (const inst of p.installments) {
    const d = new Date(inst.dueDate);
    if (Number.isNaN(d.getTime())) {
      return "Огноо зөв оруулна уу";
    }
    if (!Number.isFinite(inst.amount) || inst.amount < 0) {
      return "Дүн зөв оруулна уу";
    }
    sum += inst.amount;
  }
  if (Math.abs(sum - p.totalPrice) > 0.01) {
    return "Хуваан төлбөрийн нийлбэр нь нийт үнэтэй тэнцүү байх ёстой";
  }
  return null;
}

export const getClients = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { search, status, page = "1", limit = "10" } = req.query;

  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
  const skip = (pageNum - 1) * limitNum;

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search as string } },
            { domain: { contains: search as string } },
            { phoneNumber: { contains: search as string } },
            { regNumber: { contains: search as string } },
          ],
        }
      : {}),
    ...(status ? { status: status as ClientStatus } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.client.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: "desc" },
      include: clientDetailInclude,
    }),
    prisma.client.count({ where }),
  ]);

  res.json({ data, total, page: pageNum, limit: limitNum });
};

export const getClientById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const client = await prisma.client.findUnique({
    where: { id },
    include: clientDetailInclude,
  });

  if (!client) {
    res.status(404).json({ message: "Харилцагч олдсонгүй" });
    return;
  }

  res.json(client);
};

export const createClient = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    name,
    paymentType: paymentTypeRaw,
    status,
    domain,
    notes,
    regNumber,
    phoneNumber,
    phoneNumber2,
    email,
    productType,
    systemId,
    rental: rentalRaw,
    purchase: purchaseRaw,
  } = req.body as Record<string, unknown>;

  if (!name || !phoneNumber) {
    res.status(400).json({ message: "Шаардлагатай өгөгдөл оруулна уу" });
    return;
  }

  const paymentType = (
    (paymentTypeRaw as PaymentType) === "buy" ? "buy" : "rent"
  ) as PaymentType;

  const rental = parseRentalBody(rentalRaw);
  const purchase = parsePurchaseBody(purchaseRaw);

  if (paymentType === "rent") {
    if (!rental) {
      res.status(400).json({ message: "Түрээсийн мэдээлэл оруулна уу" });
      return;
    }
    const err = validateRental(rental);
    if (err) {
      res.status(400).json({ message: err });
      return;
    }
  } else {
    if (!purchase) {
      res.status(400).json({ message: "Худалдан авалтын мэдээлэл оруулна уу" });
      return;
    }
    const err = validatePurchase(purchase);
    if (err) {
      res.status(400).json({ message: err });
      return;
    }
  }

  try {
    const client = await prisma.$transaction(async (tx) => {
      const c = await tx.client.create({
        data: {
          name: name as string,
          paymentType,
          status: (status as ClientStatus) || "active",
          domain: (domain as string) || null,
          systemId: systemId ? parseInt(String(systemId), 10) : null,
          notes: notes as string | undefined,
          regNumber: regNumber as string | undefined,
          phoneNumber: phoneNumber as string,
          phoneNumber2: phoneNumber2 as string | undefined,
          email: email as string | undefined,
          productType: productType as string | undefined,
        },
      });

      if (paymentType === "rent" && rental) {
        const leaseStart = rental.leaseStartAt
          ? new Date(rental.leaseStartAt)
          : c.createdAt;
        await tx.rentalAgreement.create({
          data: {
            clientId: c.id,
            leaseStartAt: leaseStart,
            rentDurationMonths: rental.rentDurationMonths ?? 12,
            paymentSchedules: {
              create: rental.paymentSchedules.map((ps) => ({
                day: ps.day,
                amount: ps.amount,
              })),
            },
          },
        });
      } else if (paymentType === "buy" && purchase) {
        await tx.purchaseAgreement.create({
          data: {
            clientId: c.id,
            totalPrice: purchase.totalPrice,
            installments: {
              create: purchase.installments.map((inst, i) => ({
                dueDate: new Date(inst.dueDate),
                amount: inst.amount,
                sortOrder: i,
              })),
            },
          },
        });
      }

      return tx.client.findUniqueOrThrow({
        where: { id: c.id },
        include: clientDetailInclude,
      });
    });

    res.status(201).json(client);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Үйлчлүүлэгч үүсгэхэд алдаа гарлаа" });
  }
};

export const updateClient = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const body = req.body as Record<string, unknown>;
  const {
    name,
    paymentType: paymentTypeRaw,
    status,
    domain,
    notes,
    regNumber,
    phoneNumber,
    phoneNumber2,
    email,
    productType,
    systemId,
    rental: rentalRaw,
    purchase: purchaseRaw,
  } = body;

  const existing = await prisma.client.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ message: "Харилцагч олдсонгүй" });
    return;
  }

  const nextPaymentType: PaymentType =
    paymentTypeRaw !== undefined
      ? (paymentTypeRaw as PaymentType) === "buy"
        ? "buy"
        : "rent"
      : existing.paymentType;

  const typeSwitch =
    paymentTypeRaw !== undefined && paymentTypeRaw !== existing.paymentType;

  const rental = parseRentalBody(rentalRaw);
  const purchase = parsePurchaseBody(purchaseRaw);

  if (typeSwitch && nextPaymentType === "rent" && rental) {
    const err = validateRental(rental);
    if (err) {
      res.status(400).json({ message: err });
      return;
    }
  }
  if (typeSwitch && nextPaymentType === "buy" && purchase) {
    const err = validatePurchase(purchase);
    if (err) {
      res.status(400).json({ message: err });
      return;
    }
  }

  if (!typeSwitch && nextPaymentType === "rent" && rentalRaw !== undefined) {
    if (!rental) {
      res.status(400).json({ message: "Түрээсийн мэдээлэл буруу байна" });
      return;
    }
    const err = validateRental(rental);
    if (err) {
      res.status(400).json({ message: err });
      return;
    }
  }
  if (!typeSwitch && nextPaymentType === "buy" && purchaseRaw !== undefined) {
    if (!purchase) {
      res
        .status(400)
        .json({ message: "Худалдан авалтын мэдээлэл буруу байна" });
      return;
    }
    const err = validatePurchase(purchase);
    if (err) {
      res.status(400).json({ message: err });
      return;
    }
  }

  try {
    const client = await prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: name as string }),
          ...(paymentTypeRaw !== undefined && {
            paymentType: nextPaymentType,
          }),
          ...(status !== undefined && { status: status as ClientStatus }),
          ...(domain !== undefined && { domain: (domain as string) || null }),
          ...(systemId !== undefined && {
            systemId: systemId ? parseInt(String(systemId), 10) : null,
          }),
          ...(notes !== undefined && { notes: notes as string | undefined }),
          ...(regNumber !== undefined && { regNumber: regNumber as string }),
          ...(phoneNumber !== undefined && {
            phoneNumber: phoneNumber as string,
          }),
          ...(phoneNumber2 !== undefined && {
            phoneNumber2: phoneNumber2 as string,
          }),
          ...(email !== undefined && { email: email as string }),
          ...(productType !== undefined && {
            productType: productType as string,
          }),
        },
      });

      if (typeSwitch) {
        await tx.rentalAgreement.deleteMany({ where: { clientId: id } });
        await tx.purchaseAgreement.deleteMany({ where: { clientId: id } });
      }

      if (nextPaymentType === "rent") {
        await tx.purchaseAgreement.deleteMany({ where: { clientId: id } });

        if (typeSwitch || rentalRaw !== undefined) {
          if (!rental) {
            throw new Error("rental_payload");
          }
          const leaseStart = rental.leaseStartAt
            ? new Date(rental.leaseStartAt)
            : existing.createdAt;
          const months = rental.rentDurationMonths ?? 12;

          const ra = await tx.rentalAgreement.upsert({
            where: { clientId: id },
            create: {
              clientId: id,
              leaseStartAt: leaseStart,
              rentDurationMonths: months,
              paymentSchedules: {
                create: rental.paymentSchedules.map((ps) => ({
                  day: ps.day,
                  amount: ps.amount,
                })),
              },
            },
            update: {
              leaseStartAt: leaseStart,
              rentDurationMonths: months,
              status: "active",
              cancelledAt: null,
            },
          });

          await tx.paymentSchedule.deleteMany({
            where: { rentalAgreementId: ra.id },
          });
          await tx.paymentSchedule.createMany({
            data: rental.paymentSchedules.map((ps) => ({
              rentalAgreementId: ra.id,
              day: ps.day,
              amount: ps.amount,
            })),
          });
        }
      } else {
        await tx.rentalAgreement.deleteMany({ where: { clientId: id } });

        if (typeSwitch || purchaseRaw !== undefined) {
          if (!purchase) {
            throw new Error("purchase_payload");
          }
          const pa = await tx.purchaseAgreement.upsert({
            where: { clientId: id },
            create: {
              clientId: id,
              totalPrice: purchase.totalPrice,
              installments: {
                create: purchase.installments.map((inst, i) => ({
                  dueDate: new Date(inst.dueDate),
                  amount: inst.amount,
                  sortOrder: i,
                })),
              },
            },
            update: {
              totalPrice: purchase.totalPrice,
            },
          });

          if (pa.id) {
            await tx.purchaseInstallment.deleteMany({
              where: { purchaseAgreementId: pa.id },
            });
            await tx.purchaseInstallment.createMany({
              data: purchase.installments.map((inst, i) => ({
                purchaseAgreementId: pa.id,
                dueDate: new Date(inst.dueDate),
                amount: inst.amount,
                sortOrder: i,
              })),
            });
          }
        }
      }

      return tx.client.findUniqueOrThrow({
        where: { id },
        include: clientDetailInclude,
      });
    });

    res.json(client);
  } catch (e) {
    if (e instanceof Error && e.message === "rental_payload") {
      res.status(400).json({ message: "Түрээсийн мэдээлэл оруулна уу" });
      return;
    }
    if (e instanceof Error && e.message === "purchase_payload") {
      res.status(400).json({ message: "Худалдан авалтын мэдээлэл оруулна уу" });
      return;
    }
    console.error(e);
    res.status(500).json({ message: "Хадгалахад алдаа гарлаа" });
  }
};

export const cancelRental = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = parseInt(req.params.id as string);

  const existing = await prisma.client.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ message: "Харилцагч олдсонгүй" });
    return;
  }

  const rental = await prisma.rentalAgreement.findUnique({
    where: { clientId: id },
  });

  if (!rental) {
    res.status(404).json({ message: "Түрээсийн гэрээ олдсонгүй" });
    return;
  }

  if (rental.status === "cancelled") {
    res.status(400).json({ message: "Түрээс аль хэдийн цуцлагдсан" });
    return;
  }

  const now = new Date();
  const ty = now.getFullYear();
  const tm = now.getMonth() + 1;
  const td = now.getDate();

  await prisma.$transaction([
    prisma.rentalAgreement.update({
      where: { id: rental.id },
      data: { status: "cancelled", cancelledAt: now },
    }),
    prisma.invoice.updateMany({
      where: {
        clientId: id,
        status: "pending",
        purchaseInstallmentId: null,
        OR: [
          { scheduleYear: { gt: ty } },
          {
            AND: [{ scheduleYear: ty }, { scheduleMonth: { gt: tm } }],
          },
          {
            AND: [
              { scheduleYear: ty },
              { scheduleMonth: tm },
              { scheduleDay: { gt: td } },
            ],
          },
        ],
      },
      data: { status: "cancelled" },
    }),
  ]);

  const client = await prisma.client.findUnique({
    where: { id },
    include: clientDetailInclude,
  });

  res.json(client);
};

export const deleteClient = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = parseInt(req.params.id as string);

  const existing = await prisma.client.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ message: "Харилцагч олдсонгүй" });
    return;
  }

  await prisma.client.delete({ where: { id } });
  res.status(204).send();
};
