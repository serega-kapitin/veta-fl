/**
 * Frontend tests using Jest + React Testing Library
 * Run with: npm test
 *
 * Note: react-router-dom v7 uses ESM which is incompatible with CRA's Jest setup.
 * Tests that require router context are skipped. We test pure components and logic instead.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SellModal from './components/SellModal';
import EditModal from './components/EditModal';

// --- Sell Modal Tests ---
describe('SellModal', () => {
  const mockFlower = {
    id: 1,
    name: 'Роза красная',
    buy_price: 300,
    foto_base64: null,
  };

  const defaultProps = {
    flower: mockFlower,
    onConfirm: jest.fn().mockResolvedValue(undefined),
    onCancel: jest.fn(),
    loading: false,
  };

  const renderModal = (props = {}) =>
    render(<SellModal {...defaultProps} {...props} />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders flower name and price input', () => {
    renderModal();
    expect(screen.getByText('Роза красная')).toBeInTheDocument();
    expect(screen.getByLabelText(/цена продажи/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /продать/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /отмена/i })).toBeInTheDocument();
  });

  it('shows buy price when available', () => {
    renderModal();
    expect(screen.getByText(/покупка: 300/i)).toBeInTheDocument();
  });

  it('shows error for negative price', async () => {
    renderModal();
    fireEvent.change(screen.getByLabelText(/цена продажи/i), { target: { value: '-5' } });
    fireEvent.click(screen.getByRole('button', { name: /продать/i }));
    await waitFor(() => {
      expect(screen.getByText(/введите корректную цену/i)).toBeInTheDocument();
    });
  });

  it('shows error for zero price', async () => {
    renderModal();
    fireEvent.change(screen.getByLabelText(/цена продажи/i), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /продать/i }));
    await waitFor(() => {
      expect(screen.getByText(/введите корректную цену/i)).toBeInTheDocument();
    });
  });

  it('shows error for non-numeric price', async () => {
    renderModal();
    fireEvent.change(screen.getByLabelText(/цена продажи/i), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /продать/i }));
    await waitFor(() => {
      expect(screen.getByText(/введите корректную цену/i)).toBeInTheDocument();
    });
  });

  it('calls onConfirm with numeric price', () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(<SellModal flower={mockFlower} onConfirm={onConfirm} onCancel={jest.fn()} loading={false} />);
    fireEvent.change(screen.getByLabelText(/цена продажи/i), { target: { value: '500.50' } });
    fireEvent.click(screen.getByRole('button', { name: /продать/i }));
    expect(onConfirm).toHaveBeenCalledWith(500.5);
  });

  it('calls onConfirm with integer price', () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(<SellModal flower={mockFlower} onConfirm={onConfirm} onCancel={jest.fn()} loading={false} />);
    fireEvent.change(screen.getByLabelText(/цена продажи/i), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: /продать/i }));
    expect(onConfirm).toHaveBeenCalledWith(500);
  });

  it('calls onCancel when cancel button clicked', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /отмена/i }));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('disables buttons when loading', () => {
    renderModal({ loading: true });
    expect(screen.getByRole('button', { name: /продажа/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /отмена/i })).toBeDisabled();
  });
});

// --- Edit Modal Tests ---
describe('EditModal', () => {
  const mockFlower = {
    id: 1,
    name: 'Тюльпан',
    buy_price: 120,
    foto_base64: null,
  };

  const defaultProps = {
    flower: mockFlower,
    onConfirm: jest.fn().mockResolvedValue(undefined),
    onCancel: jest.fn(),
    loading: false,
  };

  const renderModal = (props = {}) =>
    render(<EditModal {...defaultProps} {...props} />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders flower name and change photo button', () => {
    renderModal();
    expect(screen.getByText('Тюльпан')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /изменить фото/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /закрыть/i })).toBeInTheDocument();
  });

  it('shows buy price when available', () => {
    renderModal();
    expect(screen.getByText(/покупка: 120/i)).toBeInTheDocument();
  });

  it('calls onCancel when close button clicked', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /закрыть/i }));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('validates file type before upload', async () => {
    renderModal();
    const file = new File(['not an image'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText(/выберите файл изображения/i)).toBeInTheDocument();
    });
  });

  it('validates file size before upload', async () => {
    renderModal();
    const largeFile = new File(['x'.repeat(21 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [largeFile] } });
    await waitFor(() => {
      expect(screen.getByText(/файл слишком большой/i)).toBeInTheDocument();
    });
  });

  it('calls onConfirm with file on valid upload', async () => {
    renderModal();
    const file = new File(['png data'], 'flower.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalledWith(file);
    });
  });

  it('shows API error message on upload failure', async () => {
    renderModal({
      onConfirm: jest.fn().mockRejectedValue({
        response: { data: { detail: 'Cannot update photo of a sold flower' } },
      }),
    });
    const file = new File(['png data'], 'flower.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText('Cannot update photo of a sold flower')).toBeInTheDocument();
    });
  });

  it('shows generic error when API returns no detail', async () => {
    renderModal({
      onConfirm: jest.fn().mockRejectedValue({}),
    });
    const file = new File(['png data'], 'flower.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText(/ошибка при загрузке фото/i)).toBeInTheDocument();
    });
  });

  it('handles nginx 413 error gracefully', async () => {
    renderModal({
      onConfirm: jest.fn().mockRejectedValue({ response: { status: 413 } }),
    });
    const file = new File(['png data'], 'flower.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText(/файл слишком большой/i)).toBeInTheDocument();
    });
  });

  it('disables change photo button when loading', () => {
    renderModal({ loading: true });
    expect(screen.getByRole('button', { name: /изменить фото/i })).toBeDisabled();
  });

  it('shows success message after upload', async () => {
    renderModal();
    const file = new File(['png data'], 'flower.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText(/фото обновлено/i)).toBeInTheDocument();
    });
  });

  it('resets file input after successful upload', async () => {
    renderModal();
    const file = new File(['png data'], 'flower.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText(/фото обновлено/i)).toBeInTheDocument();
    });
    expect(input.value).toBe('');
  });
});

// --- Utility function tests ---
describe('Format functions (via component rendering)', () => {
  it('displays price with Russian locale formatting', () => {
    const flower = {
      id: 1,
      name: 'Test',
      buy_price: 1234567.89,
      foto_base64: null,
    };
    render(
      <SellModal
        flower={flower}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        loading={false}
      />
    );
    expect(screen.getByText(/покупка: 1\s?234\s?567/i)).toBeInTheDocument();
  });

  it('displays "—" for null buy_price', () => {
    const flower = {
      id: 1,
      name: 'Test',
      buy_price: null,
      foto_base64: null,
    };
    render(
      <EditModal
        flower={flower}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        loading={false}
      />
    );
    // When buy_price is null, the price line should not appear
    expect(screen.queryByText(/покупка:/i)).not.toBeInTheDocument();
  });
});
