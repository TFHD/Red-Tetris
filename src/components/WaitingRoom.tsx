import { Player } from "../types";

function WaitingRoom({
  roomId,
  playerName,
  players,
  onStartGame,
} : {
  roomId : string,
  playerName : string,
  players : Player[],
  onStartGame : () => void,
}) {
  const canStart = players.length >= 1;


  const currentPlayer = players.find(p => p.name === playerName);
  const isHost = currentPlayer?.role === 'host';
  
  return (
    <div className="waiting-room">
      <div className="waiting-card">
        <h2>⏳ Salle d'attente</h2>
        
        <div className="room-details">
          <p><strong>Room :</strong> {roomId}</p>
          <p><strong>Votre pseudo :</strong> {playerName}</p>
        </div>

        <div className="players-list">
          <h3>Joueurs ({players.length}/2) :</h3>
          {players.length === 0 ? (
            <p className="text-muted">En attente de joueurs...</p>
          ) : (
            <ul>
              {players.map((player) => (
                <li key={player.id} className={player.name === playerName ? 'current-player' : ''}>
                  {player.name === playerName ? '👤 (Vous) ' : '👤 '}
                  {player.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {players.length < 2 && (
          <div className="share-link">
            <p>Partagez ce lien à votre adversaire :</p>
            <div className="link-box">
              <code>{window.location.origin}/{roomId}/[pseudo]</code>
            </div>
            <p className="text-small">Remplacez <code>[pseudo]</code> par le pseudo de votre adversaire</p>
          </div>
        )}

        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className="btn btn-success"
          >
            Démarrer la partie
          </button>
        ) : (
          <div className="waiting-message">
            <p>⏳ En attente que le host démarre la partie...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WaitingRoom;

