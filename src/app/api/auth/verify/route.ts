import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAllowedActions } from '@/lib/auth';

// Decode JWT payload without verification (for logging)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// POST /api/auth/verify - verify token and return user info
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  // Log the JWT token and its decoded payload
  console.log('\n========== JWT ACCESS TOKEN ==========');
  console.log('Raw Token:', token);
  console.log('\n---------- Decoded Payload ----------');
  const decodedPayload = decodeJwtPayload(token);
  console.log(JSON.stringify(decodedPayload, null, 2));
  console.log('=====================================\n');

  const userInfo = await verifyToken(token);

  if (!userInfo) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Get user attributes from request body (fetched from Cognito on client)
  let userType = userInfo.userType;
  let name = userInfo.name;

  try {
    const body = await request.json();
    console.log('User attributes from client:', JSON.stringify(body, null, 2));
    if (body.userType) {
      userType = body.userType;
    }
    if (body.name) {
      name = body.name;
    }
  } catch {
    // No body or invalid JSON - use defaults from token
  }

  // Use scopes from the JWT token (already parsed by verifyToken)
  const scopes = userInfo.scopes;

  console.log('Final user type:', userType);
  console.log('Scopes from token:', scopes);
  console.log('Allowed actions:', getAllowedActions(scopes));

  return NextResponse.json({
    username: userInfo.username,
    name,
    userType,
    scopes,
    allowedActions: getAllowedActions(scopes),
  });
}
