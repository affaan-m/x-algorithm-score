import type { ExtensionSettings, ReachPrediction } from './index';

export type ScoreLogEntry = {
  tweetId?: string;
  score: number;
  predictedReach: ReachPrediction;
  timestamp: number;
};

export type RuntimeMessageMap = {
  GET_SETTINGS: { payload: never; response: ExtensionSettings };
  SAVE_SETTINGS: { payload: ExtensionSettings; response: { success: true } };
  LOG_SCORE: { payload: ScoreLogEntry; response: { success: true } };
  COMPOSER_DETECTED: { payload: never; response: { success: true } };
};

export type RuntimeMessageType = keyof RuntimeMessageMap;

export type RuntimeMessage<T extends RuntimeMessageType = RuntimeMessageType> =
  RuntimeMessageMap[T]['payload'] extends never
    ? { type: T }
    : { type: T; payload: RuntimeMessageMap[T]['payload'] };

export type RuntimeResponse<T extends RuntimeMessageType> = RuntimeMessageMap[T]['response'];

