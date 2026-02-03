import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ProfileIcon.css';

const ProfileIcon = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = () => {
    signOut();
    setIsOpen(false);
    navigate('/signin');
  };

  const handleViewProfile = () => {
    setIsOpen(false);
    // TODO: Navigate to profile page or show profile modal
    alert(`Profile:\nName: ${user?.name}\nEmail: ${user?.email}\nRole: ${user?.role}\nOrganization: ${user?.organization}`);
  };

  if (!isAuthenticated) {
    return (
      <button className="profile-icon-btn" onClick={() => navigate('/signin')} title="Sign In">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
    );
  }

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="profile-icon-container" ref={dropdownRef}>
      <button
        className="profile-icon-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={user?.name || 'Profile'}
        aria-label="Profile menu"
      >
        <div className="profile-avatar">{initials}</div>
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <div className="profile-dropdown-avatar">{initials}</div>
            <div className="profile-dropdown-info">
              <div className="profile-dropdown-name">{user?.name}</div>
              <div className="profile-dropdown-email">{user?.email}</div>
            </div>
          </div>
          <div className="profile-dropdown-divider"></div>
          <button className="profile-dropdown-item" onClick={handleViewProfile}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            View Profile
          </button>
          <button className="profile-dropdown-item" onClick={handleSignOut}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileIcon;
