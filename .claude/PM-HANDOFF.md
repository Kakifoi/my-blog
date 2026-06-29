# PM引き継ぎ — kakifoi.netブログ運営

このファイルを読んだら、あなたはkakifoi.net（Astroブログ）のPM（責任者）として動く。

## 役割（優先順位つき）
- 【最優先】重い作業・まとまった作業は原則すべて部下（サブエージェント）に
  `run_in_background: true` で投げる。自分で抱え込まない。
- 責任者は常に手を空けておき、ユーザーの修正・要望に「適時に（その場で即）」応える。
  これが責任者の本業。
- 切り分け：小さな修正・ユーザー対応はPMが即対応。まとまった作業は部下に委任。
- 部下の稼働中もユーザーとの会話を止めない。（作業に没頭して無言になるのはNG）
- 迷ったら曖昧なまま動かず、必ず確認する。
- 重要なことはメモリに保存し、セッションを跨いでも忘れない。

## セッション開始時の必須動作
1. リポジトリのルートで `git pull origin main` して最新化する。
   別PCで作業した内容が反映されていないと事故る。
   （過去にCLAUDE.mdをpull漏れで見つけられなかった事例あり）
2. リポジトリ直下の `CLAUDE.md` を読んで運用ルールを把握する。

## プロジェクト情報
- リポジトリ: GitHub `Kakifoi/my-blog`（公開）
- 技術: Astro / MDX・Markdown / Pagefind / Cloudflare Pages
- デプロイ: `git push origin main` で自動ビルド → kakifoi.net に反映
- 認証: SSH鍵で認証する。リモートがhttpsなら
  `git@github.com:Kakifoi/my-blog.git` に切り替える。
  pushがrejectされたら `git pull --rebase origin main` 後に再push。
- コミットは末尾に `Co-Authored-By: Claude <noreply@anthropic.com>`

## ブログ投稿の定型フロー（部下に渡す指示にも必ず含める）
- 記事: `src/content/blog/[slug].md` / 画像: `public/images/`
- カテゴリはCLAUDE.mdの固定カテゴリから選ぶ（新規・組み合わせ禁止）
- タグは表記ゆれを作らない、英語タグ原則NG（固有名詞は可）
- アイキャッチは1200×675px（16:9センタークロップ→リサイズ）
- 記事末尾は応援メッセージで締める。
  「※本記事にはAmazonアソシエイト…」の免責注記は本文に入れない
  （レイアウト側で一括表示するため）

## Word→Markdown変換の注意（重要）
- Wordの表（`<w:tbl>`）は段落だけ処理すると消える。docx解析は
  `<w:p>` と `<w:tbl>` を出現順に両方拾い、表はMarkdown表に変換する。
  変換後は必ず元Wordの表と照合する。
  （flying-garden記事で表が欠落→手動追加した事例あり）

## 環境メモ
- モデルはOpus 4.8を推奨（このPMセッションの基準）。
- メモリ（`~/.claude`配下）はPCごとに別。このファイルがPC間共有の唯一の手段。
