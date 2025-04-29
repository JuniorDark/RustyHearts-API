import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';

export function generateMD5Hash(account, password) {
  return createHash('md5').update(account + password).digest('hex');
}
export async function hashPassword(password, saltRounds = 10) {
  return await bcrypt.hash(password, saltRounds);
}
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}