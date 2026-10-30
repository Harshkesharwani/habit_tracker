// src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { IconHome, IconLabels, IconArchive, IconTrash, IconPlus, IconLogout, IconClose } from './Icons';

export default function Sidebar({ user, onOpenCreate, onLogout, isMobileOpen, onCloseMobile, onOpenPomodoro }) {
  const navigate = useNavigate();

  const handleNavClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header-row">
          <div className="sidebar-brand">
            <span className="brand-logo-icon">🎯</span>
            <span className="brand-title">MyWebsite</span>
          </div>
          
          <button 
            type="button" 
            className="mobile-close-btn" 
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <IconClose style={{ width: '22px', height: '22px' }} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink 
            to="/" 
            end 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <IconHome className="w-2 h-2" />
            <span>Home</span>
          </NavLink>

          <NavLink 
            to="/labels" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <IconLabels className="w-5 h-5" />
            <span>Labels</span>
          </NavLink>

          <NavLink 
            to="/challenges" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>🏆</span>
            <span>Challenges</span>
          </NavLink>

          {onOpenPomodoro && (
            <button
              type="button"
              className="nav-link"
              onClick={() => {
                handleNavClick();
                onOpenPomodoro();
              }}
              style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>⏱️</span>
              <span>Pomodoro</span>
            </button>
          )}

          <NavLink 
            to="/archive" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <IconArchive className="w-5 h-5" />
            <span>Archive</span>
          </NavLink>

          <NavLink 
            to="/trash" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <IconTrash className="w-5 h-5" />
            <span>Trash</span>
          </NavLink>

          <button 
            type="button"
            className="sidebar-create-btn"
            onClick={() => {
              handleNavClick();
              onOpenCreate();
            }}
            title="Create a new habit"
          >
            <IconPlus className="w-4 h-4" />
            <span>Create New Habit</span>
          </button>
        </nav>

        <div className="sidebar-profile">
          <div 
            className="profile-info" 
            onClick={() => {
              handleNavClick();
              navigate('/profile');
            }}
            title="Go to profile"
          >
            <div className="avatar">
              {user?.avatar || 'TP'}
            </div>
            <div className="profile-text">
              <div className="name">{user?.name || 'Tanay Pratap'}</div>
              <div className="role">View Profile</div>
            </div>
          </div>

          <button 
            type="button"
            className="logout-btn" 
            onClick={() => {
              handleNavClick();
              onLogout();
            }}
            title="Log Out"
          >
            <IconLogout className="w-5 h-5" />
          </button>
        </div>
      </aside>
    </>
  );
}
