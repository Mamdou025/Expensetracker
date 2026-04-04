import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TransactionDashboard from './components/TransactionDashboard';
import EmailExtractionPage from './components/EmailExtractionPage';
import PDFImportPage from './components/PDFImportPage';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TransactionDashboard />} />
        <Route path="/email-extraction" element={<EmailExtractionPage />} />
        <Route path="/pdf-import" element={<PDFImportPage />} />
      </Routes>
    </Router>
  );
}

export default App;
