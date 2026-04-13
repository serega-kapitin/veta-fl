import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import OperationsTable from '../components/OperationsTable';
import './MainPage.css';

function MainPage({ currentUser }) {
  return (
    <div className="main-layout">
      <Sidebar currentUser={currentUser} />
      <div className="main-content">
        <Header title="Журнал операций" />
        <OperationsTable />
      </div>
    </div>
  );
}

export default MainPage;
