import { Router, Request, Response } from 'express';
import { verifyToken, getAllowedActions, decodeJwtPayload } from '../lib/auth';

const router = Router();

// POST /api/auth/verify - verify token and return user info
router.post('/verify', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
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
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  // Get user attributes from request body (fetched from Cognito on client)
  let userType = userInfo.userType;
  let name = userInfo.name;

  if (req.body) {
    console.log('User attributes from client:', JSON.stringify(req.body, null, 2));
    if (req.body.userType) {
      userType = req.body.userType;
    }
    if (req.body.name) {
      name = req.body.name;
    }
  }

  // Use scopes from the JWT token (already parsed by verifyToken)
  const scopes = userInfo.scopes;

  console.log('Final user type:', userType);
  console.log('Scopes from token:', scopes);
  console.log('Allowed actions:', getAllowedActions(scopes));

  res.json({
    username: userInfo.username,
    name,
    userType,
    scopes,
    allowedActions: getAllowedActions(scopes),
  });
});

export default router;
