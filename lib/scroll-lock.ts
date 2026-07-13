const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
  'Spacebar',
]);

/**
 * ホイール/タッチ/キーボードでのスクロールを止める。
 * `overflow: hidden` は使わない —— X はタイムラインを仮想リストで描画しており、
 * overflow変更によるレイアウト変化（スクロールバーの出現/消失）が仮想リストの
 * 再計算を誘発し、スクロール位置がリセットされてしまうため。
 * 代わりに body を `position: fixed` で視覚的に固定し、スクロール位置をそのまま保持する。
 */
export class ScrollLock {
  private locked = false;
  private savedScrollY = 0;

  lock(): void {
    if (this.locked) return;
    this.locked = true;

    this.savedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    window.addEventListener('wheel', this.preventEvent, { passive: false, capture: true });
    window.addEventListener('touchmove', this.preventEvent, { passive: false, capture: true });
    window.addEventListener('keydown', this.preventScrollKey, { capture: true });
  }

  unlock(): void {
    if (!this.locked) return;
    this.locked = false;

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, this.savedScrollY);

    window.removeEventListener('wheel', this.preventEvent, true);
    window.removeEventListener('touchmove', this.preventEvent, true);
    window.removeEventListener('keydown', this.preventScrollKey, true);
  }

  private preventEvent = (event: Event): void => {
    event.preventDefault();
  };

  private preventScrollKey = (event: KeyboardEvent): void => {
    if (SCROLL_KEYS.has(event.key)) {
      event.preventDefault();
    }
  };
}
