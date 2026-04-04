import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/ui/Header';
import TransactionDashboard from './components/TransactionDashboard';
import EmailExtractionPage from './components/EmailExtractionPage';
import PDFImportPage from './components/PDFImportPage';
import BankTemplatesPage from './components/BankTemplatesPage';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <Header />
            <Routes>
              <Route path="/" element={<TransactionDashboard />} />
              <Route path="/email-extraction" element={<EmailExtractionPage />} />
              <Route path="/pdf-import" element={<PDFImportPage />} />
              <Route path="/bank-templates" element={<BankTemplatesPage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
