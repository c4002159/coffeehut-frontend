import { render, screen } from '@testing-library/react';
import App from './App';

test('renders menu page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /menu page/i })).toBeInTheDocument();
});
