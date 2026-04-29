import React from 'react';
import PropTypes from 'prop-types';
import './BuyModal.css';

const BuyModal = ({ flower, onConfirm, onCancel, loading }) => {
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [photo, setPhoto] = React.useState(null);
  const [error, setError] = React.useState('');
  const fileInputRef = React.useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!name.trim()) {
      setError('Название цветка обязательно');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Цена покупки должна быть неотрицательным числом');
      return;
    }

    try {
      await onConfirm({
        name: name.trim(),
        buyPrice: priceNum,
        photo: photo
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при покупке цветка');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, GIF, BMP');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError('Файл слишком большой (максимум 20 МБ)');
        return;
      }
      setPhoto(file);
    } else {
      setPhoto(null);
    }
  };

  const handleSelectPhoto = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-flower-details">
          <h2 className="modal-title">Купить цветок</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="buy-name">
              Название цветка *
            </label>
            <input
              id="buy-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="buy-price">
              Цена покупки (₽) *
            </label>
            <input
              id="buy-price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Введите цену"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="buy-photo">
              Фото цветка (опционально)
            </label>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleSelectPhoto}
            >
              {photo ? 'Изменить фото' : 'Выбрать фото'}
            </button>
            <input
              ref={fileInputRef}
              id="buy-photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input-hidden"
            />
            {photo && (
              <div className="modal-photo-preview">
                <p>Выбранный файл: {photo.name}</p>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              className="btn btn--secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              className="btn btn--buy"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Покупка...' : 'Купить цветок'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

BuyModal.propTypes = {
  flower: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

BuyModal.defaultProps = {
  loading: false
};

BuyModal.defaultProps = {
  loading: false
};

export default BuyModal;