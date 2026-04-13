import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getMe } from '../services/auth';
import './ProfilePage.css';

function ProfilePage({ currentUser }) {
  const navigate = useNavigate();
  const [login, setLogin] = useState(currentUser?.login || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getMe();
        setLogin(user.login);
      } catch {
        // ignore
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      // TODO: call API to update profile
      setSuccess('Профиль обновлён');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="main-layout">
      <Sidebar currentUser={currentUser} />
      <div className="main-content">
        <Header title="Профиль пользователя" />
        <div className="profile-container">
          <div className="profile-card">
            <h2 className="profile-title">Редактирование профиля</h2>

            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="profile-login">Логин</label>
                <input
                  id="profile-login"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  disabled
                />
              </div>

              <div className="form-divider">Смена пароля</div>

              <div className="form-field">
                <label htmlFor="current-password">Текущий пароль</label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                  autoComplete="current-password"
                />
              </div>

              <div className="form-field">
                <label htmlFor="new-password">Новый пароль</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Введите новый пароль"
                  autoComplete="new-password"
                />
              </div>

              <div className="form-field">
                <label htmlFor="confirm-password">Подтверждение пароля</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  autoComplete="new-password"
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="profile-actions">
                <button type="button" className="btn btn--secondary" onClick={handleBack}>
                  Отмена
                </button>
                <button type="submit" className="btn btn--primary" disabled={loading}>
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
