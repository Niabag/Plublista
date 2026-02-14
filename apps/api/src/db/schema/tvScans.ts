import { pgTable, uuid, varchar, timestamp, index, uniqueIndex, date } from 'drizzle-orm/pg-core';
import { users } from './users';

export const tvScans = pgTable(
  'tv_scans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    source: varchar('source', { length: 100 }), // utm_medium
    campaign: varchar('campaign', { length: 255 }), // utm_campaign
    scanDate: date('scan_date').notNull(), // date only, for dedup
    scannedAt: timestamp('scanned_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_tv_scans_user_id').on(table.userId),
    // Deduplicate: same user + same campaign + same day
    uniqueIndex('idx_tv_scans_dedup').on(table.userId, table.campaign, table.scanDate),
  ],
);
