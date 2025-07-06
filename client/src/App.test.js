import { render, screen } from '@testing-library/react';
import App from './App';

test('renders header title', () => {
  render(<App />);
  const titleElement = screen.getByText(/header\.title/i);
  expect(titleElement).toBeInTheDocument();
});
