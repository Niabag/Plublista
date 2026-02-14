export interface CreditUsage {
  tier: string;
  creditsUsed: number;
  creditsLimit: number;
  percentage: number;
  period: { start: string; end: string };
}
