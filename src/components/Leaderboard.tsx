import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io';
import { ScoreEntry } from '../types.js';

interface LeaderboardProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap> | null;
}

/**
 * Composant Leaderboard - Affiche le top 10 des meilleurs scores
 */
function Leaderboard({ socket }: LeaderboardProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    const fetchLeaderboard = async () => {
      try {
        const response = await socket.emitWithAck('get_leaderboard', { limit: 10 });
        setScores(response.scores || []);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    socket.on('leaderboard_update', (data: { scores: ScoreEntry[] }) => {
      setScores(data.scores);
    });

    return () => {
      socket.off('leaderboard_update');
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="leaderboard">
        <h2>🏆 Leaderboard</h2>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h2>🏆 Top 10</h2>
      {scores.length === 0 ? (
        <p className="no-scores">Aucun score enregistré</p>
      ) : (
        <div className="leaderboard-list">
          {scores.map((entry, index) => (
            <div key={index} className={`leaderboard-entry ${index < 3 ? 'top-three' : ''}`}>
              <div className="rank">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `#${index + 1}`}
              </div>
              <div className="player-name">{entry.name}</div>
              <div className="score-info">
                <span className="score">{entry.score.toLocaleString()} pts</span>
                <span className="lines">{entry.lines} lignes</span>
              </div>
              <div className="date">{new Date(entry.date).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;

