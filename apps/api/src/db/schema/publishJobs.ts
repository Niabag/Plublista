import { pgTable, pgEnum, uuid, text, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { contentItems } from './contentItems';
import { platformEnum } from './platformConnections';

export const publishStatusEnum = pgEnum('publish_status', [
  'pending',
  'publishing',
  'published',
  'failed',
  'retrying',
]);

export const publishJobs = pgTable(
  'publish_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contentItemId: uuid('content_item_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    platform: platformEnum('platform').notNull(),
    status: publishStatusEnum('status').default('pending').notNull(),
    publishedUrl: text('published_url'),
    errorMessage: text('error_message'),
    errorCode: varchar('error_code', { length: 100 }),
    attemptCount: integer('attempt_count').default(0).notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_publish_jobs_user_id').on(table.userId),
    index('idx_publish_jobs_content_item_id').on(table.contentItemId),
    index('idx_publish_jobs_user_id_status').on(table.userId, table.status),
  ],
);
