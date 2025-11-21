import { COLORS } from '../utils/tetris.js';
import { CellValue } from '../types.js';

function OpponentBoard({ board } : { board : CellValue[][] }) {
  if (!board || !Array.isArray(board)) {
    return (
      <div className="opponent-placeholder">
        <p className="opponent-text">En attente de données...</p>
      </div>
    );
  }

  return (
    <div className="opponent-grid">
      {board.map((row : CellValue[], y : number) => (
        <div key={y} className="opponent-row">
          {row.map((cell : CellValue, x : number) => (
            <div
              key={`${y}-${x}`}
              className={`opponent-cell ${cell ? 'filled' : 'empty'}`}
              style={{
                backgroundColor: cell ? COLORS[String(cell)] : 'transparent',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default OpponentBoard;

