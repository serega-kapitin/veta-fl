import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Операции', icon: '📋' },
  { path: '/flowers', label: 'Цветы', icon: '🌸' },
];

function Sidebar({ currentUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">🌸</span>
        <span className="sidebar-title">Veta-FL</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
            }
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span className="sidebar-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-user" onClick={handleProfileClick} type="button">
          <div className="sidebar-user-avatar">
            {(currentUser?.name || currentUser?.login || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">
              {currentUser?.name || currentUser?.login || 'Пользователь'}
            </span>
          </div>
        </button>
        <button className="sidebar-logout" onClick={handleLogout}>
          Выйти
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
