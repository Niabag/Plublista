import { pgTable, pgEnum, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const platformEnum = pgEnum('platform', [
  'instagram',
  'youtube',
  'tiktok',
  'facebook',
  'linkedin',
  'x',
]);

export const platformConnections = pgTable(
  'platform_connections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    platform: platformEnum('platform').notNull(),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    platformUserId: text('platform_user_id').notNull(),
    platformUsername: text('platform_username').notNull(),
    connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('idx_platform_connections_user_platform').on(table.userId, table.platform)],
);
