import { Socket } from "socket.io-client";

export type CellValue = 0 | 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L' | 'G';

export interface Position {
    x: number;
    y: number;
}

export interface Piece {
    type: string;
    shape: number[][];
    color: string;
}

export interface GameState {
    board: CellValue[][];
}

export interface Player {
    id: string;
    name: string;
    score: number;
    gameOver: boolean;
    lines: number;
    role: 'host' | 'guest';
    lastState: GameState | null;
}

export interface Room {
    players: Map<string, Player>;
    seed: number;
    started: boolean;
}

export interface SocketHandlers {
    onConnect?: (socket: Socket) => void;
    onDisconnect?: (reason: string) => void;
    onError?: (error: Error) => void;
    onRoomUpdate?: (data: any) => void;
    onPlayerJoined?: (data: any) => void;
    onPlayerLeft?: (data: any) => void;
    onGameStarted?: (data: any) => void;
    onOpponentState?: (data: any) => void;
    onReceivePenalty?: (data: any) => void;
    onGameOver?: (data: any) => void;
    onHostAssigned?: (data: any) => void;
}

/**
 * Requests & Responses
 */

export interface JoinResponse {
    ok: boolean;
    roomId: string;
    reason?: string;
    seed?: number;
}

export interface JoinRequest {
    roomId: string;
    name: string;
}

export interface InputRequest {
    roomId: string;
}

export interface InputResponse {
    ok: boolean;
    reason?: string;
}

export interface SyncStateRequest {
    roomId: string;
    state: GameState & { score?: number, lines?: number, gameOver?: boolean };
}

export interface SyncStateResponse {
    ok: boolean;
    reason?: string;
}