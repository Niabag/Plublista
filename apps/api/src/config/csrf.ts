import { csrfSync } from 'csrf-sync';

const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
});

export { csrfSynchronisedProtection, generateToken };
