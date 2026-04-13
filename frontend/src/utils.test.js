/**
 * Utility function tests
 */

// --- Sorting Logic Tests ---
describe('Sorting Logic (from FlowersPage)', () => {
  const mockFlowers = [
    { id: 1, name: 'C', buy_price: 300, buy_date: '2026-04-10', sell_price: null, sell_date: null },
    { id: 2, name: 'A', buy_price: 100, buy_date: '2026-04-12', sell_price: 500, sell_date: '2026-04-13' },
    { id: 3, name: 'B', buy_price: null, buy_date: '2026-04-11', sell_price: 200, sell_date: '2026-04-12' },
    { id: 4, name: 'D', buy_price: 500, buy_date: null, sell_price: null, sell_date: null },
  ];

  function sortFlowers(flowers, sortField, sortDir) {
    if (!sortField || !sortDir) return [...flowers];
    return [...flowers].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  describe('sort by buy_price', () => {
    it('sorts ascending with nulls last', () => {
      const result = sortFlowers(mockFlowers, 'buy_price', 'asc');
      expect(result.map(f => f.id)).toEqual([2, 1, 4, 3]); // 100, 300, 500, null
    });

    it('sorts descending with nulls last', () => {
      const result = sortFlowers(mockFlowers, 'buy_price', 'desc');
      expect(result.map(f => f.id)).toEqual([4, 1, 2, 3]); // 500, 300, 100, null
    });
  });

  describe('sort by name', () => {
    it('sorts ascending alphabetically', () => {
      const result = sortFlowers(mockFlowers, 'name', 'asc');
      expect(result.map(f => f.name)).toEqual(['A', 'B', 'C', 'D']);
    });

    it('sorts descending alphabetically', () => {
      const result = sortFlowers(mockFlowers, 'name', 'desc');
      expect(result.map(f => f.name)).toEqual(['D', 'C', 'B', 'A']);
    });
  });

  describe('sort by date', () => {
    it('sorts buy_date ascending with nulls last', () => {
      const result = sortFlowers(mockFlowers, 'buy_date', 'asc');
      expect(result.map(f => f.id)).toEqual([1, 3, 2, 4]); // 04-10, 04-11, 04-12, null
    });

    it('sorts sell_date ascending with nulls last', () => {
      const result = sortFlowers(mockFlowers, 'sell_date', 'asc');
      // sell_date: null(1), 2026-04-13(2), 2026-04-12(3), null(4)
      expect(result.map(f => f.id)).toEqual([3, 2, 1, 4]);
    });
  });

  describe('no sort', () => {
    it('returns unchanged copy when field is null', () => {
      const result = sortFlowers(mockFlowers, null, 'asc');
      expect(result).toEqual(mockFlowers);
      expect(result).not.toBe(mockFlowers); // Should be a copy
    });

    it('returns unchanged copy when dir is null', () => {
      const result = sortFlowers(mockFlowers, 'name', null);
      expect(result).toEqual(mockFlowers);
    });
  });

  describe('all null values', () => {
    const allNull = [
      { id: 1, buy_price: null },
      { id: 2, buy_price: null },
    ];

    it('maintains order when all values are null', () => {
      const result = sortFlowers(allNull, 'buy_price', 'asc');
      expect(result.map(f => f.id)).toEqual([1, 2]);
    });
  });
});

// --- Format Function Tests ---
describe('Format Functions', () => {
  function formatPrice(price) {
    return price != null ? `${price.toLocaleString('ru-RU')} ₽` : '—';
  }

  function formatDate(dateStr) {
    return dateStr ? dateStr : '—';
  }

  describe('formatPrice', () => {
    it('formats integer price with Russian locale', () => {
      expect(formatPrice(1234567)).toBe('1\u00A0234\u00A0567 ₽');
    });

    it('formats decimal price', () => {
      expect(formatPrice(1234.56)).toBe('1\u00A0234,56 ₽');
    });

    it('formats zero', () => {
      expect(formatPrice(0)).toBe('0 ₽');
    });

    it('returns dash for null', () => {
      expect(formatPrice(null)).toBe('—');
    });

    it('returns dash for undefined', () => {
      expect(formatPrice(undefined)).toBe('—');
    });

    it('formats negative price', () => {
      expect(formatPrice(-100)).toBe('-100 ₽');
    });
  });

  describe('formatDate', () => {
    it('returns date string as-is', () => {
      expect(formatDate('2026-04-13')).toBe('2026-04-13');
    });

    it('returns dash for null', () => {
      expect(formatDate(null)).toBe('—');
    });

    it('returns dash for undefined', () => {
      expect(formatDate(undefined)).toBe('—');
    });

    it('returns dash for empty string', () => {
      expect(formatDate('')).toBe('—');
    });
  });
});

// --- Sort State Logic Tests ---
describe('Sort State Logic (handleSortClick)', () => {
  function handleSortClick(currentSort, field) {
    if (currentSort.field !== field) {
      return { field, dir: 'asc' };
    }
    if (currentSort.dir === 'asc') {
      return { field, dir: 'desc' };
    }
    return { field: null, dir: null };
  }

  it('starts with ascending when clicking new field', () => {
    const result = handleSortClick({ field: null, dir: null }, 'buy_price');
    expect(result).toEqual({ field: 'buy_price', dir: 'asc' });
  });

  it('toggles to descending when clicking same field (asc)', () => {
    const result = handleSortClick({ field: 'buy_price', dir: 'asc' }, 'buy_price');
    expect(result).toEqual({ field: 'buy_price', dir: 'desc' });
  });

  it('clears sort when clicking same field (desc)', () => {
    const result = handleSortClick({ field: 'buy_price', dir: 'desc' }, 'buy_price');
    expect(result).toEqual({ field: null, dir: null });
  });

  it('resets to asc when switching fields', () => {
    const result = handleSortClick({ field: 'buy_price', dir: 'desc' }, 'sell_price');
    expect(result).toEqual({ field: 'sell_price', dir: 'asc' });
  });

  it('cycles through asc -> desc -> clear -> asc for same field', () => {
    let state = { field: null, dir: null };
    state = handleSortClick(state, 'name');
    expect(state).toEqual({ field: 'name', dir: 'asc' });

    state = handleSortClick(state, 'name');
    expect(state).toEqual({ field: 'name', dir: 'desc' });

    state = handleSortClick(state, 'name');
    expect(state).toEqual({ field: null, dir: null });

    state = handleSortClick(state, 'name');
    expect(state).toEqual({ field: 'name', dir: 'asc' });
  });

  it('works with different field types', () => {
    ['buy_price', 'buy_date', 'sell_price', 'sell_date'].forEach(field => {
      const result = handleSortClick({ field: null, dir: null }, field);
      expect(result.field).toBe(field);
      expect(result.dir).toBe('asc');
    });
  });
});

// --- Selection Logic Tests ---
describe('Selection Logic (handleRowClick)', () => {
  function handleRowClick(currentSelectedId, clickedId) {
    return currentSelectedId === clickedId ? null : clickedId;
  }

  it('selects row when nothing is selected', () => {
    expect(handleRowClick(null, 5)).toBe(5);
  });

  it('deselects row when clicking same row', () => {
    expect(handleRowClick(5, 5)).toBe(null);
  });

  it('switches selection when clicking different row', () => {
    expect(handleRowClick(3, 5)).toBe(5);
  });

  it('works with id=0 (falsy but valid)', () => {
    expect(handleRowClick(null, 0)).toBe(0);
  });

  it('deselects id=0 when clicking it again', () => {
    expect(handleRowClick(0, 0)).toBe(null);
  });
});

// --- Filter Logic Tests ---
describe('Filter Logic', () => {
  function filterFlowers(flowers, includeSold) {
    if (includeSold) return flowers;
    return flowers.filter(f => f.sell_price === null && f.sell_date === null);
  }

  const mockFlowers = [
    { id: 1, sell_price: null, sell_date: null },
    { id: 2, sell_price: 500, sell_date: '2026-04-13' },
    { id: 3, sell_price: null, sell_date: null },
    { id: 4, sell_price: 300, sell_date: null }, // edge case: price but no date
  ];

  it('returns all flowers when includeSold is true', () => {
    const result = filterFlowers(mockFlowers, true);
    expect(result).toHaveLength(4);
  });

  it('returns only unsold when includeSold is false', () => {
    const result = filterFlowers(mockFlowers, false);
    expect(result).toHaveLength(2);
    expect(result.map(f => f.id)).toEqual([1, 3]);
  });

  it('handles empty array', () => {
    expect(filterFlowers([], true)).toEqual([]);
    expect(filterFlowers([], false)).toEqual([]);
  });

  it('handles all sold', () => {
    const allSold = [
      { id: 1, sell_price: 100, sell_date: '2026-01-01' },
      { id: 2, sell_price: 200, sell_date: '2026-02-01' },
    ];
    expect(filterFlowers(allSold, false)).toEqual([]);
  });

  it('handles all unsold', () => {
    const allUnsold = [
      { id: 1, sell_price: null, sell_date: null },
      { id: 2, sell_price: null, sell_date: null },
    ];
    expect(filterFlowers(allUnsold, false)).toHaveLength(2);
    expect(filterFlowers(allUnsold, true)).toHaveLength(2);
  });
});
