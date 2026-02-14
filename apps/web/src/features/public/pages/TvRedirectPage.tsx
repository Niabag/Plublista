import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { apiPost } from '@/lib/apiClient';

// Redirect config — easy to update without redeployment
const TV_REDIRECT_CONFIG = {
  // Set to a path to enable promo redirect, null for default
  promoRedirect: null as string | null,
  defaultRedirect: '/',
};

export function TvRedirectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    // Preserve UTM params
    const utmParams = new URLSearchParams();
    if (!searchParams.has('utm_source')) utmParams.set('utm_source', 'qr_logo');
    searchParams.forEach((v, k) => utmParams.set(k, v));

    // Record scan for authenticated users (fire-and-forget)
    if (isAuthenticated) {
      apiPost('/api/tv/scan', {
        source: searchParams.get('utm_medium') || undefined,
        campaign: searchParams.get('utm_campaign') || undefined,
      }).catch(() => {
        // Non-blocking — scan recording failure should not block redirect
      });
    }

    // Authenticated users go to dashboard, others to landing/promo
    const target = isAuthenticated
      ? '/dashboard'
      : (TV_REDIRECT_CONFIG.promoRedirect ?? TV_REDIRECT_CONFIG.defaultRedirect);

    const separator = target.includes('?') ? '&' : '?';
    const url = utmParams.toString()
      ? `${target}${separator}${utmParams.toString()}`
      : target;

    navigate(url, { replace: true });
  }, [navigate, searchParams, isAuthenticated]);

  return null;
}
