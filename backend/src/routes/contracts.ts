import { Router, Request, Response } from 'express';
import { verifyToken, canPerformAction } from '../lib/auth';
import {
  searchContractsByClient,
  getAllContracts,
  getContractById,
  updateContractNarrative,
  archiveContract,
  approveContract,
} from '../lib/contracts';

const router = Router();

// GET /api/contracts?client=searchTerm
router.get('/', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const userType = req.headers['x-user-type'] as string | undefined;
  const token = authHeader.substring(7);
  const userInfo = await verifyToken(token, userType);

  if (!userInfo) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  if (!canPerformAction(userInfo.scopes, 'review')) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const client = req.query.client as string | undefined;
  let contracts;
  if (client) {
    contracts = searchContractsByClient(client);
  } else {
    contracts = getAllContracts();
  }

  res.json({
    contracts,
    userInfo: {
      name: userInfo.name,
      userType: userInfo.userType,
      scopes: userInfo.scopes,
    },
  });
});

// GET /api/contracts/:id
router.get('/:id', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const userType = req.headers['x-user-type'] as string | undefined;
  const token = authHeader.substring(7);
  const userInfo = await verifyToken(token, userType);

  if (!userInfo) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  if (!canPerformAction(userInfo.scopes, 'review')) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const contract = getContractById(req.params.id);
  if (!contract) {
    res.status(404).json({ error: 'Contract not found' });
    return;
  }

  res.json({
    contract,
    userInfo: {
      name: userInfo.name,
      userType: userInfo.userType,
      scopes: userInfo.scopes,
    },
  });
});

// PATCH /api/contracts/:id - for edit, approve, archive actions
router.patch('/:id', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const userType = req.headers['x-user-type'] as string | undefined;
  const token = authHeader.substring(7);
  const userInfo = await verifyToken(token, userType);

  if (!userInfo) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const { action, narrative } = req.body;

  if (!canPerformAction(userInfo.scopes, action)) {
    res.status(403).json({
      error: 'Denied',
      message: `Your user type (${userInfo.userType}) does not have permission to ${action} contracts.`,
    });
    return;
  }

  let result;

  switch (action) {
    case 'edit':
      if (!narrative) {
        res.status(400).json({ error: 'Narrative is required for edit' });
        return;
      }
      const editSuccess = updateContractNarrative(req.params.id, narrative);
      result = editSuccess
        ? { success: true, message: 'Contract updated successfully' }
        : { success: false, message: 'Failed to update contract' };
      break;

    case 'approve':
      result = approveContract(req.params.id, userInfo.username);
      break;

    case 'archive':
      const archiveSuccess = archiveContract(req.params.id);
      result = archiveSuccess
        ? { success: true, message: 'Contract archived successfully' }
        : { success: false, message: 'Failed to archive contract' };
      break;

    default:
      res.status(400).json({ error: 'Invalid action' });
      return;
  }

  if (!result.success) {
    res.status(400).json({ error: result.message });
    return;
  }

  res.json(result);
});

export default router;
