import { pgTable, pgEnum, uuid, varchar, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const apiServiceEnum = pgEnum('api_service', [
  'fal',
  'ayrshare',
  'stripe',
  'claude',
  'instagram',
]);

export const apiCostLogs = pgTable(
  'api_cost_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    service: apiServiceEnum('service').notNull(),
    endpoint: varchar('endpoint', { length: 255 }).notNull(),
    costUsd: numeric('cost_usd', { precision: 10, scale: 4 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_api_cost_logs_user_id').on(table.userId),
    index('idx_api_cost_logs_user_id_created_at').on(table.userId, table.createdAt),
  ],
);
