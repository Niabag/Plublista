import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const stripeEvents = pgTable('stripe_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  stripeEventId: text('stripe_event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
});
