import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getSystems = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { search, page = "1", limit = "100" } = req.query;

  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
  const skip = (pageNum - 1) * limitNum;

  const where = search ? { name: { contains: search as string } } : {};

  const [data, total] = await prisma.$transaction([
    prisma.system.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: "desc" },
    }),
    prisma.system.count({ where }),
  ]);

  res.json({ data, total, page: pageNum, limit: limitNum });
};

export const getSystemById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = parseInt(req.params.id as string);

  const system = await prisma.system.findUnique({ where: { id } });

  if (!system) {
    res.status(404).json({ message: "Систем олдсонгүй" });
    return;
  }

  res.json(system);
};

export const createSystem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { name, photo, isEnabled } = req.body;

  if (!name) {
    res.status(400).json({ message: "Системийн нэр оруулна уу" });
    return;
  }

  const existing = await prisma.system.findUnique({ where: { name } });
  if (existing) {
    res.status(409).json({ message: "Энэ систем аль хэдийн бүртгэлтэй байна" });
    return;
  }

  const system = await prisma.system.create({
    data: {
      name,
      photo: photo ?? null,
      isEnabled: isEnabled ?? true,
    },
  });

  res.status(201).json(system);
};

export const updateSystem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const { name, photo, isEnabled } = req.body;

  const existing = await prisma.system.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ message: "Систем олдсонгүй" });
    return;
  }

  if (name && name !== existing.name) {
    const duplicate = await prisma.system.findUnique({ where: { name } });
    if (duplicate) {
      res.status(409).json({ message: "Энэ систем аль хэдийн бүртгэлтэй байна" });
      return;
    }
  }

  const system = await prisma.system.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(photo !== undefined && { photo }),
      ...(isEnabled !== undefined && { isEnabled }),
    },
  });

  res.json(system);
};

export const deleteSystem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = parseInt(req.params.id as string);

  const existing = await prisma.system.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ message: "Систем олдсонгүй" });
    return;
  }

  await prisma.system.delete({ where: { id } });
  res.status(204).send();
};
