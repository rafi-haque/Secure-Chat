import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders secure chat app', () => {
  render(<App />);
  const titleElement = screen.getByText(/🔐 Secure Chat/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders registration form', () => {
  render(<App />);
  const registerElement = screen.getByText(/Secure Chat Registration/i);
  expect(registerElement).toBeInTheDocument();
});
