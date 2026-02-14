import { pgTable, uuid, integer, date, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const quotaUsage = pgTable(
  'quota_usage',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    reelsUsed: integer('reels_used').default(0).notNull(),
    reelsLimit: integer('reels_limit').notNull(),
    carouselsUsed: integer('carousels_used').default(0).notNull(),
    carouselsLimit: integer('carousels_limit').notNull(),
    aiImagesUsed: integer('ai_images_used').default(0).notNull(),
    aiImagesLimit: integer('ai_images_limit').notNull(),
    platformsConnected: integer('platforms_connected').default(0).notNull(),
    platformsLimit: integer('platforms_limit').notNull(),
  },
  (table) => [
    uniqueIndex('idx_quota_usage_user_period').on(table.userId, table.periodStart),
  ],
);
