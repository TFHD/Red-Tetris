import { PIECES, COLORS } from '../utils/tetris.js';

interface NextPiecesProps {
  nextPieces: string[];
}

function NextPieces({ nextPieces }: NextPiecesProps) {
  return (
    <div className="next-pieces">
      <h3>Prochaines pièces</h3>
      <div className="next-pieces-container">
        {nextPieces.map((pieceType, index) => {
          const shape = PIECES[pieceType];
          const color = COLORS[pieceType];
          
          if (!shape) return null;
          
          return (
            <div key={index} className="next-piece-preview">
              <div className="next-piece-grid">
                {shape.map((row, y) => (
                  <div key={y} className="next-piece-row">
                    {row.map((cell, x) => (
                      <div
                        key={`${y}-${x}`}
                        className={`next-piece-cell ${cell ? 'filled' : 'empty'}`}
                        style={{
                          backgroundColor: cell ? color : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NextPieces;

