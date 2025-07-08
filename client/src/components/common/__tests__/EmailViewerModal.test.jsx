import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailViewerModal from '../EmailViewerModal';
import { apiClient } from '../../../Services/api';

jest.mock('../../../Services/api', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe('EmailViewerModal', () => {
  it('fetches and displays email when View Original Email is clicked', async () => {
    const fakeHtml = '<div>Hello World</div>';
    apiClient.get.mockResolvedValue({ full_email: fakeHtml });
    const transaction = { id: 123 };

    const Wrapper = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>View Original Email</button>
          <EmailViewerModal
            isOpen={open}
            onClose={() => setOpen(false)}
            transaction={transaction}
          />
        </>
      );
    };

    render(<Wrapper />);

    await userEvent.click(screen.getByText('View Original Email'));

    expect(apiClient.get).toHaveBeenCalledWith(`/api/transactions/${transaction.id}/email`);

    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });
});
