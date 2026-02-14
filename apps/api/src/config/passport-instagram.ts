import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import passport from 'passport';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index';
import { platformConnections } from '../db/schema/index';
import { encrypt } from '../lib/encryption';
import {
  exchangeForLongLivedToken,
  fetchInstagramProfile,
} from '../services/instagram.service';

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID || '';
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET || '';
const INSTAGRAM_CALLBACK_URL =
  process.env.INSTAGRAM_CALLBACK_URL || 'http://localhost:3001/api/auth/oauth/instagram/callback';

export function registerInstagramStrategy() {
  if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET) {
    // Skip registration if credentials not configured (dev without Instagram)
    return;
  }

  const strategy = new OAuth2Strategy(
    {
      authorizationURL: 'https://www.instagram.com/oauth/authorize',
      tokenURL: 'https://api.instagram.com/oauth/access_token',
      clientID: INSTAGRAM_CLIENT_ID,
      clientSecret: INSTAGRAM_CLIENT_SECRET,
      callbackURL: INSTAGRAM_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (
      req: Express.Request,
      shortLivedToken: string,
      _refreshToken: string,
      _profile: object,
      done: (err: Error | null, user?: Express.User | false) => void,
    ) => {
      try {
        const user = req.user;
        if (!user) {
          return done(new Error('User must be authenticated to connect Instagram'));
        }

        const userId = (user as { id: string }).id;

        // Exchange short-lived token for long-lived token (60 days)
        const longLived = await exchangeForLongLivedToken(
          shortLivedToken,
          INSTAGRAM_CLIENT_SECRET,
        );

        // Fetch Instagram user profile
        const profile = await fetchInstagramProfile(longLived.access_token);

        // Calculate token expiry
        const tokenExpiresAt = new Date(Date.now() + longLived.expires_in * 1000);

        // Encrypt tokens
        const encryptedAccessToken = encrypt(longLived.access_token);

        // Upsert platform connection
        const existing = await db
          .select({ id: platformConnections.id })
          .from(platformConnections)
          .where(
            and(
              eq(platformConnections.userId, userId),
              eq(platformConnections.platform, 'instagram'),
            ),
          )
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(platformConnections)
            .set({
              accessToken: encryptedAccessToken,
              refreshToken: null,
              tokenExpiresAt,
              platformUserId: profile.user_id,
              platformUsername: profile.username,
              connectedAt: new Date(),
            })
            .where(eq(platformConnections.id, existing[0].id));
        } else {
          await db.insert(platformConnections).values({
            userId,
            platform: 'instagram',
            accessToken: encryptedAccessToken,
            refreshToken: null,
            tokenExpiresAt,
            platformUserId: profile.user_id,
            platformUsername: profile.username,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err instanceof Error ? err : new Error(String(err)));
      }
    },
  );

  // Instagram returns token data as form-encoded, override to parse correctly
  strategy.userProfile = function (_accessToken: string, done: (err: Error | null, profile?: object) => void) {
    // We fetch profile ourselves in the verify callback, so just return empty profile
    done(null, {});
  };

  passport.use('instagram', strategy);
}
