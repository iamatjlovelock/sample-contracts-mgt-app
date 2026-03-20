import fs from 'fs';
import path from 'path';

export interface Contract {
  id: string;
  name: string;
  description: string;
  client: string;
  narrative: string;
  region: 'US' | 'CAN' | 'UK' | 'EUR' | 'AUS' | 'JAP' | 'IND';
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  government: 'Y' | 'N';
  status: 'Active' | 'Archived';
}

export interface ContractSummary {
  id: string;
  name: string;
  client: string;
  region: string;
  size: string;
  status: string;
}

const DATA_FILE = path.join(__dirname, '../../data/contracts.json');

// Read all contracts from JSON file
export function readContracts(): Contract[] {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.contracts || [];
  } catch (error) {
    console.error('Error reading contracts:', error);
    return [];
  }
}

// Write contracts to JSON file
export function writeContracts(contracts: Contract[]): boolean {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ contracts }, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing contracts:', error);
    return false;
  }
}

// Search contracts by client name
export function searchContractsByClient(clientName: string): ContractSummary[] {
  const contracts = readContracts();
  const searchTerm = clientName.toLowerCase();

  return contracts
    .filter(c => c.client.toLowerCase().includes(searchTerm))
    .map(c => ({
      id: c.id,
      name: c.name,
      client: c.client,
      region: c.region,
      size: c.size,
      status: c.status,
    }));
}

// Get all contracts (summary view)
export function getAllContracts(): ContractSummary[] {
  const contracts = readContracts();

  return contracts.map(c => ({
    id: c.id,
    name: c.name,
    client: c.client,
    region: c.region,
    size: c.size,
    status: c.status,
  }));
}

// Get single contract by ID
export function getContractById(id: string): Contract | null {
  const contracts = readContracts();
  return contracts.find(c => c.id === id) || null;
}

// Update contract narrative
export function updateContractNarrative(id: string, narrative: string): boolean {
  const contracts = readContracts();
  const index = contracts.findIndex(c => c.id === id);

  if (index === -1) return false;

  contracts[index].narrative = narrative;
  return writeContracts(contracts);
}

// Archive contract
export function archiveContract(id: string): boolean {
  const contracts = readContracts();
  const index = contracts.findIndex(c => c.id === id);

  if (index === -1) return false;

  contracts[index].status = 'Archived';
  return writeContracts(contracts);
}

// Approve contract (for demo, just logs approval - could add approval tracking)
export function approveContract(id: string, approverUsername: string): { success: boolean; message: string } {
  const contract = getContractById(id);

  if (!contract) {
    return { success: false, message: 'Contract not found' };
  }

  if (contract.status === 'Archived') {
    return { success: false, message: 'Cannot approve archived contract' };
  }

  // In a real app, you'd record the approval in a separate table/audit log
  console.log(`Contract ${id} approved by ${approverUsername} at ${new Date().toISOString()}`);

  return { success: true, message: `Contract "${contract.name}" has been approved` };
}
