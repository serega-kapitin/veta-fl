import React, { useState, useRef } from 'react';
import './EditModal.css';

function EditModal({ flower, onConfirm, onCancel, loading }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setSuccess('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Выберите файл изображения');
      return;
    }

    try {
      await onConfirm(file);
      setSuccess('Фото обновлено');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Ошибка при загрузке';
      setError(msg);
    }
  };

  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  if (!flower) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-flower-info">
          {flower.foto_base64 ? (
            <img
              src={`data:image/png;base64,${flower.foto_base64}`}
              alt={flower.name}
              className="modal-flower-photo"
            />
          ) : (
            <div className="modal-flower-photo modal-flower-photo--empty">—</div>
          )}
          <div className="modal-flower-details">
            <h2 className="modal-title">Редактирование цветка</h2>
            <p className="modal-flower-name">{flower.name}</p>
            {flower.buy_price != null && (
              <p className="modal-flower-buy-price">
                Покупка: {flower.buy_price.toLocaleString('ru-RU')} ₽
              </p>
            )}
          </div>
        </div>

        <div className="edit-actions">
          <button
            className="btn btn--edit-photo"
            onClick={handleChangePhoto}
            disabled={loading}
          >
            Изменить фото
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input-hidden"
          />
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="modal-actions">
          <button className="btn btn--secondary" onClick={onCancel} disabled={loading}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditModal;
