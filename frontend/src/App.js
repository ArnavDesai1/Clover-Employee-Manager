import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import EmployeeForm from './components/EmployeeForm';
import EmployeeList from './components/EmployeeList';
import EmployeePortal from './components/EmployeePortal';
import SignIn from './components/SignIn';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileIcon from './components/ProfileIcon';

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/forgot-password' || location.pathname === '/reset-password';

  if (isAuthPage) return null;

  const isEmployee = user?.role === 'Employee';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <img src="/clover-logo.png" alt="Clover Infotech" className="logo" />
          <div className="navbar-text-block">
            <div className="navbar-app-name">Clover Infotech</div>
            <div className="navbar-app-subtitle">Employee Manager</div>
          </div>
        </div>
        <div className="navbar-right">
          <ul className="nav-links">
            {isEmployee ? (
              <li>
                <NavLink
                  to="/employee"
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'nav-link-active' : ''}`
                  }
                >
                  My Portal
                </NavLink>
              </li>
            ) : (
              <>
                <li>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'nav-link-active' : ''}`
                    }
                    end
                  >
                    Employees
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/add"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'nav-link-active' : ''}`
                    }
                  >
                    Add Employee
                  </NavLink>
                </li>
              </>
            )}
          </ul>
          <ProfileIcon />
        </div>
      </div>
    </nav>
  );
};

function App() {
  const [refresh, setRefresh] = useState(false);

  const handleEmployeeAdded = () => {
    setRefresh(!refresh);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />

          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/employee"
              element={
                <ProtectedRoute requiredRole="Employee">
                  <EmployeePortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <EmployeeList refresh={refresh} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <EmployeeForm onEmployeeAdded={handleEmployeeAdded} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute>
                  <EmployeeForm onEmployeeAdded={handleEmployeeAdded} />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
