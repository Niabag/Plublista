import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { registerInstagramStrategy } from './passport-instagram';

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const { loginUser } = await import('../features/auth/auth.service');
        const user = await loginUser(email, password);
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as { id: string }).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const { db } = await import('../db/index');
    const { users } = await import('../db/schema/index');
    const { eq } = await import('drizzle-orm');

    const result = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        subscriptionTier: users.subscriptionTier,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        onboardingCompletedAt: users.onboardingCompletedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    done(null, result[0] || null);
  } catch (err) {
    // On DB errors (e.g. Neon cold start timeout), treat as unauthenticated
    // instead of propagating a 500 to every request
    console.warn('deserializeUser failed:', (err as Error).message);
    done(null, null);
  }
});

// Register OAuth strategies
registerInstagramStrategy();

export default passport;
