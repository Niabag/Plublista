export interface QuotaResource {
  resource: 'reels' | 'carousels' | 'aiImages';
  used: number;
  limit: number;
  percentage: number;
}

export interface QuotaUsage {
  tier: string;
  quotas: QuotaResource[];
  period: { start: string; end: string };
}
