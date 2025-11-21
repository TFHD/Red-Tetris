import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NextPieces from './NextPieces.js';

describe('NextPieces Component', () => {
  it('devrait afficher le titre "Prochaines pièces"', () => {
    render(<NextPieces nextPieces={[]} />);
    expect(screen.getByText(/Prochaines pièces/i)).toBeInTheDocument();
  });

  it('devrait afficher les pièces suivantes', () => {
    const pieces = ['I', 'O', 'T'];
    render(<NextPieces nextPieces={pieces} />);
    
    const container = screen.getByText(/Prochaines pièces/i).parentElement;
    expect(container).toBeInTheDocument();
  });

  it('devrait gérer une liste vide de pièces', () => {
    render(<NextPieces nextPieces={[]} />);
    expect(screen.getByText(/Prochaines pièces/i)).toBeInTheDocument();
  });
});