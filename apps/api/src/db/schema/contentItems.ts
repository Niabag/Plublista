import { pgTable, pgEnum, uuid, text, varchar, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const contentTypeEnum = pgEnum('content_type', ['reel', 'carousel', 'post']);

export const contentStatusEnum = pgEnum('content_status', [
  'draft',
  'generating',
  'scheduled',
  'published',
  'failed',
  'retrying',
]);

export const contentItems = pgTable(
  'content_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: contentTypeEnum('type').notNull(),
    title: varchar('title', { length: 255 }),
    status: contentStatusEnum('status').default('draft').notNull(),
    style: varchar('style', { length: 50 }),
    format: varchar('format', { length: 10 }),
    duration: integer('duration'),
    mediaUrls: jsonb('media_urls').$type<string[]>().default([]).notNull(),
    generatedMediaUrl: varchar('generated_media_url', { length: 2048 }),
    caption: text('caption'),
    hashtags: jsonb('hashtags').$type<string[]>().default([]).notNull(),
    hookText: text('hook_text'),
    ctaText: text('cta_text'),
    musicUrl: varchar('music_url', { length: 2048 }),
    musicPrompt: text('music_prompt'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_content_items_user_id').on(table.userId),
    index('idx_content_items_user_id_status').on(table.userId, table.status),
  ],
);
