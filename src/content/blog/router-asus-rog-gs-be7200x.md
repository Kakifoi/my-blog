---
title: 'マリオカートワールドで回線落ちが多発。原因はルーターだった。ASUS ROG Strix GS-BE7200Xに買い替えた話。'
description: 'Nintendo Switch 2でマリオカートワールドを遊んでいたら頻繁に回線落ち。原因は旧ルーターの処理能力限界だった。Wi-Fi 7対応のASUS ROG Strix GS-BE7200Xへの買い替え経緯と速度測定結果を紹介。'
pubDate: '2026-05-16T12:00:00+09:00'
category: 'ガジェット・テクノロジー'
tags: ['ルーター', 'ASUS', 'マリオカートワールド', 'Switch2', 'Wi-Fi']
heroImage: '/images/router-eyecatch.jpg'
---

Nintendo Switch 2でマリオカートワールドを楽しんでいたら、サバイバルモード中に頻繁に回線が落ちるようになった。落ちるたびにルーターを再起動して復旧。これが何度も続いた。

最初はゲーム側の問題かと思っていたが、調べていくうちに原因はルーターだとわかった。そして買い替えを決断した。

## 🎮 症状：ゲーム中に突然ネットが切れる

症状はこうだった。MKWのサバイバルモード（最大24人が同時に通信するモード）でプレイ中、突然回線が落ちる。しかもゲームだけじゃなく、スマホもPCも家中の全端末が同時にネット不通になる。ルーターを再起動すれば復旧するが、しばらくするとまた落ちる。

これはゲームや回線の問題ではなく、ルーター自体が止まっている状態だ。

## 🔍 原因：旧ルーターの限界

使っていたのはBuffaloのWSR-5400AX6S-MB。価格.comや知恵袋を調べると、同じ症状の報告が多数あった。「接続が切れた時にランプが全消灯→しばらくして復帰」というパターンで、エラーではなくルーター本体が再起動していた。

原因として考えられるのは2つ。

1つ目は処理能力の限界。MKWサバイバルは最大24人が同時に通信するため、ルーター内部のNATテーブル（通信の接続情報を管理するメモリ）が肥大化し、ルーターのCPUが限界に達してしまう構図が判明した。

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

USENのサーバーが混雑していただけで、回線自体は十分な速度が出ていることが確認できた。Ping（応答速度）は6ms、Jitter（応答速度のばらつき）は0.2msというゲーム用途で申し分ない数値だ。

v6プラスも正常動作、二重ルーターなし、ファームウェア最新を確認。QoSでSwitch 2をゲーミング優先に設定して完了。

## ⚠️ 残った課題：古いLANケーブルの問題

設置後に1つ気になることがあった。ONUを接続しているLANポートのランプが黄色（注意）になっていた。

原因はおそらくLANケーブル。ONUに接続しているLANケーブルが対応していないため、ポートの性能を活かしきれていない状態だ。また、昨日のナイトレインの定例会でDiscord通話の音質が少し悪くなっているのも、これが一因の可能性がある。

Switch 2に繋いでいたルーター付属のケーブルを「ONU→ルーター」に使用して改善した。

CAT6A規格のLANケーブルが手持ちに無かった為、Switch 2用のケーブルを発注済み。明日到着予定なので、交換後にLANポートのランプが黄色が改善するかどうか確認する。

## 📝 まとめ

ゲーム中の回線落ちに悩んでいたら、まずルーターを疑ってみてほしい。特に古いルーターを使い続けている場合、処理能力の限界や熱暴走が原因になっているケースは多い。

ASUS ROG Strix GS-BE7200Xに替えてからは回線落ちが一切なくなった。Pingも安定していてゲーム体験が格段に良くなった。ゲーミングルーターの割にはコンパクト設計（普通のものよりは大きい）で設置場所を選ばないのも気に入っている。ティッシュ箱が一回り大きくなったくらい。

残るはCAT6Aケーブルへの交換。ケーブル1本で解決すれば完璧なのだが。その後、全部解決した。→ [マリオカートワールドの回線落ちが完全解決した話](/blog/router-followup-complete-fix/)

---

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

このブログの商品リンクから飛んで、そのままAmazon・楽天・Yahoo!ショッピングで別の商品（日用品や消耗品など）を買ってもらっても、ブログへの応援になります😊リンク先の商品を買わなくてもOKです。もし使う機会があればぜひ活用してください✌️

