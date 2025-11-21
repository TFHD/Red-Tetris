import { useEffect, useState, useCallback, useRef } from 'react';
import TetrisBoard from './TetrisBoard.js';
import OpponentBoard from './OpponentBoard.js';
import NextPieces from './NextPieces.js';
import { createPieceGenerator, calculateScore, calculatePenalty } from '../utils/tetris.js';
import { Player, CellValue } from '../types.js';
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io';

//TODO: Rajouter un bouton restart 

/**
 * @description Composant Game
 * @param {Socket} socket - Instance du socket
 * @param {string} roomId - ID de la room
 * @param {string} playerName - Nom du joueur
 * @param {Array} players - Liste des joueurs
 * @returns {JSX.Element} - Composant Game
 */
function Game({ socket, roomId, playerName, players, seed } :
  { socket : Socket<DefaultEventsMap, DefaultEventsMap>,
    roomId : string,
    playerName : string,
    players : Player[],
    seed : number,
  }) {
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [opponentBoard, setOpponentBoard] = useState<CellValue[][]>([]);
  const [opponentStats, setOpponentStats] = useState({ score: 0, lines: 0 });
  const currentBoardRef = useRef<CellValue[][]>([]);
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  //Gestion penalites
  const [pendingPenalty, setPendingPenalty] = useState<number>(0);
  const [penaltyNotification, setPenaltyNotification] = useState<string | null>(null);
  // Prochaines pièces
  const [nextPieces, setNextPieces] = useState<string[]>([]);

  const [pieceGenerator] = useState(() => createPieceGenerator(seed));

  scoreRef.current = score;
  linesRef.current = lines;

  useEffect(() => {
    if (!socket) return;

    socket.on('opponent_state', (data) => {
      if (data.state?.board) {
        setOpponentBoard(data.state.board);
        if (data.state.score !== undefined || data.state.lines !== undefined) {
          setOpponentStats({
            score: data.state.score || 0,
            lines: data.state.lines || 0,
          });
        }
      }
    });

    socket.on('receive_penalty', (data) => {
      console.log(`⚡ Received ${data.lines} penalty lines from opponent!`);
      
      // compteur de pénalités
      setPendingPenalty(prev => prev + data.lines);
      
      //notification
      setPenaltyNotification(`+${data.lines} ligne${data.lines > 1 ? 's' : ''} 💀`);
      setTimeout(() => setPenaltyNotification(null), 2000);
      
      //Ca pour eviter des problemes
      setTimeout(() => setPendingPenalty(0), 100);
    });

    return () => {
      socket.off('opponent_state');
      socket.off('receive_penalty');
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || gameOver) return;

    const interval = setInterval(() => {
      if (currentBoardRef.current) {
        socket.emit('sync_state', { 
          roomId, 
          state: { 
            board: currentBoardRef.current,
            score: scoreRef.current,
            lines: linesRef.current,
            gameOver: gameOver,
          } 
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [socket, roomId, gameOver]);

  const handleInput = useCallback(async () => {
    if (!socket || gameOver) return false;
    
    try {
      const ack = await socket.emitWithAck('input', { roomId });
      if (!ack?.ok)
        return false;
      return true;
    } catch (error) { return false; }
  }, [socket, roomId, gameOver]);

  const handleStateUpdate = useCallback((board : CellValue[][]) => {
    currentBoardRef.current = board;
  }, []);

  const handleLinesCleared = useCallback((count : number) => {
    setLines((prev : number) => prev + count);
    setScore((prev : number) => prev + calculateScore(count));

    const penaltyLines = calculatePenalty(count);

    if (socket && penaltyLines > 0) {
      socket.emit('send_penalty', { roomId, lines: penaltyLines });
      console.log(`⚡ Sending ${penaltyLines} penalty lines to opponent`);
    }
  }, [socket, roomId]);
  

  const handleGameOver = useCallback(() => {
    setGameOver(true);
    socket.emit('sync_state', {
      roomId,
      state: { 
        board: currentBoardRef.current,
        score: scoreRef.current,
        lines: linesRef.current,
        gameOver: gameOver,
      }
    });
    socket.emit('end_game', { roomId });
  }, [socket, roomId]);

  const speed = Math.max(100, 1000 - (lines * 20));

  const handleNextPiecesUpdate = useCallback((pieces: string[]) => {
    setNextPieces(pieces);
  }, []);

  const opponent = players.find(p => p.name !== playerName);

  return (
    <div className="game">
      {penaltyNotification && (
        <div className="penalty-notification">
          {penaltyNotification}
        </div>
      )}
      <div className="game-container">
        <div className="next-pieces-sidebar">
          <NextPieces nextPieces={nextPieces} />
        </div>

        <div className="player-section">
          <div className="player-info">
            <h3>👤 {playerName} (Vous)</h3>
            <div className="stats">
              <p>Score: <strong>{score}</strong></p>
              <p>Lignes: <strong>{lines}</strong></p>
            </div>
          </div>
          
          <TetrisBoard
            pieceGenerator={pieceGenerator}
            onInput={handleInput}
            onStateUpdate={handleStateUpdate}
            onLinesCleared={handleLinesCleared}
            pendingPenalty={pendingPenalty}
            gameOver={gameOver}
            onGameOver={handleGameOver}
            speed={speed}
            onNextPiecesUpdate={handleNextPiecesUpdate}
          />

          {gameOver && (
            <div className="game-over-overlay">
              <h2>Game Over!</h2>
              <p>Score final: {score}</p>
            </div>
          )}
        </div>

      {opponent && (
        <div className="opponent-section">
          <div className="player-info">
            <h3>🎯 {opponent.name}</h3>
            <div className="stats">
              <p>Score: <strong>{opponentStats.score}</strong></p>
              <p>Lines: <strong>{opponentStats.lines}</strong></p>
            </div>
          </div>

          <div className="opponent-board-container">
            <OpponentBoard board={opponentBoard} />
          </div>
        </div>
      )}
      </div>

      <div className="controls-info">
        <h4>🎮 Contrôles :</h4>
        <ul>
          <li><kbd>←</kbd> <kbd>→</kbd> : Déplacer</li>
          <li><kbd>↑</kbd> : Rotation</li>
          <li><kbd>↓</kbd> : Descente rapide</li>
          <li><kbd>Espace</kbd> : Hard drop</li>
        </ul>
        <div className="penalty-info">
          <p><strong>💀 Pénalités :</strong></p>
          <p>2 lignes → 1 ligne grise</p>
          <p>3 lignes → 2 lignes grises</p>
          <p>4 lignes → 4 lignes grises 🔥</p>
        </div>
      </div>
    </div>
  );
}

export default Game;

