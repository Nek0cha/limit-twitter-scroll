/**
 * chrome.storage ラッパー
 * - settings / lastResetAt: chrome.storage.local に永続化（日次リセット判定用）
 * - sessionState: chrome.storage.session に保持（ブラウザセッション内のみ）
 *
 * chrome.storage.session はデフォルトで拡張ページ/background からしかアクセスできないため、
 * background 側で setAccessLevel(TRUSTED_AND_UNTRUSTED_CONTEXTS) を呼び、
 * content script からも読み書きできるようにしている（background.ts 参照）。
 */

export interface TollScrollSettings {
  /** 初期閾値（スクロールpx換算） */
  baseThreshold: number;
  /** 「続ける」を選んだ際の閾値減少率（0.2 = 20%） */
  incrementRate: number;
  /** 「休憩する」選択時にタイムラインをぼかすか */
  blurOnStop: boolean;
}

export interface TollScrollSessionState {
  accumulatedScroll: number;
  currentThreshold: number;
  sessionStartedAt: number;
}

export const DEFAULT_SETTINGS: TollScrollSettings = {
  baseThreshold: 8000,
  incrementRate: 0.2,
  blurOnStop: true,
};

const SETTINGS_KEY = 'tollScrollSettings';
const SESSION_STATE_KEY = 'tollScrollSessionState';
const LAST_RESET_KEY = 'tollScrollLastResetAt';

export async function getSettings(): Promise<TollScrollSettings> {
  const result = await browser.storage.local.get(SETTINGS_KEY);
  const stored = result[SETTINGS_KEY] as Partial<TollScrollSettings> | undefined;
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function setSettings(settings: Partial<TollScrollSettings>): Promise<void> {
  const current = await getSettings();
  await browser.storage.local.set({ [SETTINGS_KEY]: { ...current, ...settings } });
}

export async function getSessionState(): Promise<TollScrollSessionState | null> {
  const result = await browser.storage.session.get(SESSION_STATE_KEY);
  return (result[SESSION_STATE_KEY] as TollScrollSessionState | undefined) ?? null;
}

export async function setSessionState(state: TollScrollSessionState): Promise<void> {
  await browser.storage.session.set({ [SESSION_STATE_KEY]: state });
}

export async function clearSessionState(): Promise<void> {
  await browser.storage.session.remove(SESSION_STATE_KEY);
}

export async function getLastResetAt(): Promise<number | null> {
  const result = await browser.storage.local.get(LAST_RESET_KEY);
  return (result[LAST_RESET_KEY] as number | undefined) ?? null;
}

export async function setLastResetAt(timestamp: number): Promise<void> {
  await browser.storage.local.set({ [LAST_RESET_KEY]: timestamp });
}
