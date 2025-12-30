import { verifyToken } from './jwt';

export async function verifyAuth(request) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isValid: false,
        error: 'No authorization token provided'
      };
    }

    const token = authHeader.substring(7);
    const result = await verifyToken(token);

    if (!result.isValid) {
      return {
        isValid: false,
        error: result.error || 'Invalid token'
      };
    }

    return {
      isValid: true,
      user: result.payload
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      isValid: false,
      error: 'Authentication failed'
    };
  }
}

export function extractToken(request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
}