import { CognitoJwtVerifier } from 'aws-jwt-verify';

// Define valid scopes
export type ContractScope = 'REVIEW' | 'EDIT' | 'APPROVE' | 'ARCHIVE';

// Map Cognito scope strings to ContractScope
const COGNITO_SCOPE_MAP: Record<string, ContractScope> = {
  // Colon format (your Cognito setup)
  'contracts:review': 'REVIEW',
  'contracts:edit': 'EDIT',
  'contracts:approve': 'APPROVE',
  'contracts:archive': 'ARCHIVE',
  // Slash format
  'contracts/review': 'REVIEW',
  'contracts/edit': 'EDIT',
  'contracts/approve': 'APPROVE',
  'contracts/archive': 'ARCHIVE',
  // Short form
  'review': 'REVIEW',
  'edit': 'EDIT',
  'approve': 'APPROVE',
  'archive': 'ARCHIVE',
  // Uppercase
  'REVIEW': 'REVIEW',
  'EDIT': 'EDIT',
  'APPROVE': 'APPROVE',
  'ARCHIVE': 'ARCHIVE',
};

// Map user types to their allowed scopes (fallback if no scopes in token)
export const USER_TYPE_SCOPES: Record<string, ContractScope[]> = {
  'Intern': ['REVIEW'],
  'Outside-counsel': ['REVIEW', 'EDIT'],
  'inhouse-counsel': ['REVIEW', 'EDIT', 'APPROVE'],
  'business-operations': ['REVIEW', 'EDIT', 'ARCHIVE'],
};

// Map actions to required scopes
export const ACTION_REQUIRED_SCOPE: Record<string, ContractScope> = {
  'review': 'REVIEW',
  'edit': 'EDIT',
  'approve': 'APPROVE',
  'archive': 'ARCHIVE',
};

export interface DecodedToken {
  sub: string;
  'cognito:username': string;
  'custom:user_type'?: string;
  'custom:name'?: string;
  scope?: string;
  exp: number;
  iat: number;
}

export interface UserInfo {
  username: string;
  name: string;
  userType: string;
  scopes: ContractScope[];
}

// Create JWT verifier for access tokens
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
      tokenUse: 'access',
      clientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
    });
  }
  return verifier;
}

// Parse scopes from JWT scope claim (space-separated string)
function parseScopesFromToken(scopeString: string | undefined): ContractScope[] {
  if (!scopeString) return [];

  const scopes: ContractScope[] = [];
  const scopeParts = scopeString.split(' ');

  console.log('Parsing scope string:', scopeString);
  console.log('Scope parts:', scopeParts);

  for (const part of scopeParts) {
    const mappedScope = COGNITO_SCOPE_MAP[part] || COGNITO_SCOPE_MAP[part.toLowerCase()];
    if (mappedScope && !scopes.includes(mappedScope)) {
      scopes.push(mappedScope);
    }
  }

  console.log('Mapped scopes:', scopes);
  return scopes;
}

// Verify access token and extract user info
// userTypeOverride: passed from client via fetchUserAttributes (since access token doesn't have custom attrs)
export async function verifyToken(token: string, userTypeOverride?: string): Promise<UserInfo | null> {
  try {
    const payload = await getVerifier().verify(token);
    const decodedPayload = payload as unknown as DecodedToken;

    // Get user type - prefer override from client's fetchUserAttributes
    const userType = userTypeOverride || decodedPayload['custom:user_type'] || 'Intern';
    const username = decodedPayload['cognito:username'] || String(payload.sub);
    const name = decodedPayload['custom:name'] || username;

    // Extract scopes from the token's scope claim
    const tokenScopes = parseScopesFromToken(decodedPayload.scope);

    // Use token scopes if present, otherwise fall back to user_type mapping
    const scopes = tokenScopes.length > 0
      ? tokenScopes
      : (USER_TYPE_SCOPES[userType] || ['REVIEW']);

    console.log('Token scope claim:', decodedPayload.scope);
    console.log('Final scopes for user:', scopes);

    return {
      username,
      name,
      userType,
      scopes,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Check if user has required scope for an action
export function hasScope(userScopes: ContractScope[], requiredScope: ContractScope): boolean {
  return userScopes.includes(requiredScope);
}

// Check if user can perform a specific action
export function canPerformAction(userScopes: ContractScope[], action: string): boolean {
  const requiredScope = ACTION_REQUIRED_SCOPE[action.toLowerCase()];
  if (!requiredScope) return false;
  return hasScope(userScopes, requiredScope);
}

// Get allowed actions for a user based on their scopes
export function getAllowedActions(userScopes: ContractScope[]): string[] {
  const actions: string[] = [];

  for (const [action, scope] of Object.entries(ACTION_REQUIRED_SCOPE)) {
    if (hasScope(userScopes, scope)) {
      actions.push(action);
    }
  }

  return actions;
}
