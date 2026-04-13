import React from 'react';
import { NavLink } from 'react-router-dom';
import { logout } from '../services/auth';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Операции', icon: '📋' },
  { path: '/counterparties', label: 'Контрагенты', icon: '👥' },
  { path: '/warehouse', label: 'Склад', icon: '' },
  { path: '/reports', label: 'Отчёты', icon: '📊' },
  { path: '/settings', label: 'Настройки', icon: '⚙️' },
];

function Sidebar({ currentUser }) {
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
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
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {currentUser?.login?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{currentUser?.login || 'Пользователь'}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          Выйти
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
