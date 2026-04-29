import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SellModal from '../components/SellModal';
import EditModal from '../components/EditModal';
import BuyModal from '../components/BuyModal';
import { getFlowers, sellFlower, updateFlowerPhoto, buyFlower } from '../services/flowers';
import './FlowersPage.css';

function FlowersPage({ currentUser }) {
  const [flowers, setFlowers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);
  const [sellError, setSellError] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState('');

  // Sorting state: { field, dir } where dir: 'asc' | 'desc' | null
  const [sort, setSort] = useState({ field: null, dir: null });

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

  const handleBuyClick = () => {
    setBuyError('');
    setBuyModalOpen(true);
  };

  const handleBuyConfirm = async (data) => {
    setBuyLoading(true);
    setBuyError('');
    try {
      await buyFlower(data);
      setBuyModalOpen(false);
      fetchFlowers();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Ошибка при покупке';
      setBuyError(msg);
    } finally {
      setBuyLoading(false);
    }
  };

  const handleBuyCancel = () => {
    setBuyModalOpen(false);
    setBuyError('');
  };

  const handleEditClick = () => {
    if (hasSelection) {
      setEditModalOpen(true);
    }
  };

  const handleEditConfirm = async (file) => {
    setEditLoading(true);
    await updateFlowerPhoto(selectedId, file);
    setEditLoading(false);
    fetchFlowers();
  };

  const handleEditCancel = () => {
    setEditModalOpen(false);
  };

  const handleSortClick = (field) => {
    setSort((prev) => {
      if (prev.field !== field) {
        return { field, dir: 'asc' };
      }
      if (prev.dir === 'asc') {
        return { field, dir: 'desc' };
      }
      return { field: null, dir: null };
    });
  };

  const sortedFlowers = useMemo(() => {
    if (!sort.field || !sort.dir) return flowers;
    return [...flowers].sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      // nulls go last
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [flowers, sort]);

  const formatPrice = (price) =>
    price != null ? `${price.toLocaleString('ru-RU')} ₽` : '—';

  const formatDate = (date) => (date ? date : '—');

  const sortableFields = ['buy_price', 'buy_date', 'sell_price', 'sell_date'];

  const SortArrow = ({ field }) => {
    if (sort.field !== field) return <span className="sort-arrow sort-arrow--inactive">⇅</span>;
    if (sort.dir === 'asc') return <span className="sort-arrow sort-arrow--active">↑</span>;
    return <span className="sort-arrow sort-arrow--active">↓</span>;
  };

  return (
    <div className="main-layout">
      <Sidebar currentUser={currentUser} />
      <div className="main-content">
        <Header title="Цветы" />

        <div className="flowers-toolbar">
          <div className="toolbar-left">
            <button className="btn btn--primary" onClick={handleBuyClick}>
              + Купить цветок
            </button>
            <button
              className={`btn ${hasSelection ? 'btn--edit btn--edit--active' : 'btn--edit'}`}
              disabled={!hasSelection}
              onClick={handleEditClick}
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
                  <th
                    className={`col-price ${sortableFields.includes('buy_price') ? 'th-sortable' : ''}`}
                    onClick={() => handleSortClick('buy_price')}
                  >
                    Цена покупки <SortArrow field="buy_price" />
                  </th>
                  <th
                    className={`col-date ${sortableFields.includes('buy_date') ? 'th-sortable' : ''}`}
                    onClick={() => handleSortClick('buy_date')}
                  >
                    Дата покупки <SortArrow field="buy_date" />
                  </th>
                  <th
                    className={`col-price ${sortableFields.includes('sell_price') ? 'th-sortable' : ''}`}
                    onClick={() => handleSortClick('sell_price')}
                  >
                    Цена продажи <SortArrow field="sell_price" />
                  </th>
                  <th
                    className={`col-date ${sortableFields.includes('sell_date') ? 'th-sortable' : ''}`}
                    onClick={() => handleSortClick('sell_date')}
                  >
                    Дата продажи <SortArrow field="sell_date" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedFlowers.map((flower) => (
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

      {editModalOpen && (
        <EditModal
          flower={selectedFlower}
          onConfirm={handleEditConfirm}
          onCancel={handleEditCancel}
          loading={editLoading}
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
      {buyError && (
        <div className="modal-overlay" onClick={() => setBuyError('')}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title modal-title--error">Ошибка</h2>
            <p className="modal-flower-name">{buyError}</p>
            <div className="modal-actions">
              <button
                className="btn btn--secondary"
                onClick={() => setBuyError('')}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
      {buyModalOpen && (
        <BuyModal
          flower={selectedFlower}
          onConfirm={handleBuyConfirm}
          onCancel={handleBuyCancel}
          loading={buyLoading}
        />
      )}
    </div>
  );
}

export default FlowersPage;
