export type UserRole = 'user' | 'admin';

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'business' | 'agency';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
  updatedAt: string;
  onboardingCompletedAt: string | null;
}
