# PowerApps ローコード開発演習

## 目次

  - [INTRO 概要と機能一覧](#intro-概要と機能一覧)
  - [DAY 1 Ch.1 SharePoint リストの作成](#day-1-ch.1-sharepoint-リストの作成)
  - [DAY 1 Ch.2 アプリの自動生成](#day-1-ch.2-アプリの自動生成)
  - [DAY 1 Ch.3 自動生成アプリの理解](#day-1-ch.3-自動生成アプリの理解)
  - [DAY 1 Ch.4 一覧画面の機能追加](#day-1-ch.4-一覧画面の機能追加)
  - [DAY 1 Ch.5 登録・編集のバリデーション](#day-1-ch.5-登録編集のバリデーション)
  - [DAY 1 Ch.6 詳細参照画面のカスタマイズ](#day-1-ch.6-詳細参照画面のカスタマイズ)
  - [DAY 1 Ch.7 削除機能と確認ダイアログの理解](#day-1-ch.7-削除機能と確認ダイアログの理解)
  - [DAY 1 Ch.8 検索・フィルタ機能](#day-1-ch.8-検索フィルタ機能)
  - [DAY 1 Ch.9 ページネーション](#day-1-ch.9-ページネーション)
  - [DAY 2 午前 Ch.10 デザインの統一と仕上げ](#day-2-午前-ch.10-デザインの統一と仕上げ)
  - [DAY 2 午前 Ch.11 工数比較と振り返り](#day-2-午前-ch.11-工数比較と振り返り)
  - [付録 付録A. PowerApps の「委任」問題](#付録-付録a.-powerapps-の委任問題)
  - [付録 付録B. バックアップとデータ保全](#付録-付録b.-バックアップとデータ保全)
  - [付録 付録C. GitHub へのアプリ保存（参考）](#付録-付録c.-github-へのアプリ保存参考)
  - [解答 演習の解答例](#解答-演習の解答例)

---

タスク管理アプリ ─ SharePoint リスト × キャンバスアプリ（2日間）

☰

## INTRO 概要と機能一覧

### 0-1. この研修の目的

Spring Boot 3 研修で **4日間** かけて構築した「タスク管理アプリ」と **まったく同じ機能** を、Microsoft Power Apps で構築します。同じ要件を両方の手法で体験し、ローコード開発の速さと限界を自分の手で確かめることが目的です。

### 0-2. Spring Boot 3 研修で作ったもの ─ 機能の棚卸し

まず、Spring Boot 3 研修で4日間かけて実装した機能を細かく分解します。この一覧が、PowerApps でどこまで追いつくかの「チェックリスト」になります。

| \#  | カテゴリ | 機能                           | Spring Boot での実装                               | 所要（目安） |
|-----|----------|--------------------------------|----------------------------------------------------|--------------|
| F01 | 環境     | 開発環境の構築                 | JDK + Eclipse + Docker + MySQL                     | 半日         |
| F02 | 環境     | DB テーブル作成                | Entity + DDL + data.sql                            | 1時間        |
| F03 | 画面     | 一覧画面（全件表示）           | Controller + Service + Repository + task-list.html | 2時間        |
| F04 | 画面     | 新規登録画面（フォーム）       | task-form.html + @PostMapping                      | 2時間        |
| F05 | 画面     | 編集画面（既存データ表示）     | task-form.html 兼用 + @GetMapping("/{id}/edit")    | 1.5時間      |
| F06 | 画面     | 詳細参照画面                   | task-detail.html + @GetMapping("/{id}")            | 1.5時間      |
| F07 | 操作     | 削除機能                       | @PostMapping("/{id}/delete") + JavaScript confirm  | 1時間        |
| F08 | 操作     | 保存後の一覧へのリダイレクト   | return "redirect:/tasks"                           | 0.5時間      |
| F09 | 検証     | タイトル必須バリデーション     | @NotBlank + BindingResult + エラー表示             | 1時間        |
| F10 | 検索     | キーワード検索（部分一致）     | findByTitleContaining                              | 1時間        |
| F11 | 検索     | ステータスフィルタ             | findByStatus + ドロップダウン                      | 1時間        |
| F12 | 検索     | 優先度フィルタ                 | findByPriority + ドロップダウン                    | 1時間        |
| F13 | 検索     | 複合条件検索（AND）            | findByTitleContainingAndStatusAndPriority          | 1.5時間      |
| F14 | 表示     | 優先度の色分け表示             | th:classappend + CSS                               | 0.5時間      |
| F15 | 表示     | 完了タスクの取り消し線         | th:classappend="done"                              | 0.5時間      |
| F16 | 表示     | 件数表示（全 N 件）            | model.addAttribute("count", ...)                   | 0.5時間      |
| F17 | ページ   | ページネーション（5件/ページ） | Pageable + PageRequest.of()                        | 2時間        |
| F18 | ページ   | ページ送りボタン（前へ/次へ）  | th:href + page パラメータ                          | 1時間        |
| F19 | ページ   | 現在ページ / 総ページ数表示    | page.getNumber() / page.getTotalPages()            | 0.5時間      |
| F20 | UI       | ヘッダー・テーマカラーの統一   | CSS :root + header 共通化                          | 1時間        |
| F21 | UI       | ID降順ソート（新しいものが上） | Sort.by("id").descending()                         | 0.5時間      |
| F22 | 配備     | アプリの公開（デプロイ）       | Docker コンテナ / jar ファイル                     | 1時間        |

> **📊 Spring Boot 研修の規模まとめ**
>
> **全22機能 ── 画面4種 ── ボタン8個 ── 検索3系統 ── ファイル10個以上 ── 所要4日間（32時間）**
>
> PowerApps 研修では、この22機能すべてを実装し、各章の末尾で「今どこまで追いついたか」をトラッカーで確認していきます。

### 0-3. 事前準備（環境確認）

以下の3点を研修開始前に確認してください。1つでもアクセスできない場合は、M365 管理者に連絡してください。

#### 確認①：PowerApps にアクセスできるか

1.  ブラウザで <a href="https://make.powerapps.com" target="_blank">https://make.powerapps.com</a> を開く
2.  M365 のアカウント（会社のメールアドレス）でサインインする
3.  **ゴール：**PowerApps のホーム画面が表示され、左メニューに「ホーム」「作成」「アプリ」等が見えていれば OK。「ライセンスがありません」「アクセスが拒否されました」と表示された場合は管理者に確認

#### 確認②：SharePoint リストを作成できるか（個人用）

本研修では SharePoint リストをデータベース代わりに使います。共有のチームサイトではなく、**自分だけがアクセスできる個人用リスト**で十分です。

1.  <a href="https://www.office.com" target="_blank">https://www.office.com</a> にサインイン → 左側のアプリ一覧（またはワッフルメニュー「⁝⁝⁝」）から Lists（Microsoft Lists）をクリック。見つからない場合は すべてのアプリ → Lists
2.  Microsoft Lists のホーム画面が開く。「マイ リスト」タブが表示されていることを確認
3.  画面上部の ＋ 新しいリスト ボタンが表示されているか確認する
4.  **ゴール：**「＋ 新しいリスト」ボタンが表示され、クリックすると「空白のリスト」等の選択肢が出る状態なら OK。ここで作成したリストは**自分だけがアクセスできる個人用リスト**になるため、研修中のテストデータが他のメンバーに見えることはない

> **💡 Microsoft Lists とは**
>
> Microsoft Lists は SharePoint リストの進化版で、M365 に標準搭載されています。「マイ リスト」に作成したリストは個人の OneDrive 領域に保存され、自分だけがアクセスできます。チームサイトに作成する必要はありません。PowerApps のデータソースとしても同じように使えます。

> **⚠️ 本番運用でアプリをチームに共有する場合**
>
> 本研修では個人用リスト（マイリスト）で十分ですが、完成したアプリを**社内のチームメンバーと共有して使う場合**は、リストの保存先を**チームの SharePoint サイト**に変更する必要があります。個人用リストのデータには作成者本人しかアクセスできないため、他のメンバーがアプリを開いてもデータが表示されません。
>
> 共有アプリを作る場合は、Microsoft Lists でリスト作成時に保存先を「マイ リスト」ではなく**チームの SharePoint サイト**に指定してください。リストの保存先を後から変更することはできないため、最初から共有サイトに作成する必要があります。

#### 確認③：ブラウザ

Microsoft Edge または Google Chrome の最新版を使用してください（どちらでも動作します）。

> **🔄 環境構築の比較 ─ これだけで F01 が完了**
>
> Spring Boot 研修では JDK・Eclipse・Docker Desktop・MySQL のインストールと設定に**半日（4時間）**かかりました。PowerApps では**ブラウザを開くだけ**です。インストール作業ゼロ。これが最初に体感するローコードのメリットです。

📊 機能達成トラッカー ── 事前準備完了時点 **1** / 22 機能達成（F01 環境構築 ✅）

## DAY 1 Ch.1 SharePoint リストの作成

Spring Boot 研修で MySQL に `tasks` テーブルを CREATE TABLE で作成した工程に相当します。

### 1-1. リストの作成

1.  事前準備（0-3 確認②）で開いた Microsoft Lists のホーム画面を開く（まだ開いていない場合は <a href="https://www.office.com" target="_blank">office.com</a> → Lists）
2.  画面上部の ＋ 新しいリスト をクリック
3.  「リストを作成」ダイアログが表示されるので、空白のリスト を選択
4.  名前に `タスク管理` と入力。保存先が「マイ リスト」になっていることを確認 → 作成 をクリック
5.  **ゴール：**「タスク管理」リストが開き、「Title」列だけがある空のリストが表示されれば OK。このリストは自分だけがアクセスできる個人用リスト

### 1-2. 列の追加（Spring Boot の Entity 定義に相当）

| Spring Boot（Entity フィールド） | 型                  | SharePoint 列名 | 列の種類                     | 備考                   |
|----------------------------------|---------------------|-----------------|------------------------------|------------------------|
| id                               | Long AUTO_INCREMENT | ID              | 自動                         | 追加不要（既定で存在） |
| title                            | @NotBlank String    | Title           | 1行テキスト                  | 追加不要（既定で存在） |
| description                      | String              | 説明            | 複数行テキスト               | ＋列の追加             |
| priority                         | String              | 優先度          | 選択肢（高/中/低）           | 既定値: 中             |
| status                           | String              | ステータス      | 選択肢（未着手/進行中/完了） | 既定値: 未着手         |
| dueDate                          | LocalDate           | 期限日          | 日付                         | ＋列の追加             |
| done                             | Boolean             | 完了フラグ      | はい/いいえ                  | 既定値: いいえ         |
| createdAt                        | @CreatedDate        | 登録日時        | 自動                         | 追加不要（既定で存在） |
| updatedAt                        | @LastModifiedDate   | 更新日時        | 自動                         | 追加不要（既定で存在） |

#### 列の追加手順（共通）

以下の手順を「説明」「優先度」「ステータス」「期限日」「完了フラグ」の5列分、繰り返します。

1.  列ヘッダー行の右端にある ＋ 列の追加 をクリック（列名が並んでいる行の一番右に「＋」が表示されている）
2.  ドロップダウンメニューから列の種類を選択（上表の「列の種類」列を参照）
3.  右側に設定パネルが表示されるので、「名前」欄に列名を入力。選択肢列の場合は、選択肢欄に値を1つ入力して Enter → 次の値を入力して Enter、を繰り返す
4.  保存 をクリック → リストに新しい列が追加される。続けて次の列を追加
5.  **ゴール：**5列すべて追加後、列ヘッダーに「Title」「説明」「優先度」「ステータス」「期限日」「完了フラグ」が横に並んでいれば OK

> **💡 ヒント：Spring Boot では何ファイル必要だったか**
>
> 同じテーブル定義のために、Spring Boot では `Task.java`（Entity）+ `TaskRepository.java`（Repository）+ `application.properties`（DB接続設定）の最低3ファイルが必要でした。SharePoint ではブラウザで列を追加するだけです。

### 1-3. テストデータの入力（data.sql に相当）

＋ 新しいアイテム で5件ほど入力します。

| Title                    | 説明                                  | 優先度 | ステータス | 期限日     |
|--------------------------|---------------------------------------|--------|------------|------------|
| APIドキュメント整備      | REST API仕様をSwaggerでドキュメント化 | 高     | 進行中     | 2026-06-15 |
| テスト仕様書の作成       | 結合テストの仕様書を作成              | 中     | 未着手     | 2026-07-10 |
| DB設計レビュー           | ER図のレビュー実施                    | 高     | 未着手     | 2026-06-05 |
| ログイン画面デザイン修正 | UI/UXチームの指摘反映                 | 低     | 完了       | 2026-04-10 |
| CI/CDパイプライン構築    | GitHub ActionsでCI/CD構築             | 中     | 進行中     | 2026-07-31 |

✏️ 演習 1-1：SharePoint リストの完成

「タスク管理」リストを作成し、全列の追加と5件のテストデータ入力を完了させてください。

📊 機能達成トラッカー ── Ch.1 完了時点 **2** / 22 機能達成

| 機能             | 状態    | 所要時間                  |
|------------------|---------|---------------------------|
| F01 環境構築     | ✅ 完了 | 0分（ブラウザを開くだけ） |
| F02 テーブル作成 | ✅ 完了 | 約15分                    |

Spring Boot では F01+F02 に**約5時間**。PowerApps では**約15分**。

## DAY 1 Ch.2 アプリの自動生成

ここが PowerApps 最大の特長です。データソースを指定するだけで、**一覧・詳細・登録・削除の機能を備えたアプリが一瞬で生成**されます。

### 2-1. アプリを生成する

本研修は**新しいレスポンシブ構造（単一画面 MainScreen1）**を前提にしています。この構造を生成するには、必ず **make.powerapps.com から作成**してください。

> **⚠️ リストの「統合」メニューからは作成しないでください**
>
> SharePoint リストの 統合（Integrate）→ Power Apps → アプリの作成 からでもアプリは生成できますが、**この方法では古い3画面構成（BrowseScreen1 / DetailScreen1 / EditScreen1）のモバイル向けアプリが生成されます**。本研修テキストの新構造（MainScreen1 + コンテナ）とは一致しないため、**使わないでください**。必ず以下の make.powerapps.com からの手順で作成してください。

#### make.powerapps.com から作成する（新構造・本研修の前提）

> **⚠️ 事前準備：自分のマイリストの「サイト URL」を控える（必須）**
>
> マイリスト（個人用リスト）は OneDrive 領域に保存されるため、**後の手順でサイト一覧には表示されません**。URL を直接入力する必要があるので、先に控えておきます。
>
> 1.  Ch.1 で作成した「タスク管理」リストを Microsoft Lists で開く（<a href="https://www.office.com" target="_blank">office.com</a> → Lists → マイリストの「タスク管理」をクリック）
> 2.  ブラウザのアドレスバーに表示される URL を見る。`https://〇〇〇-my.sharepoint.com/personal/△△△/Lists/タスク管理/...` のような形式になっている
> 3.  このうち **`https://〇〇〇-my.sharepoint.com/personal/△△△` までの部分**（`/Lists/...` の手前まで）をコピーしてメモ帳などに控える。これが「サイト URL」になる  
>     例：`https://contoso-my.sharepoint.com/personal/taro_contoso_com`（`@` や `.` が `_` に置き換わる）

1.  ブラウザで <a href="https://make.powerapps.com" target="_blank">https://make.powerapps.com</a> にアクセス → M365 アカウントでサインイン
2.  左メニューの + 作成 をクリック → 画面中央の「データから開始」セクションにある SharePoint を選択（Microsoft Lists で作成した個人用リストも、この「SharePoint」コネクタ経由で接続します）
3.  SharePoint サイトを指定する画面になる。マイリストは一覧（最近使ったサイト）には出ないので、**URL 入力欄に、事前準備で控えた「サイト URL」を貼り付けて 接続 をクリック**（`https://〇〇〇-my.sharepoint.com/personal/△△△` の形式）
4.  そのサイト内のリスト一覧が表示されるので `タスク管理` を選択 → アプリの作成 をクリック
5.  「アプリを作成しています...」と表示されて数十秒〜1分ほど待つ
6.  **ゴール：**PowerApps Studio が開き、画面左のツリービューに `MainScreen1` が表示され、その配下に `ScreenContainer1` → `BodyContainer1` → `SidebarContainer1`（左ペイン）と `RightContainer1`（右ペイン）の階層が見えていれば OK

> **💡 なぜ URL を直接入力するのか（7人同時開発の理由）**
>
> 本研修では受講者が**それぞれ自分のマイリスト**で開発します。チームの共有 SharePoint サイトにリストを作ると、7人分のテスト用リストが残ってゴミになり、後片付けが大変です。マイリストなら各自の OneDrive 領域に保存され、他の人には見えず、研修後も自分で消すだけで済みます。  
> その代わり、マイリストは「データから開始」のサイト一覧に出てこないため、上記のように**サイト URL を直接入力する**のが正しい手順です。

> **💡 それでも接続できない・SharePoint が選べない場合**
>
> 上記のサイト URL を入力しても接続できない、そもそも「データから開始」に SharePoint が出てこない場合は、以下を順に試してください。
>
> 1.  **接続を先に作る：**左メニュー 接続 → + 新しい接続 → SharePoint を選んで接続を作成してから、再度「+ 作成 → データから開始 → SharePoint」を行う
> 2.  **URL を再確認：**事前準備で控えた URL が `/Lists/...` の手前（`.../personal/△△△` まで）になっているか確認する。`/Lists/タスク管理` まで含めてしまうとエラーになる
> 3.  **リスト名を直接入力：**サイトには接続できたがリストが一覧に出ない場合、「カスタム テーブル名の入力」ボックスに `タスク管理` と直接入力する（公式に用意された回避策）
> 4.  **権限を確認：**それでも出ない場合は、Power Apps の利用権限や SharePoint への接続が組織のポリシー（DLP）で制限されている可能性がある。IT 管理者に「Power Apps から SharePoint コネクタへの接続可否」を確認する
>
> **⚠️ 注意：**うまくいかないからといって、リストの「統合」メニューや、空のキャンバスアプリ＋データ追加で代替しないでください。前者は**古い3画面構成**に、後者は**自動生成されない（手動で全画面を作る必要がある）**ため、いずれも本研修の新構造と一致しません。

### 2-2. 自動生成された画面構造の確認

自動生成されたアプリは、**単一の画面（MainScreen1）にコンテナを組み合わせたレスポンシブ構造**になっています。以前は「一覧」「詳細」「編集」の3画面を遷移する形でしたが、現在は**1画面内で左ペインにギャラリー、右ペインに詳細/編集フォームを並べる構造**です。

［図（テキスト抽出）：自動生成アプリの構造（MainScreen1 内） / ScreenContainer1（垂直） / TableNameContainer1（ヘッダー：タスク管理） / BodyContainer1（水平） / SidebarContainer1（左） / SearchContainer1 (SearchInput1) / NewRecordButtonBackground1 (+ 新規) / RecordsGallery1 / （一覧アイテムが並ぶ） / RightContainer1（右） / DetailsForm1（閲覧）/ EditForm1（編集） / 編集（✏）/ 削除（🗑）/ 保存（✓）/ 取消（✗） / 変数（newMode / editMode）で表示モード切替 / + DeleteConfirmDialogContainer1（削除確認・通常は非表示）］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

### 2-3. ツリービューでの確認

画面左の「ツリービュー」を展開すると、以下の階層構造が確認できます。

| 階層 | コントロール名                        | 役割                               |
|------|---------------------------------------|------------------------------------|
| 1    | `MainScreen1`                         | すべてを含む単一の画面             |
| 2    | └ `ScreenContainer1`                  | 全体を縦に分割する垂直コンテナ     |
| 3    | 　├ `TableNameContainer1`             | ヘッダー（タイトルバー）           |
| 3    | 　└ `BodyContainer1`                  | 本体を左右に分割する水平コンテナ   |
| 4    | 　　├ `SidebarContainer1`             | 左ペイン（検索＋一覧）             |
| 5    | 　　│ ├ `SearchContainer1`            | 検索ボックス（`SearchInput1`）     |
| 5    | 　　│ ├ `NewRecordButtonBackground1`  | 「+ 新規」ボタン                   |
| 5    | 　　│ └ `RecordsGallery1`             | レコード一覧ギャラリー             |
| 4    | 　　├ `RightContainer1`               | 右ペイン（詳細/編集フォーム）      |
| 5    | 　　│ └ `DetailsForm1` / `EditForm1`  | 詳細表示・編集フォーム             |
| 4    | 　　└ `DeleteConfirmDialogContainer1` | 削除確認ダイアログ（通常は非表示） |

> **⚠️ 旧情報との違いに注意**
>
> インターネット上の古い情報や、以前の研修資料には「`BrowseScreen1`」「`DetailScreen1`」「`EditScreen1`」の3画面が生成されると書かれていることがあります。これは**2023年5月以前のレイアウト**です。2023年6月以降は、上記のレスポンシブな単一画面構造が標準になっています。本研修テキストは新構造に準拠しています。

> **⚠️ 重要：コントロール挿入時は「親コンテナを先に選択」する**
>
> 新構造はコンテナで構成されているため、ラベル・ボタン・ドロップダウン等を 挿入 メニューから追加する際、**事前にツリービューで挿入先の親コンテナを選択しておかないと、意図しない場所（最上位の MainScreen 直下など）に挿入されてしまいます**。
>
> 本研修テキストの操作手順では「○○コンテナを選択した状態で 挿入 → ...」という指示を都度書いていますので、必ずツリービューで指定された親コンテナをクリックしてから挿入してください。
>
> もし誤った場所に挿入してしまった場合は、ツリービューで挿入したコントロールをドラッグして正しいコンテナへ移動できます。

### 2-4. CRUD 機能と Spring Boot の対応

| 機能         | 新構造での実装                                  | Spring Boot で作ったもの               | Spring Boot 所要 |
|--------------|-------------------------------------------------|----------------------------------------|------------------|
| **一覧表示** | `RecordsGallery1`（左ペイン）                   | Controller list() + task-list.html     | 2時間            |
| **詳細参照** | `DetailsForm1`（右ペイン・閲覧モード）          | Controller detail() + task-detail.html | 1.5時間          |
| **新規登録** | `EditForm1`（右ペイン・新規モード）             | Controller create() + task-form.html   | 2時間            |
| **編集**     | `EditForm1`（右ペイン・編集モード）             | Controller edit() + task-form.html     | 1.5時間          |
| **削除確認** | `DeleteConfirmDialogContainer1`（自動生成済み） | JavaScript confirm() + 削除Controller  | 1時間            |

> **🔄 ここが最大の違い！**
>
> Spring Boot では上記5機能のために **最低10ファイル**（Entity, Repository, Service, Controller, HTML×4, CSS, application.properties）を手書きし、**約8時間** かかりました。PowerApps では SharePoint リストを選ぶだけで**約1分**です。さらに、**削除確認ダイアログまで自動で生成されます**。

### 2-5. プレビューで動作確認

1.  画面右上の ▶（プレビュー）をクリック（または `F5`）
2.  左ペインの一覧にテストデータが表示されることを確認
3.  一覧のアイテムをクリック → 右ペインに詳細情報が表示される（画面遷移ではない）
4.  右ペイン上部の**編集アイコン（✏）**をクリック → フォームが編集モードに切り替わる
5.  データを変更して**保存アイコン（✓）**をクリック → 保存されて閲覧モードに戻る
6.  左ペイン上部の**「+ 新規」**をクリック → 右ペインが新規登録モードに → 入力して保存
7.  右ペインの**削除アイコン（🗑）**をクリック → 削除確認ダイアログが画面中央に表示される
8.  `Esc` でプレビュー終了 → `Ctrl + S` または画面右上の保存アイコンで保存

> **⚠️ こまめに保存してください**
>
> PowerApps Studio はクラウド上のエディタです。PC のハングアップなどでブラウザがダウンすると、未保存の変更は保存されません。演習の区切りごとに `Ctrl + S` または画面右上の 保存 アイコンで保存する習慣をつけてください。

✏️ 演習 2-1：自動生成アプリの全機能テスト

プレビューで以下を確認してください。

1.  一覧表示（F03）、新規登録（F04）、編集（F05）、詳細参照（F06）、削除確認（F07の一部）が動作する
2.  登録・編集の保存後に閲覧モードに戻る（F08の代替）
3.  ブラウザ幅を縮めても、レイアウトが自動で調整される（レスポンシブ）

この時点で、Spring Boot 研修の Day 1〜Day 2 後半の成果に相当するものが手に入っています。

📊 機能達成トラッカー ── Ch.2 完了時点（自動生成直後） **9** / 22 機能達成

| 機能                   | 状態        | 備考                               |
|------------------------|-------------|------------------------------------|
| F01 環境構築           | ✅          |                                    |
| F02 テーブル作成       | ✅          |                                    |
| F03 一覧画面           | ✅ 自動生成 | RecordsGallery1（左ペイン）        |
| F04 新規登録画面       | ✅ 自動生成 | EditForm1（newMode=true）          |
| F05 編集画面           | ✅ 自動生成 | EditForm1（editMode=true）         |
| F06 詳細参照画面       | ✅ 自動生成 | DetailsForm1（右ペイン）           |
| F07 削除機能           | ✅ 自動生成 | DeleteConfirmDialogContainer1 付き |
| F08 保存後リダイレクト | ✅ 自動生成 | OnSuccess で閲覧モードに戻る       |
| F21 ID降順ソート       | ✅ 自動生成 | SortByColumns 済み                 |
| F09〜F20               | ─ 未実装    | Ch.4 以降で順次実装                |

自動生成だけで **9/22 機能（41%）**が完了。**削除機能まで含まれている**のが新構造の大きな特徴。Spring Boot では同じ9機能に**約13時間（1.5日強）**かかりました。

## DAY 1 Ch.3 自動生成アプリの理解

### 3-1. PowerApps と Spring Boot MVC の対応

| Spring Boot の層       | 役割                     | PowerApps の対応                                  |
|------------------------|--------------------------|---------------------------------------------------|
| Thymeleaf テンプレート | 画面の表示               | Gallery / Form / ラベル等のコントロール           |
| Controller             | リクエスト受付・画面遷移 | アイコンの OnSelect / SubmitForm / 状態変数の切替 |
| Service                | ビジネスロジック         | Power Fx 数式（If, Switch, Filter...）            |
| Repository             | DB操作                   | SharePoint コネクタ（Patch / Remove / Filter）    |
| MySQL                  | データ保存               | SharePoint リスト                                 |

### 3-2. 単一画面 + 状態変数の仕組み

新構造のアプリは画面遷移しません。代わりに、**右ペインの表示モード**を変数で切り替えます。Spring Boot の MVC の「画面遷移」が、PowerApps では「変数による表示切替」に置き換わっています。

| 状態変数      | 値の意味                       | Spring Boot 相当                               |
|---------------|--------------------------------|------------------------------------------------|
| `newMode`     | true：新規登録モード           | GET /tasks/new                                 |
| `editMode`    | true：編集モード               | GET /tasks/{id}/edit                           |
| `deleteMode`  | true：削除確認ダイアログ表示中 | JavaScript confirm()                           |
| `CurrentItem` | 選択中のレコード               | @PathVariable Long id でロードしたエンティティ |
| すべて false  | 閲覧モード（デフォルト）       | GET /tasks/{id}（詳細画面）                    |

### 3-3. ツリービューとプロパティの見方

1.  画面左の「ツリービュー」で `MainScreen1` → `ScreenContainer1` → `BodyContainer1` → `SidebarContainer1` → `RecordsGallery1` と展開してクリック
2.  画面上部の「数式バー」に `Items` プロパティの値が表示される
3.  数式バー左のドロップダウンでプロパティを切り替え可能（`Items`, `OnSelect` 等）

### 3-4. 自動生成された Gallery の Items を読む

**RecordsGallery1.Items（自動生成）**

    SortByColumns(
        Filter(
            タスク管理,
            StartsWith(Title, SearchInput1.Value)
        ),
        "ID",
        SortOrder.Descending
    )

この1行で「検索ボックスで絞り込み、ID降順でソートして表示」を実現しています。Spring Boot では Controller → Service → Repository → SQL の4段階が必要でした。

> **💡 自動生成される検索関数は環境により異なる場合がある**
>
> 上記は `StartsWith`（前方一致）が標準の場合です。これは SharePoint への委任が可能で警告が出ないため、現行の Microsoft 公式テンプレートで採用されています。一方、Copilot 経由のアプリ生成や、PowerApps のテンプレート種別によっては `Search`（部分一致）が自動生成される場合もあります。
>
> 自分の環境で `Search(タスク管理, SearchInput1.Value, "Title")` のように `Search` が使われている場合は、Ch.8 で部分一致への変更作業は不要です（すでに部分一致になっているため）。その代わり、数式バーに委任警告（青い下線）が表示されているはずです。

### 3-5. 「+ 新規」ボタンの仕組み

左ペインの「+ 新規」（`NewRecordButtonBackground1`）には以下の数式が設定されています。

**NewRecordButtonBackground1 の OnSelect**

    NewForm(EditForm1);
    UpdateContext({newMode: true, editMode: false})

`NewForm` でフォームを新規モードに切り替え、変数 `newMode` を true にすることで、右ペインの表示を新規登録用のレイアウトに変えています。

### 3-6. Power Fx と Spring Boot のコード対応表

| やりたいこと     | Spring Boot（Java）                    | PowerApps（Power Fx）                                  |
|------------------|----------------------------------------|--------------------------------------------------------|
| 全件取得         | `taskRepository.findAll()`             | `タスク管理`（リスト名を書くだけ）                     |
| 条件絞り込み     | `findByStatus("未着手")`               | `Filter(タスク管理, ステータス.Value="未着手")`        |
| 部分一致検索     | `findByTitleContaining(kw)`            | `Search(タスク管理, kw, "Title")`                      |
| 新規モードへ     | `return "task-form"`（空のtaskを渡す） | `NewForm(EditForm1); UpdateContext({newMode: true})`   |
| 編集モードへ     | `return "task-form"`（既存taskを渡す） | `EditForm(EditForm1); UpdateContext({editMode: true})` |
| 保存             | `taskRepository.save(task)`            | `SubmitForm(EditForm1)`                                |
| 削除             | `taskRepository.deleteById(id)`        | `Remove(タスク管理, CurrentItem)`                      |
| 閲覧モードへ戻る | `return "redirect:/tasks/{id}"`        | `UpdateContext({newMode: false, editMode: false})`     |

✏️ 演習 3-1：自動生成コードの読解

以下のコントロールの `OnSelect` または `OnSuccess` を確認し、Spring Boot のどのメソッドに対応するか考えてみてください。

1.  `NewRecordButtonBackground1`（「+ 新規」）の `OnSelect`
2.  `EditForm1` の `OnSuccess`（保存成功時の処理）
3.  右ペインの編集アイコン（`EditIconButton1` 等）の `OnSelect`

[→ 解答例はこちら](#answers)

## DAY 1 Ch.4 一覧画面の機能追加

自動生成された一覧画面に、Spring Boot 研修で実装した表示機能を追加します。まず**機能を**作ります（デザインの統一は最終章で行います）。

### 4-1. Gallery の表示項目を確認・調整（F14, F15, F16）

新構造の `RecordsGallery1` はすでに「Title + Subtitle」のレイアウトでアイテムが表示されています。ツリーで `RecordsGallery1` を展開し、中の各ラベル（`Title1`、`Subtitle1` など、連番命名）の `Text` を確認してください。

#### Subtitle ラベルに優先度＋ステータスを表示

1.  ツリーで `RecordsGallery1` を展開 → 中にある Subtitle ラベル（自動生成では `Subtitle1` などの連番）をクリック
2.  数式バーで `Text` プロパティを以下に変更：

**Subtitle ラベルの Text**

    "優先度: " & ThisItem.優先度.Value & "　|　" & ThisItem.ステータス.Value

> **💡 .Value が必要な理由**
>
> SharePoint の「選択肢」列は内部的に `{Value: "高"}` というレコード構造です。表示テキストを取り出すには `.Value` を付けます。

> **⚠️ 列名のエラーが出る場合：内部名と表示名の違い**
>
> 「`優先度` という名前は認識されません」というエラーが数式バーに出る場合があります。これは SharePoint 列の**内部名**と**表示名**が異なるためです。日本語で列を作成した直後は両者が一致しますが、後から表示名を変更すると内部名はそのまま残ります。
>
> 対処法：SharePoint リスト → 列ヘッダー → 列の設定 → 編集 で内部名を確認するか、最初に英語名で作成して後から表示名を日本語に変更すると安全です。本研修では最初から日本語名で作成しているため、通常は問題ありません。

#### 期限日ラベルの追加

1.  **ツリーで `RecordsGallery1` をクリックして選択**した状態で（重要：これをしないと意図しない場所に挿入される）、上部メニューの 挿入 → テキスト → テキスト ラベル を追加し、Subtitle の下に配置
2.  `Text`: `"期限: " & Text(ThisItem.期限日, "yyyy/mm/dd")`
3.  **ゴール：**プレビューで一覧の各行に「タイトル」「優先度: 高 \| 進行中」「期限: 2026/06/15」の3行が表示される

#### 優先度の色分け（F14）

Subtitle ラベルの `Color` プロパティに条件式を設定します。

**Subtitle ラベルの Color**

    Switch(ThisItem.優先度.Value,
        "高", ColorValue("#D32F2F"),
        "中", ColorValue("#F57C00"),
        "低", ColorValue("#388E3C"),
        Color.DarkGray
    )

> **💡 Subtitle ラベル全体の色が変わる点に注意**
>
> この実装では「優先度: 高 \| 進行中」の行全体が優先度に応じた色になります。厳密に「優先度」部分だけを色分けしたい場合は、Gallery 内で優先度用とステータス用のラベルを別々に配置してください。研修では簡便さを優先し、1ラベルでの実装とします。

#### 完了タスクの取り消し線（F15）

Title ラベル（自動生成名は `Title1` などの連番）の `Strikethrough` プロパティ: `ThisItem.ステータス.Value = "完了"`

#### 件数表示ラベル（F16）

1.  **ツリーで `SidebarContainer1` → `SearchContainer1` をクリックして選択**した状態で（重要：先にコンテナを選択しないと意図しない場所に挿入される）、挿入 → テキスト → テキスト ラベル を追加
2.  `Text`: `"全 " & CountRows(RecordsGallery1.AllItems) & " 件"`

> **💡 AllItems は「読み込み済みの件数」を返す**
>
> `RecordsGallery1.AllItems` は Gallery に読み込まれているデータの件数を返します。委任制限により、大量データでは全件取得できずに件数が不正確になる可能性があります（詳細は付録A）。研修規模（10〜20件）では問題なく動作します。
>
> なお、Ch.9 でページネーションを導入すると AllItems は「現在ページの件数」しか返さなくなるため、このラベルの式は **Ch.9-4 で更新します**（この時点ではこのままで OK）。

✏️ 演習 4-1：一覧画面の表示カスタマイズ

プレビューで以下をすべて確認してください。

1.  Gallery の各行に「タイトル」「優先度: 高 \| 進行中」「期限: 2026/06/15」の3行が表示されている
2.  優先度「高」のタスクは赤色、「中」はオレンジ、「低」は緑で表示されている
3.  ステータスが「完了」のタスクにはタイトルに取り消し線が付いている
4.  検索ボックスの横に「全 5 件」のような件数表示が出ている

📊 機能達成トラッカー ── Ch.4 完了時点 **12** / 22 機能達成

| 今回追加                 | 状態                        |
|--------------------------|-----------------------------|
| F14 優先度の色分け       | ✅ Switch + ColorValue      |
| F15 完了タスク取り消し線 | ✅ Strikethrough プロパティ |
| F16 件数表示             | ✅ CountRows                |

半日でSpring Boot 研修 Day 2 終了時点の機能量を超えました。

## DAY 1 Ch.5 登録・編集のバリデーション

### 5-1. タイトル必須チェック（F09）

Spring Boot では `@NotBlank` + `BindingResult` で実装した部分です。新構造では、右ペインに配置された**保存アイコン（✓）**の OnSelect を変更します。

1.  ツリーで `RightContainer1` を展開し、保存アイコン（自動生成では `SaveIconButton1` 等の名前）を選択。アイコンの見た目はチェックマーク（✓）
2.  数式バーで現在の `OnSelect` を確認（通常は `SubmitForm(EditForm1)`）
3.  ツリーで `EditForm1` を展開し、Title 列の入力コントロール名を確認（自動生成では `DataCardValue1`、`DataCardValue2` のように連番）
4.  保存アイコンの `OnSelect` を以下に変更（`DataCardValue1` は実名に置き換える）：

**保存アイコン（✓）の OnSelect**

    If(
        IsBlank(DataCardValue1.Text),   // Title 列の入力コントロール（実名に置換）
        Notify("タイトルは必須です", NotificationType.Error),
        SubmitForm(EditForm1)
    )

> **💡 DataCardValue の実名を確認する方法**
>
> 自動生成されたフォームでは、入力コントロールは `DataCardValue1`、`DataCardValue2`...と連番で命名されます。Title 列に対応するコントロールの正確な名前を確認する確実な方法は：
>
> 1.  フォーム上の**Title 入力欄を直接クリック**する
> 2.  ツリービューで自動的に対応するコントロール名がハイライトされる
> 3.  その名前を数式にコピーして使用
>
> または、ツリービューで `EditForm1` を展開すると、各列に対応する DataCard（カード名は環境・言語設定により `Title_DataCard1`、`DataCard1` など若干異なる）が並んでいるので、Title 列のカードを展開して中の入力コントロールを確認します。

### 5-2. ヘッダータイトルの動的切り替え

Spring Boot では URL パスで新規 (`/new`) と編集 (`/{id}/edit`) を区別していました。PowerApps では状態変数 `newMode` で判定します。

1.  ツリーで `TableNameContainer1` → `TableNameLabel1`（ヘッダーのタイトルラベル）を選択
2.  `Text` プロパティを以下に変更：

**TableNameLabel1 の Text**

    If(
        newMode, "タスクの新規登録",
        editMode, "タスクの編集",
        "タスク管理"
    )

### 5-3. 保存成功時の通知と閲覧モードへの復帰（F08 の強化）

新構造では「画面遷移」ではなく「状態変数のリセット」で閲覧モードに戻ります。自動生成の `EditForm1.OnSuccess` には UpdateContext がすでに記述されています。**その直前の行**に Notify を1行追加します。

1.  ツリーで `EditForm1` を選択 → `OnSuccess` を確認
2.  既存の `UpdateContext({...})` 行の**上**に Notify を1行追加：

**EditForm1 の OnSuccess（修正後）**

    Notify("保存しました", NotificationType.Success);   // ← この1行を追加
    // 以下は自動生成（変更しない）
    UpdateContext({CurrentItem: Self.LastSubmit, editMode: false, newMode: false})

✏️ 演習 5-1：バリデーションの動作確認

プレビューで以下をすべて確認してください。

1.  左ペインの「+ 新規」をクリック → ヘッダーが「タスクの新規登録」に変わる
2.  タイトルを空のまま保存アイコン（✓）をクリック → 「タイトルは必須です」のエラー通知が画面上部に表示される
3.  タイトルを入力して保存 → 「保存しました」の成功通知が表示され、右ペインが閲覧モードに戻る
4.  一覧からアイテムを選択 → 右ペインに詳細表示 → 編集アイコン（✏） → ヘッダーが「タスクの編集」に変わる

📊 機能達成トラッカー ── Ch.5 完了時点 **13** / 22 機能達成（+F09 バリデーション）

## DAY 1 Ch.6 詳細参照画面のカスタマイズ

新構造では、左ペインでアイテムを選択すると**右ペインに自動的に詳細が表示**されます（画面遷移なし）。表示には自動生成された `DetailsForm1` が使われます。

### 6-1. 表示フィールドの整理

1.  ツリーで `RightContainer1` を展開 → `DetailsForm1` を選択
2.  右パネルで フィールドの編集 をクリック
3.  表示する列を確認：Title, 説明, 優先度, ステータス, 期限日, 完了フラグ
4.  不要な列（添付ファイル等）が含まれていれば、三点リーダー … → 削除 で外す
5.  同じ手順で `EditForm1`（編集モード用フォーム）も整理

> **💡 DetailsForm1 と EditForm1 は別コントロール**
>
> 新構造では閲覧用の `DetailsForm1` と編集用の `EditForm1` が別々のコントロールとして自動生成されています。状態変数（`newMode`/`editMode`）の値によって、どちらかが表示される仕組みです。両方のフォームで同じフィールド構成にしておくと、閲覧と編集で表示項目が一致します。

これで F06（詳細参照画面）が Spring Boot 研修の `task-detail.html` と同等になります。

✏️ 演習 6-1：詳細参照の動作確認

プレビューで以下をすべて確認してください。

1.  左ペインのアイテムをクリック → 右ペインに詳細が表示される（画面遷移はしない）
2.  右ペインに「Title」「説明」「優先度」「ステータス」「期限日」「完了フラグ」の全項目が表示されている
3.  添付ファイル等の不要な項目が表示されていない
4.  編集アイコン（✏）をクリック → 同じフォームが編集モードに切り替わる

## DAY 1 Ch.7 削除機能と確認ダイアログの理解

新構造では、削除機能と確認ダイアログがすでに自動生成されています。本章ではその仕組みを理解し、必要に応じてメッセージのカスタマイズを行います。

### 7-1. 自動生成された削除機能の仕組み

右ペインに配置された**削除アイコン（🗑）**と、画面中央に隠れている `DeleteConfirmDialogContainer1` によって削除確認フローが実現されています。

［図（テキスト抽出）：自動生成された削除フロー / 🗑 削除アイコン / deleteMode = true に / 確認ダイアログ表示 / DeleteConfirmDialogContainer1 / 「はい」ボタン / Remove(タスク管理, ...) / 「いいえ」ボタン / deleteMode = false に / すべて自動生成済み・コードを書く必要なし / DeleteConfirmDialogContainer1 の Visible プロパティは「deleteMode」変数を参照］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

### 7-2. 削除アイコンの OnSelect を確認

1.  ツリーで `RightContainer1` を展開 → 削除アイコン（自動生成では `DeleteIconButton1`、または `DeleteIcon1`、`TrashIcon1` 等、環境により名称が異なる場合あり）を選択。アイコンはゴミ箱（🗑）の形
2.  `OnSelect` プロパティを確認：

**削除アイコン（🗑）の OnSelect（自動生成）**

    UpdateContext({
        deleteMode: true,
        deleteCancelled: false,
        selectedRecord: RecordsGallery1.Selected
    })

### 7-3. 削除確認ダイアログのカスタマイズ（任意）

確認メッセージを日本語化したい場合は、ダイアログ内のラベルを修正します。

1.  ツリーで `DeleteConfirmDialogContainer1` を展開 → 内部のメッセージラベル（タイトル・本文）を選択
2.  `Text` を `"このタスクを削除しますか？"` 等に変更（タイトルや本文ラベルは自動生成では英語表記の場合がある）
3.  「Confirm」「Cancel」ボタンのラベルも「削除」「キャンセル」に変更

### 7-4. 削除成功時の通知を追加

確認ダイアログの「削除」ボタンの OnSelect には、すでに Remove と UpdateContext が自動生成されています。**Remove の直後の行**に Notify を追加してください。

1.  ダイアログ内の「削除」ボタン（自動生成では `ConfirmDeleteButton1` 等の連番命名）を選択
2.  既存の `OnSelect` を確認（おおむね下記のような構造になっている）：

**「削除」ボタンの OnSelect（自動生成・修正前）**

    Remove(タスク管理, selectedRecord);
    UpdateContext({deleteMode: false})

`Remove` の**直後の行**に Notify を1行追加：

**「削除」ボタンの OnSelect（修正後）**

    Remove(タスク管理, selectedRecord);
    Notify("削除しました", NotificationType.Success);   // ← この1行を追加
    UpdateContext({deleteMode: false})

> **💡 自動生成コードは環境によって若干異なります**
>
> 自動生成された OnSelect には、上記以外にも `ResetForm(EditForm1)` や、選択中アイテムのクリア処理が含まれることがあります。**既存の行は削除せず、Remove の直後に Notify を1行追加するだけ**にしてください。

> **🔄 Spring Boot との比較：削除機能が自動生成される**
>
> Spring Boot では「削除Controller」「JavaScript confirm()」「削除後のリダイレクト」を手書きする必要があり、合計で約1時間かかっていました。新構造のPowerAppsでは、これらが**すべて自動生成されている**ため、本章で行うのは確認とメッセージのカスタマイズだけです。

✏️ 演習 7-1：削除機能の動作確認

プレビューで以下をすべて確認してください。

1.  右ペインに削除アイコン（🗑）が表示されている
2.  削除アイコンをクリック → 画面中央に確認ダイアログが表示される
3.  「キャンセル」をクリック → ダイアログが閉じ、データはそのまま
4.  もう一度削除アイコン → 「削除」をクリック → 「削除しました」通知が表示される
5.  左ペインで、削除したアイテムが消えていることを確認

📊 機能達成トラッカー ── Ch.7 完了時点 **13** / 22 機能達成（F07はCh.2で自動取得済み、本章は確認とカスタマイズ）

## DAY 1 Ch.8 検索・フィルタ機能

Spring Boot 研修 Day 3 で実装した検索系機能（F10〜F13）を一気に実装します。

### 8-1. キーワード検索を部分一致に変更（F10）

自動生成の `StartsWith`（前方一致）を `Search`（部分一致）に変更します。実際の変更はステップ 8-4 で Items 数式全体を書き換える際に行います（個別変更ではなく、ステータス/優先度フィルタと合わせて一括変更）。

> **💡 自動生成がすでに Search の場合**
>
> 環境によっては自動生成時点で `Search`（部分一致）が使われている場合があります（Ch.3 のヒント参照）。その場合、F10（部分一致検索）はすでに達成済みですが、ステータス/優先度フィルタを追加するために 8-2 以降は同様に進めてください。

### 8-2. ステータスフィルタ（F11）

1.  **ツリービューで `SidebarContainer1` → `SearchContainer1` をクリックして選択**した状態で（重要：これをしないと意図しない場所に挿入される）、挿入 → 入力 → ドロップダウン をクリック
2.  ツリービューでドロップダウンの名前を `ddStatus` に変更（連番命名の自動生成名を変更）
3.  `Items` プロパティに `["すべて", "未着手", "進行中", "完了"]` と入力
4.  **ゴール：**プレビューで左ペインの検索ボックス付近にドロップダウンが表示され、クリックすると4つの選択肢が出れば OK

### 8-3. 優先度フィルタ（F12）

1.  **同じく `SearchContainer1` を選択した状態で**、挿入 → 入力 → ドロップダウン を追加し、`ddStatus` の隣に配置
2.  ツリービューで名前を `ddPriority` に変更
3.  `Items` に `["すべて", "高", "中", "低"]` と入力

### 8-4. Gallery の Items に統合（F13 複合検索）

`RecordsGallery1` を選択し、`Items` プロパティを以下に変更します（自動生成の StartsWith を Search に変更し、フィルタ条件を追加）。

**RecordsGallery1 の Items（検索+フィルタ統合版）**

    SortByColumns(
        Filter(
            Search(タスク管理, SearchInput1.Value, "Title"),
            ddStatus.Selected.Value = "すべて"
                || ステータス.Value = ddStatus.Selected.Value,
            ddPriority.Selected.Value = "すべて"
                || 優先度.Value = ddPriority.Selected.Value
        ),
        "ID", SortOrder.Descending
    )

> **💡 SearchInput1.Value と Text の違い**
>
> 新構造の `SearchInput1`（モダンコントロールの SearchInput）は値取得に `.Value` プロパティを使います。旧コントロール `TextSearchBox1` の `.Text` とは異なるので注意してください。

> **📐 この1つの数式で F10+F11+F12+F13+F21 の5機能をカバー**
>
> Spring Boot では `findByTitleContainingAndStatusAndPriority` メソッド + Controller のパラメータ処理 + Thymeleaf のフォーム連携で3ファイルにまたがっていた処理が、**Power Fx 1つの式**で完結しています。

> **⚠️ この数式には委任警告（青い下線）が表示されます**
>
> `Search` 関数は SharePoint に委任できないため、数式バーに青い下線が表示されます。研修のテストデータ（10〜20件）では問題ありませんが、500件を超えるデータでは検索結果が不完全になる可能性があります。詳細と対策は[付録A. 委任問題の解説](#appendixA)を参照してください。

✏️ 演習 8-1：検索・フィルタの動作確認

1.  「API」で検索 → 該当タスクだけ表示
2.  ステータス「進行中」でフィルタ → 進行中だけ表示
3.  検索 + ステータス + 優先度の組み合わせ
4.  「すべて」に戻すと全件表示

📊 機能達成トラッカー ── Ch.8 完了時点 **17** / 22 機能達成

| 今回追加               | 状態                       |
|------------------------|----------------------------|
| F10 キーワード検索     | ✅ Search 関数             |
| F11 ステータスフィルタ | ✅ ドロップダウン + Filter |
| F12 優先度フィルタ     | ✅ ドロップダウン + Filter |
| F13 複合条件検索       | ✅ \|\| 演算子で統合       |

DAY 1 の夕方で Spring Boot 研修 Day 3 終了時点を超えました。残りはページネーションとデザインだけです。

## DAY 1 Ch.9 ページネーション

### 9-1. ページ変数の定義（F17）

ツリーで `MainScreen1` を選択し、`OnVisible` に以下を入力：

**MainScreen1 の OnVisible**

    UpdateContext({currentPage: 1, pageSize: 5})

### 9-2. Gallery の Items にページ切り出しを追加

Ch.8 で設定した RecordsGallery1 の Items を以下のように書き換えて、ページ切り出しを追加します。

**RecordsGallery1 の Items（最終版）**

    With(
        {filtered:
            Filter(
                Search(タスク管理, SearchInput1.Value, "Title"),
                ddStatus.Selected.Value = "すべて"
                    || ステータス.Value = ddStatus.Selected.Value,
                ddPriority.Selected.Value = "すべて"
                    || 優先度.Value = ddPriority.Selected.Value
            )
        },
        FirstN(
            LastN(
                SortByColumns(filtered, "ID", SortOrder.Descending),
                Max(0, CountRows(filtered) - (currentPage - 1) * pageSize)
            ),
            pageSize
        )
    )

### 9-3. ページ送りボタン（F18）と表示（F19）

左ペイン下部にページネーション用のボタンを追加します。境界判定（最初/最終ページ）は `DisplayMode` プロパティで行います。

1.  **ツリーで `SidebarContainer1` をクリックして選択**した状態で（重要：これをしないと意図しない場所に挿入される）、挿入 → ボタン を追加。RecordsGallery1 の下に配置し、`Text` を `"◀ 前へ"` に変更
2.  「◀ 前へ」ボタンの `OnSelect` に `UpdateContext({currentPage: currentPage - 1})` と入力
3.  「◀ 前へ」ボタンの `DisplayMode` に `If(currentPage <= 1, DisplayMode.Disabled, DisplayMode.Edit)` と入力（1ページ目では無効化）
4.  **同じく `SidebarContainer1` を選択した状態で**、挿入 → ボタン をもう1つ追加し、「◀ 前へ」の右隣に配置。`Text` を `"次へ ▶"` に変更
5.  「次へ ▶」ボタンの `OnSelect` に `UpdateContext({currentPage: currentPage + 1})` と入力
6.  「次へ ▶」ボタンの `DisplayMode` に以下を入力（最終ページで無効化）：

**「次へ ▶」ボタンの DisplayMode**

    If(
        currentPage * pageSize >= CountRows(
            Filter(
                Search(タスク管理, SearchInput1.Value, "Title"),
                ddStatus.Selected.Value = "すべて"
                    || ステータス.Value = ddStatus.Selected.Value,
                ddPriority.Selected.Value = "すべて"
                    || 優先度.Value = ddPriority.Selected.Value
            )
        ),
        DisplayMode.Disabled,
        DisplayMode.Edit
    )

1.  **同じく `SidebarContainer1` を選択した状態で**、挿入 → テキスト → テキスト ラベル を追加し、2つのボタンの間に配置。`Text` を以下に設定：

> **💡 DisplayMode による境界制御 ─「AllItems の件数で判定」してはいけない理由**
>
> OnSelect で `Max`/`Min` を使うより、`DisplayMode` でボタンを無効化する方がユーザーには分かりやすくなります（グレーアウトして押せないことが視覚的にわかる）。
>
> 最終ページの判定は「`currentPage × pageSize ≥ 絞り込み後の総件数`」で行います。一見「`CountRows(RecordsGallery1.AllItems) < pageSize`（表示が5件未満なら最終ページ）」でも良さそうに見えますが、この方法は**総件数がちょうど 5 の倍数（10件・15件…）のとき、最終ページも5件表示されるため判定できず**、空の「次のページ」に進めてしまうバグになります。境界条件のテスト（Spring Boot 研修のバリデーション境界値テストと同じ発想）が大事な例です。

**ページ番号ラベルの Text**

    currentPage & " / " & Max(
        1,
        RoundUp(
            CountRows(
                Filter(
                    Search(タスク管理, SearchInput1.Value, "Title"),
                    ddStatus.Selected.Value = "すべて"
                        || ステータス.Value = ddStatus.Selected.Value,
                    ddPriority.Selected.Value = "すべて"
                        || 優先度.Value = ddPriority.Selected.Value
                )
            ) / pageSize,
            0
        )
    )

> **💡 なぜ Items の式を繰り返すのか**
>
> 最終ページ判定やページ番号の計算には**絞り込み後の全件数**が必要です。`RecordsGallery1.AllItems` は現在ページに表示中のアイテム（最大5件）しか返さないため使えません。Items プロパティ内の `filtered` 変数（With スコープ内）も外からは参照できないため、Filter 式を再度記述しています。
>
> 同じ式を複数箇所に書くのは冗長ですが、これは PowerApps の制約です。コレクション（`Collect`）を使えば回避できますが、研修ではシンプルな実装を優先します。

### 9-4. Ch.4 の件数表示ラベルを修正する

Ch.4 で追加した件数表示ラベル（「全 N 件」）は `CountRows(RecordsGallery1.AllItems)` を使っていました。ページ切り出し後の `AllItems` は**現在ページの最大5件しか返さない**ため、このままでは「全 5 件」と誤った表示になります。`Text` を以下に更新してください。

**件数表示ラベルの Text（Ch.9 更新版）**

    "全 " & CountRows(
        Filter(
            Search(タスク管理, SearchInput1.Value, "Title"),
            ddStatus.Selected.Value = "すべて"
                || ステータス.Value = ddStatus.Selected.Value,
            ddPriority.Selected.Value = "すべて"
                || 優先度.Value = ddPriority.Selected.Value
        )
    ) & " 件"

> **💡 ヒント：テストデータを10件以上に増やしてください**
>
> ページネーションの動作確認には、pageSize（5件）より多いデータが必要です。SharePoint リストに直接追加するか、左ペインの「+ 新規」から追加してください。

✏️ 演習 9-1：ページネーションの動作確認

SharePoint リストに直接データを追加し、テストデータを**10件以上**にしてから、プレビューで以下を確認してください。

1.  一覧画面に最大5件だけ表示され、残りは次ページに送られている
2.  「次へ ▶」をクリック → 2ページ目のデータが表示される
3.  「◀ 前へ」をクリック → 1ページ目に戻る
4.  ページ番号ラベルに「1 / 3」のように 現在ページ / 総ページ数 が表示されている
5.  1ページ目で「◀ 前へ」が、最終ページで「次へ ▶」がグレーアウトして押せない（**境界チェック：データをちょうど10件にして、2ページ目で「次へ ▶」が無効になることも確認**）
6.  件数表示ラベルが「全 5 件」ではなく、絞り込み後の総件数（例：全 12 件）を表示している
7.  検索やフィルタで件数が変わった場合、ページ数も連動して変わる

📊 機能達成トラッカー ── Ch.9 完了時点（DAY 1 終了） **20** / 22 機能達成

| 今回追加             | 状態                   |
|----------------------|------------------------|
| F17 ページネーション | ✅ FirstN + LastN      |
| F18 前へ/次へボタン  | ✅ UpdateContext       |
| F19 ページ番号表示   | ✅ RoundUp + CountRows |

**DAY 1 だけで20/22機能が完了。**残りは「デザイン統一（F20）」と「公開（F22）」のみ。Spring Boot 研修の Day 4 に相当する作業だけが残っています。

## DAY 2 午前 Ch.10 デザインの統一と仕上げ

Spring Boot 研修の最終日と同じく、全機能が動く状態になってからデザインを整えます。

### 10-1. テーマカラーのグローバル変数化（F20）

Spring Boot では CSS の `:root { --primary-color: ... }` でテーマを管理しました。PowerApps では App の OnStart でグローバル変数を定義します。

1.  ツリービューで `App` を選択
2.  `OnStart` に以下を入力：

**App の OnStart**

    Set(ThemeColor, ColorValue("#0078D4"));
    Set(ThemeColorDark, ColorValue("#005A9E"));
    Set(DangerColor, ColorValue("#D32F2F"))

1.  **重要：**OnStart は本来「アプリ起動時」に実行されるため、書いただけでは変数はまだ定義されていません。ツリービューで `App` の右の …（三点リーダー）→ OnStart を実行 をクリックして、いますぐ変数を有効にする（このメニューが見つからない場合は、`Ctrl + S` で保存してブラウザを再読み込み）
2.  **ゴール：**次の 10-2 で `ThemeColor` を参照したときに、エラーにならず色が反映されれば OK

### 10-2. ヘッダーと削除関連の色統一

新構造は単一画面なので、ヘッダー（`TableNameContainer1`）の色を変えるだけで全体に反映されます。

1.  ツリーで `TableNameContainer1`（ヘッダーの長方形コンテナ）を選択し、`Fill` を `ThemeColor` に変更
2.  `TableNameContainer1` 内の `TableNameLabel1` を選択し、`Color` を `Color.White` に変更
3.  削除アイコン（`DeleteIconButton1` 等）を選択し、`Color`（アイコンの色）を `DangerColor` に変更
4.  削除確認ダイアログ内の「削除」ボタン（`ConfirmDeleteButton1` 等）を選択し、`Fill` を `DangerColor`、`Color` を `Color.White` に変更
5.  **ゴール：**ヘッダーが青色（#0078D4）、削除関連が赤色（#D32F2F）に統一されていれば OK

✏️ 演習 10-1：デザイン統一の確認

プレビューで全機能を操作し、以下をすべて確認してください。

1.  ヘッダーが青色（#0078D4）で統一されている
2.  削除アイコン・削除ボタンが赤色になっている
3.  新規 → 編集 → 保存 → 削除 の一連の操作がスムーズに動作する

### 10-3. デバイスプレビューで表示確認

Spring Boot 研修ではブラウザの開発者ツール（F12）でモバイル表示を確認しましたが、PowerApps Studio には**デバイスピッカー**が標準搭載されています。実機がなくてもスマートフォンやタブレットでの見え方を確認できます。

1.  画面右上の ▶（プレビュー）をクリック
2.  プレビュー画面の上部に**デバイスピッカー**（端末アイコン）が表示される
3.  Web をクリック → PC ブラウザでの表示を確認
4.  タブレット をクリック → iPad 等のタブレット画面サイズに切り替わる。複数のデバイスモデルから選択可能
5.  携帯 をクリック → スマートフォン画面サイズに切り替わる
6.  **向きの切り替え**アイコンで縦向き ⇔ 横向きを切り替えて確認

> **💡 ヒント：自動生成アプリはレスポンシブ対応**
>
> 2023年以降の自動生成アプリは、内部的に**レスポンシブ対応のコンテナレイアウト**で構成されています。画面幅に応じて Gallery やフォームの配置が自動的に調整されるため、PC でもスマートフォンでも適切なレイアウトで表示されます。
>
> Spring Boot 研修では、CSSメディアクエリ（`@media`）を手書きしてレスポンシブ対応する必要がありました。PowerApps ではコンテナコントロールが自動で対応してくれます。

**🔄 モバイル対応の比較**

| 観点             | Spring Boot                            | PowerApps                                |
|------------------|----------------------------------------|------------------------------------------|
| レスポンシブ対応 | CSS メディアクエリを手書き             | コンテナレイアウトで自動対応             |
| 表示確認         | ブラウザ開発者ツール（F12）            | デバイスピッカー（タブレット/携帯/向き） |
| スマホアプリ化   | PWA 対応またはネイティブアプリ別途開発 | Power Apps モバイルアプリで即利用可能    |

✏️ 演習 10-2：デバイスプレビュー確認

デバイスピッカーで以下の3パターンを確認し、レイアウトが崩れていないことを確認してください。

1.  Web（PC ブラウザ）表示
2.  タブレット（横向き + 縦向き）表示
3.  携帯（縦向き）表示 ─ Gallery の幅が自動調整されることを確認

### 10-4. アプリの公開（F22）

1.  `Ctrl + S` または画面右上の 保存 アイコンで保存
2.  画面右上の 公開 ボタンをクリック
3.  「このバージョンを公開」を選択

> **🔄 Spring Boot との比較：デプロイ**
>
> Spring Boot では Dockerfile を書き、`docker compose up` でコンテナを起動し、ポート設定を確認して…という手順が必要でした。PowerApps では「公開」ボタンを1回押すだけで、M365 ユーザーがブラウザやスマホアプリからアクセスできるようになります。

📊 機能達成トラッカー ── 全機能完了 🎉 **22** / 22 機能達成 ── **全機能コンプリート！**

## DAY 2 午前 Ch.11 工数比較と振り返り

### 11-1. 全22機能の工数比較

同じ22機能を実装するのに、それぞれどのくらい時間がかかったかを比較します。

| \#  | 機能               | Spring Boot      | PowerApps       | 短縮率    |
|-----|--------------------|------------------|-----------------|-----------|
| F01 | 環境構築           | 4時間            | 0分             | 100%      |
| F02 | テーブル作成       | 1時間            | 15分            | 75%       |
| F03 | 一覧画面           | 2時間            | 1分（自動生成） | 99%       |
| F04 | 新規登録画面       | 2時間            | 1分（自動生成） | 99%       |
| F05 | 編集画面           | 1.5時間          | 1分（自動生成） | 99%       |
| F06 | 詳細参照画面       | 1.5時間          | 10分            | 89%       |
| F07 | 削除機能           | 1時間            | 1分（自動生成） | 98%       |
| F08 | 保存後リダイレクト | 30分             | 1分（自動生成） | 97%       |
| F09 | バリデーション     | 1時間            | 10分            | 83%       |
| F10 | キーワード検索     | 1時間            | 5分             | 92%       |
| F11 | ステータスフィルタ | 1時間            | 10分            | 83%       |
| F12 | 優先度フィルタ     | 1時間            | 10分            | 83%       |
| F13 | 複合条件検索       | 1.5時間          | 5分             | 94%       |
| F14 | 優先度色分け       | 30分             | 5分             | 83%       |
| F15 | 完了取り消し線     | 30分             | 3分             | 90%       |
| F16 | 件数表示           | 30分             | 3分             | 90%       |
| F17 | ページネーション   | 2時間            | 20分            | 83%       |
| F18 | ページ送りボタン   | 1時間            | 10分            | 83%       |
| F19 | ページ番号表示     | 30分             | 5分             | 83%       |
| F20 | デザイン統一       | 1時間            | 20分            | 67%       |
| F21 | ID降順ソート       | 30分             | 1分（自動生成） | 97%       |
| F22 | アプリ公開         | 1時間            | 1分             | 98%       |
|     | 合計               | 約27時間（≒4日） | 約2.5時間       | 約90%短縮 |

> **📊 結論：同じ22機能を約90%の工数削減で実現**
>
> Spring Boot で4日間かかった開発が、PowerApps では**実質1日で完了**しました。2日目の午前はデザイン調整と振り返りに充てることができます。

### 11-2. 作成したファイル数の比較

| 観点                       | Spring Boot                                          | PowerApps                               |
|----------------------------|------------------------------------------------------|-----------------------------------------|
| 作成したファイル数         | 10ファイル以上（Java×4, HTML×4, CSS, properties...） | 0ファイル（全てGUI上で完結）            |
| 書いたコード行数           | 約500〜700行（Java + HTML + CSS）                    | 約30行（Power Fx 数式のみ）             |
| 使った画面（ブラウザタブ） | Eclipse + ブラウザ + Docker Desktop + ターミナル     | ブラウザ1つ                             |
| ボタンの数                 | 8個（HTML + JavaScript で実装）                      | 8個（GUI で配置 + Power Fx で動作）     |
| 画面数                     | 4画面（HTML テンプレート4つ）                        | 1画面（左右ペインに集約・画面遷移なし） |

### 11-3. ローコードの強みと限界

> **✅ PowerApps が向いているケース**
>
> - **社内業務アプリ**（申請、台帳、日報、在庫管理など）
> - **プロトタイプの高速開発**（要件確認のための仮アプリ）
> - **非エンジニアが自分で作る**（市民開発者）
> - **M365 エコシステムとの連携**（Teams, Outlook, Power Automate）

> **⚠️ Spring Boot が必要なケース**
>
> - **大量データ** ─ 委任の制限により、既定500件（最大2,000件）を超えるデータで不正確な結果が返る可能性がある（→ 付録A参照）
> - **複雑なロジック** ─ トランザクション制御、複数テーブルの結合処理
> - **外部API提供** ─ REST API を自社で設計・公開する場合
> - **厳密なテスト** ─ JUnit / Mockito 等の自動テストフレームワーク
> - **Git管理** ─ コードレビュー・ブランチ戦略が必要な開発

### 11-4. 使い分けの判断基準

| 判断基準   | → PowerApps                          | → Spring Boot          |
|------------|--------------------------------------|------------------------|
| 利用者数   | 〜500人                              | 500人以上 / 不特定多数 |
| データ件数 | 〜数千件                             | 数万件以上             |
| 開発者     | 情シス / 業務部門                    | 専任エンジニア         |
| 要件変更   | 頻繁（現場で即修正）                 | リリースサイクルで管理 |
| 予算       | M365導入済みならライセンスに含まれる | 開発工数＋サーバー費用 |

✏️ 演習 11-1：比較レポート

以下のテーマから1つ選び、どちらの開発手法が適切か、理由とともにまとめてください。

1.  「社内の備品管理システム」（100人利用、備品300件程度）
2.  「ECサイトの注文管理」（1万ユーザー、月間注文5万件）
3.  「PowerApps で作ったアプリが将来的にデータ量上限を超えた場合の移行戦略」

[→ 解答例はこちら](#answers)

### 11-5. 研修のまとめ

**🎓 この研修で体感したこと**

| 体感ポイント               | 内容                                                                               |
|----------------------------|------------------------------------------------------------------------------------|
| 速さ                       | Spring Boot 4日 → PowerApps 実質1日。同じ22機能を約90%短い時間で実装できた         |
| 設計の共通性               | ツールが変わっても CRUD・検索・バリデーション・画面遷移の設計思想は同じ            |
| トレードオフ               | 速い代わりに、大規模・高性能・複雑なロジックには向かない                           |
| Spring Boot の学びが活きる | MVC・データバインディング・リダイレクト等の概念は PowerApps でもそのまま適用できた |

**最も重要な学び：**「ローコードは万能ではないが、適材適所で使えば開発効率を劇的に上げられる。そして、Spring Boot で学んだ設計の基礎があるからこそ、ローコードツールの仕組みも正しく理解できる。」

## 付録 付録A. PowerApps の「委任」問題

本編で「大量データに向かない」と述べました。その正体が**「委任（Delegation）」**の問題です。PowerApps を実務で使う際に最も注意すべきポイントなので、仕組みをしっかり理解してください。

### A-1. 委任とは何か ─「誰が検索するか」の問題

Gallery に `Filter(タスク管理, ステータス.Value = "未着手")` と書いたとき、絞り込み処理を **サーバー側（SharePoint）**で実行するか、**端末側（ブラウザ / スマホ）**で実行するかが問題になります。

［図（テキスト抽出）：委任あり vs 委任なし / ✅ 委任あり（サーバー側で処理） / PowerApps / 条件だけ送る → / SharePoint / 10,000件の中から / サーバーが絞り込み / → 結果50件だけ返す / 結果：正確 ✅　速度：高速 ✅ / 例：Filter, =, SortByColumns, StartsWith / ❌ 委任なし（端末側で処理） / SharePoint / ← 先頭500件だけ渡す / PowerApps / 500件だけを / 端末側で絞り込み / → 501件目以降は無視 / 結果：不完全 ❌　速度：遅い ❌ / 例：Search, Sum, CountRows, in, FirstN］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

> **💡 Spring Boot に例えると**
>
> Spring Boot で `WHERE status = '未着手'` を MySQL サーバーに実行させるのが「委任あり」。全件を Java に取得してから for ループでフィルタするのが「委任なし」です。PowerApps 特有の概念に見えますが、「処理をどこで実行するか」はどのアーキテクチャでも同じ課題です。

### A-2. 制限値の一覧

| 制限                                   | 既定値     | 最大値  | 説明                                                                                                                                                                         |
|----------------------------------------|------------|---------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **データ行の制限**（PowerApps の設定） | 500件      | 2,000件 | 委任できない関数を使った場合、データソースから取得する最大件数。**501件目以降は存在しないかのように無視される。**設定で最大2,000件に引き上げ可能だが、それ以上には増やせない |
| **委任クエリの1回取得上限**            | 2,000件/回 |         | 委任できる関数でも、1回で返るのは最大2,000件。Gallery はスクロール時に自動追加取得するが、変数・コレクションに格納する場合はこの上限に引っかかる                             |
| **SharePoint リストビューしきい値**    | 5,000件    |         | SharePoint 側の制限。インデックスのない列でフィルタすると5,000件超でエラー。PowerApps の委任とは別の問題だが、同時に影響する                                                 |

### A-3. 数式バーの「青い下線」に注意

PowerApps Studio で数式を入力した際、**青い下線（波線）**が表示されることがあります。これは「この関数は委任できません」という警告です。本研修で使った `Search` 関数にもこの警告が出ます。

> **⚠️ 最も危険なケース：「一見正しく動いているように見える」**
>
> リストに3,000件のデータがあり `Search`（委任不可）で検索した場合、先頭500件だけがスキャンされます。501件目以降に該当データがあっても検索結果に出ません。**エラーも出ず「該当なし」と表示されるだけ**なので、ユーザーは正しく動いていると誤解します。テストデータが少ないうちは問題に気づけず、本番稼働後にデータが増えてから発覚するのが典型的なパターンです。

### A-4. 本研修で使った関数の委任対応状況

| 関数 / 演算子    | 委任    | 使用箇所                       | データ増加時のリスク                          |
|------------------|---------|--------------------------------|-----------------------------------------------|
| `Filter`         | ✅ 可能 | Ch.8 ステータス/優先度フィルタ | なし（サーバー側で処理）                      |
| `=` 演算子       | ✅ 可能 | Ch.8 フィルタ条件内            | なし                                          |
| `SortByColumns`  | ✅ 可能 | Ch.2, Ch.9                     | なし                                          |
| `StartsWith`     | ✅ 可能 | Ch.2 自動生成                  | なし（前方一致なら安全）                      |
| `Search`         | ❌ 不可 | Ch.8 キーワード部分一致検索    | **高リスク：**500件超で検索結果が不完全になる |
| `CountRows`      | ❌ 不可 | Ch.4 件数表示, Ch.9 ページ計算 | **中リスク：**総件数が実際と異なる可能性      |
| `FirstN / LastN` | ❌ 不可 | Ch.9 ページネーション          | **高リスク：**ページ切り出しが不正確になる    |

### A-5. 対策の選択肢

| 対策                     | 方法                                                          | 効果                         | 注意点                                          |
|--------------------------|---------------------------------------------------------------|------------------------------|-------------------------------------------------|
| ① 設定値の引き上げ       | 設定 → 全般 → データ行の制限 → **2,000**                      | 500→2,000件に拡大            | 2,000が上限。件数が多いとアプリの動作が重くなる |
| ② 委任可能な関数に置換   | `Search` → `Filter` + `StartsWith`                            | サーバー側処理で件数制限なし | 部分一致が前方一致に制限される                  |
| ③ コレクションに分割取得 | `ClearCollect` + ループで2,000件ずつ蓄積                      | 2,000件超のデータを保持可能  | 初回読み込みが遅い。実装が複雑                  |
| ④ Power Automate 経由    | フローで「複数項目の取得」（上限5,000件）→ 結果をアプリに返す | 5,000件まで対応              | フローの設計が必要                              |
| ⑤ データソース変更       | SharePoint → **Dataverse** に移行                             | 委任制限が大幅に緩和         | 追加ライセンスが必要な場合あり                  |
| ⑥ 設計で回避             | リストを年度別に分割する、完了タスクを別リストに移動する等    | 1リストの件数を抑える        | 運用ルールの徹底が必要                          |

> **💡 実務でのおすすめ**
>
> まず**①（2,000件に引き上げ）**を設定し、データが2,000件を超えない運用を心がけます。超えそうな場合は**⑥（リスト分割や完了タスクのアーカイブ）**が最も低コストです。それでも対応できない規模になったら、**⑤（Dataverse 移行）**または Spring Boot 等でのフルスクラッチ開発を検討します。

### A-6. 設定変更の手順（データ行の制限：500→2,000）

1.  PowerApps Studio で対象アプリを開く
2.  メニューバーの 設定（⚙ 歯車アイコン）をクリック
3.  全般 タブを選択
4.  「データ行の制限」のスライダーを **2000** に変更
5.  `Ctrl + S` または 保存 アイコンで保存

> **🔄 Spring Boot との比較：データ量上限**
>
> Spring Boot + MySQL の構成では、数百万件のデータでもインデックス設計とクエリ最適化で対応できます。PowerApps + SharePoint の構成は、実質的に**2,000〜5,000件が快適に扱える上限**です。これが Ch.11「使い分けの判断基準」で「データ件数：〜数千件 → PowerApps」とした根拠です。

## 付録 付録B. バックアップとデータ保全

### B-1. アプリのバックアップ ─ 自動で行われるため心配不要

Spring Boot 研修では、ソースコードを Git にコミットし、DB のバックアップは `mysqldump` で手動取得していました。PowerApps では以下の理由で、**アプリのバックアップを意識する必要はほとんどありません。**

> **☁️ M365 が自動で管理してくれること**
>
> - **アプリ本体** ─ PowerApps のアプリはクラウド上に自動保存され、「バージョン履歴」機能で過去の任意のバージョンに復元可能。保存（`Ctrl + S` または保存アイコン）のたびにバージョンが記録される
> - **SharePoint リストのデータ** ─ SharePoint Online は Microsoft によって自動的にバックアップされており、サイトコレクションのゴミ箱（93日間保持）と、Microsoft のデータセンター側のバックアップ（14日間）で保護されている
> - **可用性** ─ M365 の SLA（サービスレベル契約）で 99.9% の稼働率が保証されている

**🔄 Spring Boot との比較：バックアップ**

| 対象           | Spring Boot                    | PowerApps                               |
|----------------|--------------------------------|-----------------------------------------|
| ソースコード   | Git で手動コミット             | 自動バージョン管理（保存のたびに記録）  |
| DB データ      | `mysqldump` で手動バックアップ | M365 側の自動バックアップ               |
| バックアップ先 | GitHub / ローカル              | Microsoft データセンター（自動）        |
| 復元           | Git checkout / SQL リストア    | バージョン履歴から復元 / ゴミ箱から復元 |

### B-2. アプリのバージョン復元手順

アプリの編集で問題が起きた場合、過去の保存バージョンに戻すことができます。

1.  <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> → 左メニュー アプリ → 対象アプリの …（その他） → バージョン
2.  バージョン一覧が表示される。復元したいバージョンの … → 復元
3.  **ゴール：**選択したバージョンが最新版として復元され、アプリを開くとその時点の状態に戻っていれば OK

### B-3. SharePoint リストのデータエクスポートとインポート

データを手元にバックアップしたい場合や、別の環境にデータを移行したい場合は、SharePoint リストの**エクスポート（Excel 形式）**と**インポート**機能を使います。

#### エクスポート手順（データのバックアップ）

1.  SharePoint で「タスク管理」リストを開く
2.  リスト上部のコマンドバーから エクスポート → CSV にエクスポート（または Excel にエクスポート）をクリック
3.  CSV / Excel ファイルがダウンロードされる。全アイテムのデータが含まれている
4.  **ゴール：**ダウンロードしたファイルを開き、SharePoint リストの全データが含まれていれば OK

#### インポート手順（データのリストア・移行）

> **⚠️ データ重複に注意**
>
> SharePoint リストには「既存データを上書きインポートする」機能がありません。既存リストにインポートすると、既存データはそのまま残り、インポートデータが追加されるため**重複が発生**します。以下の2つの方法から状況に応じて選んでください。

#### 方法A：新しいリストとして復元する（推奨・簡単）

元のリストとは別の新しいリストを作成し、そこにデータをインポートします。データ重複のリスクがなく最も安全です。

1.  Microsoft Lists で ＋ 新しいリスト → Excel から を選択
2.  エクスポートしておいた Excel / CSV ファイルをアップロード
3.  列の型が正しくマッピングされていることを確認し、リスト名を入力（例：`タスク管理_復元`）→ 作成
4.  PowerApps アプリのデータソースを新しいリストに切り替える（アプリ編集画面 → 左メニュー データ → 旧リストを削除 → 新リストを追加）
5.  **ゴール：**新しいリストにデータが復元され、アプリからデータが正常に表示・操作できれば OK

#### 方法B：既存リストのデータを全削除してからインポートする

同じリスト名・同じ接続のまま復元したい場合は、先に既存データを全削除してからインポートします。

1.  SharePoint / Lists で対象リストを開く
2.  リスト左上のチェックボックスで**全アイテムを選択**（ヘッダー行のチェックボックスをクリック）
3.  コマンドバーの 削除 をクリック → 全アイテムが削除される
4.  リストが空になったことを確認。次にコマンドバーの クイック編集（グリッドビュー）を開く
5.  エクスポートした Excel を開き、データ行をコピー（Ctrl+C）→ グリッドビューに貼り付け（Ctrl+V）
6.  **ゴール：**リストのデータ件数がエクスポート時と一致し、重複がなければ OK。PowerApps アプリのデータソース変更は不要

> **💡 どんなときにエクスポート / インポートが必要か**
>
> - **定期バックアップ** ─ M365 の自動バックアップに加え、手元にもデータを持っておきたい場合（月次など）
> - **環境移行** ─ 研修環境から本番環境にデータを移す場合（方法Aを推奨）
> - **データ分析** ─ Excel で集計やグラフ化を行いたい場合
> - **障害からの復旧** ─ 誤操作でデータを大量削除してしまった場合（方法Bで復元）
>
> 日常的なバックアップは M365 の自動バックアップに任せて問題ありません。エクスポートは「念のため」や「環境移行」のためのものです。

## 付録 付録C. GitHub へのアプリ保存（参考）

Spring Boot 研修ではソースコードを GitHub にコミットしてバージョン管理していました。PowerApps のアプリも、**.msapp ファイルとしてエクスポート**し、GitHub のプライベートリポジトリに保存することができます。

### C-1. アプリのエクスポート

キャンバスアプリのエクスポートには2つの方法があります。研修用途ではシンプルな**方法A（コピーのダウンロード）**を推奨します。

#### 方法A：コピーのダウンロード（.msapp ファイル）─ 推奨

アプリ本体のみを `.msapp` ファイルとしてダウンロードします。編集画面から数クリックで取得でき、GitHub 保存用途には最適です。

1.  PowerApps Studio でアプリを開く
2.  左上のメニュー ファイル をクリック
3.  名前を付けて保存 → このコンピューター をクリック
4.  ファイル名を入力（例：`TaskManagementApp_v1.msapp`）→ ダウンロード
5.  **ゴール：**ダウンロードフォルダに `.msapp` ファイルが保存されていれば OK

#### 方法B：パッケージのエクスポート（.zip ファイル）─ 環境移行用

アプリ＋接続情報＋関連フロー等をまとめて `.zip` にエクスポートします。別の環境（別テナント・別環境）にデプロイする場合に使用します。

1.  <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> → 左メニュー アプリ
2.  対象アプリの行にある …（その他のコマンド） をクリック
3.  エクスポート パッケージ をクリック
4.  パッケージ名を入力 → エクスポート → `.zip` がダウンロードされる

**💡 2つの方法の使い分け**

| 形式                    | 内容                         | 研修用途での推奨                                           |
|-------------------------|------------------------------|------------------------------------------------------------|
| .msapp（方法A）         | アプリ本体のみ               | ✅ **GitHub 保存には最適**。編集画面から即ダウンロード可能 |
| パッケージ.zip（方法B） | アプリ＋接続情報＋関連フロー | 別環境への完全移行時のみ                                   |

インポート（復元）時は、.msapp なら PowerApps Studio の ファイル → 開く → 参照 から読み込めます。

### C-2. GitHub プライベートリポジトリへの保存

1.  GitHub にサインインし、プライベートリポジトリを作成（例：`powerapps-task-management`）
2.  エクスポートした `.msapp`（または `.zip`）ファイルをリポジトリにコミット・プッシュ
3.  README.md にアプリの概要、バージョン情報、変更履歴を記載しておくと管理しやすい
4.  バージョンごとに `TaskManagementApp_v1.msapp`、`TaskManagementApp_v2.msapp`... のようにファイル名で世代管理、またはタグ/リリース機能を併用

**🔄 Spring Boot との比較：ソース管理**

| 観点           | Spring Boot                               | PowerApps                                                |
|----------------|-------------------------------------------|----------------------------------------------------------|
| 管理対象       | .java / .html / .css 等のテキストファイル | .msapp / .zip のバイナリファイル                         |
| 差分確認       | Git diff で行単位の差分が見える           | バイナリのため差分確認は困難                             |
| ブランチ運用   | feature / develop / main の Git-Flow      | ファイル名にバージョン番号を付けて管理（例：v1.0, v1.1） |
| コードレビュー | Pull Request でレビュー可能               | ファイル差分が見えないためレビューは画面上で実施         |

### C-3. 発展：Power Platform の Git 統合機能

より本格的なバージョン管理を行いたい場合、Power Platform には **Azure DevOps との Git 統合機能**が提供されています（2024年〜パブリックプレビュー）。この機能を使うと、アプリの変更をテキスト形式で Azure DevOps リポジトリにコミットでき、差分の確認やブランチ運用が可能になります。

> **💡 本研修での推奨**
>
> 本研修の範囲では、エクスポートした .zip ファイルを GitHub プライベートリポジトリに保存するだけで十分です。Azure DevOps 統合は Dataverse 環境とシステム管理者権限が必要なため、組織のインフラ担当と相談の上で導入を検討してください。
>
> 参考：<a href="https://learn.microsoft.com/ja-jp/power-platform/alm/git-integration/canvas-apps-git-integration" target="_blank">キャンバスアプリのソース管理 - Microsoft Learn</a>

## 解答 演習の解答例

### 演習 3-1：自動生成コードの読解 ─ 解答

**① NewRecordButtonBackground1（「+ 新規」）の OnSelect**

| Power Fx（自動生成）                                                  | Spring Boot 対応                                                                                                                                                                                                                                       |
|-----------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `NewForm(EditForm1); UpdateContext({newMode: true, editMode: false})` | Controller の `@GetMapping("/tasks/new")`。フォームを「新規モード」に切り替え、状態変数で右ペインの表示を変更。Spring Boot では `model.addAttribute("task", new Task())` で空オブジェクトを渡し、URL `/tasks/new` で新規入力画面を返していた処理に相当 |

**② EditForm1 の OnSuccess**

| Power Fx（自動生成）                                                             | Spring Boot 対応                                                                                                                                                                                                  |
|----------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `UpdateContext({CurrentItem: Self.LastSubmit, editMode: false, newMode: false})` | Controller の `return "redirect:/tasks/{id}"`。フォーム送信（`SubmitForm`）成功後に、状態変数を閲覧モードにリセットして詳細表示に戻す。Spring Boot では `taskService.save(task)` 成功後にリダイレクトしていた部分 |

**③ 編集アイコン（EditIconButton1 等）の OnSelect**

| Power Fx（自動生成）                                                   | Spring Boot 対応                                                                                                                                                                                                                                                    |
|------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `EditForm(EditForm1); UpdateContext({editMode: true, newMode: false})` | Controller の `@GetMapping("/tasks/{id}/edit")`。既存レコードをロード済みのフォームを編集モードにする。Spring Boot では `model.addAttribute("task", taskRepository.findById(id))` で既存オブジェクトを渡し、URL `/tasks/{id}/edit` で編集画面を返していた処理に相当 |

> **💡 読み解きのポイント**
>
> Spring Boot の MVC パターンが「**URL → Controller → View**」のフロー型なのに対し、PowerApps の新構造は「**イベント → 状態変数 → 表示切替**」の状態型です。「画面が遷移する」のではなく「同じ画面の表示モードが切り替わる」のが新構造の本質。React/Vue 等の SPA に近い設計といえます。

### 演習 11-1：比較レポート ─ 解答例

### 解答例①：社内の備品管理システム（100人利用、備品300件程度）

> **結論：PowerApps が適切**
>
> **理由：**
>
> - 利用者100人・データ300件は、PowerApps の委任制限（既定500件）の範囲内であり、委任問題が発生しない
> - 備品管理は CRUD（登録・参照・更新・削除）＋ 検索が中心で、複雑なビジネスロジックが不要。本研修で作ったタスク管理アプリとほぼ同じ構成で実現できる
> - M365 を導入済みの企業であれば、M365 ライセンスに含まれるため追加コストゼロ。Spring Boot で開発する場合のサーバー費用・開発工数と比較して大幅に安い
> - 情シス部門だけでなく、総務部門の担当者が自分でフィールド追加や画面修正ができる（市民開発）
> - スマートフォンから備品の棚卸しを行う場合も、Power Apps モバイルアプリで即対応できる
>
> **Spring Boot を選ぶべき場面：**備品にバーコード/QRコードリーダーを連携させたい、外部の資産管理システムと API 連携が必要、といった要件が追加された場合は、PowerApps だけでは難しくなる可能性がある。

### 解答例②：ECサイトの注文管理システム（1万ユーザー、月間注文5万件）

> **結論：Spring Boot（フルスクラッチ開発）が適切**
>
> **理由：**
>
> - 月間5万件 ＝ 年間60万件のデータ量は、SharePoint リストの実用上限（数千件）を大幅に超過。委任問題が確実に発生する
> - 注文処理にはトランザクション制御が必須（在庫の減算と注文の登録を一括で行い、途中で失敗した場合はロールバック）。PowerApps + SharePoint ではトランザクション制御ができない
> - 決済システム、配送システム、在庫管理システムとの API 連携が必要。Spring Boot の `RestTemplate` や `WebClient` で自由に外部 API を呼び出せる
> - 1万ユーザーの同時アクセスに耐えるパフォーマンスが必要。SharePoint のスロットリング制限に引っかかる可能性が高い
> - PCI DSS 等のセキュリティ基準への準拠が求められる場合、インフラ構成を細かく制御できる Spring Boot + クラウド（AWS/Azure）の方が適切
>
> **PowerApps を活用できる部分：**社内スタッフ向けの「注文ステータス確認アプリ」や「返品申請アプリ」など、コア業務ではない補助的なツールには PowerApps が有効。Spring Boot で構築した基幹 API を PowerApps のカスタムコネクタで呼び出すハイブリッド構成もある。

### 解答例③：PowerApps で作ったアプリがデータ量上限を超えた場合の移行戦略

> **段階的な移行アプローチ**
>
> **Phase 1：運用で対応（コスト最小）**
>
> - データ行の制限を2,000件に引き上げ（付録A-6 参照）
> - 完了タスクを定期的に別リスト（アーカイブ）に移動し、アクティブなリストの件数を抑える
> - 年度ごとにリストを分割する運用ルールを導入
>
> **Phase 2：データソース移行（中コスト）**
>
> - SharePoint リスト → **Dataverse** に移行。PowerApps の画面はほぼそのまま流用でき、委任制限が大幅に緩和される
> - Dataverse は M365 に付属する Dataverse for Teams（制限あり）か、Power Apps Per App ライセンスで利用可能
> - 移行ツール（Power Automate のフロー等）でデータを移行し、アプリのデータソース接続先を差し替える
>
> **Phase 3：フルスクラッチ移行（高コスト・最終手段）**
>
> - 要件が PowerApps の限界を超えた場合（複雑なロジック、外部 API 提供、数十万件のデータ等）、Spring Boot 等で再構築
> - ただし PowerApps で固めた画面仕様・データ構造・業務フローは、そのまま要件定義書として活用できる
> - **つまり、PowerApps で作ったアプリは「高速なプロトタイプ」として無駄にならない。**本研修で体感した「同じ22機能を設計する力」が、この移行時にも活きる
