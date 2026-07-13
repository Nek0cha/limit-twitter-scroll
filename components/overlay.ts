const HOST_ID = 'toll-scroll-overlay-host';

const STYLE = `
  :host {
    all: initial;
  }
  .gauge-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(0, 0, 0, 0.08);
    z-index: 2147483646;
    pointer-events: none;
  }
  .gauge-fill {
    height: 100%;
    width: 0%;
    background: #4caf50;
    transition: width 120ms linear, background-color 300ms ease;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 20, 25, 0.55);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    opacity: 0;
    pointer-events: none;
    z-index: 2147483647;
    transition: opacity 200ms ease;
  }
  .backdrop.visible {
    opacity: 1;
    pointer-events: auto;
  }
  .card {
    width: min(320px, 84vw);
    padding: 24px 20px;
    border-radius: 16px;
    background: #fff;
    color: #0f1419;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
    transform: scale(0.95);
    transition: transform 200ms ease;
  }
  .backdrop.visible .card {
    transform: scale(1);
  }
  .message {
    margin: 0 0 4px;
    font-size: 17px;
    font-weight: 700;
  }
  .submessage {
    margin: 0 0 18px;
    font-size: 13px;
    color: #536471;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  button {
    border: none;
    border-radius: 999px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }
  .btn-continue {
    background: #1d9bf0;
    color: #fff;
  }
  .btn-stop {
    background: #eff3f4;
    color: #0f1419;
  }
  .btn-unblur {
    background: #1d9bf0;
    color: #fff;
  }
`;

const TEMPLATE = `
  <div class="gauge-bar"><div class="gauge-fill"></div></div>
  <div class="backdrop">
    <div class="card">
      <div class="section-confirm">
        <p class="message">まだ見る？</p>
        <p class="submessage">スクロール量が今日の通行料を超えました</p>
        <div class="actions">
          <button type="button" class="btn-continue">続ける</button>
          <button type="button" class="btn-stop">休憩する</button>
        </div>
      </div>
      <div class="section-stopped" hidden>
        <p class="message">ひと休み中</p>
        <p class="submessage">解除するまでタイムラインは見られません</p>
        <div class="actions">
          <button type="button" class="btn-unblur">休憩を終える</button>
        </div>
      </div>
    </div>
  </div>
`;

export type ConfirmChoice = 'continue' | 'stop';

export class TollScrollOverlay {
  private shadow: ShadowRoot;
  private gaugeFill: HTMLElement;
  private backdrop: HTMLElement;
  private confirmSection: HTMLElement;
  private stoppedSection: HTMLElement;
  private continueBtn: HTMLButtonElement;
  private stopBtn: HTMLButtonElement;
  private unblurBtn: HTMLButtonElement;

  private pendingConfirmResolve: ((choice: ConfirmChoice) => void) | null = null;
  private pendingUnblurResolve: (() => void) | null = null;

  constructor() {
    document.getElementById(HOST_ID)?.remove();

    const host = document.createElement('div');
    host.id = HOST_ID;
    document.documentElement.appendChild(host);

    this.shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = STYLE;
    this.shadow.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = TEMPLATE;
    this.shadow.appendChild(wrapper);

    this.gaugeFill = this.shadow.querySelector('.gauge-fill')!;
    this.backdrop = this.shadow.querySelector('.backdrop')!;
    this.confirmSection = this.shadow.querySelector('.section-confirm')!;
    this.stoppedSection = this.shadow.querySelector('.section-stopped')!;
    this.continueBtn = this.shadow.querySelector('.btn-continue')!;
    this.stopBtn = this.shadow.querySelector('.btn-stop')!;
    this.unblurBtn = this.shadow.querySelector('.btn-unblur')!;

    this.continueBtn.addEventListener('click', () => this.resolveConfirm('continue'));
    this.stopBtn.addEventListener('click', () => this.resolveConfirm('stop'));
    this.unblurBtn.addEventListener('click', () => this.resolveUnblur());
  }

  updateGauge(ratio: number, color: string): void {
    this.gaugeFill.style.width = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
    this.gaugeFill.style.backgroundColor = color;
  }

  /** 満タン確認カードを表示し、ユーザーの選択を待つ */
  showConfirm(): Promise<ConfirmChoice> {
    this.confirmSection.hidden = false;
    this.stoppedSection.hidden = true;
    this.backdrop.classList.add('visible');
    return new Promise((resolve) => {
      this.pendingConfirmResolve = resolve;
    });
  }

  /** 「休憩する」選択後、解除ボタンのみのカードに切り替えて待つ */
  showStopped(): Promise<void> {
    this.confirmSection.hidden = true;
    this.stoppedSection.hidden = false;
    this.backdrop.classList.add('visible');
    return new Promise((resolve) => {
      this.pendingUnblurResolve = resolve;
    });
  }

  hide(): void {
    this.backdrop.classList.remove('visible');
  }

  /** ページ遷移などで待機中の Promise を強制的に解決し、リークを防ぐ */
  cancelPending(): void {
    this.resolveConfirm('stop');
    this.resolveUnblur();
    this.hide();
  }

  private resolveConfirm(choice: ConfirmChoice): void {
    this.pendingConfirmResolve?.(choice);
    this.pendingConfirmResolve = null;
  }

  private resolveUnblur(): void {
    this.pendingUnblurResolve?.();
    this.pendingUnblurResolve = null;
  }

  destroy(): void {
    this.cancelPending();
    document.getElementById(HOST_ID)?.remove();
  }
}
