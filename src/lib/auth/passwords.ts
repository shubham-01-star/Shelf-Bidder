import bcrypt from 'bcryptjs';

const DEFAULT_BCRYPT_ROUNDS = 10;
const BCRYPT_PREFIX = /^\$2[aby]\$/;

function getBcryptRounds(): number {
  const parsed = Number.parseInt(process.env.AUTH_BCRYPT_ROUNDS || '', 10);
  return Number.isFinite(parsed) && parsed >= 8 ? parsed : DEFAULT_BCRYPT_ROUNDS;
}

export function isPasswordHash(value: string | null | undefined): boolean {
  return typeof value === 'string' && BCRYPT_PREFIX.test(value);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, getBcryptRounds());
}

export async function verifyPassword(
  password: string,
  storedPassword: string | null | undefined
): Promise<{ valid: boolean; needsMigration: boolean }> {
  if (!storedPassword) {
    return { valid: false, needsMigration: false };
  }

  if (isPasswordHash(storedPassword)) {
    const valid = await bcrypt.compare(password, storedPassword);
    return { valid, needsMigration: false };
  }

  return {
    valid: storedPassword === password,
    needsMigration: storedPassword === password,
  };
}
