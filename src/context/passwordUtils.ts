/**
 * Utility functions for password and verification code management
 */

/**
 * Generates a temporary password for new users
 * @returns A random password string
 */
export function generateTemporaryPassword(): string {
  const length = 8;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

/**
 * Generates a 6-digit verification code for SMS authentication
 * @returns A 6-digit numeric code as string
 */
export function generateTemporaryCode(): string {
  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * Generates a verification code for registration or login
 * @returns A 6-digit numeric code as string
 */
export function generateVerificationCode(): string {
  return generateTemporaryCode();
}