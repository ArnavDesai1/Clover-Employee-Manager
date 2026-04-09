import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import employeeAPI from '../services/employeeAPI';
import EmployeeForm from './EmployeeForm';
import './EmployeePortal.css';

const EmployeePortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myEmployee, setMyEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const fetchMyProfile = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    setError('');
    try {
      const res = await employeeAPI.getEmployeeByEmail(user.email);
      setMyEmployee(res.data);
      setShowRegisterForm(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setMyEmployee(null);
      } else {
        setError('Failed to load your profile.');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.role !== 'Employee' || !user?.email) {
      navigate('/', { replace: true });
      return;
    }
    fetchMyProfile();
  }, [user?.email, user?.role, navigate, fetchMyProfile]);

  const handleSelfRegisterSuccess = () => {
    fetchMyProfile();
  };

  if (user?.role !== 'Employee') return null;
  if (loading) {
    return (
      <div className="container">
        <div className="portal-loading">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="portal-header">
        <h2>My Portal</h2>
        <p className="portal-subtitle">View your profile or register in the system</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {myEmployee ? (
        <div className="portal-content">
          <div className="portal-profile-card">
            <div className="portal-card-header">
              <h3>{myEmployee.name}</h3>
              <span className="role-badge">{myEmployee.role}</span>
            </div>
            <div className="portal-card-body">
              {myEmployee.approvalStatus && myEmployee.approvalStatus.toUpperCase() === 'PENDING' && (
                <div className="info-row">
                  <span className="label">Application</span>
                  <span className="value">Pending admin approval</span>
                </div>
              )}
              {myEmployee.birthdate && (
                <div className="info-row">
                  <span className="label">Birthdate</span>
                  <span className="value">{myEmployee.birthdate}</span>
                </div>
              )}
              {myEmployee.gender && (
                <div className="info-row">
                  <span className="label">Gender</span>
                  <span className="value">{myEmployee.gender}</span>
                </div>
              )}
              {myEmployee.hobbies && (
                <div className="info-row info-row-hobbies">
                  <span className="label">Hobbies</span>
                  <span className="value">
                    {myEmployee.hobbies.split(',').map((h) => h.trim()).filter(Boolean).map((hobby) => (
                      <span key={hobby} className="hobby-tag">{hobby}</span>
                    ))}
                  </span>
                </div>
              )}
              {(myEmployee.address1 || myEmployee.city || myEmployee.pin) && (
                <div className="info-row">
                  <span className="label">Address</span>
                  <span className="value">
                    {[myEmployee.address1, myEmployee.address2, myEmployee.city, myEmployee.state, myEmployee.pin]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
              {myEmployee.pan && (
                <div className="info-row">
                  <span className="label">PAN / Govt ID</span>
                  <span className="value">{myEmployee.pan}</span>
                </div>
              )}
            </div>
            <div className="portal-card-actions">
              <button
                type="button"
                className="btn-edit"
                onClick={() => navigate(`/edit/${myEmployee.id}`)}
              >
                Update my details
              </button>
            </div>
          </div>
          <p className="portal-hint">Your employer can see this profile on the main dashboard.</p>
        </div>
      ) : showRegisterForm ? (
        <div className="portal-form-wrap">
          <EmployeeForm
            selfRegisterEmail={user.email}
            onEmployeeAdded={handleSelfRegisterSuccess}
            onSuccessRedirect="/employee"
          />
        </div>
      ) : (
        <div className="portal-empty">
          <p>You are not yet registered in the employee system.</p>
          <button
            type="button"
            className="btn-add"
            onClick={() => setShowRegisterForm(true)}
          >
            Register as Employee
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployeePortal;
