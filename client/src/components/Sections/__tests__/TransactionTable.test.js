import { render, screen } from '@testing-library/react';
import TransactionTable from '../TransactionTable';

const sampleTxns = [
  {
    id: 1,
    date: '2025-02-04',
    description: 'COUCHE-TARD # 1319',
    amount: 3.62,
    category: 'Food',
    tags: '',
    bank: 'capital_one_credit'
  }
];

const noop = () => {};
const baseProps = {
  transactions: sampleTxns,
  filteredTransactions: sampleTxns,
  paginatedTransactions: sampleTxns,
  sortField: 'date',
  sortDirection: 'asc',
  currentPage: 1,
  itemsPerPage: 10,
  filters: { categories: [], tags: [] },
  onSort: noop,
  onMultiSelectFilter: noop,
  onPageChange: noop,
  editingTransaction: null,
  editValues: {},
  setEditValues: noop,
  onStartEdit: noop,
  onSaveEdit: noop,
  onCancelEdit: noop,
  categories: [],
  uniqueTags: [],
  onOpenTagModal: noop,
  removeTag: noop,
  onDeleteTransaction: noop
};

test('renders transaction description', () => {
  render(<TransactionTable {...baseProps} />);
  expect(screen.getByText('COUCHE-TARD # 1319')).toBeInTheDocument();
});
