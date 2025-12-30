import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'erp-secret-key-change-in-production'
);

export async function generateToken(payload) {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    return token;
  } catch (error) {
    console.error('Generate token error:', error);
    throw new Error('Failed to generate token');
  }
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return { isValid: true, payload };
  } catch (error) {
    console.error('Verify token error:', error);
    return { isValid: false, error: 'Invalid or expired token' };
  }
}