# valid-pstack

[pstack](https://github.com/michael-denyer/pstack-claude) の有用性を検証するためのリポジトリ。題材として TODO アプリを作っている。

## TODO アプリ

依存なしの静的 Web アプリ。状態は `localStorage` に保存する。

- 追加 (Enter)、完了切り替え、すべて完了/未完了
- ダブルクリックで編集 (Enter で確定、Esc で取り消し、空にすると削除)
- フィルタ (すべて / 未完了 / 完了)、完了済みの一括削除

```sh
npm start          # http://localhost:8000
npm test           # reducer の単体テスト (node --test)
npm install && npm run test:e2e   # Chromium での E2E 検証
```

`src/todos.js` が状態とアクションの reducer、`src/app.js` が DOM の描画とイベント配線を持つ。
