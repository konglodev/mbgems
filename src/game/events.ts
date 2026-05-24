import type { Challenge, ScoreResult, Tray } from '../types/game';

export type GameEventMap = {
  trayChanged: Tray;
  challengeChanged: Challenge;
  resultReady: ScoreResult;
  cookPulse: string;
};

type Handler<T> = (payload: T) => void;

class GameEventBus {
  private listeners = new Map<keyof GameEventMap, Set<Handler<any>>>();

  on<K extends keyof GameEventMap>(event: K, handler: Handler<GameEventMap[K]>) {
    const handlers = this.listeners.get(event) ?? new Set();
    handlers.add(handler);
    this.listeners.set(event, handlers);
  }

  off<K extends keyof GameEventMap>(event: K, handler: Handler<GameEventMap[K]>) {
    this.listeners.get(event)?.delete(handler);
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]) {
    this.listeners.get(event)?.forEach((handler) => handler(payload));
  }
}

export const gameEvents = new GameEventBus();
