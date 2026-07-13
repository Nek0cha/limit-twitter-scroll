# 通行料スクロール

Twitter(X)のタイムライン向けのChrome拡張機能です。

現在、スクロールに摩擦を与える機能は不具合が多かったため一旦削除しており、拡張機能としては最小構成の状態です（今後別の方向性で作り直す予定）。

## 技術構成

- [WXT](https://wxt.dev/)（TypeScript / Manifest V3）

## 開発

Node.js が必要です。

```bash
npm install
npm run dev      # 開発モード（HMR付き）
npm run build    # 本番ビルド（.output/chrome-mv3 に出力）
npm run compile  # 型チェックのみ
```

## インストール方法（Releaseからパッケージ化されていない拡張機能として読み込む）

Chrome Web Storeには公開していないため、[Releases](../../releases) から配布用のzipをダウンロードして読み込んでください。Chromium系ブラウザ（Chrome、Edge、Braveなど）であれば動作します。

1. [Releases](../../releases) ページから最新の `.zip` をダウンロードし、任意のフォルダに解凍する
2. ブラウザで拡張機能の管理ページを開く（Chromeなら `chrome://extensions`、Edgeなら `edge://extensions`）
3. 右上の「デベロッパーモード」をONにする
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、手順1で解凍したフォルダ（`chrome-mv3` フォルダ自体）を選択する
5. 拡張機能一覧に「通行料スクロール」が表示されれば完了

コードを変更しながら試したい場合は、`npm run build` で生成される `.output/chrome-mv3` フォルダを同様に読み込んでください（`npm run dev` を使うと変更が自動的に反映されます）。

## ライセンス

[MIT](LICENSE)
