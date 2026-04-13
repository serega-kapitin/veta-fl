import React, { useState } from 'react';
import './SellModal.css';

function SellModal({ flower, onConfirm, onCancel, loading }) {
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Введите корректную цену');
      return;
    }
    setError('');
    onConfirm(numPrice);
  };

  if (!flower) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Продажа цветка</h2>
        <p className="modal-flower-name">{flower.name}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="sell-price">Цена продажи (₽)</label>
            <input
              id="sell-price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Введите цену"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn--sell btn--sell--active"
              disabled={loading}
            >
              {loading ? 'Продажа...' : 'Продать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SellModal;
