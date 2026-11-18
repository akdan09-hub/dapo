import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

const SESSION_SECRET = process.env.SESSION_SECRET || 'portal-sertifikasi-guru-secret-key-2026';

export interface AuthUserPayload {
  uid: string;
  email: string;
  nama?: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload & Partial<DecodedIdToken>;
}

export function hashPassword(password: string): string {
  const salt = 'sertifikasi-salt-2026';
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function createCustomToken(payload: AuthUserPayload): string {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `custom.${data}.${signature}`;
}

export function verifyCustomToken(token: string): AuthUserPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || parts[0] !== 'custom') return null;
    const [, data, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    if (sig !== expectedSig) return null;
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return {
      uid: parsed.uid,
      email: parsed.email,
      nama: parsed.nama,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Check if custom signed session token (for credential login / role accounts)
  if (token.startsWith('custom.')) {
    const customUser = verifyCustomToken(token);
    if (customUser) {
      req.user = customUser;
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid session token' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      ...decodedToken,
      uid: decodedToken.uid,
      email: decodedToken.email || `${decodedToken.uid}@guru.belajar.id`,
      nama: decodedToken.name || decodedToken.email?.split('@')[0] || 'Pengguna',
    };
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
