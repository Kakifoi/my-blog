---
title: 'マリオカートワールドで回線落ちが多発。ASUS ROG Strix GS-BE7200Xに買い替えた話。'
description: 'Nintendo Switch 2でマリオカートワールドを遊んでいたら頻繁に回線落ち。旧ルーターの不調を疑い、Wi-Fi 7対応のASUS ROG Strix GS-BE7200Xへ買い替えた経緯と速度測定結果を紹介。'
pubDate: '2026-05-16T12:00:00+09:00'
updatedDate: 2026-11-17
category: 'ガジェット・テクノロジー'
tags: ['ルーター', 'ASUS', 'マリオカートワールド', 'Switch2', 'Wi-Fi']
heroImage: '/images/router-eyecatch.jpg'
---

※2026年11月17日訂正・補足：ルーターの処理能力や発熱を原因と断定していた表現を見直し、改善した経過と未確認の可能性を区別しました。本文は当時の体験の記録です。

Nintendo Switch 2でマリオカートワールドを楽しんでいたら、サバイバルモード中に頻繁に回線が落ちるようになった。落ちるたびにルーターを再起動して復旧。これが何度も続いた。

最初はゲーム側の問題かと思っていたが、家中の端末が同時に切れるので、ルーターの不調を疑った。そして買い替えを決断した。

## 🎮 症状：ゲーム中に突然ネットが切れる

症状はこうだった。MKWのサバイバルモード（最大24人が同時に通信するモード）でプレイ中、突然回線が落ちる。しかもゲームだけじゃなく、スマホもPCも家中の全端末が同時にネット不通になる。ルーターを再起動すれば復旧するが、しばらくするとまた落ちる。

ルーターを再起動すると復旧するので、ルーター側に問題があるのではないかと思った。

## 🔍 原因として考えたこと：旧ルーターの限界

使っていたのはBuffaloのWSR-5400AX6S-MB。価格.comや知恵袋を調べると、同じ症状の報告が多数あった。「接続が切れた時にランプが全消灯→しばらくして復帰」というパターンだった。ただ、こうした症状だけでルーター内部の原因までは断定できない。

原因として考えられるのは2つ。

1つ目は処理能力の限界。ゲーム中の通信負荷が関係している可能性を考えたが、原因までは確認できていない。

2つ目は熱暴走。Switch 2の近くに設置していたため、夏場に向かって熱がこもり、熱暴走を起こしていた可能性がある。

ファームウェアの更新で改善した事例もあるとのことで試してみたが、根本的な解決には至らなかった。買い替えを決意。

## 🛒 ルーター選定：ASUS ROG Strix GS-BE7200X

候補をいくつか検討した。

我が家の事情がある。家猫がいてケーブル類を噛むという恐ろしい内敵がいるのだ。全機器をテレビ台内に収納するか、テレビの裏側に隠すしかない。プラスチックのケーブルでコーディングしてもいいが、目立つところに置くと猫や子供にやられる危険がある。また外部アンテナも格好な噛みごたえで危険。加えて夏場は熱がこもりやすい。この条件を全て満たせるのが、アンテナ内蔵でコンパクトなASUS ROG Strix GS-BE7200Xだった。

Wi-Fi 7対応・10G WAN搭載・アンテナ内蔵・コンパクト設計で、パソコン工房のWEB会員限定価格24,982円（期間限定）で即入手できた。

<div class="product-card">
  <span class="pr-label">PR</span>
  <div class="product-inner">
    <a href="https://amzn.to/4eMqZfy" target="_blank" rel="nofollow sponsored noopener" class="product-img-link">
      <img src="https://m.media-amazon.com/images/I/41sHxS6HjHL._AC_SL1000_.jpg" alt="ASUS ROG Strix GS-BE7200X" class="product-img" />
    </a>
    <div class="product-info">
      <p class="product-name">ASUS ROG Strix GS-BE7200X</p>
      <div class="btn-group">
        <a href="https://amzn.to/4eMqZfy" target="_blank" rel="nofollow sponsored noopener" class="btn-amazon">Amazonで見る</a>
        <a href="https://a.r10.to/h5e3Cs" target="_blank" rel="nofollow sponsored noopener" class="btn-rakuten">楽天で見る</a>
        <a href="https://shopping.yahoo.co.jp/search/0199291099555/0/?first=1&tab_ex=commerce&fr=shp-prop&mcr=6dd49fa6fb5d2ea38b73659926ca603a&ts=1778938839&sretry=1&sc_i=shopping-pc-web-search-suggest-h_srch-srchbtn-sgstfrom-detail-item-h_srch-kwd" target="_blank" rel="nofollow sponsored noopener" class="btn-yahoo">Yahoo!で見る</a>
      </div>
    </div>
  </div>
</div>

## 📊 設置後の速度測定結果

設置してすぐに速度を測定した。

USENの速度計測サーバーで計測するとダウン89〜75Mbps程度だったが、Fast.comで計測するとダウン190〜200Mbps・アップ420Mbpsと大幅に改善。ASUSのアプリ内蔵の計測では677〜738Mbpsまで出ていた。

計測サービスによって数値に差はあったが、Fast.comやASUSのアプリでは十分な速度が出た。Ping（応答速度）は6ms、Jitter（応答速度のばらつき）は0.2msというゲーム用途で申し分ない数値だ。

v6プラスも正常動作、二重ルーターなし、ファームウェア最新を確認。QoSでSwitch 2をゲーミング優先に設定して完了。

## ⚠️ 残った課題：古いLANケーブルの問題

設置後に1つ気になることがあった。ONUを接続しているLANポートのランプが黄色になっていた。

原因として疑ったのはLANケーブル。ONUに接続しているケーブルが関係しているのではないかと思った。また、昨日のナイトレインの定例会でDiscord通話の音質が少し悪くなっていたが、これとの関係は確認できていない。

Switch 2に繋いでいたルーター付属のケーブルを「ONU→ルーター」に使用して改善した。

CAT6A規格のLANケーブルが手持ちに無かった為、Switch 2用のケーブルを発注済み。明日到着予定なので、交換後にLANポートのランプが黄色が改善するかどうか確認する。

## 📝 まとめ

ゲーム中の回線落ちに悩んでいたら、ルーターや接続環境も確認してみるといいかもしれない。うちではルーターの買い替えを試すことにした。

ASUS ROG Strix GS-BE7200Xに替えてからは回線の安定性が改善した。Pingも安定していてゲーム体験が良くなった。ゲーミングルーターの割にはコンパクト設計（普通のものよりは大きい）で設置場所を選ばないのも気に入っている。ティッシュ箱が一回り大きくなったくらい。

残るはCAT6Aケーブルへの交換。ケーブル1本で解決すれば完璧なのだが。その後の経過は、[ルーター交換後にLANケーブル・冷却ファン・SSID分離を試した話](/blog/router-followup-complete-fix/)にまとめた。

---

最後まで読んでいただき、ありがとうございます。

※商品リンクにはアフィリエイト広告を利用しています。リンク経由の購入が条件を満たすと、当ブログが紹介料を受け取る場合があります。

