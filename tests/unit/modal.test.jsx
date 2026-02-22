import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Modal from '@/components/ui/Modal';

describe('Modal', () => {
  it('renders when open and calls onClose on overlay click', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="Teste">
        <div>Conteudo</div>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when closed', () => {
    const onClose = vi.fn();
    render(
      <Modal open={false} onClose={onClose} title="Teste">
        <div>Conteudo</div>
      </Modal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
