import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TransactionDashboard from './components/TransactionDashboard';
import EmailExtractionPage from './components/EmailExtractionPage';
import './index.css';

function App() {
  return (
    <Router>
      <nav className="bg-gray-800 text-white p-4 flex gap-4">
        <Link to="/" className="hover:underline">Dashboard</Link>
        <Link to="/email-extraction" className="hover:underline">Email Extraction</Link>
      </nav>
      <Routes>
        <Route path="/" element={<TransactionDashboard />} />
        <Route path="/email-extraction" element={<EmailExtractionPage />} />
      </Routes>
    </Router>
  );
}

export default App;
