import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/ui/Header';
import TransactionDashboard from './components/TransactionDashboard';
import EmailExtractionPage from './components/EmailExtractionPage';
import PDFImportPage from './components/PDFImportPage';
import BankTemplatesPage from './components/BankTemplatesPage';
import ChatPage from './components/ChatPage';
import LandingPage from './components/LandingPage';
import './index.css';

const ProtectedRoute = ({ children, ownerOnly = false }) => {
  const { isAuthenticated, isLoading, isOwner, login } = useAuth();
  if (isLoading) {
    return <div className="text-center text-sm text-gray-400 py-16">Loading…</div>;
  }
  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-300 mb-4">Please sign in to use this page.</p>
        <button onClick={login} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">
          Sign in
        </button>
      </div>
    );
  }
  if (ownerOnly && !isOwner) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        This page is restricted to the workspace owner.
      </div>
    );
  }
  return children;
};

const HomeRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="text-center text-sm text-gray-400 py-16">Loading…</div>;
  }
  return isAuthenticated ? <TransactionDashboard /> : <LandingPage />;
};

const AppShell = () => (
  <div className="min-h-screen bg-gray-950">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <Header />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/me" element={<Navigate to="/" replace />} />
        <Route path="/email-extraction" element={
          <ProtectedRoute ownerOnly><EmailExtractionPage /></ProtectedRoute>
        } />
        <Route path="/pdf-import" element={
          <ProtectedRoute><PDFImportPage /></ProtectedRoute>
        } />
        <Route path="/bank-templates" element={
          <ProtectedRoute><BankTemplatesPage /></ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute><ChatPage /></ProtectedRoute>
        } />
      </Routes>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppShell />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
