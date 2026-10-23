# 記事末尾アフィリエイト監査（2026-10-23）

対象基準: main `2bf2b9c`。全170記事の本文と末尾、共通レイアウト、rehype処理、原稿作成ルールを監査。

## 結果

- 165記事を修正。従来の一律グリル・肉の案内165件を廃止し、152記事は商品案内なし、13記事は本文の実使用・実食・具体的比較に限定した案内へ置換。残り5記事の独自末尾・案内なしは変更しない。
- ナイトレインのPC体験記事（nightreign-world-lore）から、PS5版へ誘導していた末尾カード1枚を削除。新たなPC版アフィリエイトリンクの推測・生成はしない。
- 元の68商品カード中67枚を保持。保持カードのHTML・商品リンク・アフィリエイトID・計測情報・PR表記はバイト単位で変更なし。
- 本文・見出し・frontmatter・写真・関連記事は保持（上記の末尾カード削除を除く）。トップページの商品紹介、共通広告開示、クリック計測処理は変更なし。

## 原因と再発防止

自動推薦やカテゴリ別の代替商品表示は存在しなかった。旧原稿作成ルールが全記事に同じ4段落のグリル・肉案内を要求し、postcheckもそれを必須としていた。rehypeは案内を装飾し検索除外するだけで、商品を選んではいなかった。

既定を感謝＋広告開示の2段落へ変更。記事別案内は `scripts/article-footer-guides.json` の明示選択のみ。本文の原文根拠と選定理由、記事末尾との完全一致をビルド・postcheckで検証し、カテゴリ・タグや未設定時の自動補充は行わない。CLAUDE.mdとPM・Chat用要約も同期。外部ChatGPT/claude.aiのプロジェクト指示は自動同期されないため、利用者側で最新版への貼り替えが必要。

## 商品リンクの照合

末尾側の既存短縮URLを解決し、商品名・型番を確認。AmazonではAZ4U B09Z7LL9G1、アラジン CAG-MG7A（B0BKZMBCZN）、Dyson HD08 BNBC（B0FYN7B31Qのメーカー型番欄）、ASUS GS-BE7200X（B0FS16PPPR）、冷却ファン TOM-45101B（B0FMRMLYDF）、CAT6A 1m LD-GPA/BK1（B076J4XT3K）、タイガー ADC-B061-KM（B0CY17VZ7B）、SKECHERS 205046（B0BQR9Q43F）、AirPods 4 ANC非搭載（B0DGJ63QY8）、Switch 2 Proコントローラー（B0DX1HQX9J）等を照合。書籍・食品・塗料も商品タイトルで確認。

`link.amazon` の1Password・CCウォーターはHEAD確認では404だったが、通常のGETとブラウザでは正しく遷移した。1PasswordはB0CPHPC7LYの3年・ファミリー5人用・カード版、CCウォーターはB0BGQW9ZCWの300ml S203とアフィリエイトtagを確認。HEAD検査だけでリンク切れと誤判定せず、元の指定リンクを保持した。

楽天は[うし釜1.3kgセット](https://item.rakuten.co.jp/ushikama/ss09/)と[The Oniku牛ハラミ1kg](https://item.rakuten.co.jp/nikudonya/10000165/)のセット内容を店舗ページで照合。Yahooのvc_url等は構造を確認し既存値を保持。紙・電子、販売単位違いを購入した形式・数量と同一だったと本文へ追記しない。全検索結果の在庫や全販売者の同一性を保証する監査ではない。

既存Amazonリンクには `kakifoi-blog-22` と旧来の `pcpartsgekiya-22` が混在するが、本人アカウント内の所有関係は今回未確認。推測で統一・再発行せず、元の有効な計測情報を保持した。

## 検証

- 全170記事のpostcheck: ERROR 0。既存の画像寸法・単発タグ等のWARNは今回変更対象外。
- ビルド成功（458ページ、検索対象170記事）。
- 対象の末尾・検索・計測テスト33件成功。ビルド完了後の周辺回帰テストを含め、旧仕様のブログ村配置テストファイルを除く102件成功。
- 全テスト実行では、既存の `scripts/blogmura-placement.test.mjs` 5件が旧『ホームはサイドバーPV』設計を期待して失敗。実装はユーザー承認済みの『全ページでピンク色フッターPV』。今回そのテスト／関連実装は変更していない。
- 全170記事の生成HTMLでも商品カード67枚・記事別案内13件・canonicalを照合。未設定記事の代替商品・空の商品枠はなし。
- PC・375pxの表示検証は完了（下記）。

## 全記事の判定

| 記事スラッグ | 末尾商品案内 |
| --- | --- |
| 40th-milestone-health-checkup | 一律の商品誘導を削除 |
| ai-magic-words | 一律の商品誘導を削除 |
| ai-weight-loss-running-plan | 一律の商品誘導を削除 |
| airpods4-primeday | 一律の商品誘導を削除 |
| airpods4-review | 一律の商品誘導を削除 |
| amaike-yakiniku-2026 | 本文根拠を確認し、商品を限定 |
| ashikaga-flower-park-autumn | 一律の商品誘導を削除 |
| az4u-wireless-chime | 一律の商品誘導を削除 |
| back-to-work-after-hokkaido-trip | 一律の商品誘導を削除 |
| bronco-billy-kumagaya-birthday-lunch | 一律の商品誘導を削除 |
| burger-king-mushroom-whopper | 一律の商品誘導を削除 |
| cancel-rakuten-life-insurance | 一律の商品誘導を削除 |
| ceiling-fan-light-led-daylight-white | 一律の商品誘導を削除 |
| chatgpt-plus-pro-claude-speed-settings | 一律の商品誘導を削除 |
| child-marathon-training-weekday | 一律の商品誘導を削除 |
| child-vaccination-flumist | 一律の商品誘導を削除 |
| claude-fable-max5x | 一律の商品誘導を削除 |
| claudecode-blog-ichinichi | 既存の独自末尾／案内なしを保持 |
| coopdeli-childcare-discount-2years | 一律の商品誘導を削除 |
| cruzard-headlight-cleaning | 一律の商品誘導を削除 |
| cup-ramen-lunch | 一律の商品誘導を削除 |
| curry-party-wild-boar-habanero | 一律の商品誘導を削除 |
| daiko-asl-613-ceiling-fan | 一律の商品誘導を削除 |
| datenoya-seafood-dinner | 一律の商品誘導を削除 |
| debit-card-fraud-risk | 一律の商品誘導を削除 |
| dental-cleaning-smartphone-myna | 一律の商品誘導を削除 |
| discord-voice-head-cut-fix | 一律の商品誘導を削除 |
| dohtonbori-kagohara | 一律の商品誘導を削除 |
| duskbloods-network-test | 一律の商品誘導を削除 |
| dyson-dryer-hd08-review-1 | 一律の商品誘導を削除 |
| dyson-dryer-hd08-review-2 | 一律の商品誘導を削除 |
| eldenring-nightreign-offline | 本文根拠を確認し、商品を限定 |
| fable5-blog-setup | 一律の商品誘導を削除 |
| family-home-window-renovation | 一律の商品誘導を削除 |
| farming-and-nightreign | 一律の商品誘導を削除 |
| fixed-cost-self-employed | 一律の商品誘導を削除 |
| flumist-vaccination-fever | 一律の商品誘導を削除 |
| flying-garden-fukaya-2026 | 一律の商品誘導を削除 |
| frienda-mew-rhythm-tengoku | 本文根拠を確認し、商品を限定 |
| frieren-anime-manga-review | 一律の商品誘導を削除 |
| fudosan-investment-orcan-2026 | 一律の商品誘導を削除 |
| fujikyu-highland-2026 | 既存の独自末尾／案内なしを保持 |
| fukaya-hanazono-kuaaina | 本文根拠を確認し、商品を限定 |
| fukaya-marathon-entry | 一律の商品誘導を削除 |
| fukaya-nisseki-wisdom-teeth | 一律の商品誘導を削除 |
| fukaya-nisseki-wisdom-tooth-extraction | 一律の商品誘導を削除 |
| fukaya-shouzushi-lunch | 一律の商品誘導を削除 |
| garagaku-omiya-shoyu-ramen | 一律の商品誘導を削除 |
| gas-rate-comparison | 一律の商品誘導を削除 |
| grandparents-house-rebuilding | 一律の商品誘導を削除 |
| gunma-flowerpark-cocos | 一律の商品誘導を削除 |
| gunma-natural-history-museum-dinosaurs | 一律の商品誘導を削除 |
| gw2026-home-grill | 本文根拠を確認し、商品を限定 |
| hanabusa-takeout-kumagaya | 本文根拠を確認し、商品を限定 |
| headlight-polishing | 一律の商品誘導を削除 |
| hinabe-off-switch2-duskbloods | 一律の商品誘導を削除 |
| hoiku-sankan-2026 | 一律の商品誘導を削除 |
| hoikusankan-engawa-lunch | 一律の商品誘導を削除 |
| hokkaido-trip-day1-ibaraki-airport-sapporo | 一律の商品誘導を削除 |
| hokkaido-trip-day2-otaru-westin-rusutsu | 一律の商品誘導を削除 |
| hokkaido-trip-day3-rusutsu-sapporo-naganuma | 一律の商品誘導を削除 |
| hokkaido-trip-day4-new-chitose-airport | 一律の商品誘導を削除 |
| hokkaido-trip-plan | 一律の商品誘導を削除 |
| ideco-minimum | 一律の商品誘導を削除 |
| ihai-seiri-otakiage | 一律の商品誘導を削除 |
| inakappe-udon-kuboshima-family-lunch | 一律の商品誘導を削除 |
| inakappe-udon-kumagaya-planetarium | 一律の商品誘導を削除 |
| index-orukan-4percent-rule | 一律の商品誘導を削除 |
| iphone-lease-cost | 一律の商品誘導を削除 |
| iris-ohyama-frying-pan-28cm-replacement | 一律の商品誘導を削除 |
| jagaimo-kitaakari-2026 | 本文根拠を確認し、商品を限定 |
| jichikai-natsumatsuri | 一律の商品誘導を削除 |
| jichikai-natsumatsuri-katazuke | 一律の商品誘導を削除 |
| jogging-restart-2026 | 一律の商品誘導を削除 |
| jogging-with-child-morning | 一律の商品誘導を削除 |
| karaokekan-kumagaya-ginza | 一律の商品誘導を削除 |
| kawaba-tambara-lavender | 一律の商品誘導を削除 |
| kaze-engawa-lunch | 一律の商品誘導を削除 |
| kids-swimming-continue-or-quit | 一律の商品誘導を削除 |
| kingdom-tamashii-no-kessen | 一律の商品誘導を削除 |
| kitakata-ramen-bannai-honjo | 一律の商品誘導を削除 |
| kodomo-challenge-start | 一律の商品誘導を削除 |
| kodomo-fukka-park | 一律の商品誘導を削除 |
| komeda-gogo-no-kocha-frappe-tsukimi-2026 | 一律の商品誘導を削除 |
| koppe-tajima-rakuten-gyutan | 本文根拠を確認し、商品を限定 |
| kouza-furikae-paper-procedure | 一律の商品誘導を削除 |
| kumagaya-cancer-screening-age40 | 一律の商品誘導を削除 |
| kumagaya-fireworks-aeon-kumagaya-rooftop | 一律の商品誘導を削除 |
| kusakimarino-fukaya-lunch | 一律の商品誘導を削除 |
| kyokai-tachiai | 一律の商品誘導を削除 |
| lasik-icl-presbyopia | 一律の商品誘導を削除 |
| life-plan-fire-90-percent-satisfied | 一律の商品誘導を削除 |
| long-term-quality-housing-maintenance-report | 一律の商品誘導を削除 |
| marutama-oura-nikujiru-udon | 一律の商品誘導を削除 |
| measles-antibody-result | 一律の商品誘導を削除 |
| measles-antibody-test | 一律の商品誘導を削除 |
| mentaipark-gunma-2026 | 一律の商品誘導を削除 |
| mf-cloud-zenryoku-hojinzei-corporate-closing | 一律の商品誘導を削除 |
| mixi-generation-instagram | 一律の商品誘導を削除 |
| miyajiro-fukaya-350g-all-mashi | 一律の商品誘導を削除 |
| mothers-day-2026 | 一律の商品誘導を削除 |
| mothers-day-coffee-maker | 一律の商品誘導を削除 |
| mr-lunch-eldenring-switch2 | 本文根拠を確認し、商品を限定 |
| nasu-family-trip-day-one | 一律の商品誘導を削除 |
| nasu-highland-park-family-trip | 一律の商品誘導を削除 |
| neko-yobou-sesshu | 一律の商品誘導を削除 |
| nightreign-deep-night-9999 | 一律の商品誘導を削除 |
| nightreign-kumagaya | 一律の商品誘導を削除 |
| nightreign-world-lore | 一律の商品誘導を削除・PS5版カードも削除 |
| niibori-tamai-school-merger | 一律の商品誘導を削除 |
| ningen-level-ron-6years | 一律の商品誘導を削除 |
| nitori-bookrack-birthday-present | 一律の商品誘導を削除 |
| nourin-park-softcream-sushiro | 一律の商品誘導を削除 |
| nzxt-relay-speakers-review | 一律の商品誘導を削除 |
| ogo-green-flower-farm | 一律の商品誘導を削除 |
| okabe-cosmos-fireworks | 本文根拠を確認し、商品を限定 |
| okuribon-family-childcare | 一律の商品誘導を削除 |
| one-in-eight-billion-india | 一律の商品誘導を削除 |
| oniku-harami | 本文根拠を確認し、商品を限定 |
| password-review | 一律の商品誘導を削除 |
| piano-review-amazon-photos-fire-tv | 一律の商品誘導を削除 |
| pisola-lunch-review | 一律の商品誘導を削除 |
| pokemon-center-hanyu | 一律の商品誘導を削除 |
| pokemon-ice-cake-birthday | 一律の商品誘導を削除 |
| pokemon-za-soundtrack-cd | 一律の商品誘導を削除 |
| pokemon-zukan-meisaku-book | 一律の商品誘導を削除 |
| pork-labo-frozen-hamburg | 一律の商品誘導を削除 |
| post-office-kokusai-warning | 一律の商品誘導を削除 |
| precure-movie-family-kumagaya | 一律の商品誘導を削除 |
| prime-sale-1password-shopping | 一律の商品誘導を削除 |
| rakuten-black-card-cancel | 一律の商品誘導を削除 |
| rakuten-passkey-login | 一律の商品誘導を削除 |
| rhythm-heaven-ado-song | 一律の商品誘導を削除 |
| router-asus-rog-gs-be7200x | 一律の商品誘導を削除 |
| router-followup-complete-fix | 一律の商品誘導を削除 |
| sagi-taisaku-app-parents-iphone | 一律の商品誘導を削除 |
| sbc-hige-datsu-mo-8kai | 一律の商品誘導を削除 |
| sbc-needle-hair-removal-counseling | 一律の商品誘導を削除 |
| sbc-needle-hair-removal-first-session | 一律の商品誘導を削除 |
| sbc-shirahige-needle-datsumo-cost | 一律の商品誘導を削除 |
| school-entry-health-check | 一律の商品誘導を削除 |
| seiban-model-royal-randoseru | 一律の商品誘導を削除 |
| sendai-2026-day1 | 一律の商品誘導を削除 |
| sendai-2026-day2 | 一律の商品誘導を削除 |
| senpai-jagaimo-potechi | 一律の商品誘導を削除 |
| senpai-taue-tetsudai | 一律の商品誘導を削除 |
| shinjuku-dosokai-2026 | 既存の独自末尾／案内なしを保持 |
| shufu-small-business-tax-fuyo | 一律の商品誘導を削除 |
| skechers-slip-ins-review | 一律の商品誘導を削除 |
| smartphone-atm-cashcard | 一律の商品誘導を削除 |
| sobo-isshuki-rouka | 一律の商品誘導を削除 |
| sobo-niibon-2026 | 一律の商品誘導を削除 |
| strider-14x-debut | 一律の商品誘導を削除 |
| studio-alice-photo-data | 一律の商品誘導を削除 |
| swimming-short-course-day1 | 一律の商品誘導を削除 |
| switch2-procon-nightreign | 一律の商品誘導を削除 |
| switch2-second-unit-duskbloods | 一律の商品誘導を削除 |
| tadokoro-shoten-miso-ramen-comparison | 一律の商品誘導を削除 |
| takanome-omiya-ramen | 一律の商品誘導を削除 |
| ushigama-yakiniku-set | 本文根拠を確認し、商品を限定 |
| welkatsu-limit-shopping | 既存の独自末尾／案内なしを保持 |
| why-i-started-blog | 一律の商品誘導を削除 |
| wisdom-tooth-extraction-pain-swelling | 一律の商品誘導を削除 |
| wisdom-tooth-suture-removal | 一律の商品誘導を削除 |
| yamada-udon-fukaya-17-bypass | 一律の商品誘導を削除 |
| yamanashi-day2-2026 | 既存の独自末尾／案内なしを保持 |
| yamaya-udon-fukaya | 一律の商品誘導を削除 |
| yamaya-udon-fukaya-compared-with-inakappe | 一律の商品誘導を削除 |
| yotei-nozei-side-fire | 一律の商品誘導を削除 |
| yukakko-honjo | 本文根拠を確認し、商品を限定 |

## 末尾側の商品カード判定

最後の節・まとめ近辺にあるカード27枚を個別確認（本文中のカードは変更対象外）。

| 記事 | 商品 | 判定・本文との関係 |
| --- | --- | --- |
| airpods4-review | Apple AirPods 4（ノイズキャンセリング非搭載） | 保持：L85–100は「総評」直後のカード。通話や装着感を検証した記事の主役であり、本文とカード名のANC非搭載表記も一致する。後ろに映画の予定と最終まとめが続くが、総評後の配置なので末尾寄りの監査対象に含め、保持する。 |
| amaike-yakiniku-2026 | うし釜 秘伝のタレ漬け焼肉セット 1.3kg | 保持：まとめと次回購入の話の後、L105–118にある比較対象商品のカード。本文に購入・実食・内訳・価格・味の比較があり、単に精肉店の記事へ付け足された別商品ではない。 |
| az4u-wireless-chime | AZ4U ワイヤレスチャイム 電池式 インターホン ドアベル 工事不要 技適取得済み 送信機防水 60曲 音量4段階 ホワイト 発信機1個 受信機1個 | 保持：L111–125は最終評価と設置上の助言の後に置かれた主役商品のカード。本文の白色・送信機1個・受信機1個・電池式という購入条件とカード表示が合う。旧ELPAや純正Panasonic製品の代替カードではない。 |
| cruzard-headlight-cleaning | プロスタッフ CCウォーターゴールド プレミア 300ml S203（クロス2枚付き） | 保持：L76–91は最後の具体的な施工セクション「今回は簡単なコーティングまで」の末尾、短いまとめの直前にあるため監査対象に含める。L70–72で実使用を明記し、本文公式リンクのs203とカードのS203も整合するので保持する。 |
| curry-party-wild-boar-habanero | リズム天国 ミラクルスターズ -Switch | 保持：最後の実質的な節「リズム天国で遊んで夕飯まで」で実際に遊んだゲームの感想直後にある。記事の体験に直接対応するカードなので保持する。 |
| dyson-dryer-hd08-review-2 | dyson ヘアドライヤー Supersonic HD08 BNBC | 保持：まとめ直後に置かれた主役商品のカードで、本文の実使用モデルHD08とカード名のHD08が一致する。 |
| eldenring-nightreign-offline | アラジン 焼き焼きグリル CAG-MG7A グラファイトミニグリラー | 保持：本文で使い勝手を具体的に評価したCAG-MG7Aのカード。まとめ内の再推薦直後にあり、実体験に対応するため保持する。 |
| frieren-anime-manga-review | 葬送のフリーレン 1巻（山田鐘人・アベツカサ著） | 保持：最後の推薦節に置かれた、記事の主役であり購入・読了した漫画の第1巻カード。全巻購入の記述と冒頭巻への導線は矛盾しない。 |
| gw2026-home-grill | アラジン 焼き焼きグリル CAG-MG7A グラファイトミニグリラー | 保持：牛タン・シマチョウや焼き鳥を実際に焼いた体験と、家グリルの仕上がりの評価に直接対応する商品カード。GWの過ごし方の中心として複数日に登場するため、無関係な末尾販促として削除せず保持する。 |
| headlight-polishing | SOFT99（ソフト99）ボデーペン ウレタンクリアー 320ml 08006（単品） | 保持：最後の意味のある節『ウレタンクリアーも買ったけど塗装はまだ』で、実際の購入品08006・320mlを説明した直後に置かれている。購入済み・未使用の記録に対応する本文カードであり、メーカーが劣化した樹脂製ヘッドライトへの使用を不可としている本文とカード説明を一体で保持する。 |
| ihai-seiri-otakiage | うし釜 秘伝のタレ漬け焼肉セット 1.3kg | 保持：本文68〜72行に楽天で購入した焼肉セットの調理・実食が詳しくあり、焼肉セットのカードには直接の文脈があるため保持する。ブランドとセットの同一性は別途確認事項とする。 |
| jagaimo-kitaakari-2026 | アラジン 焼き焼きグリル CAG-MG7A グラファイトミニグリラー | 保持：本文32行で実際にアラジンを持参して肉を焼いているため、そのグリルを紹介するカードには直接の体験根拠があり保持する。 |
| koppe-tajima-rakuten-gyutan | うし釜 秘伝のタレ漬け焼肉セット 1.3kg | 保持：最後の実質的な食体験節で、焼いて食べたうし釜の牛タンを含むセットを直後に紹介しており、本文64行もセットの構成品と明記しているため保持する。 |
| mothers-day-coffee-maker | タイガー コーヒーメーカー ADC-B061KM マットブラック | 保持：まとめ後に主役の購入品を1回だけ案内。選定理由と同シリーズ旧機の使用経験が本文にある。 |
| nightreign-world-lore | Elden Ring Nightreign（エルデンリング ナイトレイン） | 削除：本文は自作ゲーミングPCでの実体験なのに、版を明示しない末尾カードがPM確認済みのPS5版ASIN B0DWZVYNM3へ案内する。PC版の購入先と誤認する可能性があり、今回新規アフィリエイトリンクを作らない方針のため、この末尾カードを削除候補とする。 |
| oniku-harami | 極旨秘伝タレ漬け 牛ハラミ 1kg | 保持：主役The Onikuの長文実食レビューのまとめ後再掲。本文の#1と同一商品で、長文主役レビューの再掲例外に合う。 |
| password-review | ソースネクスト 1Password 3年版 ファミリー（5人用・カード版） | 保持：最終の製品説明節で本人のファミリー3年版の使用とWatchtower等の機能を説明した直後、まとめ前にある。広告のためだけに追加された無関係カードではない。 |
| router-followup-complete-fix | ASUS ROG Strix GS-BE7200X Wi-Fi 7 ゲーミングルーター | 保持：本文で実際に交換・使用したルーターで、購入後の改善と残課題を報告している。 |
| router-followup-complete-fix | Nintendo Switch 2 対応 冷却ファン | 保持：本文で導入後の温度を50℃以上→40℃前後と実測比較した冷却ファン。 |
| router-followup-complete-fix | CAT6A LANケーブル 1m | 保持：本文でCAT6A（1m）に交換し警告解消を確認している。 |
| senpai-jagaimo-potechi | カルビー 堅あげポテト うすしお味 | 保持：自作の手間・味を比較した相手として本文に商品名が明記される。自作より市販品が合理的という結論の購入先として直接関連。 |
| skechers-slip-ins-review | SKECHERS（スケッチャーズ） ハンズフリー スリップインズ ガルザ ガービン 205046 メンズ スニーカー | 保持：主役の実購入・実使用した靴をまとめ後に1回だけ案内。 |
| swimming-short-course-day1 | リズム天国 ミラクルスターズ -Switch | 保持：記事終盤の夕食前のゲーム節で実際に家族が遊ぶ方法と感想を述べた直後の1カード。正当な本文カードとして残す。 |
| switch2-procon-nightreign | Nintendo Switch 2 Proコントローラー | 保持：記事終盤の購入節直後に、誤爆解消を実使用で確認した主役商品を1回だけ案内。 |
| why-i-started-blog | DIE WITH ZERO 人生が豊かになりすぎる究極のルール | 保持：ブログを始める価値観に影響した具体的な本を本文で論じ、末尾に1回案内している。 |
| yukakko-honjo | 極旨秘伝タレ漬け 牛ハラミ 1kg | 保持：夕食で母親に振る舞った実食商品で、味の反応・購入量と残量も本文で説明。初出カードであるため無関係末尾広告として削除しない。 |
| yukakko-honjo | アラジン 焼き焼きグリル CAG-MG7A グラファイトミニグリラー | 保持：当日の焼肉と片付けまで実使用が本文にあり、初出のカード。 |

## 表示確認記録

PC（1280px）・スマホ（375px）幅で、AZ4U（商品カード保持）、抜歯後の痛み（無関係案内削除）、ナイトレイン世界観（PS5版カード削除）、家グリル（関連案内保持）を確認済み。いずれも横はみ出しなし。商品画像・ボタン・PR表記と本文から末尾案内への並びを目視し、削除記事に空の商品見出し・枠・余白が残っていないことを確認。画像生成や新しい購入体験の追記はしていない。

画面記録（ローカル）:

- `/private/tmp/affiliate-keep-pc-20261023.png` / `/private/tmp/affiliate-keep-mobile-20261023.png`
- `/private/tmp/affiliate-remove-pc-20261023.png` / `/private/tmp/affiliate-remove-mobile-20261023.png`
- `/private/tmp/affiliate-guide-pc-20261023.png` / `/private/tmp/affiliate-guide-mobile-20261023.png`
- `/private/tmp/affiliate-unrelated-pc-20261023.png` / `/private/tmp/affiliate-unrelated-mobile-20261023.png`

この監査記録は修正・ローカル検証時点のもの。本番反映はユーザーの公開承認後に行い、公開ページでの確認結果は完了報告で別途伝える。
