import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../lib/amplify-config';
import type { Contract } from '../lib/types';

type ActionType = 'review' | 'edit' | 'approve' | 'archive' | null;

interface ContractDetailProps {
  contractId: string;
  onBack: () => void;
}

export default function ContractDetail({ contractId, onBack }: ContractDetailProps) {
  const { canPerformAction, user, getAuthHeaders } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentAction, setCurrentAction] = useState<ActionType>(null);
  const [editNarrative, setEditNarrative] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchContract() {
      try {
        const response = await fetch(`${API_URL}/api/contracts/${contractId}`, {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          setContract(data.contract);
          setEditNarrative(data.contract.narrative);
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to load contract');
        }
      } catch {
        setError('Failed to load contract');
      } finally {
        setIsLoading(false);
      }
    }

    fetchContract();
  }, [contractId, getAuthHeaders]);

  const handleAction = async (action: 'edit' | 'approve' | 'archive') => {
    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const body: { action: string; narrative?: string } = { action };
      if (action === 'edit') {
        body.narrative = editNarrative;
      }

      const response = await fetch(`${API_URL}/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setActionMessage({ type: 'success', text: data.message });
        if (action === 'edit' && contract) {
          setContract({ ...contract, narrative: editNarrative });
        } else if (action === 'archive' && contract) {
          setContract({ ...contract, status: 'Archived' });
        }
        setCurrentAction(null);
      } else {
        setActionMessage({ type: 'error', text: data.message || data.error || 'Action failed' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to perform action' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading contract...</div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
            {error || 'Contract not found'}
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              &larr; Back to Search
            </button>
            <h1 className="text-xl font-bold text-gray-800 mt-1">{contract.name}</h1>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{user?.name}</span>
            <span className="text-gray-400 ml-2">({user?.userType})</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Action Message */}
        {actionMessage && (
          <div
            className={`mb-6 p-4 rounded ${
              actionMessage.type === 'success'
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}
          >
            {actionMessage.text}
          </div>
        )}

        {/* Contract Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-500">ID</span>
              <p className="font-medium text-gray-900">{contract.id}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Client</span>
              <p className="font-medium text-gray-900">{contract.client}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Region</span>
              <p className="font-medium text-gray-900">{contract.region}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Size</span>
              <p className="font-medium text-gray-900">{contract.size}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Government Contract</span>
              <p className="font-medium text-gray-900">{contract.government === 'Y' ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Status</span>
              <p className={`font-medium ${contract.status === 'Active' ? 'text-green-600' : 'text-gray-600'}`}>
                {contract.status}
              </p>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500">Description</span>
            <p className="text-gray-900">{contract.description}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Actions</h2>
          <div className="flex gap-3 flex-wrap">
            {canPerformAction('review') && (
              <button
                onClick={() => setCurrentAction('review')}
                className={`px-4 py-2 rounded font-medium ${
                  currentAction === 'review'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Review
              </button>
            )}
            {canPerformAction('edit') && (
              <button
                onClick={() => {
                  setCurrentAction('edit');
                  setEditNarrative(contract.narrative);
                }}
                className={`px-4 py-2 rounded font-medium ${
                  currentAction === 'edit'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Edit
              </button>
            )}
            {canPerformAction('approve') && (
              <button
                onClick={() => setCurrentAction('approve')}
                className={`px-4 py-2 rounded font-medium ${
                  currentAction === 'approve'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                Approve
              </button>
            )}
            {canPerformAction('archive') && (
              <button
                onClick={() => setCurrentAction('archive')}
                className={`px-4 py-2 rounded font-medium ${
                  currentAction === 'archive'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                Archive
              </button>
            )}
          </div>
        </div>

        {/* Action Panel */}
        {currentAction && (
          <div className="bg-white rounded-lg shadow p-6">
            {/* Review Panel */}
            {currentAction === 'review' && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Contract Narrative (Read-Only)</h3>
                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                  <p className="text-gray-800 whitespace-pre-wrap">{contract.narrative}</p>
                </div>
                <button
                  onClick={() => setCurrentAction(null)}
                  className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            )}

            {/* Edit Panel */}
            {currentAction === 'edit' && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Edit Contract Narrative</h3>
                <textarea
                  value={editNarrative}
                  onChange={(e) => setEditNarrative(e.target.value)}
                  className="w-full h-48 p-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleAction('edit')}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setCurrentAction(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Approve Panel */}
            {currentAction === 'approve' && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Approve Contract</h3>
                <div className="bg-purple-50 border border-purple-200 rounded p-6 text-center">
                  <p className="text-gray-700 mb-4">
                    You are about to approve the contract: <strong>{contract.name}</strong>
                  </p>
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-purple-600 text-white font-medium rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Approving...' : 'Click here to approve'}
                  </button>
                </div>
                <button
                  onClick={() => setCurrentAction(null)}
                  className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Archive Panel */}
            {currentAction === 'archive' && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Archive Contract</h3>
                <div className="bg-orange-50 border border-orange-200 rounded p-6 text-center">
                  <p className="text-gray-700 mb-4">
                    You are about to archive the contract: <strong>{contract.name}</strong>
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    This action will change the contract status to Archived.
                  </p>
                  <button
                    onClick={() => handleAction('archive')}
                    disabled={isSubmitting || contract.status === 'Archived'}
                    className="px-6 py-3 bg-orange-600 text-white font-medium rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Archiving...' : 'Click here to archive'}
                  </button>
                  {contract.status === 'Archived' && (
                    <p className="mt-2 text-sm text-orange-600">This contract is already archived.</p>
                  )}
                </div>
                <button
                  onClick={() => setCurrentAction(null)}
                  className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
