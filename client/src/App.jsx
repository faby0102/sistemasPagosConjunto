import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'reactstrap';

// Import views/components
import Navbar from './components/Navbar';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Properties from './views/Properties';
import Payments from './views/Payments';
import Reports from './views/Reports';
import Debtors from './views/Debtors';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  return (
    <div className="App">
      {isAuthenticated && <Navbar />}
      <Container fluid className="p-4">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated 
                ? <Navigate to="/dashboard" /> 
                : <Login />
            } 
          />
          <Route 
            path="/login" 
            element={
              isAuthenticated 
                ? <Navigate to="/dashboard" /> 
                : <Login />
            } 
          />
          
          {/* Protected routes */}
          {isAuthenticated && (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              {(userRole === 'admin' || userRole === 'treasurer') && (
                <>
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/debtors" element={<Debtors />} />
                </>
              )}
            </>
          )}
          
          {/* Redirect to login if accessing protected route without authentication */}
          <Route 
            path="*" 
            element={
              isAuthenticated 
                ? <Navigate to="/dashboard" /> 
                : <Navigate to="/login" />
            } 
          />
        </Routes>
      </Container>
    </div>
  );
}

export default App;