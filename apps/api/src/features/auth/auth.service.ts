import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index';
import { users } from '../../db/schema/index';
import { AppError } from '../../lib/errors';
import type { RegisterInput, ProfileUpdateInput } from '@plublista/shared';

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      displayName: users.displayName,
      role: users.role,
      subscriptionTier: users.subscriptionTier,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      onboardingCompletedAt: users.onboardingCompletedAt,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const user = result[0];
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _excluded, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

const BCRYPT_ROUNDS = 12;

export async function registerUser(data: RegisterInput) {
  const email = data.email.toLowerCase().trim();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new AppError('CONFLICT', 'This email is already registered', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  try {
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        displayName: data.displayName,
      })
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        subscriptionTier: users.subscriptionTier,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        onboardingCompletedAt: users.onboardingCompletedAt,
      });

    return newUser;
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes('unique constraint')
    ) {
      throw new AppError('CONFLICT', 'This email is already registered', 409);
    }
    throw err;
  }
}

export async function updateUserProfile(userId: string, data: ProfileUpdateInput) {
  const [updated] = await db
    .update(users)
    .set({
      displayName: data.displayName,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      subscriptionTier: users.subscriptionTier,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      onboardingCompletedAt: users.onboardingCompletedAt,
    });

  if (!updated) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  return updated;
}

export async function completeOnboarding(userId: string) {
  const [updated] = await db
    .update(users)
    .set({
      onboardingCompletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      subscriptionTier: users.subscriptionTier,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      onboardingCompletedAt: users.onboardingCompletedAt,
    });

  if (!updated) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  return updated;
}
