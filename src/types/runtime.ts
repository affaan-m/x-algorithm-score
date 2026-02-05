import type { ExtensionSettings, ReachPrediction } from './index';

export type ScoreLogEntry = {
  id: string;
  tweetId?: string;
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  predictedReach: ReachPrediction;
  timestamp: number;
  // Enhanced context
  hasMedia?: boolean;
  mediaType?: 'image' | 'video' | 'gif' | 'poll';
  externalLinks?: number;
  hashtags?: number;
  mentions?: number;
  length?: number;
  isThread?: boolean;
  isReply?: boolean;
  // Tracking metadata
  source?: 'popup' | 'x_composer' | 'timeline';
  status?: 'draft' | 'posted';
  createdAt?: number;
  postedAt?: number;
  tweetPreview?: string;
  aiOverallInsight?: string;
  aiOriginalityScore?: number;
  aiAudienceAlignmentScore?: number;
};

export type RuntimeMessageMap = {
  GET_SETTINGS: { payload: never; response: ExtensionSettings };
  SAVE_SETTINGS: { payload: ExtensionSettings; response: { success: true } };
  LOG_SCORE: { payload: Omit<ScoreLogEntry, 'id'>; response: { success: true; id: string } };
  UPDATE_HISTORY_ENTRY: { payload: { id: string; updates: Partial<ScoreLogEntry> }; response: { success: true } };
  COMPOSER_DETECTED: { payload: never; response: { success: true } };
  CLEAR_HISTORY: { payload: never; response: { success: true } };
  EXPORT_HISTORY: { payload: never; response: { data: ScoreLogEntry[] } };
};

export type RuntimeMessageType = keyof RuntimeMessageMap;

export type RuntimeMessage<T extends RuntimeMessageType = RuntimeMessageType> =
  RuntimeMessageMap[T]['payload'] extends never
    ? { type: T }
    : { type: T; payload: RuntimeMessageMap[T]['payload'] };

export type RuntimeResponse<T extends RuntimeMessageType> = RuntimeMessageMap[T]['response'];

