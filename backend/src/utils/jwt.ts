import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'fallback_access_secret_12345!';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret_12345!';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}
