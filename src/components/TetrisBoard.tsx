import { useEffect, useState, useCallback, useRef } from 'react';
import { PIECES, COLORS, addPenaltyLines, BOARD_WIDTH, BOARD_HEIGHT } from '../utils/tetris.js';
import { Piece, Position, CellValue } from '../types.js';


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
interface TetrisBoardProps {
  pieceGenerator: () => string;
  onInput: () => Promise<boolean>;
  onStateUpdate: (board: CellValue[][]) => void;
  onLinesCleared: (count: number) => void;
  pendingPenalty: number;
  gameOver: boolean;
  onGameOver: () => void;
  speed: number;
  onNextPiecesUpdate?: (pieces: string[]) => void;
}

function TetrisBoard({
  pieceGenerator,
  onInput,
  onStateUpdate,
  onLinesCleared,
  pendingPenalty,
  gameOver,
  onGameOver,
  speed,
  onNextPiecesUpdate,
}: TetrisBoardProps) {
  const [board, setBoard] = useState(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)) as CellValue[][]
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [position, setPosition] = useState<Position>({ x: 3, y: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [nextPieces, setNextPieces] = useState<string[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef({ currentPiece, position, board, gameOver, isPaused });

  stateRef.current = { currentPiece, position, board, gameOver, isPaused, };

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
  const generateNewPiece : () => Piece = useCallback(() => {
    const type = pieceGenerator();
    return {
      type,
      shape: PIECES[type],
      color: COLORS[type],
    } as Piece;  
  }, [pieceGenerator]);

  /**
   * Initialise les 5 prochaines pièces
   */
  const initNextPieces = useCallback(() => {
    const pieces: string[] = [];
    for (let i = 0; i < 5; i++) {
      pieces.push(pieceGenerator());
    }
    setNextPieces(pieces);
    onNextPiecesUpdate?.(pieces);
  }, [pieceGenerator, onNextPiecesUpdate]);

  /**
   * Prend la prochaine pièce de la file et en génère une nouvelle
   */
  const getNextPiece = useCallback((): Piece => {
    if (nextPieces.length === 0) {
      return generateNewPiece();
    }
    
    const type = nextPieces[0]!;
    const newNextPieces = [...nextPieces.slice(1), pieceGenerator()];
    setNextPieces(newNextPieces);
    onNextPiecesUpdate?.(newNextPieces);
    
    return {
      type,
      shape: PIECES[type],
      color: COLORS[type],
    } as Piece;
  }, [nextPieces, pieceGenerator, onNextPiecesUpdate, generateNewPiece]);  


  /**
   * Initialise les prochaines pièces au démarrage
   */
  useEffect(() => {
    if (nextPieces.length === 0 && !gameOver) {
      initNextPieces();
    }
  }, [nextPieces.length, initNextPieces, gameOver]);

  /**
   * Initialise la première pièce
   */
  useEffect(() => {
    if (!currentPiece && !gameOver && nextPieces.length > 0) {
      setCurrentPiece(getNextPiece());
    }
  }, [currentPiece, gameOver, nextPieces.length]);


  /**
   * Vérifie les collisions entre la pièce et le board
   */
  const checkCollision = useCallback((piece: Piece | null, pos: Position, boardState: CellValue[][]) => {
    if (!piece) return true;
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y]!.length; x++) {
        if (piece.shape[y]![x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          
          if (
            newX < 0 || 
            newX >= BOARD_WIDTH || 
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && boardState[newY]![newX])
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
  const mergePiece = useCallback((overridePos: Position | null = null) => {
    const { currentPiece: piece, position: pos, board: brd } = stateRef.current;
    
    const finalPos = overridePos || pos;
    
    if (!piece) return;

    //=================================================
    // FIRST PART  : MERGE PIECE WITH BOARD
    //=================================================

    const newBoard = brd.map(row => [...row]);
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y]!.length; x++) {
        if (piece.shape[y]![x]) {
          const boardY = finalPos.y + y;
          const boardX = finalPos.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT) {
            newBoard[boardY]![boardX] = piece.type as CellValue;
          }
        }
      }
    }

    //=================================================
    // SECOND PART : CLEAR LINES AND FILL EMPTY ROWS
    //=================================================

    let linesCleared = 0;
    const clearedBoard = newBoard.filter(row => {
      const isFull = row.every((cell : CellValue) => cell !== 0);
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

    const newPiece = getNextPiece();
    const newPos = { x: 3, y: 0 };
    
    if (checkCollision(newPiece, newPos, clearedBoard)) {
      stopTimer();
      onGameOver?.();
    } else {
      setCurrentPiece(newPiece);
      setPosition(newPos);
    }
  }, [getNextPiece, checkCollision, onLinesCleared, onStateUpdate]);


  /**
   * Démarre le timer avec la vitesse actuelle
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
      
      if (over || paused || !piece ) return;

      const newPos = { ...pos, y: pos.y + 1 };
      
      if (checkCollision(piece, newPos, brd)) {
        mergePiece();
      } else {
        setPosition(newPos);
      }
    }, speed);
  }, [checkCollision, mergePiece, speed]);


  /**
   * Arrête le timer
   */
  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Redémarre le timer quand la vitesse change
   */
  useEffect(() => {
    if (!gameOver) {
      startTimer();
    }
    
    return () => stopTimer();
  }, [startTimer, gameOver]);


  /**
   * Gère les inputs clavier
   */
  useEffect(() => {
    const handleKeyDown = async (e : KeyboardEvent) => {
      const { currentPiece: piece, position: pos, board: brd, gameOver: over } = stateRef.current;
      
      if (over || !piece) return;

      let newPos = { ...pos };
      let newPiece = piece;

      switch (e.key) {
        case 'ArrowLeft':
          if (await onInput())
            newPos.x -= 1;
          break;
        case 'ArrowRight':
          if (await onInput())
            newPos.x += 1;
          break;
        case 'ArrowDown':
          if (await onInput())
            newPos.y += 1;
          break;
        case 'ArrowUp':
          if (await onInput())
            newPiece = {
              ...piece,
              shape: rotate(piece.shape),
            };
          break;
        case ' ':
          if (await onInput()) {
            while (!checkCollision(newPiece, { ...newPos, y: newPos.y + 1 }, brd))
              newPos.y += 1;
          }
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
  const rotate = (matrix : number[][]) => {
    const N = matrix.length;
    const rotated = Array(N).fill(null).map(() => Array(N).fill(0)) as number[][];
    
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        rotated[x]![N - 1 - y] = matrix[y]![x]! ;
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
        for (let x = 0; x < currentPiece.shape[y]!.length; x++) {
          if (currentPiece.shape[y]![x]) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              visual[boardY]![boardX] = currentPiece.type as CellValue;
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
                  backgroundColor: cell ? COLORS[String(cell)] : 'transparent',
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

