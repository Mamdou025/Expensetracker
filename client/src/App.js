import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/ui/Header';
import TransactionDashboard from './components/TransactionDashboard';
import EmailExtractionPage from './components/EmailExtractionPage';
import PDFImportPage from './components/PDFImportPage';
import ConnectedAccountsPage from './components/ConnectedAccountsPage';
import ChatPage from './components/ChatPage';
import LandingPage from './components/LandingPage';
import './index.css';

const ProtectedRoute = ({ children, ownerOnly = false }) => {
  const { isAuthenticated, isLoading, isOwner } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (ownerOnly && !isOwner) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        This page is restricted to the workspace owner.
      </div>
    );
  }
  return children;
};

/* Full app shell — shown only when authenticated */
const AppShell = () => (
  <div className="min-h-screen bg-gray-950">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <Header />
      <Routes>
        <Route path="/" element={<TransactionDashboard />} />
        <Route path="/me" element={<Navigate to="/" replace />} />
        <Route path="/email-extraction" element={
          <ProtectedRoute ownerOnly><EmailExtractionPage /></ProtectedRoute>
        } />
        <Route path="/pdf-import" element={<PDFImportPage />} />
        <Route path="/bank-templates" element={<Navigate to="/accounts" replace />} />
        <Route path="/accounts" element={<ConnectedAccountsPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </div>
  </div>
);

/* Root — landing (no app chrome) or app shell */
const Root = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <LandingPage />;
  return <AppShell />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Root />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
