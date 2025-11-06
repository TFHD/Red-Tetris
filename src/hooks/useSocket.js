import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

//TODO: Y'a pleins de route ici qui servent pas a grand chose mais qu'on pourra utiliser plus tard



/**
 * Hook pour gérer Socket.IO dans React
 * @param {string} url - URL du serveur Socket.IO
 * @param {object} handlers - Handlers pour les événements
 * @returns {Socket} - Instance du socket
 */
export function useSocket(url, handlers = {}) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      handlers.onConnect?.(socketInstance);
    });

    socketInstance.on('disconnect', (reason) => {
      handlers.onDisconnect?.(reason);
    });

    socketInstance.on('connect_error', (error) => {
      handlers.onError?.(error);
    });

    socketInstance.on('room_update', (data) => {
      handlers.onRoomUpdate?.(data);
    });

    socketInstance.on('player_joined', (data) => {
      handlers.onPlayerJoined?.(data);
    });

    socketInstance.on('player_left', (data) => {
      handlers.onPlayerLeft?.(data);
    });

    socketInstance.on('game_started', (data) => {
      handlers.onGameStarted?.(data);
    });

    socketInstance.on('opponent_input', (data) => {
      handlers.onOpponentInput?.(data);
    });

    socketInstance.on('opponent_state', (data) => {
      handlers.onOpponentState?.(data);
    });

    socketInstance.on('receive_penalty', (data) => {
      handlers.onReceivePenalty?.(data);
    });

    socketInstance.on('game_over', (data) => {
      handlers.onGameOver?.(data);
    });
    //pour avoir un message dans le serveur mais ca marche pas
    socketInstance.on('host_assigned', (data) => {
      handlers.onHostAssigned?.(data);
    });

    setSocket(socketInstance);

    return () => {
      console.log('🔌 Closing socket connection');
      socketInstance.close();
    };
  }, [url]);

  return socket;
}
