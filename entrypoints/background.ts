import { clearSessionState, getLastResetAt, setLastResetAt } from '@/lib/storage';
import { isNewDay } from '@/lib/threshold';

export default defineBackground(() => {
  // content script から browser.storage.session を読み書きできるようにする
  browser.storage.session
    .setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' })
    .catch((error) => console.error('[toll-scroll] setAccessLevel failed', error));

  // ツールバーアイコンをワンクリックで設定画面に直行させる（default_popup は設定しない）
  browser.action.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
  });

  void checkAndResetIfNewDay();

  browser.alarms.create('toll-scroll-daily-check', { periodInMinutes: 30 });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'toll-scroll-daily-check') {
      void checkAndResetIfNewDay();
    }
  });
});

async function checkAndResetIfNewDay(): Promise<void> {
  const now = Date.now();
  const lastResetAt = await getLastResetAt();
  if (isNewDay(lastResetAt, now)) {
    await clearSessionState();
    await setLastResetAt(now);
  }
}
