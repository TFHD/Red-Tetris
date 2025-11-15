import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WaitingRoom from './WaitingRoom';
import { Player } from '../types';

describe('WaitingRoom Component', () => {
  const mockPlayers: Player[] = [
    {
      id: '1',
      name: 'Player1',
      score: 0,
      gameOver: false,
      lines: 0,
      role: 'host',
      lastState: null,
    },
  ];

  it('devrait afficher le nom de la room', () => {
    render(
      <WaitingRoom
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        onStartGame={vi.fn()}
      />
    );

    expect(screen.getByText('test-room')).toBeInTheDocument();
  });

  it('devrait afficher les joueurs dans la room', () => {
    render(
      <WaitingRoom
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        onStartGame={vi.fn()}
      />
    );

    expect(screen.getByText('Player1')).toBeInTheDocument();
  });

  it('devrait afficher le bouton de démarrage pour le host', () => {
    render(
      <WaitingRoom
        roomId="test-room"
        playerName="Player1"
        players={mockPlayers}
        onStartGame={vi.fn()}
      />
    );

    expect(screen.getByText(/Démarrer la partie/i)).toBeInTheDocument();
  });
});