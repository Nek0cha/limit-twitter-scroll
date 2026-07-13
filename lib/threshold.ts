import type { TollScrollSessionState, TollScrollSettings } from './storage';

export function createInitialSessionState(
  settings: TollScrollSettings,
  now: number,
): TollScrollSessionState {
  return {
    accumulatedScroll: 0,
    currentThreshold: settings.baseThreshold,
    sessionStartedAt: now,
  };
}

export function isGaugeFull(state: TollScrollSessionState): boolean {
  return state.accumulatedScroll >= state.currentThreshold;
}

/** 0〜1のゲージ充填率 */
export function getGaugeRatio(state: TollScrollSessionState): number {
  if (state.currentThreshold <= 0) return 1;
  return Math.min(1, state.accumulatedScroll / state.currentThreshold);
}

/** 緑→黄→赤 */
export function getGaugeColor(ratio: number): string {
  if (ratio < 0.5) return '#4caf50';
  if (ratio < 0.85) return '#ffc107';
  return '#f44336';
}

/** 「続ける」を選ぶたびに満タンとみなす閾値が下がっていく際の下限（px） */
const MIN_THRESHOLD = 200;

/** 「続ける」選択時: ゲージをリセットし、次の閾値を引き下げる（スクロールが徐々に重くなる） */
export function nextStateOnContinue(
  state: TollScrollSessionState,
  settings: TollScrollSettings,
): TollScrollSessionState {
  return {
    ...state,
    accumulatedScroll: 0,
    currentThreshold: Math.max(
      MIN_THRESHOLD,
      Math.round(state.currentThreshold * (1 - settings.incrementRate)),
    ),
  };
}

/** 日付（ローカルタイム基準）が変わっていればリセットが必要 */
export function isNewDay(lastResetAt: number | null, now: number): boolean {
  if (lastResetAt === null) return true;
  const last = new Date(lastResetAt);
  const current = new Date(now);
  return (
    last.getFullYear() !== current.getFullYear() ||
    last.getMonth() !== current.getMonth() ||
    last.getDate() !== current.getDate()
  );
}
