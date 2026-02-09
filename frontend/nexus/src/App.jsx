import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Hulk from './pages/hulk/Hulk';
import GammaWave from './pages/hulk/GammaWave';
import HulkFinal from './pages/hulk/HulkFinal';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" />;

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
       <Route
        path="/hulk"
        element={
          <ProtectedRoute>
            <Hulk />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gamma_wave"
        element={
          <ProtectedRoute>
            <GammaWave />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hulk_final"
        element={
          <ProtectedRoute>
            <HulkFinal />
          </ProtectedRoute>
        }
      />
      
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
