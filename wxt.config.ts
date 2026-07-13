import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'Twitter無限スクロール防止拡張機能',
    description: 'Xのタイムラインスクロールに摩擦を与えて、無限スクロールを自然に止めるきっかけを作る拡張機能',
    permissions: ['storage', 'alarms'],
    host_permissions: ['*://x.com/*', '*://twitter.com/*'],
    // default_popup を設定しないことで action.onClicked を発火させ、
    // ツールバーアイコンのワンクリックで設定画面を開けるようにする（background.ts参照）
    action: {
      default_title: 'Twitter無限スクロール防止拡張機能 - 設定を開く',
    },
  },
});
