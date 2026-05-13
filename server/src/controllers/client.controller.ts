import { Request, Response } from "express";

import prisma from "../lib/prisma";
import { ClientStatus, PaymentType } from "../generated/prisma/enums";

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
      include: {
        system: { select: { id: true, name: true, photo: true } },
        paymentSchedules: { orderBy: { day: "asc" } },
      },
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
    include: {
      system: { select: { id: true, name: true, photo: true } },
      paymentSchedules: { orderBy: { day: "asc" } },
    },
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
    paymentType,
    status,
    domain,
    notes,
    regNumber,
    phoneNumber,
    phoneNumber2,
    email,
    productType,
    systemId,
    paymentSchedules,
  } = req.body;

  if (!name || !phoneNumber) {
    res.status(400).json({ message: "Шаардлагатай өгөгдөл оруулна уу" });
    return;
  }

  const client = await prisma.client.create({
    data: {
      name,
      paymentType: (paymentType as PaymentType) || "rent",
      status: status || "active",
      domain: domain || null,
      systemId: systemId ? parseInt(systemId) : null,
      notes,
      regNumber,
      phoneNumber,
      phoneNumber2,
      email,
      productType,
      paymentSchedules: {
        create: (paymentSchedules || []).map((ps: { day: number; amount: number }) => ({
          day: ps.day,
          amount: ps.amount,
        })),
      },
    },
    include: {
      system: { select: { id: true, name: true, photo: true } },
      paymentSchedules: { orderBy: { day: "asc" } },
    },
  });

  res.status(201).json(client);
};

export const updateClient = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const {
    name,
    paymentType,
    status,
    domain,
    notes,
    regNumber,
    phoneNumber,
    phoneNumber2,
    email,
    productType,
    systemId,
    paymentSchedules,
  } = req.body;

  const existing = await prisma.client.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ message: "Харилцагч олдсонгүй" });
    return;
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(paymentType !== undefined && { paymentType: paymentType as PaymentType }),
      ...(status !== undefined && { status }),
      ...(domain !== undefined && { domain: domain || null }),
      ...(systemId !== undefined && { systemId: systemId ? parseInt(systemId) : null }),
      ...(notes !== undefined && { notes }),
      ...(regNumber !== undefined && { regNumber }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(phoneNumber2 !== undefined && { phoneNumber2 }),
      ...(email !== undefined && { email }),
      ...(productType !== undefined && { productType }),
      ...(paymentSchedules !== undefined && {
        paymentSchedules: {
          deleteMany: {},
          create: (paymentSchedules || []).map((ps: { day: number; amount: number }) => ({
            day: ps.day,
            amount: ps.amount,
          })),
        },
      }),
    },
    include: {
      system: { select: { id: true, name: true, photo: true } },
      paymentSchedules: { orderBy: { day: "asc" } },
    },
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
