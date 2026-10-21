import type { ErrorRequestHandler, Request, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

// Nas versões recentes dos tipos do Express, req.params.x é string | string[].
// Este helper devolve sempre uma string.
export function param(req: Request, name: string): string {
  const value = req.params[name];
  const first = Array.isArray(value) ? value[0] : value;
  if (!first) throw new HttpError(400, "Pedido inválido.");
  return first;
}

// Evita try/catch em cada rota: qualquer erro vai para o errorHandler
export const h =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export function parse<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown
): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const path = result.error.issues[0]?.path.join(".");
    throw new HttpError(
      400,
      path ? `Campo inválido: ${path}` : "Dados inválidos."
    );
  }
  return result.data;
}

// Data opcional: "" ou null limpam o campo; texto inválido é rejeitado
export const dateInput = z
  .string()
  .nullable()
  .transform((value, ctx) => {
    if (value === null || value === "") return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Data inválida" });
      return z.NEVER;
    }
    return date;
  });

// Texto opcional: "" vira null
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null);

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error:
          "Já existe um registo com estes dados (por exemplo, o número do ficheiro).",
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Registo não encontrado." });
    }
  }

  // Erros do body-parser: JSON malformado, corpo demasiado grande
  const status = (err as { status?: number })?.status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    return res.status(status).json({ error: "Pedido inválido." });
  }

  console.error(err);
  res.status(500).json({ error: "Ocorreu um erro no servidor." });
};