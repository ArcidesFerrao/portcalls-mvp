import { hash, verify } from "@node-rs/argon2";

// argon2id, parâmetros mínimos recomendados pela OWASP
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string) {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

// Quando o e-mail não existe, verificamos contra um hash falso para gastar
// o mesmo tempo. Assim não dá para descobrir que e-mails estão registados
// medindo a resposta.
let dummyHash: Promise<string> | null = null;

export async function verifyDummy(password: string) {
  dummyHash ??= hashPassword("palavra-passe-que-nunca-e-usada");
  await verifyPassword(await dummyHash, password);
}