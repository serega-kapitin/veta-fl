import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import FlowersPage from './pages/FlowersPage';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/PrivateRoute';
import { getProfile } from './services/auth';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile();
        setCurrentUser(profile);
      } catch {
        setCurrentUser({ login: 'user', name: null });
      }
    };
    fetchProfile();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainPage currentUser={currentUser} />
            </PrivateRoute>
          }
        />
        <Route
          path="/flowers"
          element={
            <PrivateRoute>
              <FlowersPage currentUser={currentUser} />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage
                currentUser={currentUser}
                onUpdateProfile={setCurrentUser}
              />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
