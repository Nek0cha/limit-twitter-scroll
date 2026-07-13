import { TollScrollOverlay } from '@/components/overlay';
import { ScrollLock } from '@/lib/scroll-lock';
import {
  getSessionState,
  getSettings,
  setSessionState,
  type TollScrollSessionState,
  type TollScrollSettings,
} from '@/lib/storage';
import {
  createInitialSessionState,
  getGaugeColor,
  getGaugeRatio,
  isGaugeFull,
  nextStateOnContinue,
} from '@/lib/threshold';

// ホームタイムラインのみを対象とする（通知欄など他ページは対象外）
const TARGET_PATHS = new Set(['/', '/home']);
const PERSIST_DEBOUNCE_MS = 400;
const URL_POLL_INTERVAL_MS = 1000;

export default defineContentScript({
  matches: ['*://x.com/*', '*://twitter.com/*'],
  runAt: 'document_idle',
  main() {
    new TollScrollController();
  },
});

class TollScrollController {
  private overlay: TollScrollOverlay | null = null;
  private scrollLock = new ScrollLock();
  private settings: TollScrollSettings | null = null;
  private state: TollScrollSessionState | null = null;
  private lastScrollTopByTarget = new WeakMap<EventTarget, number>();
  private pendingDelta = 0;
  private rafScheduled = false;
  private persistTimer: number | null = null;
  private dialogOpen = false;
  private cancelled = false;
  private active = false;
  private currentPath = '';

  constructor() {
    void this.handleUrlChange();
    window.setInterval(() => void this.handleUrlChange(), URL_POLL_INTERVAL_MS);
  }

  private async handleUrlChange(): Promise<void> {
    const path = location.pathname;
    if (path === this.currentPath) return;
    this.currentPath = path;

    if (TARGET_PATHS.has(path)) {
      if (!this.active) await this.activate();
    } else if (this.active) {
      this.deactivate();
    }
  }

  private async activate(): Promise<void> {
    this.active = true;
    this.cancelled = false;
    // SPA再訪問時、前回セッションの scrollTop を引きずらないようにする
    this.lastScrollTopByTarget = new WeakMap();

    this.settings = await getSettings();
    const existing = await getSessionState();
    this.state = existing ?? createInitialSessionState(this.settings, Date.now());
    await setSessionState(this.state);

    this.overlay = new TollScrollOverlay();
    this.renderGauge();

    document.addEventListener('scroll', this.onScrollEvent, { capture: true, passive: true });
  }

  private deactivate(): void {
    this.active = false;
    // 確認ダイアログ待ちで固まっていた場合に備え、待機中の Promise を強制解決してからロックを解く
    this.cancelled = true;
    this.overlay?.cancelPending();
    this.scrollLock.unlock();
    this.dialogOpen = false;

    document.removeEventListener('scroll', this.onScrollEvent, true);
    if (this.persistTimer !== null) {
      window.clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    this.overlay?.destroy();
    this.overlay = null;
  }

  private onScrollEvent = (event: Event): void => {
    if (!this.active || this.dialogOpen) return;
    const target: EventTarget = event.target === document ? window : (event.target as EventTarget);
    const current = this.getScrollTop(target);
    const last = this.lastScrollTopByTarget.get(target) ?? current;
    const delta = current - last;
    this.lastScrollTopByTarget.set(target, current);

    if (delta > 0) {
      this.pendingDelta += delta;
      this.scheduleFlush();
    }
  };

  private getScrollTop(target: EventTarget): number {
    if (target === window) {
      return window.scrollY || document.documentElement.scrollTop;
    }
    return (target as HTMLElement).scrollTop;
  }

  private scheduleFlush(): void {
    if (this.rafScheduled) return;
    this.rafScheduled = true;
    requestAnimationFrame(() => {
      this.rafScheduled = false;
      this.applyPendingDelta();
    });
  }

  private applyPendingDelta(): void {
    if (!this.state || !this.settings || this.pendingDelta <= 0) return;
    const delta = this.pendingDelta;
    this.pendingDelta = 0;

    this.state = { ...this.state, accumulatedScroll: this.state.accumulatedScroll + delta };
    this.renderGauge();
    this.schedulePersist();

    if (isGaugeFull(this.state)) {
      void this.handleGaugeFull();
    }
  }

  private renderGauge(): void {
    if (!this.overlay || !this.state) return;
    const ratio = getGaugeRatio(this.state);
    this.overlay.updateGauge(ratio, getGaugeColor(ratio));
  }

  private schedulePersist(): void {
    if (this.persistTimer !== null) return;
    this.persistTimer = window.setTimeout(() => {
      this.persistTimer = null;
      if (this.state) void setSessionState(this.state);
    }, PERSIST_DEBOUNCE_MS);
  }

  private async handleGaugeFull(): Promise<void> {
    if (this.dialogOpen || !this.overlay || !this.state || !this.settings) return;
    this.dialogOpen = true;
    this.scrollLock.lock();

    const choice = await this.overlay.showConfirm();
    if (this.cancelled) return;

    if (choice === 'continue') {
      this.state = nextStateOnContinue(this.state, this.settings);
      this.overlay.hide();
      this.scrollLock.unlock();
    } else {
      this.state = { ...this.state, accumulatedScroll: 0 };
      if (this.settings.blurOnStop) {
        await this.overlay.showStopped();
        if (this.cancelled) return;
      }
      this.overlay.hide();
      this.scrollLock.unlock();
    }

    await setSessionState(this.state);
    if (this.cancelled) return;
    this.renderGauge();
    this.dialogOpen = false;
  }
}
