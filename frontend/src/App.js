import React, { useEffect, useState } from 'react';
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
import authAPI from './services/authAPI';
import employeeAPI from './services/employeeAPI';

const Navbar = ({ onDirectoryRefresh }) => {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/forgot-password' || location.pathname === '/reset-password';
  const isEmployee = user?.role === 'Employee';
  const isAdmin = user?.role === 'Admin';
  const [showBlocklistModal, setShowBlocklistModal] = useState(false);
  const [blockedEmails, setBlockedEmails] = useState([]);
  const [blocklistEmployees, setBlocklistEmployees] = useState([]);
  const [blockEmailInput, setBlockEmailInput] = useState('');
  const [showBlocklistSuggestions, setShowBlocklistSuggestions] = useState(false);
  const [blocklistLoading, setBlocklistLoading] = useState(false);
  const [blocklistError, setBlocklistError] = useState('');
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const loadBlockedEmails = async () => {
    setBlocklistLoading(true);
    setBlocklistError('');
    try {
      const res = await authAPI.getBlockedEmails();
      setBlockedEmails(res?.data?.emails || []);
    } catch {
      setBlocklistError('Failed to load blocked emails.');
    } finally {
      setBlocklistLoading(false);
    }
  };

  const loadBlocklistEmployees = async () => {
    try {
      const [approvedRes, pendingRes] = await Promise.all([
        employeeAPI.getAllEmployees(),
        employeeAPI.getPendingEmployees(),
      ]);
      const combined = [...(approvedRes?.data || []), ...(pendingRes?.data || [])];
      const byEmail = new Map();
      combined.forEach((employee) => {
        const email = (employee?.email || '').trim().toLowerCase();
        if (!email) return;
        if (!byEmail.has(email)) {
          byEmail.set(email, {
            id: employee?.id,
            name: employee?.name || 'Unknown',
            email,
          });
        }
      });
      setBlocklistEmployees([...byEmail.values()]);
    } catch {
      setBlocklistEmployees([]);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadBlockedEmails();
    } else {
      setBlockedEmails([]);
    }
  }, [isAdmin]);

  const handleOpenBlocklist = async () => {
    setShowBlocklistModal(true);
    setShowBlocklistSuggestions(false);
    await Promise.all([loadBlockedEmails(), loadBlocklistEmployees()]);
  };

  const handleBlockEmail = async () => {
    const email = (blockEmailInput || '').trim().toLowerCase();
    if (!email) {
      setBlocklistError('Email is required.');
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setBlocklistError('Enter a valid email address.');
      return;
    }
    setBlocklistLoading(true);
    setBlocklistError('');
    try {
      await authAPI.blockEmail(email);
      setBlockEmailInput('');
      setShowBlocklistSuggestions(false);
      await loadBlockedEmails();
      if (onDirectoryRefresh) onDirectoryRefresh();
    } catch {
      setBlocklistError('Failed to block email.');
      setBlocklistLoading(false);
    }
  };

  const handleUnblockEmail = async (email) => {
    setBlocklistLoading(true);
    setBlocklistError('');
    try {
      await authAPI.unblockEmail(email);
      await loadBlockedEmails();
      if (onDirectoryRefresh) onDirectoryRefresh();
    } catch {
      setBlocklistError('Failed to unblock email.');
      setBlocklistLoading(false);
    }
  };

  const normalizedBlockQuery = (blockEmailInput || '').trim().toLowerCase();
  const blocklistSuggestions = showBlocklistSuggestions && normalizedBlockQuery
    ? blocklistEmployees
      .filter((employee) =>
        (employee.name || '').toLowerCase().includes(normalizedBlockQuery) ||
        employee.email.includes(normalizedBlockQuery)
      )
      .slice(0, 8)
    : [];

  if (isAuthPage) return null;

  return (
    <>
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
            {isAdmin && (
              <button
                type="button"
                className="nav-blocklist-btn"
                title="Manage blocked sign-in emails"
                onClick={handleOpenBlocklist}
              >
                Blocklist: {blockedEmails.length}
              </button>
            )}
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

      {isAdmin && showBlocklistModal && (
        <div className="app-modal-overlay" onClick={() => setShowBlocklistModal(false)}>
          <div className="app-modal" onClick={(e) => e.stopPropagation()}>
            <div className="app-modal-header">
              <h3>Blocklist Manager</h3>
              <button type="button" className="close-btn" onClick={() => setShowBlocklistModal(false)}>×</button>
            </div>
            <div className="app-modal-content">
              <div className="blocklist-form">
                <div className="blocklist-input-wrap">
                  <input
                    type="text"
                    placeholder="Search name or enter email..."
                    value={blockEmailInput}
                    onChange={(e) => {
                      setBlockEmailInput(e.target.value);
                      setShowBlocklistSuggestions(true);
                    }}
                    onFocus={() => {
                      if ((blockEmailInput || '').trim()) setShowBlocklistSuggestions(true);
                    }}
                  />
                  {blocklistSuggestions.length > 0 && (
                    <div className="blocklist-suggestions">
                      {blocklistSuggestions.map((employee) => (
                        <button
                          key={`${employee.email}-${employee.id}`}
                          type="button"
                          className="blocklist-suggestion-item"
                          onClick={() => {
                            setBlockEmailInput(employee.email);
                            setBlocklistError('');
                            setShowBlocklistSuggestions(false);
                          }}
                        >
                          <span className="blocklist-suggestion-name">{employee.name}</span>
                          <span className="blocklist-suggestion-email">{employee.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" className="btn-edit" onClick={handleBlockEmail} disabled={blocklistLoading}>
                  Block Email
                </button>
              </div>

              {blocklistError && <div className="error-message">{blocklistError}</div>}

              {blocklistLoading ? (
                <div className="loading">Loading...</div>
              ) : blockedEmails.length === 0 ? (
                <div className="empty-state"><p>No blocked emails.</p></div>
              ) : (
                <div className="blocklist-list">
                  {blockedEmails.map((email) => (
                    <div key={email} className="blocklist-item">
                      <span>{email}</span>
                      <button type="button" className="btn-delete" onClick={() => handleUnblockEmail(email)}>
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function App() {
  const [refresh, setRefresh] = useState(false);

  const triggerDirectoryRefresh = () => {
    setRefresh((prev) => !prev);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar onDirectoryRefresh={triggerDirectoryRefresh} />

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
                  <EmployeeList refresh={refresh} onManualRefresh={triggerDirectoryRefresh} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <EmployeeForm onEmployeeAdded={triggerDirectoryRefresh} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute>
                  <EmployeeForm onEmployeeAdded={triggerDirectoryRefresh} />
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
