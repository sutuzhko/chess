import type {
  AiSide,
  GameMode,
  OpponentType,
  PlayerSide,
} from '@shared/config/game-constants.js';
import {
  GAME_MODE,
  OPPONENT,
  PLAYER_SIDE,
} from '@shared/config/game-constants.js';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type { AiSide, GameMode, OpponentType, PlayerSide };

export interface TimeControl {
  initialSeconds: number;
  incrementSeconds: number;
}

export interface LobbyConfig {
  mode: GameMode;
  opponent: OpponentType;
  aiLevel: number;
  side: PlayerSide;
  time: TimeControl;
  /** Opening-training only: position the trained game starts from. */
  startFen?: string;
  /** Opening-training only: i18n key of the trained opening, or null. */
  openingName?: string | null;
}

const DEFAULT_CONFIG: LobbyConfig = {
  mode: GAME_MODE.STANDARD,
  opponent: OPPONENT.AI,
  aiLevel: 4,
  side: PLAYER_SIDE.RANDOM,
  time: { initialSeconds: 0, incrementSeconds: 0 },
};

export const useGameStore = defineStore('game', () => {
  const lobbyConfig = ref<LobbyConfig>({ ...DEFAULT_CONFIG });
  const newGamePending = ref(false);

  function setConfig(cfg: Partial<LobbyConfig>): void {
    lobbyConfig.value = { ...lobbyConfig.value, ...cfg };
  }

  function setNewGamePending(v: boolean): void {
    newGamePending.value = v;
  }

  return { lobbyConfig, setConfig, newGamePending, setNewGamePending };
});
