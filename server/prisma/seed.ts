import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { config } from "dotenv";
config();

async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: parseInt(url.port || "3306"),
    user: url.username,
    password: url.password,
    database: url.pathname.replace("/", ""),
    connectionLimit: 5,
  });
  const prisma = new PrismaClient({ adapter });

  const hashed = await bcrypt.hash("Infitech@202020***", 10);
  const user = await prisma.user.upsert({
    where: { email: "controller@infitech.mn" },
    update: {},
    create: {
      email: "controller@infitech.mn",
      password: hashed,
    },
  });
  console.log("Created user:", user.email);
  process.exit(0);
}

main().catch(console.error);
