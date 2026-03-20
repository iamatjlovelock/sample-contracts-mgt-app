import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, canPerformAction } from '@/lib/auth';
import { searchContractsByClient, getAllContracts } from '@/lib/contracts';

// GET /api/contracts?client=searchTerm
export async function GET(request: NextRequest) {
  // Get authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user type from header (fetched from Cognito attributes on client)
  const userType = request.headers.get('x-user-type') || undefined;

  const token = authHeader.substring(7);
  const userInfo = await verifyToken(token, userType);

  if (!userInfo) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Check if user has at least REVIEW scope to list contracts
  if (!canPerformAction(userInfo.scopes, 'review')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Get search parameter
  const searchParams = request.nextUrl.searchParams;
  const client = searchParams.get('client');

  let contracts;
  if (client) {
    contracts = searchContractsByClient(client);
  } else {
    contracts = getAllContracts();
  }

  return NextResponse.json({
    contracts,
    userInfo: {
      name: userInfo.name,
      userType: userInfo.userType,
      scopes: userInfo.scopes,
    },
  });
}
