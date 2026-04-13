import React, { useState } from 'react';
import { mockOperations } from '../data/mockOperations';
import './OperationsTable.css';

const statusColors = {
  'Проведён': 'status--success',
  'Черновик': 'status--draft',
  'Ожидание': 'status--pending',
};

function OperationsTable() {
  const [operations] = useState(mockOperations);
  const [selectedType, setSelectedType] = useState('Все');

  const filtered = selectedType === 'Все'
    ? operations
    : operations.filter((op) => op.type === selectedType);

  const totalIncome = operations
    .filter((op) => op.type === 'Продажа')
    .reduce((sum, op) => sum + op.amount, 0);

  const totalExpense = operations
    .filter((op) => op.type === 'Покупка')
    .reduce((sum, op) => sum + op.amount, 0);

  return (
    <div className="operations">
      {/* Summary Cards */}
      <div className="operations-summary">
        <div className="summary-card summary-card--income">
          <span className="summary-label">Приход</span>
          <span className="summary-value">{totalIncome.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div className="summary-card summary-card--expense">
          <span className="summary-label">Расход</span>
          <span className="summary-value">{totalExpense.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div className="summary-card summary-card--balance">
          <span className="summary-label">Баланс</span>
          <span className="summary-value">{(totalIncome - totalExpense).toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="operations-toolbar">
        <div className="toolbar-left">
          <button className="btn btn--primary">+ Создать операцию</button>
          <button className="btn btn--secondary">Регистр документов</button>
        </div>
        <div className="toolbar-right">
          <select
            className="filter-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option>Все</option>
            <option>Покупка</option>
            <option>Продажа</option>
          </select>
          <input
            type="text"
            className="search-input"
            placeholder="Поиск (Ctrl+F)"
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="operations-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Номер</th>
              <th>Тип</th>
              <th>Контрагент</th>
              <th>Описание</th>
              <th className="text-right">Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((op) => (
              <tr key={op.id} className="operations-row">
                <td>{op.date}</td>
                <td className="mono">{op.number}</td>
                <td>
                  <span className={`type-badge type-badge--${op.type === 'Покупка' ? 'expense' : 'income'}`}>
                    {op.type}
                  </span>
                </td>
                <td>{op.counterparty}</td>
                <td className="description-cell">{op.description}</td>
                <td className="text-right mono">
                  {op.amount.toLocaleString('ru-RU')} {op.currency}
                </td>
                <td>
                  <span className={`status ${statusColors[op.status] || ''}`}>
                    {op.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-footer">
        <span className="table-info">
          Показано {filtered.length} из {operations.length} операций
        </span>
        <div className="pagination">
          <button className="pagination-btn" disabled>←</button>
          <button className="pagination-btn pagination-btn--active">1</button>
          <button className="pagination-btn">→</button>
        </div>
      </div>
    </div>
  );
}

export default OperationsTable;
