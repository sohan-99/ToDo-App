import bcrypt from 'bcrypt';

/**
 * Configuration for authentication functions
 */
const AUTH_CONFIG = {
  saltRounds: 10,
  minPasswordLength: 8,
};

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error('Password is required');
  }

  if (password.length < AUTH_CONFIG.minPasswordLength) {
    throw new Error(`Password must be at least ${AUTH_CONFIG.minPasswordLength} characters long`);
  }

  return await bcrypt.hash(password, AUTH_CONFIG.saltRounds);
}

/**
 * Verify a password against its hash
 * @param plainPassword - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise resolving to a boolean indicating if the password matches
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  if (!plainPassword || !hashedPassword) {
    return false;
  }

  return await bcrypt.compare(plainPassword, hashedPassword);
}
