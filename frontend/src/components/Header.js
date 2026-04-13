import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function Header({ title, onProfileClick }) {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      <button className="header-profile-btn" onClick={handleProfileClick}>
        <span className="header-profile-icon">👤</span>
        <span className="header-profile-label">Профиль</span>
      </button>
    </header>
  );
}

export default Header;
