'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface ContractSummary {
  id: string;
  name: string;
  client: string;
  region: string;
  size: string;
  status: string;
}

interface ContractSearchProps {
  onSelectContract: (id: string) => void;
}

export default function ContractSearch({ onSelectContract }: ContractSearchProps) {
  const { user, logout, getAuthHeaders } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSearching(true);
    setHasSearched(true);

    try {
      const url = searchTerm
        ? `/api/contracts?client=${encodeURIComponent(searchTerm)}`
        : '/api/contracts';

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts);
      } else if (response.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        const data = await response.json();
        setError(data.error || 'Search failed');
      }
    } catch {
      setError('Failed to search contracts');
    } finally {
      setIsSearching(false);
    }
  };

  const getSizeColor = (size: string) => {
    const colors: Record<string, string> = {
      'S': 'bg-green-100 text-green-800',
      'M': 'bg-blue-100 text-blue-800',
      'L': 'bg-yellow-100 text-yellow-800',
      'XL': 'bg-orange-100 text-orange-800',
      'XXL': 'bg-red-100 text-red-800',
    };
    return colors[size] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    return status === 'Active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Contracts Management</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{user?.name}</span>
              <span className="text-gray-400 ml-2">({user?.userType})</span>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* User Permissions Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Your permissions:</span>{' '}
            {user?.allowedActions.map((action) => (
              <span
                key={action}
                className="inline-block px-2 py-0.5 mx-1 bg-blue-200 text-blue-900 rounded text-xs uppercase"
              >
                {action}
              </span>
            ))}
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="client-search" className="block text-sm font-medium text-gray-700 mb-1">
                Search by Client Name
              </label>
              <input
                id="client-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Enter client name (leave empty to show all)"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Results */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">
                {contracts.length === 0
                  ? 'No contracts found'
                  : `Found ${contracts.length} contract${contracts.length !== 1 ? 's' : ''}`}
              </h2>
            </div>

            {contracts.length > 0 && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{contract.name}</div>
                        <div className="text-xs text-gray-500">{contract.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contract.client}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contract.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getSizeColor(contract.size)}`}>
                          {contract.size}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(contract.status)}`}>
                          {contract.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => onSelectContract(contract.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
