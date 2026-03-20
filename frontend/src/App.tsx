import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import ContractSearch from './components/ContractSearch';
import ContractDetail from './components/ContractDetail';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onSuccess={() => {}} />;
  }

  if (selectedContractId) {
    return (
      <ContractDetail
        contractId={selectedContractId}
        onBack={() => setSelectedContractId(null)}
      />
    );
  }

  return <ContractSearch onSelectContract={setSelectedContractId} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
