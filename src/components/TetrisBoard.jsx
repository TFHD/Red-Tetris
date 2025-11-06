import { useEffect, useState, useCallback, useRef } from 'react';
import { PIECES, COLORS, addPenaltyLines, BOARD_WIDTH, BOARD_HEIGHT } from '../utils/tetris';


/**
 * @description Composant TetrisBoard
 * @param {function} pieceGenerator - Générateur de pièces
 * @param {function} onInput - Fonction appelée lors d'un input
 * @param {function} onStateUpdate - Fonction appelée lors de la mise à jour de l'état
 * @param {function} onLinesCleared - Fonction appelée lors de la suppression de lignes
 * @param {boolean} gameOver - Indique si le jeu est terminé
 * @param {function} onGameOver - Fonction appelée lorsque le jeu est terminé
 * @returns {JSX.Element} - Composant TetrisBoard
 */
function TetrisBoard({ pieceGenerator, onInput, onStateUpdate, onLinesCleared, onSendPenalty, pendingPenalty, gameOver, onGameOver }) {
  const [board, setBoard] = useState(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
  );
  const [currentPiece, setCurrentPiece] = useState(null);
  const [position, setPosition] = useState({ x: 3, y: 0 });
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef(null);
  const stateRef = useRef({ currentPiece, position, board, gameOver, isPaused });

  stateRef.current = { currentPiece, position, board, gameOver, isPaused };

  //Generqtion des pieces 
  useEffect(() => {
    if (pendingPenalty > 0 && !gameOver) {
      console.log(`⚡ Receiving ${pendingPenalty} penalty lines!`);
      setBoard(prevBoard => addPenaltyLines(prevBoard, pendingPenalty));
    }
  }, [pendingPenalty, gameOver]);

  /**
   * Génère une nouvelle pièce 
   */
  const generateNewPiece = useCallback(() => {
    const type = pieceGenerator();
    return {
      type,
      shape: PIECES[type],
      color: COLORS[type],
    };  
  }, [pieceGenerator]);  


  /**
   * Initialise la première pièce
   */
  useEffect(() => {
    if (!currentPiece && !gameOver) {
      setCurrentPiece(generateNewPiece());
    }
  }, [currentPiece, generateNewPiece, gameOver]);


  /**
   * Vérifie les collisions entre la pièce et le board
   */
  const checkCollision = useCallback((piece, pos, boardState) => {
    if (!piece) return true;
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          
          if (
            newX < 0 || 
            newX >= BOARD_WIDTH || 
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && boardState[newY][newX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);


  /**
   * Fusionne la pièce avec le board
   * @param {Object} overridePos - Position à utiliser (optionnelle, pour le hard drop)
   */
  const mergePiece = useCallback((overridePos = null) => {
    const { currentPiece: piece, position: pos, board: brd } = stateRef.current;
    
    const finalPos = overridePos || pos;
    
    if (!piece) return;

    //=================================================
    // FIRST PART  : MERGE PIECE WITH BOARD
    //=================================================

    const newBoard = brd.map(row => [...row]);
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = finalPos.y + y;
          const boardX = finalPos.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT) {
            newBoard[boardY][boardX] = piece.type;
          }
        }
      }
    }

    //=================================================
    // SECOND PART : CLEAR LINES AND FILL EMPTY ROWS
    //=================================================

    let linesCleared = 0;
    const clearedBoard = newBoard.filter(row => {
      const isFull = row.every(cell => cell !== 0);
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (clearedBoard.length < BOARD_HEIGHT)
      clearedBoard.unshift(Array(BOARD_WIDTH).fill(0));

    setBoard(clearedBoard);
    
    if (linesCleared > 0) {
      onLinesCleared(linesCleared);
    }

    //=================================================
    // THIRD PART : CHECK GAME OVER
    //=================================================

    const newPiece = generateNewPiece();
    const newPos = { x: 3, y: 0 };
    
    if (checkCollision(newPiece, newPos, clearedBoard)) {
      stopTimer();
      onGameOver?.();
    } else {
      setCurrentPiece(newPiece);
      setPosition(newPos);
    }
  }, [generateNewPiece, checkCollision, onLinesCleared, onStateUpdate]);


  /**
   * Démarre le timer
   */
  const startTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const { 
        currentPiece: piece,
        position: pos,
        board: brd,
        gameOver: over,
        isPaused: paused
      } = stateRef.current;
      
      if (over || paused || !piece) return;

      const newPos = { ...pos, y: pos.y + 1 };
      
      if (checkCollision(piece, newPos, brd)) {
        mergePiece();
      } else {
        setPosition(newPos);
      }
    }, 1000);
  }, [checkCollision, mergePiece]);


  /**
   * Arrête le timer
   */
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startTimer();
    
    return () => stopTimer();
  }, []);


  /**
   * Gère les inputs clavier
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const { currentPiece: piece, position: pos, board: brd, gameOver: over } = stateRef.current;
      
      if (over || !piece) return;

      let newPos = { ...pos };
      let newPiece = piece;

      switch (e.key) {
        case 'ArrowLeft':
          newPos.x -= 1;
          onInput?.({ type: 'move', direction: 'left' });
          break;
        case 'ArrowRight':
          newPos.x += 1;
          onInput?.({ type: 'move', direction: 'right' });
          break;
        case 'ArrowDown':
          newPos.y += 1;
          onInput?.({ type: 'move', direction: 'down' });
          break;
        case 'ArrowUp':
          newPiece = {
            ...piece,
            shape: rotate(piece.shape),
          };
          onInput?.({ type: 'rotate' });
          break;
        case ' ':
          while (!checkCollision(piece, { ...newPos, y: newPos.y + 1 }, brd)) {
            newPos.y += 1;
          }
          onInput?.({ type: 'hard_drop' });
          break;
        default:
          return;
      }

      e.preventDefault();

      if (e.key === ' ') {
        setPosition(newPos);
        mergePiece(newPos);
      } else if (!checkCollision(newPiece, newPos, brd)) {
        setPosition(newPos);
        if (newPiece !== piece) {
          setCurrentPiece(newPiece);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checkCollision, mergePiece, onInput]);



  /**
   * Effectue une rotation de 90° sens horaire autour du point pivot (point blanc)
   * Les pièces Tetris tournent dans une grille carrée (3x3 ou 4x4) go voir utils/tetris.js
   */
  const rotate = (matrix) => {
    const N = matrix.length;
    const rotated = Array(N).fill(null).map(() => Array(N).fill(0));
    
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        rotated[x][N - 1 - y] = matrix[y][x];
      }
    }
    
    return rotated;
  };


  /**
   * Crée un board visuel combinant le board fixe et la pièce actuelle
   */
  const getVisualBoard = useCallback(() => {
    const visual = board.map(row => [...row]);
    
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              visual[boardY][boardX] = currentPiece.type;
            }
          }
        }
      }
    }
    
    return visual;
  }, [board, currentPiece, position]);

  const visualBoard = getVisualBoard();


  /**
   * Envoie le board visuel au parent (pour sync avec l'adversaire)
   */
  useEffect(() => {
    if (onStateUpdate && visualBoard) {
      onStateUpdate(visualBoard);
    }
  }, [visualBoard, onStateUpdate]);


  return (
    <div className="tetris-board">
      <div className="game-grid">
        {visualBoard.map((row, y) => (
          <div key={y} className="grid-row">
            {row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className={`grid-cell ${cell ? 'filled' : 'empty'}`}
                style={{
                  backgroundColor: cell ? COLORS[cell] : 'transparent',
                }}
              />
            ))}
          </div>
        ))}
      </div>
      {gameOver && (
        <div className="board-overlay">
          <h3>Game Over</h3>
        </div>
      )}
    </div>
  );
}

export default TetrisBoard;

