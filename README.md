# Web3AI リンクまとめハブ

授業内で共有されたデモ・教材・参考リンクを整理し、授業回ごとに見返しやすくした「リンクまとめハブ」です。  
Next.js (App Router) + TypeScript + CSS Modules + Supabase で構築されており、Vercel にデプロイ済みです。

---

## プロジェクトの目的

授業チャットで流れていくリンクを後から探しにくい問題を解決するため、  
- 授業回別にリンクを整理・閲覧できる
- クリック数・おすすめ数を全員で共有できる（Supabase）
- キーワード・カテゴリ・投稿者での絞り込み
- タイトルや説明文をその場で編集できる（wiki モード）

---

## ファイル構成と責務

```
src/
├── app/
│   ├── page.tsx          # メインページ（SPA）。授業回タブ・検索・フィルタ・カード一覧
│   ├── page.module.css   # メインページのスタイル
│   ├── layout.tsx        # HTML レイアウト
│   └── globals.css       # グローバルスタイル
├── components/
│   ├── LinkCard.tsx      # リンク1件のカードコンポーネント
│   │                     # クールダウン管理（おすすめ・クリック両方）もここ
│   └── LinkCard.module.css
├── data/
│   └── lessons.ts        # 授業回・リンクデータの定義（ここだけ編集して回を追加）
└── lib/
    └── linkStats.ts      # Supabase との読み書き。未設定時は localStorage にフォールバック
```

---

## Supabase のテーブル構成

環境変数 `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が設定されている場合、Supabase が使われます。未設定なら localStorage にフォールバックします。

### `link_clicks` テーブル

| カラム名         | 型      | 説明                        |
|------------------|---------|-----------------------------|
| link_id          | text    | primary key（リンクのID）   |
| click_count      | integer | クリック数                  |
| recommend_count  | integer | おすすめ数                  |

### `link_details` テーブル

| カラム名  | 型   | 説明                              |
|-----------|------|-----------------------------------|
| link_id   | text | primary key（リンクのID）         |
| title     | text | 編集後のタイトル（上書き用）      |
| summary   | text | 編集後の説明文（上書き用）        |

---

## 環境変数

`.env.local` を作成して以下を設定します（Vercel の場合は Environment Variables に追加）。

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxx
```

---

## クールダウンの仕組み（重要）

クリックとおすすめのカウントは、同一ユーザーが連打しても重複しないよう **3時間のクールダウン** を設けています。クールダウンの記録はすべて **localStorage** で管理しています。

| localStorage キー          | 用途                            |
|-----------------------------|---------------------------------|
| `web3ai_click_cooldown`     | クリックカウントのクールダウン  |
| `web3ai_recommend_cooldown` | おすすめカウントのクールダウン  |

**ポイント：** クールダウン中でもリンクは普通に開けます。Supabase への書き込みだけがスキップされます。  
クールダウンの判定・設定は `LinkCard.tsx` のフロントエンド側が単一の責任を持ちます（`linkStats.ts` 側は判定しません）。

---

## ローカルでの起動

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) で確認できます。Supabase を使う場合は `.env.local` を作成してから起動してください。

---

## Vercel へのデプロイ

1. GitHub にプッシュ
2. Vercel で Import → Next.js を選択して Deploy
3. Vercel の Environment Variables に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を追加

---

## 新しい授業回を追加する方法

`src/data/lessons.ts` の `lessons` 配列の末尾に追記するだけです。

```typescript
{
  lessonId: "7",
  title: "第7回：〇〇",
  description: "第7回の概要",
  links: [
    {
      id: "link-7-1",       // 一意なID（重複禁止）
      order: 1,             // 授業進行順の並び順
      sharer: "userName",   // 投稿者名（ドロップダウンフィルタに自動反映）
      title: "タイトル",
      url: "https://...",
      category: "ハンズオン教材",  // カテゴリフィルタに自動反映
      tags: ["tag1"],
      summary: "リンクの説明",
      lessonContext: "授業内での意味・位置づけ",
      isCore: true,         // true = 「課題に役立ちそう」フィルタ対象
      isDuplicate: false,   // true = 重複バッジを表示
      duplicateNote: "",    // isDuplicate=true のときのバッジ文言
    },
  ],
}
```

---

## 現在実装済みの機能一覧

| 機能 | 説明 |
|------|------|
| 授業回タブ | 複数回を切り替えて表示 |
| みんなのおすすめ Top3 | おすすめ数→クリック数順で上位3件を常時表示 |
| キーワード検索 | タイトル・説明・タグ・投稿者名で検索 |
| カテゴリフィルタ | ドロップダウンで絞り込み |
| 投稿者フィルタ | ドロップダウンで特定の人のリンクだけ表示 |
| 課題フィルタ | `isCore: true` のリンクのみ表示 |
| 並び替え | いいね順 / 閲覧数順 / 授業進行順 |
| クリックカウント | 開くボタンクリックで Supabase にカウント（3時間クールダウン） |
| おすすめボタン | 👍 ボタンで Supabase にカウント（3時間クールダウン） |
| wiki 編集 | ✏️ 編集ボタンでタイトル・説明を上書き保存（Supabase `link_details`） |

---

## GitHubリポジトリ

https://github.com/KeitoKuramochi/web3_link_sort
