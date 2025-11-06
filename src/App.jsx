import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import Game from './components/Game';
import WaitingRoom from './components/WaitingRoom';

function App() {
  const [gameState, setGameState] = useState('connecting'); // 'connecting' | 'waiting' | 'playing' | 'error'
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [seed, setSeed] = useState(null);
  const [error, setError] = useState('');

  // Parser l'URL : /:room/:playerName
  useEffect(() => {
    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p);
    
    if (parts.length >= 2) {
      const [room, name] = parts;
      setRoomId(decodeURIComponent(room));
      setPlayerName(decodeURIComponent(name));
      setGameState('connecting');
    } else if (parts.length === 0) {
      setGameState('home');
    } else {
      setError('URL invalide. Format: http://localhost:3001/<room>/<player_name>');
      setGameState('error');
    }
  }, []);

  const [socketConnected, setSocketConnected] = useState(false);

  const socket = useSocket('http://localhost:3000', {
    onConnect: () => {
      console.log('Socket connected!');
      setSocketConnected(true);
    },
    onDisconnect: () => {
      console.log('Socket disconnected!');
      setSocketConnected(false);
    },
    onRoomUpdate: (data) => {
      console.log('Room update:', data);
      setPlayers(data.players);
    },
    onGameStarted: (data) => {
      console.log('Game started with seed:', data.seed);
      setSeed(data.seed);
      setGameState('playing');
    },
    onPlayerJoined: (player) => {
      console.log('Player joined:', player);
    },
    onPlayerLeft: (player) => {
      console.log('Player left:', player);
    },
    //pour avoir un message dans le serveur mais ca marche pas
    onHostAssigned: (data) => {
    console.log('New host assigned:', data);

    //TEST: j'ai mis une alerte (utilite je sais pas) juste pour etre sur que mon player2 deviennent bien l'host 
    alert(`👑 ${data.name} est maintenant le host de la room!`);
  },
  });

  useEffect(() => {
    if (socket && socketConnected && roomId && playerName && gameState === 'connecting') {
      console.log('Auto-joining room:', roomId, 'as', playerName);
      socket.emit('join', { roomId, name: playerName }, (response) => {
        if (response && response.ok) {
          setSeed(response.seed);
          setGameState('waiting');
          console.log('Successfully joined room:', roomId);
        } else {
          setError(`Impossible de rejoindre: ${response?.reason || 'unknown error'}`);
          setGameState('error');
        }
      });
    }
  }, [socket, socketConnected, roomId, playerName, gameState]);

  const handleStartGame = () => {
    if (socket) {
      socket.emit('start_game', { roomId });
    }
  };

  if (gameState === 'home') {
    return (
      <div className="app">
        <header>
          <h1>🎮 Red Tetris</h1>
        </header>
        <main>
          <div className="home-screen">
            <h2>Bienvenue sur Red Tetris !</h2>
            <p>Pour rejoindre une partie, utilisez l'URL suivante :</p>
            <div className="url-format">
              <code>http://localhost:3001/&lt;room&gt;/&lt;player_name&gt;</code>
            </div>
            <h3>📖 Exemples :</h3>
            <ul className="examples-list">
              <li>
                <a href="/room1/sabartho">http://localhost:3001/room1/sabartho</a>
                <span> → Rejoindre "room1" en tant que "sabartho"</span>
              </li>
              <li>
                <a href="/tetris42/aauberti">http://localhost:3001/tetris42/aauberti</a>
                <span> → Rejoindre "tetris42" en tant que "aauberti"</span>
              </li>
            </ul>
            <div className="info-box">
              <p>💡 <strong>Astuce :</strong> Partagez l'URL avec un ami pour jouer ensemble !</p>
              <p>Assurez-vous d'utiliser le <strong>même nom de room</strong> mais des <strong>pseudos différents</strong>.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (gameState === 'error') {
    return (
      <div className="app">
        <header>
          <h1>🎮 Red Tetris</h1>
        </header>
        <main>
          <div className="error-screen">
            <h2>Erreur</h2>
            <p>{error}</p>
            <p>Format attendu : <code>http://localhost:3001/&lt;room&gt;/&lt;player_name&gt;</code></p>
            <p>Exemple : <code>http://localhost:3001/room1/aauberti</code></p>
          </div>
        </main>
      </div>
    );
  }

  if (gameState === 'connecting') {
    return (
      <div className="app">
        <header>
          <h1>🎮 Red Tetris</h1>
        </header>
        <main>
          <div className="loading-screen">
            <h2>🔄 Connexion...</h2>
            <p>Connexion au serveur en cours...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>🎮 Red Tetris</h1>
        {socket && (
          <span className="connection-status">
            {socket.connected ? '🟢 Connecté' : '🔴 Déconnecté'}
          </span>
        )}
      </header>

      <main>
        {gameState === 'waiting' ? (
          <WaitingRoom
            roomId={roomId}
            playerName={playerName}
            players={players}
            onStartGame={handleStartGame}
          />
        ) : (
          <Game
            socket={socket}
            roomId={roomId}
            playerName={playerName}
            players={players}
            seed={seed}
          />
        )}
      </main>
    </div>
  );
}

export default App;

