import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getFlowers } from '../services/flowers';
import './FlowersPage.css';

function FlowersPage({ currentUser }) {
  const [flowers, setFlowers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(false);

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
              className="btn btn--secondary"
              disabled={!hasSelection}
            >
              Изменить цветок
            </button>
            <button
              className="btn btn--secondary"
              disabled={!hasSelection}
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
              <span>Проданные</span>
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
                      {flower.foto ? (
                        <img
                          src={`data:image/jpeg;base64,${btoa(
                            new Uint8Array(flower.foto.data || flower.foto)
                              .reduce((data, byte) => data + String.fromCharCode(byte), '')
                          )}`}
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
    </div>
  );
}

export default FlowersPage;
