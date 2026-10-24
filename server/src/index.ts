// Tem de ser o PRIMEIRO import: originCheck e sessions leem process.env
// quando o módulo é carregado, e os imports correm antes de qualquer
// chamada a dotenv.config() mais abaixo no ficheiro.
import "dotenv/config";

import express from "express";
import cookieParser from "cookie-parser";
import { prisma } from "./lib/prisma";
import { errorHandler } from "./lib/http";
import { originCheck } from "./middleware/originCheck";
import { requireAuth } from "./middleware/requireAuth";
import { authRouter } from "./routes/auth";
import { processesRouter } from "./routes/processes";
import { itemsRouter } from "./routes/items";
import { statsRouter } from "./routes/stats";

const app = express();
const PORT = process.env.PORT || 3001;

// Quantos proxies existem entre o utilizador e o servidor. Em produção
// (Vercel -> Render) são 2; em desenvolvimento, 1 chega.
// Se estiver errado, o limite de tentativas do login conta mal os IPs.
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 1));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Health check (público)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", originCheck);

// Público: login, logout, /me
app.use("/api/auth", authRouter);

// Tudo o que vem a seguir exige sessão válida
app.use("/api", requireAuth);
app.use("/api", processesRouter);
app.use("/api", itemsRouter);
app.use("/api", statsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`PortOps API a correr em http://localhost:${PORT}`);
});

// Encerramento limpo
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});