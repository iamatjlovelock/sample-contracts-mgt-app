export type ContractScope = 'REVIEW' | 'EDIT' | 'APPROVE' | 'ARCHIVE';

export interface AuthUser {
  username: string;
  name: string;
  userType: string;
  scopes: ContractScope[];
  allowedActions: string[];
}

export interface ContractSummary {
  id: string;
  name: string;
  client: string;
  region: string;
  size: string;
  government: string;
  status: string;
}

export interface Contract {
  id: string;
  name: string;
  description: string;
  client: string;
  narrative: string;
  region: string;
  size: string;
  government: string;
  status: string;
}
