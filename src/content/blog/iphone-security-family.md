---
title: '夫婦のセキュリティ対策を見直した iPhoneの設定手順もメモ'
description: '夫婦のパスワードや復旧用連絡先を見直した記録。親のスマホも一緒に確認できるよう、iPhone・1Password・各サービスの設定手順を残す。'
pubDate: '2026-10-30T12:00:00+09:00'
category: 'ガジェット・テクノロジー'
tags: ['セキュリティ', 'iPhone', '1Password', '家族', 'ライフスタイル', '日記']
heroImage: '/images/iphone-security-family-eyecatch.jpg'
heroImageAlt: '青い盾と鍵のマークでiPhoneのセキュリティ対策を表したイメージ画像'
---

10月は、俺と妻のスマホまわりのセキュリティ対策を進めていた。もともと8割くらいは設定できていた気がするが、見直してみると、重要なアカウントに短いパスワードが残っていた。

夫婦の分は大体済んだ。次は親の分も見たいので、実際に変えたことと、iPhoneでの設定方法をここに残しておく。

<nav id="article-toc" class="article-toc" aria-labelledby="article-toc-title" tabindex="-1">
  <h2 id="article-toc-title" class="article-toc-title">記事の目次</h2>
  <ul class="article-toc-list">
    <li><a href="#story-password">🔑 6文字くらいのパスワードを変えた</a></li>
    <li><a href="#story-watchtower">😅 Watchtowerは正直手に負えない</a></li>
    <li><a href="#story-recovery">🔐 iPhoneの復旧用連絡先も設定した</a></li>
    <li><a href="#story-family">📱 家族がiPhoneだとこういうときに助かる</a></li>
    <li><a href="#story-parents">🤝 今度は親と一緒に確認したい</a></li>
    <li>
      <a href="#memo">🛠️ 設定するときに見返すメモ</a>
      <details class="article-toc-details">
        <summary>設定メモの11項目を選ぶ</summary>
        <ul class="article-toc-list">
          <li><a href="#s1">始める前に確認しておくこと</a></li>
          <li><a href="#s2">iPhoneの更新と画面ロック</a></li>
          <li><a href="#s3">1Password</a></li>
          <li><a href="#s4">Apple Account</a></li>
          <li><a href="#s5">Googleアカウント</a></li>
          <li><a href="#s6">メールとChrome</a></li>
          <li><a href="#s7">LINEとSNS</a></li>
          <li><a href="#s8">銀行と証券とカード</a></li>
          <li><a href="#s9">家のルーター</a></li>
          <li><a href="#s10">探すと盗難デバイスの保護</a></li>
          <li><a href="#s11">最後の確認と困ったとき</a></li>
        </ul>
      </details>
    </li>
    <li><a href="#summary">📝 まとめ</a></li>
  </ul>
</nav>

<h2 id="story-password">🔑<strong> 6文字くらいのパスワードを変えた</strong></h2>

今回、優先して変えたのはGoogle、Apple、SNSのパスワード。中には6文字くらいの短いものもあったので、なるべく長く、記号を使えるところには記号も入れて設定し直した。

パスワードは普段から1Password Familiesで管理している。長くしたものを全部覚えるのは無理なので、サービスごとに違うものにして、1Passwordに保存しておく。

GoogleやAppleは、メールや写真だけでなく、ほかのサービスのログインにも関わる。こういうところは、後回しにせず先に変えておきたい。

<h2 id="story-watchtower">😅<strong> Watchtowerは正直手に負えない</strong></h2>

1PasswordのWatchtowerでは、弱いパスワードや使い回しを確認できる。ただ、ここを見ると、昔の登録がかなり出てくる。10年以上前に作ったものは、みんな同じようなパスワードだ。

最近使っているサービスは大体変えた。ただ、飲食店ごとのポイントサービスまで一つずつ、となると手に負えない。まずはGoogleやApple、普段使うSNSなど、破られたら困るところから順に変えている。

Watchtowerから変更するときの操作は、後半の[1Passwordのメモ](#s3)に載せておいた。

<h2 id="story-recovery">🔐<strong> iPhoneの復旧用連絡先も設定した</strong></h2>

今回、新しく設定したものの一つが、iPhoneの「復旧用連絡先」だ。Apple Accountに入れなくなったとき、指定しておいた人に復旧を手伝ってもらえる。

相手が写真やメールを見られるようになるわけではない。困ったときに、復旧用のコードを出してもらうための設定だ。

設定する場所は「設定」→一番上の名前→「サインインとセキュリティ」→「復旧用連絡先」。そこから、信頼できる人を追加する。

依頼を受ける側の操作もあるので、追加するときと、実際に復旧を手伝うときの両方を[Appleの設定メモ](#s4)に残しておいた。

<h2 id="story-family">📱<strong> 家族がiPhoneだとこういうときに助かる</strong></h2>

うちは家族全員がiPhoneなので、こういう設定を手伝いやすい。実家の母は、いつも俺のお下がりのスマホを使っている。妻も以前はAndroidだったが、iPhoneになった。

完全に俺の都合ではある。妻は最初、OSが変わることに少し躊躇していたが、納得してくれたようだ。使い始めたら、すぐに慣れて使いこなしていた。

Apple製品はちょっと高い。でも、動作が遅くて何をするにも進まない、ということはないし、アプリの使い勝手やセキュリティも含めて、俺は満足している。家族の設定を見るときに、同じ画面で話を進められるのも助かる。

<h2 id="story-parents">🤝<strong> 今度は親と一緒に確認したい</strong></h2>

次は、実家の母と妻の父の設定も見直したい。最近のニュースで関心があるかもしれないので、直接会ったときに話してみるつもりだ。

証券口座は、以前フィッシング被害がニュースになったときに、二人ともパスキーを設定してある。今度は銀行なども含めて確認したい。

しなくていいと言われたら、こちらだけでは進められない。ただ、お金に関わるところは特に気になるので、何のための設定なのかを説明して、一緒に見ていけたらと思う。

<h2 id="memo">🛠️<strong> 設定するときに見返すメモ</strong></h2>

設定方法も、あとで探し回らずに済むように残しておく。自分の設定を見直すときも、家族の分を手伝うときも、必要な項目から開いて使ってもらえれば。

<nav id="memo-toc" class="article-toc" aria-labelledby="memo-toc-title" tabindex="-1">
  <h3 id="memo-toc-title" class="article-toc-title">設定メモの目次</h3>
  <ul class="article-toc-list">
    <li><a href="#s1">始める前に確認しておくこと</a></li>
    <li><a href="#s2">iPhoneの更新と画面ロック</a></li>
    <li><a href="#s3">1Password</a></li>
    <li><a href="#s4">Apple Account</a></li>
    <li><a href="#s5">Googleアカウント</a></li>
    <li><a href="#s6">メールとChrome</a></li>
    <li><a href="#s7">LINEとSNS</a></li>
    <li><a href="#s8">銀行と証券とカード</a></li>
    <li><a href="#s9">家のルーター</a></li>
    <li><a href="#s10">探すと盗難デバイスの保護</a></li>
    <li><a href="#s11">最後の確認と困ったとき</a></li>
  </ul>
</nav>

画面名はiOSやアプリの版で少し違うことがある。見つからないときに開けるよう、各項目に公式の案内も付けた。

<h3 id="s1"><strong>始める前に確認しておくこと</strong></h3>

設定するiPhoneを充電し、Wi-Fiにつないでおく。復旧用連絡先を追加するなら、もう一方のiPhoneも手元にあると、依頼の承諾まで進めやすい。

まずは「設定」一番上の名前と、Googleのプロフィール写真から、誰のアカウントを開いているかを見る。登録電話番号でSMS・電話を受けられるか、登録メールを開けるかも確認。古い連絡先は先に直しておく。

Appleの「パスワード」アプリと1Passwordのどちらにログイン情報やパスキーが入っているかも見ておく。設定済みの証券パスキーは、保存先が分からないまま消さない。

一つのサービスで「変更する→保存内容を更新する→ログインを試す」まで終えてから、次へ進む。先に更新とバックアップ、次に復旧情報と各サービスの認証、最後に盗難対策、という順で進めるとよい。

メールが必要なら[メールとChrome](#s6)、1Passwordを新しく使う人は[Familiesへの追加](#s3invite)へ。盗難デバイスの保護がすでに有効なら、待機の案内に従って進める。

<p class="toc-return"><a href="#memo-toc">↑ 設定メモの目次へ戻る</a></p>

<h3 id="s2"><strong>iPhoneの更新と画面ロック</strong></h3>

<h4><strong>バックアップとiOSの更新</strong></h4>

1. 「設定」→名前→「iCloud」→「iCloudバックアップ」→「今すぐバックアップを作成」。最終バックアップ日時を見る。容量不足なら先に空きを確保する。

2. 「設定」→「一般」→「ソフトウェアアップデート」から更新する。再起動後に同じ画面でもう一度確認。古い機種も、その機種向けの更新がないか見る。

3. 同じ画面の「自動アップデート」で自動インストールをオン。ダウンロードやシステムファイルの更新が別に表示される場合もオンにする。

<h4><strong>Chromeなどのアプリも更新</strong></h4>

「App Store」→右上の写真→「アプリのアップデート」から更新する。旧版では写真を開いた画面に一覧が出る。「すべてをアップデート」でもよい。

自動更新は「設定」→「アプリ」→「App Store」→「アプリのアップデート」をオン。古いiOSでは「設定」直下にApp Storeがある。iPhone版ChromeもApp Storeで更新する。

<h4><strong>パスコードとFace ID</strong></h4>

「設定」→「Face IDとパスコード」（指紋の機種は「Touch IDとパスコード」）→「パスコードを変更」。連番や誕生日を避け、「パスコードオプション」から長い数字や英数字も選べる。未設定なら顔・指紋も登録する。

一度ロックして、新しいパスコードと顔・指紋で開けるか試す。「設定」→「画面表示と明るさ」→「自動ロック」で、長時間開きっぱなしにならないようにする。ここで変えるのは画面ロック用で、AppleやGoogleのパスワードとは別だ。

<h4><strong>使わないアプリと残った画像</strong></h4>

「設定」→「一般」→「iPhoneストレージ」で不要なアプリを確認。「設定」→「プライバシーとセキュリティ」では写真・位置情報・マイクなどを開き、不要なアクセス許可を外す。アプリを削除する前に、そこにしかないデータや認証情報がないか見る。

「写真」「ファイル」に残った本人確認書類や、パスワード・認証用QRコードの画像も整理する。必要なものの保管先を確保してから、不要なコピーを削除。写真の「最近削除した項目」からも消すと戻せず、iCloud写真を使っていればほかの端末にも削除が反映される。

公式の案内：[バックアップ](https://support.apple.com/ja-jp/108366) ／ [iOS更新](https://support.apple.com/ja-jp/118575) ／ [アプリ更新](https://support.apple.com/ja-jp/102629) ／ [パスコード](https://support.apple.com/ja-jp/119586) ／ [権限](https://support.apple.com/ja-jp/102515) ／ [写真の削除](https://support.apple.com/ja-jp/104967)

<p class="toc-return"><a href="#memo-toc">↑ 設定メモの目次へ戻る</a></p>

<h3 id="s3"><strong>1Password</strong></h3>

<h4><strong>Watchtowerからパスワードを変える</strong></h4>

1. 1Passwordを開いて解除→「Watchtower」→使い回し・弱いパスワードの項目を選ぶ。

2. 対象サービスの公式アプリ・公式サイトで変更画面を開く。現在のパスワードを求められたら、保存内容を書き換える前に入力する。

3. 1Passwordの対象ログイン→「編集（Edit）」→パスワード欄→新規生成（Create a New Password）。サービスの条件に合わせて作り、保存する。

4. 生成したものをサービス側の新しいパスワード欄に入れ、変更を確定。新しいものでログインできるか、1Passwordと内容が一致するか試す。

文字数はサービスが許す範囲で16文字以上など十分に長くし、使える記号も条件に合わせる。名前・誕生日や、ほかで使っているものは避ける。1Passwordだけを書き換えてもサービス側は変わらないので、一件ずつ最後まで終える。

<h4><strong>iPhoneの自動入力</strong></h4>

「設定」→「一般」→「自動入力とパスワード」で「パスワードとパスキーを自動入力」と「1Password」をオン。旧版は「パスワード」→「パスワードオプション」などにある。ログイン欄をタップし、鍵マークから項目を選べるか試す。

Appleの「パスワード」に証券パスキーがあるなら、そちらの自動入力も急に切らない。保存先を確かめてから整理する。自動入力を切ることと、iCloudキーチェーンを止めることは別の操作だ。

<h4><strong>入れなくなったときのために</strong></h4>

Emergency Kitはブラウザの1Password.com→名前→「Manage Account」→「Save Emergency Kit」でPDFを保存する。少なくとも1部は印刷し、アカウントパスワードも記入して安全に保管。Secret Keyなども載っているので、1Passwordに入れなくても取り出せる場所に置く。

復旧コードはアプリのアカウントアイコン→「Manage Accounts」→自分のアカウント→「Sign-in & Recovery」→「Set up recovery code」で別に作る。安全に保管し、登録メールも受信できるようにしておく。試しに復旧を始める必要はない。

Emergency Kit、Secret Key、復旧コードは別のもの。名前と保管場所を区別しておく。

<h4><strong>1Password自身の2要素認証</strong></h4>

1Passwordに入るためのコードは、別の認証アプリで管理する。今使っているものがなければ、App StoreからMicrosoft Authenticatorなどを入れる。

1. ブラウザの1Password.com→名前→「Manage Account」→「More Actions」→「Manage Two-Factor Authentication」→「Set Up App」。

2. 認証アプリで追加する。Microsoft Authenticatorは「＋」→「その他のアカウント」。同じiPhoneに出たQRコードなら手入力を選び、1Passwordが示す設定用シークレットを入力する。

3. 設定用の16文字のシークレットを安全に控え、認証アプリに出た6桁のコードを1Password側に入力して確定する。

この設定用シークレットも復旧コードとは別。Familiesでは管理者が1Password.comの「People」→家族の名前→役割を「Family Organizer」にして、もう一人、復旧を手伝える管理者を用意しておく。

<h4 id="s3invite"><strong>これから家族をFamiliesへ追加する場合</strong></h4>

すでに使っている人は、そのアカウントを確認する。個人契約から移すならデータ移行が必要なので、古いアカウントや保管庫を先に消さない。新しく参加する人は次の順番で。

1. 管理者がブラウザの1Password.com→「Invitations」→「Invite by Email」で、受信できるメール宛てに「Invite」。

2. 届いたメールから参加し、その人専用のアカウントパスワードを決める。Secret KeyとEmergency Kitを保存する。

3. 管理者が登録完了の通知、または「Invitations」→名前の横の「Confirm」から承認する。

4. 公式ダウンロードページからiPhoneアプリを入れ、新しく契約せず、作成したアカウントでサインイン。Emergency Kitでメール・Secret Key・パスワードを確認し、アプリを開けるか試す。

現行アプリはiOS 18以降が必要。家族でもログイン情報は一人ずつ。個人のものは「Private」、見せたいものだけ「Shared」に入れる。

公式の案内：[Watchtower](https://support.1password.com/watchtower/) ／ [生成](https://support.1password.com/generate-website-password/) ／ [自動入力](https://support.1password.com/ios-autofill/) ／ [Emergency Kit](https://support.1password.com/emergency-kit/) ／ [復旧コード](https://support.1password.com/recovery-codes/) ／ [2要素認証](https://support.1password.com/two-factor-authentication/) ／ [家族の復旧](https://support.1password.com/family-recovery-plan/) ／ [招待と承認](https://support.1password.com/add-remove-family-members/) ／ [iPhoneアプリ](https://1password.com/downloads/ios)

<p class="toc-return"><a href="#memo-toc">↑ 設定メモの目次へ戻る</a></p>

<h3 id="s4"><strong>Apple Account</strong></h3>

<h4><strong>2ファクタ認証と電話番号</strong></h4>

「設定」→名前→「サインインとセキュリティ」→「2ファクタ認証」を確認し、未設定なら案内に従って有効にする。登録した電話番号が今も受信できるものかも見る。

番号を増やすなら「信頼できる電話番号を追加」から確認まで済ませる。iPhoneをなくしても受信できる番号があると助かる。家族の番号なら先に了承をもらう。

<h4><strong>パスワードの変更</strong></h4>

同じ「サインインとセキュリティ」→「パスワードの変更」から、長くて使い回しのないものにする。1Passwordも更新。同じアカウントのiPadやMacで入り直すよう求められたら、新しいものを使う。

<h4><strong>復旧用連絡先を追加する</strong></h4>

1. 設定するiPhoneで「設定」→名前→「サインインとセキュリティ」→「復旧用連絡先」→「復旧用連絡先を追加」。

2. 候補か「ほかの連絡先を選択」から相手を選ぶ。ファミリー共有のメンバーなら自動追加。それ以外は、もう一方のiPhoneの「メッセージ」に届く依頼を承諾してもらう。

3. 設定したiPhoneの一覧に相手の名前が出たか確認する。

双方にiOS 15以降などの対応端末とiMessageが必要で、2ファクタ認証も求められる。古い端末がアカウントに残っていると、更新が必要なこともある。相手が写真やメールを見られる設定ではない。

<h4><strong>実際に復旧を手伝うとき</strong></h4>

コードを出すのは、連絡先を引き受けた側のiPhone。「設定」→名前→「サインインとセキュリティ」→「復旧用連絡先」→「以下の人のアカウント復旧用連絡先」にある相手の名前→「復旧用コードを取得」。復旧を始めた本人に直接伝える。近くの端末を使う方法が出たら、その案内で進める。

<h4><strong>古い端末とiCloudのWebアクセス</strong></h4>

「設定」→名前→下のデバイス一覧で、手放したものや知らないものがないか見る。端末名から情報を確かめ、不要なら「アカウントから削除」。盗まれた端末を「探す」から消す操作とは混同しない。

ブラウザでiCloudの写真・メールを使わないなら、iOS 26.4以降は「設定」→名前→「iCloud」→「iCloud.com」→「データアクセスを許可」をオフ。以前の版は「iCloud」内の「WebでiCloudデータにアクセス」をオフにする。

iPhoneの同期とiCloud.com/findでの端末探しは引き続き使える。PCのブラウザで写真やメールを使っている人は、その使い方への影響を確認して選ぶ。

公式の案内：[2ファクタ認証](https://support.apple.com/ja-jp/102660) ／ [電話番号](https://support.apple.com/ja-jp/122621) ／ [パスワード変更](https://support.apple.com/ja-jp/101567) ／ [復旧用連絡先](https://support.apple.com/ja-jp/102641) ／ [復旧を手伝う操作](https://support.apple.com/ja-jp/102608) ／ [端末一覧](https://support.apple.com/ja-jp/102649) ／ [Webアクセス](https://support.apple.com/ja-jp/102630)

<p class="toc-return"><a href="#memo-toc">↑ 設定メモの目次へ戻る</a></p>

<h3 id="s5"><strong>Googleアカウント</strong></h3>

Chromeで[Googleアカウント](https://myaccount.google.com/)を開く。Gmailアプリなら右上の写真→「Google アカウントの管理」でもよい。最初にメールアドレスを見て、設定するアカウントか確かめる。

<h4><strong>再設定用の連絡先とセキュリティ診断</strong></h4>

「セキュリティとログイン」→「Googleにログインする方法」→「再設定用の電話番号」「再設定用のメールアドレス」で、登録と確認を済ませる。予備メールは、このGoogleアカウントとは別に受信できるものを使う。続けて「推奨される対応」からセキュリティ診断を開き、表示された項目を確認する。

同じセキュリティ設定の「お使いのデバイス」→「すべてのデバイスを管理」で、手放した端末や知らないログインを確認し、必要ならログアウト。[連携アプリの一覧](https://myaccount.google.com/linkedapps)も見る。「Googleでログイン」を使うサービスは、別の入り方を用意する前に連携を切らない。

<h4><strong>パスワードの変更</strong></h4>

「個人情報」→「その他の情報とGoogleサービスの設定」→「パスワード」で本人確認し、長くて使い回しのないものへ変更。1Passwordも更新して、再ログインを求められた端末やアプリで使えるか試す。

<h4><strong>2段階認証とパスキー</strong></h4>

1. 「セキュリティとログイン」→「Googleにログインする方法」→「2段階認証プロセス」。未設定なら有効にし、iPhoneに届く確認などを最後まで進める。

2. 同じ設定の「バックアップコード」を取得し、iPhoneをなくしても取り出せる場所へ。各コードは1回限りで、新しく発行すると古い一式は使えなくなる。

パスキーは普段使うiPhoneで[設定画面](https://myaccount.google.com/signinoptions/passkeys)→「パスキーを作成する」→作成→画面ロックで本人確認。保存先がAppleの「パスワード」か1Passwordかを確認し、作成後に一覧と実際のログインを試す。

パスキーで入るときは、2段階認証の追加手順は省略される。パスワードで入る方法も残るなら、そのための2段階認証は有効にしておく。追加した電話番号などに待機期間が出たら、その案内で進める。

<h4><strong>Gmailの転送とフィルタはPCで</strong></h4>

ここだけはPC版Gmailで確認する。歯車→「すべての設定を表示」→「メール転送とPOP/IMAP」または「転送」で、知らない転送先がないか見る。「フィルタとブロック中のアドレス」も開き、身に覚えのない転送・削除の設定を確認して、不要なら外す。

公式の案内：[再設定用情報](https://support.google.com/accounts/answer/183723?co=GENIE.Platform%3DiOS&hl=ja) ／ [診断](https://support.google.com/accounts/answer/46526?hl=ja) ／ [端末一覧](https://support.google.com/accounts/answer/3067630?hl=ja) ／ [アプリ連携](https://support.google.com/accounts/answer/13533235?hl=ja) ／ [パスワード変更](https://support.google.com/accounts/answer/41078?co=GENIE.Platform%3DiOS&hl=ja) ／ [2段階認証](https://support.google.com/accounts/answer/185839?co=GENIE.Platform%3DiOS&hl=ja) ／ [バックアップコード](https://support.google.com/accounts/answer/1187538?co=GENIE.Platform%3DiOS&hl=ja) ／ [パスキー](https://support.google.com/accounts/answer/13548313?hl=ja) ／ [転送](https://support.google.com/mail/answer/10957?hl=ja) ／ [フィルタ](https://support.google.com/mail/answer/6579?hl=ja)

<p class="toc-return"><a href="#memo-toc">↑ 設定メモの目次へ戻る</a></p>

<h3 id="s6"><strong>メールとChrome</strong></h3>

<h4><strong>Gmailを用意して登録メールを変更する場合</strong></h4>

1. すでにGmailがあれば受信を確認する。新しく作るならGoogleのアカウント作成画面から個人用を作成し、再設定用情報と2段階認証も設定する。

2. Gmailアプリ→右上の写真→「別のアカウントを追加」→「Google」でログイン。別のメールから送って、受信・返信を試す。

3. 銀行・証券・カードなどの公式アプリの「登録情報」「会員情報」からメールを変更し、旧・新メールに届く確認の手続きまで済ませる。

4. メールがログインIDも兼ねるなら、ログインを試して1Passwordのユーザー名も更新する。済んだサービスをメモして次へ。

旧メールをGmailアプリに追加するだけでは、サービスの登録先は変わらない。変更と受信確認が済むまで旧メールは残しておく。Gmail以外のメールで作ったGoogleアカウントにGmailを追加する場合は、Googleへのログイン用メールも変わる。

<h4><strong>公式サイトを開く入口を作る</strong></h4>

Chromeで銀行などの公式サイトを開き、「…」→「ブックマークに追加」。次からは「…」→「ブックマーク」から開く。メールやSMSで急がされても、ログインはこの入口か公式アプリから進める。

Chromeの「…」→「設定」→「プライバシーとセキュリティ」→「セーフ ブラウジング」で「保護なし」になっていないか見る。保護強化機能はURLやページ内容などの追加情報を送信するので、家族の設定なら説明して選ぶ。金融用のChromeプロフィールを分ける機能はPC向けで、iPhoneには同じものがない。

公式の案内：[Googleアカウント作成](https://support.google.com/accounts/answer/27441?co=GENIE.Platform%3DiOS&hl=ja) ／ [Gmailへの追加](https://support.google.com/mail/answer/6078445?co=GENIE.Platform%3DiOS&hl=ja) ／ [既存アカウントへのGmail追加](https://support.google.com/accounts/answer/76194?hl=ja) ／ [ブックマーク](https://support.google.com/chrome/answer/188842?co=GENIE.Platform%3DiOS&hl=ja) ／ [保護設定](https://support.google.com/chrome/answer/9890866?co=GENIE.Platform%3DiOS&hl=ja)

<p class="toc-return"><a href="#memo-toc">↑ 設定メモの目次へ戻る</a></p>

<h3 id="s7"><strong>LINEとSNS</strong></h3>

<h4><strong>LINEは「ホーム」→歯車→「アカウント」から</strong></h4>

1. 「メールアドレス」が今も受信できるものか見る。変更するなら認証まで終える。

2. 「パスワード」を使い回しのないものへ変更し、1Passwordも更新。LINEは8～20文字で、英大文字・英小文字・数字・記号のうち3種類以上を使う。

3. 「Webログインの2要素認証」をオン。「ログイン中の端末」で知らないものがあればログアウトさせる。

4. iPhoneだけで使う人は「ログイン許可」をオフ。PC・iPadでも使う人はオンのまま、「パスワードでログイン」をオフにすると、サブ端末へのログインをQRコードや生体情報に限定できる。普段の方法でログインできるか試す。

この3つのスイッチは別々の設定だ。「パスワードでログイン」を切っても、すでにログイン中の端末は残るので、一覧も確認する。機種変更・引き継ぎ直後は、変更まで待つ案内が出る場合もある。

Face IDでPCなどにログインするなら、iPhoneの「設定」→「アプリ」→「LINE」→「Face ID」をオン。LINE側も「ホーム」→歯車→「アカウント」→「Face ID／Touch ID」→「許可する」で、連携済みになったか確認する。

<h4><strong>X</strong></h4>

プロフィール→「設定とプライバシー」→「アカウント」→「パスワードを変更する」。次に「セキュリティとアカウントアクセス」→「セキュリティ」→「2要素認証」で認証アプリを登録し、コード入力まで終える。バックアップコードの保存と1Passwordの更新も忘れずに。

<h4><strong>Instagramなど</strong></h4>

設定の「アカウントセンター」または「Metaアカウント」のセキュリティ設定から、対象プロフィールのパスワードと二段階認証を見直す。画面が移行中なので表示に合わせ、認証アプリの登録・コード入力・バックアップコードの保存まで進める。ほかのSNSも普段使うものから確認する。

公式の案内：[LINEの不正ログイン対策](https://help.line.me/line/smartphone?contentId=20000438&lang=ja) ／ [LINEのパスワード変更](https://help.line.me/line/smartphone?contentId=20000060&lang=ja) ／ [生体認証](https://help.line.me/line/smartphone?contentId=20018577&lang=ja) ／ [端末一覧](https://help.line.me/line/ios/?contentId=20008468&lang=ja) ／ [Xの2要素認証](https://help.x.com/en/managing-your-account/two-factor-authentication) ／ [Metaの画面変更](https://about.fb.com/ja/news/2026/04/meta-account/)

<p class="toc-return"><a href="#memo-toc">↑ 設定メモの目次へ戻る</a></p>

<h3 id="s8"><strong>銀行と証券とカード</strong></h3>

金融サービスは会社ごとに画面が違う。以下は楽天証券・楽天銀行などの例で、利用先に合うところを使う。

<h4><strong>楽天証券のパスキー</strong></h4>

設定済みなら、普段の公式サイト・アプリからログインを試す。新規設定は公式サイトにログイン→「マイメニュー」→「セキュリティ設定」→再認証→「パスキー認証に変更」などの作成案内へ。保存先を確認して作り、パスキーで入れるか試す。

<h4><strong>楽天証券で取引を制限する場合</strong></h4>

1. 「マイメニュー」→「セキュリティ設定」で再認証する。

2. 「取引の一時的な利用停止」→「取引やサービスの一時的な利用停止」→「設定」。

3. 止める範囲を選んで「認証へ進む」。登録電話番号への音声電話でワンタイムキーを受け取り、入力して確定。利用停止状況を確認する。

<div role="region" aria-label="楽天証券の利用停止設定の比較表（横にスクロールできます）" tabindex="0" style="overflow-x: auto;">
  <table style="min-width: 600px; white-space: nowrap;">
    <thead>
      <tr><th scope="col">設定の種類</th><th scope="col">投信の買付・積立</th><th scope="col">投信の売却</th><th scope="col">出金</th></tr>
    </thead>
    <tbody>
      <tr><td>投資信託の買付以外を停止</td><td>できる</td><td>停止</td><td>停止</td></tr>
      <tr><td>投資信託と出金以外を停止</td><td>できる</td><td>できる</td><td>できる</td></tr>
    </tbody>
  </table>
</div>

似た名前でも、売却・出金まで止まるかが違う。取り崩しや出金の予定に合わせて選ぶ。変更・解除も同じ画面で本人確認が必要になる。ログイン自体の停止は、普段の点検のついでには選ばない。

<h4><strong>楽天銀行の振込上限と通知</strong></h4>

楽天銀行アプリ→左上のアカウント→「セキュリティ設定」→「振込限度額設定」で一日の上限を変更する。必要な振込ができる金額にしておく。

通知はアカウント→「登録情報のメール設定」→通知先メール→「設定内容を変更する」→「取引通知メール」。宛先と受信設定を確認し、翌朝にまとめて届く時間帯なども使い方に合わせる。ほかの銀行も、ログイン・送金時の認証、振込上限、通知、登録連絡先を公式アプリで確認する。

<h4><strong>カードの利用通知</strong></h4>

三井住友カードはVpass→「メニュー」→「安心・安全サービス」→「ご利用通知サービス」→「設定の確認・変更」で通知方法を選ぶ。楽天カードはアプリ→「メニュー」→「アプリの設定」→「通知」で利用・明細のお知らせを設定する。複数枚ならカードごとに見る。

iPhoneの「設定」→「通知」→銀行・カードアプリ側でも通知を許可する。通知されない取引もあるので、明細も確認。使わない口座やカードを整理するなら、残高・引き落とし・継続課金を先に見る。

公式の案内：[楽天証券のパスキー](https://www.rakuten-sec.co.jp/smartphone/security/passkey/guide/) ／ [取引制限](https://www.rakuten-sec.co.jp/smartphone/security/account_lock/) ／ [楽天銀行の上限](https://www.rakuten-bank.co.jp/security/howto/account_management/payment_limit/) ／ [取引通知](https://www.rakuten-bank.co.jp/security/howto/account_management/notice_mail/setting.html) ／ [Vpassの通知](https://faq-mem.smbc-card.com/--69969bb710cec11a1c8f8c2d) ／ [楽天カードの通知](https://www.rakuten-card.co.jp/security/information-mail/)

<p class="toc-return"><a href="#memo-toc">↑ 設定メモの目次へ戻る</a></p>

<h3 id="s9"><strong>家のルーター</strong></h3>

本体のメーカーと型番を見て、公式サイトで更新とサポートの状況を確認する。使用年数だけでなく、更新が続いているかも見る。

<h4><strong>ASUS Routerアプリに対応した機種</strong></h4>

iPhoneをそのルーターのWi-Fiにつなぎ、アプリで対象を開く。「設定」→「ファームウェアアップデート」→「ファームウェアバージョンを確認」から更新し、再起動後に接続とバージョンを確かめる。

管理者パスワードは「設定」→「システム設定」→「ルーターログイン設定」→編集。変更後に再ログインし、1Passwordにも保存する。

<h4><strong>バッファローの対応機種</strong></h4>

AirStationアプリ（旧StationRadar）→「管理」→ルーター→「設定画面を表示する」→「設定画面を開く」からログイン。対応機種では「詳細設定」→「管理」→「ファームウェア更新」→「拡張設定」で自動更新を設定できる。機種ごとの説明書も確認する。

管理画面用のパスワードと、Wi-Fi接続用は別のもの。更新中は電源を切らない。管理情報が不明だからと初期化すると、インターネットの設定まで消えてしまう。

公式の案内：[ASUSの更新](https://www.asus.com/jp/support/faq/1045788/) ／ [管理者パスワード](https://www.asus.com/jp/support/faq/1047761/) ／ [AirStationの設定画面](https://www.buffalo.jp/support/faq/detail/124160320.html) ／ [自動更新の例](https://www.buffalo.jp/support/faq/detail/15923.html)

<p class="toc-return"><a href="#memo-toc">↑ 設定メモの目次へ戻る</a></p>

<h3 id="s10"><strong>探すと盗難デバイスの保護</strong></h3>

<h4><strong>「iPhoneを探す」をオンにする</strong></h4>

「設定」→名前→「探す」→「iPhoneを探す」で、「iPhoneを探す」「“探す”ネットワーク」「最後の位置情報を送信」をオンにする。家族の端末から探すにはファミリー共有などの設定も必要。Apple Accountは一人ずつ自分のものを使う。

<h4><strong>盗難デバイスの保護は最後に</strong></h4>

1. 「設定」→「Face IDとパスコード」（または「Touch IDとパスコード」）→パスコードを入力→「盗難デバイスの保護」をオン。

2. iOS 17.3以降が対象で、2ファクタ認証・生体認証・「探す」・位置情報の「利用頻度の高い場所」も必要になる。位置情報は「設定」→「プライバシーとセキュリティ」→「位置情報サービス」→「システムサービス」→「利用頻度の高い場所と経路」（旧名「利用頻度の高い場所」）で確認できる。

3. 自宅でも追加保護をかけるなら「セキュリティ継続が必要」などの選択欄で「常に」を選ぶ。

「常に」ではApple Accountのパスワード変更などに、生体認証と原則1時間の待機が必要になる。一部の操作はパスコードで代用できず、設定を手伝うときも持ち主の顔や指紋が必要だ。仕組みを確認し、重要な変更を済ませてから設定する。

公式の案内：[探す](https://support.apple.com/ja-jp/102648) ／ [盗難デバイスの保護](https://support.apple.com/ja-jp/120340) ／ [保護する場所の選択](https://support.apple.com/ja-jp/guide/iphone/iph17105538b/27/ios/27)

<p class="toc-return"><a href="#memo-toc">↑ 設定メモの目次へ戻る</a></p>

<h3 id="s11"><strong>最後の確認と困ったとき</strong></h3>

画面ロックを解除し、Apple・Google・金融・LINEに普段の方法で入れるか試す。パスキーの保存先、銀行の上限、通知先、復旧情報の保管場所は、使う本人にも分かるようにしておく。

再設定用の電話番号・メールで受信できるか、Appleの復旧用連絡先の一覧に相手が出ているかも確かめる。

復旧情報はiPhoneをなくしても取り出せる場所に。作業メモには確認日・済んだ項目・次回やることだけを残し、パスワードや認証コードは書き込まない。

<h4><strong>iPhoneをなくしたとき</strong></h4>

別の端末から[iCloudのデバイスを探す](https://www.icloud.com/find)を開き、「紛失としてマーク」する。盗まれた端末を「探す」のリストから削除すると保護を外すことになるので、消さない。必要に応じて携帯会社や金融機関にも連絡する。

<h4><strong>電話やSMSで急がされたとき</strong></h4>

警察・銀行・家族を名乗られても、暗証番号・認証コード・送金の話が出たら、一度切って家族に相談する。名前や住所、表示された電話番号だけでは判断せず、公式アプリや自分で調べた連絡先から確認。頼んでいないログイン用QRコードも読み取らない。

AIに設定を相談するときも、パスワード・復旧コード・認証用QRコードは貼らない。画面を見せるならメールアドレスやコードを隠し、操作に必要のないアクセス権は渡さない。

公式の案内：[Appleの紛失時の対処](https://support.apple.com/ja-jp/120837) ／ [警察庁の注意喚起](https://www.npa.go.jp/bureau/safetylife/sos47/new-topics/241218/02.html)

<p class="toc-return"><a href="#memo-toc">↑ 設定メモの目次へ戻る</a></p>

<h2 id="summary">📝<strong> まとめ</strong></h2>

「8割くらいはできている」と思っていたのに、見直したら重要なアカウントに短いパスワードが残っていた。普段使えていると、設定したときのままでも気にならなくなる。俺もそのままにしていたところがあった。

Watchtowerに並ぶ昔の登録を全部片付けるのは、正直なかなか大変だ。まずはGoogleやApple、普段使うSNSなど、破られたら困るものから。全部終わらせようとすると手に負えないので、一件ずつ進めていきたい。

パスワードを長くするだけでなく、入れなくなったときの復旧方法も一緒に確認しておきたい。家族の分は、俺だけ分かっていても困る。使う本人にも、何のための設定か、復旧に必要なものをどこに置くか、分かるようにしたい。

次は母と妻の父に会ったとき、このメモを開きながら説明して進めたい。最初から全部やるのではなく、必要なところから一緒に確認する。銀行の設定も含め、納得してもらいながら見ていくつもりだ。

<p class="toc-return"><a href="#article-toc">↑ 記事の目次へ戻る</a></p>
