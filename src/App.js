import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EmployeePage from './pages/EmployeePage';
import DashboardPage from './pages/DashboardPage';
import EmployerPage from './pages/EmployerPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/employee" element={<EmployeePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employer" element={<EmployerPage />} />
        {/* Optional: Redirect root to one of the pages */}
        <Route path="/" element={<EmployeePage />} />
      </Routes>
    </Router>
  );
}

export default App;
