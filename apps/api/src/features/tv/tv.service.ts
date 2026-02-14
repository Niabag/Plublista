import { eq, count, sql } from 'drizzle-orm';
import { db } from '../../db';
import { tvScans } from '../../db/schema/tvScans';

// Badge definitions — ordered by threshold ascending
export const TV_BADGES = [
  { threshold: 1, id: 'starter', label: 'Starter', reward: '1 free premium template' },
  { threshold: 5, id: 'bronze', label: 'Bronze', reward: '1 week Pro free + badge' },
  { threshold: 15, id: 'silver', label: 'Silver', reward: '1 month Pro free + badge' },
  { threshold: 30, id: 'gold', label: 'Gold', reward: '3 months Pro free + exclusive templates + badge' },
  { threshold: 50, id: 'og_scanner', label: 'OG Scanner', reward: 'Lifetime badge + merch eligibility' },
] as const;

export type TvBadge = (typeof TV_BADGES)[number];

/**
 * Derive earned badges from a total scan count.
 */
export function getBadgesForCount(totalScans: number): TvBadge[] {
  return TV_BADGES.filter((b) => totalScans >= b.threshold);
}

/**
 * Record a TV scan for an authenticated user.
 * Returns { recorded, totalScans, badges, newBadge? }
 * - recorded=false if this is a duplicate (same user + campaign + day)
 */
export async function recordScan(
  userId: string,
  source?: string,
  campaign?: string,
): Promise<{
  recorded: boolean;
  totalScans: number;
  badges: TvBadge[];
  newBadge: TvBadge | null;
}> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const campaignValue = campaign || 'default';

  // Get count before insert for new-badge detection
  const beforeResult = await db
    .select({ value: count() })
    .from(tvScans)
    .where(eq(tvScans.userId, userId));
  const countBefore = beforeResult[0]?.value ?? 0;

  // Try to insert — unique index prevents duplicates
  try {
    await db.insert(tvScans).values({
      userId,
      source: source || null,
      campaign: campaignValue,
      scanDate: today,
    });
  } catch (err: unknown) {
    // Postgres unique violation = duplicate scan
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      const badges = getBadgesForCount(countBefore);
      return { recorded: false, totalScans: countBefore, badges, newBadge: null };
    }
    throw err;
  }

  const totalScans = countBefore + 1;
  const badgesBefore = getBadgesForCount(countBefore);
  const badgesAfter = getBadgesForCount(totalScans);

  // Detect newly unlocked badge
  const newBadge = badgesAfter.length > badgesBefore.length
    ? badgesAfter[badgesAfter.length - 1]
    : null;

  return { recorded: true, totalScans, badges: badgesAfter, newBadge };
}

/**
 * Get a user's TV scan stats (count + earned badges).
 */
export async function getUserStats(userId: string): Promise<{
  totalScans: number;
  badges: TvBadge[];
  nextBadge: TvBadge | null;
  scansToNext: number;
}> {
  const result = await db
    .select({ value: count() })
    .from(tvScans)
    .where(eq(tvScans.userId, userId));
  const totalScans = result[0]?.value ?? 0;

  const badges = getBadgesForCount(totalScans);
  const nextBadge = TV_BADGES.find((b) => totalScans < b.threshold) || null;
  const scansToNext = nextBadge ? nextBadge.threshold - totalScans : 0;

  return { totalScans, badges, nextBadge, scansToNext };
}

/**
 * Public leaderboard — top scanners (anonymized display names).
 */
export async function getLeaderboard(limit = 10): Promise<
  Array<{ userId: string; displayName: string; totalScans: number; topBadge: string | null }>
> {
  const rows = await db.execute(sql`
    SELECT
      ts.user_id,
      u.display_name,
      COUNT(*)::int AS total_scans
    FROM tv_scans ts
    JOIN users u ON u.id = ts.user_id
    GROUP BY ts.user_id, u.display_name
    ORDER BY total_scans DESC
    LIMIT ${limit}
  `);

  return (rows.rows as Array<{ user_id: string; display_name: string; total_scans: number }>).map(
    (row) => {
      const totalScans = row.total_scans;
      const badges = getBadgesForCount(totalScans);
      const topBadge = badges.length > 0 ? badges[badges.length - 1].id : null;
      return {
        userId: row.user_id,
        displayName: row.display_name,
        totalScans,
        topBadge,
      };
    },
  );
}
