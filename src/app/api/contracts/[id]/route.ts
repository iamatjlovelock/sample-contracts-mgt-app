import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, canPerformAction } from '@/lib/auth';
import { getContractById, updateContractNarrative, archiveContract, approveContract } from '@/lib/contracts';

// GET /api/contracts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  if (!canPerformAction(userInfo.scopes, 'review')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const contract = getContractById(id);
  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  return NextResponse.json({
    contract,
    userInfo: {
      name: userInfo.name,
      userType: userInfo.userType,
      scopes: userInfo.scopes,
    },
  });
}

// PATCH /api/contracts/[id] - for edit, approve, archive actions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const body = await request.json();
  const { action, narrative } = body;

  // Check if user can perform the requested action
  if (!canPerformAction(userInfo.scopes, action)) {
    return NextResponse.json(
      {
        error: 'Denied',
        message: `Your user type (${userInfo.userType}) does not have permission to ${action} contracts.`
      },
      { status: 403 }
    );
  }

  let result;

  switch (action) {
    case 'edit':
      if (!narrative) {
        return NextResponse.json({ error: 'Narrative is required for edit' }, { status: 400 });
      }
      const editSuccess = updateContractNarrative(id, narrative);
      result = editSuccess
        ? { success: true, message: 'Contract updated successfully' }
        : { success: false, message: 'Failed to update contract' };
      break;

    case 'approve':
      result = approveContract(id, userInfo.username);
      break;

    case 'archive':
      const archiveSuccess = archiveContract(id);
      result = archiveSuccess
        ? { success: true, message: 'Contract archived successfully' }
        : { success: false, message: 'Failed to archive contract' };
      break;

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json(result);
}
