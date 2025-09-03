// src/App.js
import './setupAxios'; // makes axios point at your backend

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import EmployeePage from './pages/EmployeePage';
import EmployerPage from './pages/EmployerPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default → employee */}
        <Route path="/" element={<Navigate to="/employee" replace />} />
        <Route path="/employee" element={<EmployeePage />} />
        <Route path="/employer" element={<EmployerPage />} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/employee" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
