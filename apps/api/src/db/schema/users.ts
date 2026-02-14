import { pgTable, pgEnum, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'starter',
  'pro',
  'business',
  'agency',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('free').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
  ayrshareProfileKey: text('ayrshare_profile_key'),
});
