import "dotenv/config";
import { randomBytes } from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/passwords";

// Uso:
//   npm run create-admin -- "Nome da Empresa" admin@empresa.com "Nome Completo"
//
// Se ADMIN_PASSWORD não estiver definida, gera uma palavra-passe aleatória
// e mostra-a uma única vez no fim.

async function main() {
  const [orgName, emailArg, name] = process.argv.slice(2);

  if (!orgName || !emailArg || !name) {
    console.error(
      'Uso: npm run create-admin -- "Empresa" email@empresa.com "Nome Completo"'
    );
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const password =
    process.env.ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");

  if (password.length < 10) {
    console.error("A palavra-passe tem de ter pelo menos 10 caracteres.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`Já existe um utilizador com o e-mail ${email}.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const { org, user } = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: orgName } });
    const user = await tx.user.create({
      data: { email, name, passwordHash, emailVerifiedAt: new Date() },
    });
    await tx.membership.create({
      data: { userId: user.id, organizationId: org.id, role: "ADMIN" },
    });
    return { org, user };
  });

  console.log(`Empresa criada: ${org.name} (${org.id})`);
  console.log(`Administrador: ${user.name} <${user.email}>`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`Palavra-passe (guarde-a, não volta a aparecer): ${password}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());