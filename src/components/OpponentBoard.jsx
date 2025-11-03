const COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
  0: 'transparent',
};

function OpponentBoard({ board }) {
  if (!board || !Array.isArray(board)) {
    return (
      <div className="opponent-placeholder">
        <p className="opponent-text">En attente de données...</p>
      </div>
    );
  }

  return (
    <div className="opponent-grid">
      {board.map((row, y) => (
        <div key={y} className="opponent-row">
          {row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              className={`opponent-cell ${cell ? 'filled' : 'empty'}`}
              style={{
                backgroundColor: cell ? COLORS[cell] : 'transparent',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default OpponentBoard;

