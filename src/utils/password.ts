import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const hashPassword = (plain: string, salt?: string) => {
  const resolvedSalt = salt ?? randomBytes(16).toString('hex');
  const derived = scryptSync(plain, resolvedSalt, 64);
  return {
    hash: derived.toString('hex'),
    salt: resolvedSalt,
  };
};

export const verifyPassword = (plain: string, hash: string, salt: string) => {
  const derived = scryptSync(plain, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (derived.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(derived, expected);
};
