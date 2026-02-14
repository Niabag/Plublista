import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logCost, getUserCosts } from './costTracker';

vi.mock('../db/index', () => {
  const mockInsert = vi.fn().mockReturnThis();
  const mockValues = vi.fn().mockResolvedValue(undefined);
  const mockSelect = vi.fn().mockReturnThis();
  const mockFrom = vi.fn().mockReturnThis();
  const mockWhere = vi.fn().mockResolvedValue([]);

  return {
    db: {
      insert: mockInsert,
      values: mockValues,
      select: mockSelect,
      from: mockFrom,
      where: mockWhere,
    },
  };
});

describe('costTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logCost', () => {
    it('should insert a cost record into the database', async () => {
      const { db } = await import('../db/index');

      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      });

      await logCost('user-123', 'claude', 'messages', 0.0045);

      expect(db.insert).toHaveBeenCalled();
    });

    it('should format cost to 4 decimal places', async () => {
      const { db } = await import('../db/index');

      const mockValues = vi.fn().mockResolvedValue(undefined);
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: mockValues,
      });

      await logCost('user-123', 'fal', 'cassetteai', 0.01);

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          costUsd: '0.0100',
          service: 'fal',
          endpoint: 'cassetteai',
        }),
      );
    });
  });

  describe('getUserCosts', () => {
    it('should query costs for a user', async () => {
      const { db } = await import('../db/index');

      const mockCosts = [
        { id: '1', userId: 'user-123', service: 'claude', endpoint: 'messages', costUsd: '0.0030', createdAt: new Date() },
      ];

      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockCosts),
        }),
      });

      const result = await getUserCosts('user-123');
      expect(result).toEqual(mockCosts);
    });

    it('should filter by date when since is provided', async () => {
      const { db } = await import('../db/index');

      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const since = new Date('2026-01-01');
      const result = await getUserCosts('user-123', since);
      expect(result).toEqual([]);
    });
  });
});
