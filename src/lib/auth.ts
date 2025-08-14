import bcrypt from 'bcrypt';
const AUTH_CONFIG = {
  saltRounds: 10,
  minPasswordLength: 8,
};
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error('Password is required');
  }
  if (password.length < AUTH_CONFIG.minPasswordLength) {
    throw new Error(`Password must be at least ${AUTH_CONFIG.minPasswordLength} characters long`);
  }
  return await bcrypt.hash(password, AUTH_CONFIG.saltRounds);
}
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  if (!plainPassword || !hashedPassword) {
    return false;
  }
  return await bcrypt.compare(plainPassword, hashedPassword);
}
