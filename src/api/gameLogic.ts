import { Player, GameState, Room } from '../types';

/**
 * Crée ou retourne une room existante
 */
export function ensureRoom(roomId: string, rooms: Map<string, Room>): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      players: new Map(),
      seed: Date.now(),
      started: false
    });
  }
  return rooms.get(roomId) as Room;
}

/**
 * Valide l'état du jeu pour éviter la triche (Game Logic serveur)
 * @param player - État actuel du joueur
 * @param newState - Nouvel état à valider
 * @returns true si l'état est valide, false sinon
 */
export function validateGameState(
  player: Player,
  newState: GameState & { score?: number; lines?: number; gameOver?: boolean }
): boolean {
  if (newState.score !== undefined && newState.score < player.score) {
    console.warn(`Invalid score: ${newState.score} < ${player.score}`);
    return false;
  }

  if (newState.lines !== undefined && newState.lines < player.lines) {
    console.warn(`Invalid lines: ${newState.lines} < ${player.lines}`);
    return false;
  }

  if (newState.score !== undefined && newState.lines !== undefined) {
    const maxPossibleScore = newState.lines * 800;
    if (newState.score > maxPossibleScore) {
      console.warn(`Score too high: ${newState.score} > ${maxPossibleScore}`);
      return false;
    }
  }

  if (player.gameOver && newState.gameOver === false) {
    console.warn(`Cannot un-gameover`);
    return false;
  }

  return true;
}

