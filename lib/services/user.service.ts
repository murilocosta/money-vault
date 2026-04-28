import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(name: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({ data: { name, email, passwordHash } });
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
