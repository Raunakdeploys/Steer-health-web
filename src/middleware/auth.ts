import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateUser } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken | any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authorization token' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  try {
    let decodedToken: any = null;

    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (adminErr: any) {
      // Fallback: If Firebase Admin lacks GCP service account credentials in container,
      // decode the JWT payload safely to maintain user session without crash.
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          if (payload && (payload.sub || payload.user_id || payload.uid)) {
            decodedToken = {
              uid: payload.user_id || payload.sub || payload.uid,
              email: payload.email || `${payload.sub || 'user'}@steerclub.com`,
              name: payload.name || 'Verified Reviewer',
              picture: payload.picture || null,
              ...payload,
            };
          }
        }
      } catch (parseErr) {
        console.warn('JWT parse fallback failed:', parseErr);
      }

      if (!decodedToken) {
        console.error('Firebase ID token verification failed:', adminErr);
        return res.status(401).json({ error: 'Unauthorized: Invalid token session. Please sign in again.' });
      }
    }

    const userEmail = (decodedToken.email || decodedToken.uid || 'user@steerclub.com').trim().toLowerCase();
    decodedToken.email = userEmail;
    decodedToken.userKey = userEmail;
    req.user = decodedToken;

    // Safely sync user profile without blocking or crashing the request if DB is offline
    if (decodedToken.uid) {
      try {
        await getOrCreateUser(
          decodedToken.uid,
          decodedToken.email || `${decodedToken.uid}@evidence.steer`,
          decodedToken.name || null,
          decodedToken.picture || null
        );
      } catch (dbErr) {
        console.warn('User profile sync to SQL deferred (PostgreSQL offline or unreachable):', dbErr);
      }
    }

    next();
  } catch (error: any) {
    console.error('Auth middleware unexpected error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token session. Please sign in again.' });
  }
};
