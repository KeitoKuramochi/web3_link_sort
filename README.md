# Web3AI リンクまとめハブ

授業内で共有されたデモ・教材・参考リンクなどを整理し、各授業回ごとに見返しやすいようにした「リンクまとめハブ」です。
Next.js (App Router) + TypeScript で構築されており、Vercel 等へ簡単にデプロイできます。

## 目的

授業内のチャット等で共有されるリンクが多く、後から探しにくくなる課題を解決するため。
- 各回の重要リンク（ハンズオン教材など）を上部に表示
- クリック数をカウントし、人気のリンクを可視化（現在は `localStorage` 使用）
- 検索・カテゴリ絞り込み機能の提供

## ローカルでの起動方法

このプロジェクトは Next.js で作成されています。

```bash
# パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスすると確認できます。

## Vercelへのデプロイ方法

1. GitHub リポジトリにコードを Push します。
2. Vercel (https://vercel.com) にログインし、「Add New...」 > 「Project」を選択します。
3. 対象のリポジトリを Import します。
4. フレームワークプリセットが `Next.js` になっていることを確認し、「Deploy」をクリックします。
特別な環境変数の設定等は不要です。

## 第7回以降のリンクを追加する方法

新しい授業回のリンクまとめページを追加するには、`src/data/lessons.ts` を編集します。

`lessons` 配列の末尾に、新しい `Lesson` オブジェクトを追加するだけで、自動的にトップページにカードが追加され、詳細ページも生成されます。

### 追加するデータの例

```typescript
export const lessons: Lesson[] = [
  // ... 既存の授業回 ...
  {
    lessonId: "7",
    title: "第7回：〇〇の基礎と応用",
    description: "第7回授業内で共有された〇〇関連の教材・リンク一覧",
    links: [
      {
        id: "link-7-1",
        order: 1,
        sharer: "user_name",
        title: "教材タイトル",
        url: "https://example.com",
        category: "ハンズオン教材",
        tags: ["タグ1", "タグ2"],
        summary: "リンクの簡単な説明",
        lessonContext: "授業内での位置づけ",
        isCore: true,
        isDuplicate: false,
      },
      // ... その他のリンク ...
    ]
  }
];
```

## クリック数と人気ランキングについて

現在、リンクのクリック数は簡易的にブラウザの `localStorage` に保存・管理しています。
そのため、表示される「人気」バッジやクリック数は、アクセスしているユーザーごとの端末内のカウントであり、全員の合計値ではありません。

将来的に、全ユーザー共通のランキングを表示したい場合は、Supabase などのデータベースにクリック数保存処理を移行することを想定しています。
移行の際は、`src/lib/linkStats.ts` 内の `getLinkClicks()` と `incrementLinkClick()` 関数の中身を、DBへのAPIリクエストに書き換えるだけで済むように設計されています。
