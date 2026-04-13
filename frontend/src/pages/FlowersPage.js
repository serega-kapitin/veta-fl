import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SellModal from '../components/SellModal';
import { getFlowers, sellFlower } from '../services/flowers';
import './FlowersPage.css';

function FlowersPage({ currentUser }) {
  const [flowers, setFlowers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);
  const [sellError, setSellError] = useState('');

  const fetchFlowers = async () => {
    setLoading(true);
    try {
      const data = await getFlowers(filter);
      setFlowers(data);
      setSelectedId(null);
    } catch {
      setFlowers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlowers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleRowClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const selectedFlower = flowers.find((f) => f.id === selectedId) || null;
  const hasSelection = selectedId !== null;

  const handleSellClick = () => {
    if (hasSelection) {
      setSellError('');
      setSellModalOpen(true);
    }
  };

  const handleSellConfirm = async (price) => {
    setSellLoading(true);
    setSellError('');
    try {
      await sellFlower(selectedId, price);
      setSellModalOpen(false);
      fetchFlowers();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Ошибка при продаже';
      setSellError(msg);
    } finally {
      setSellLoading(false);
    }
  };

  const handleSellCancel = () => {
    setSellModalOpen(false);
    setSellError('');
  };

  const formatPrice = (price) =>
    price != null ? `${price.toLocaleString('ru-RU')} ₽` : '—';

  const formatDate = (date) => (date ? date : '—');

  return (
    <div className="main-layout">
      <Sidebar currentUser={currentUser} />
      <div className="main-content">
        <Header title="Цветы" />

        <div className="flowers-toolbar">
          <div className="toolbar-left">
            <button className="btn btn--primary">+ Купить цветок</button>
            <button
              className={`btn ${hasSelection ? 'btn--edit btn--edit--active' : 'btn--edit'}`}
              disabled={!hasSelection}
            >
              Изменить цветок
            </button>
            <button
              className={`btn ${hasSelection ? 'btn--sell btn--sell--active' : 'btn--sell'}`}
              disabled={!hasSelection}
              onClick={handleSellClick}
            >
              Продать цветок
            </button>
          </div>
          <div className="toolbar-right">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filter}
                onChange={(e) => setFilter(e.target.checked)}
              />
              <span>Включая проданные</span>
            </label>
            <button className="btn btn--secondary" onClick={fetchFlowers}>
              ↻
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : flowers.length === 0 ? (
            <div className="empty-state">
              Нет цветов в списке
            </div>
          ) : (
            <table className="flowers-table">
              <thead>
                <tr>
                  <th className="col-photo">Фото</th>
                  <th>Название</th>
                  <th className="col-price">Цена покупки</th>
                  <th className="col-date">Дата покупки</th>
                  <th className="col-price">Цена продажи</th>
                  <th className="col-date">Дата продажи</th>
                </tr>
              </thead>
              <tbody>
                {flowers.map((flower) => (
                  <tr
                    key={flower.id}
                    className={`flowers-row ${flower.id === selectedId ? 'flowers-row--selected' : ''}`}
                    onClick={() => handleRowClick(flower.id)}
                  >
                    <td className="col-photo">
                      {flower.foto_base64 ? (
                        <img
                          src={`data:image/png;base64,${flower.foto_base64}`}
                          alt={flower.name}
                          className="flower-thumb"
                        />
                      ) : (
                        <span className="no-photo">—</span>
                      )}
                    </td>
                    <td>{flower.name}</td>
                    <td className="col-price mono">
                      {formatPrice(flower.buy_price)}
                    </td>
                    <td className="col-date">{formatDate(flower.buy_date)}</td>
                    <td className="col-price mono">
                      {formatPrice(flower.sell_price)}
                    </td>
                    <td className="col-date">{formatDate(flower.sell_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="table-footer">
          <span className="table-info">
            Всего: {flowers.length}
          </span>
          {selectedFlower && (
            <span className="selected-info">
              Выбрано: {selectedFlower.name}
            </span>
          )}
        </div>
      </div>

      {sellModalOpen && (
        <SellModal
          flower={selectedFlower}
          onConfirm={handleSellConfirm}
          onCancel={handleSellCancel}
          loading={sellLoading}
        />
      )}

      {sellError && (
        <div className="modal-overlay" onClick={() => setSellError('')}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title modal-title--error">Ошибка</h2>
            <p className="modal-flower-name">{sellError}</p>
            <div className="modal-actions">
              <button
                className="btn btn--secondary"
                onClick={() => setSellError('')}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlowersPage;
