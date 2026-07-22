# Kotlin演習 テキスト

## 目次

  - [DAY 1 ─ Kotlin概論 + 言語の核](#day-1-kotlin概論-言語の核)
  - [DAY 2 ─ 関数型・コレクション・DSL](#day-2-関数型コレクションdsl)
  - [DAY 3 ─ コルーチン・構造化並行性](#day-3-コルーチン構造化並行性)
  - [DAY 4 ─ Spring Boot × Kotlin 基礎](#day-4-spring-boot-kotlin-基礎)
  - [DAY 5 ─ Spring Boot 高度](#day-5-spring-boot-高度)
  - [DAY 6 ─ Vue 3 基礎](#day-6-vue-3-基礎)
  - [DAY 7 ─ Vue統合・実践](#day-7-vue統合実践)

---

Spring Boot 3 + Vue 3 / 7日間

☰

> **📚 演習解答について**
>
> 各 Day の演習の**参考解答コード**は、 配布 ZIP の `kotlin-training/solutions/` フォルダに格納されています。 まず**自分で書いてから**参照してください。
>
> - `solutions/day2/` 〜 `solutions/day7/`: 各Dayの演習解答(完成版コード + 解説コメント)
> - Day 1 の演習は本文中の「▶ 解答例(クリック)」 で展開できます
> - Day 7 演習① の TODO①②、 演習①の SaleSpecifications は本文中にも解答抜粋あり
>
> 解答コードはそのままビルドできる単位で書かれています。 詳細は `solutions/README.md` を参照。

## DAY 1 ─ Kotlin概論 + 言語の核

Java経験者がKotlinの世界に踏み込む最初の1日。午前は「Kotlinとは何者か」を腑に落とし、午後は手を動かして基本構文・Null安全・data class・拡張関数・スコープ関数を体感する。

合計 9時間 前提: Java + Eclipse 経験 到達点: Kotlinで簡単なドメインモデルが書ける

### Ch.00 本日の目標と進め方⏱ 5分

Day 1 を終えた時に、何ができるようになっていれば良いか

### 0-1. 本日のゴール

Day 1 の終わりには、次のことができるようになっていれば成功です。

- **Kotlinの正体を説明できる** ─ 「JVM言語」「コンパイル」「Javaとの関係」を自分の言葉で言える
- **4つのコンパイルターゲット**(JVM / Android / Native / JS)の位置づけがわかる
- **3つのビルドパターン**(完全分離 / モノレポ / jar同梱)の使い分けがわかる
- **Kotlinの基本構文**を読み書きできる ─ val/var、関数定義、文字列テンプレート
- **Null安全**の仕組みがわかる ─ `?.`、`?:`、`let`、スマートキャストを使い分けられる
- **data class** と **value class** を業務モデルで使い分けられる
- **拡張関数**と**スコープ関数**(let / run / apply / also / with)を使い分けられる
- **IntelliJ から Git** 経由で GitHub に push できる

### 0-2. 進め方のリズム

各章は次のパターンで進みます。これは Spring Boot 研修と同じです。

1 説明 何のための機能か、Java とどう違うかを図と短い説明で押さえる。 2 一緒に書く サンプルコードを写経する。コピペは禁止。指が覚えるまで打つ。 3 動かす IntelliJ で実行する。期待通りの出力が出るか確認する。 4 解説 + つまづきポイント 「なぜそう書くのか」「Java脳で見るとハマりがちな点」を整理する。 5 小演習 章末で短い問題を解く。回答は次の章の冒頭で確認する。

> **💡 写経することの意味**
>
> Kotlin は Java と似ているがゆえに「読めば分かる」気になりやすい言語です。実際に指で打つと、`?` の位置や `val`/`var` の使い分けで必ず手が止まります。その「止まる場所」こそが、Java脳との差分です。

**⚠ 本日の作業開始前に ─ 起動チェック**

**Day 1 では起動が必要なサーバはありません。**IntelliJ + JDK 21 + Git があれば作業を始められます。Docker や Spring Boot は **Day 4 以降**から使うので、本日は起動不要です。

| 必要なもの               | 状態       | 確認方法                                             |
|--------------------------|------------|------------------------------------------------------|
| IntelliJ IDEA            | 起動済み   | スタートメニューから起動                             |
| JDK 21 (Amazon Corretto) | セット済み | コマンドプロンプトで `java -version` → Corretto-21.x |
| Git                      | セット済み | コマンドプロンプトで `git --version` → 2.x           |
| Docker / DB / Vue        | 本日は不要 | ─                                                    |

**📌 サンプルコードの提供方式(7日間共通)**

本研修のサンプルコードは、以下の二段構えで配布されます:

| 提供物                                        | 形態                                 | 含まれるもの                                                                                                                                                                                 |
|-----------------------------------------------|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **kotlin-training-samples.zip**(Day 0 で配布) | 解凍して使う「スケルトン」           | Day 0 動作確認に必要な全部 ─ Spring Boot プロジェクト枠、Vue プロジェクト枠、Docker 構成、DB初期化SQL、仕入先APIモック、ディレクトリ枠(`day1/`〜`day3/`、controller/service/...等を空で用意) |
| **本テキスト(HTML)**のコードブロック          | 受講者が**コピペまたは写経して使う** | Day 1〜7 の各演習で書く Kotlin / Vue / TypeScript / SQL の<u>全コード</u>。各コードブロックの上部に保存先ファイルパスを表示                                                                  |

**進め方の基本パターン**:

1.  テキスト中のコードブロックを見る → 上部の「ファイル名」を確認(例: `backend/src/main/kotlin/com/example/training/day1/Hello.kt`)
2.  IntelliJ や VS Code でその場所にファイルを新規作成(または既存ファイルを編集)
3.  コードを**写経 or コピペ**して保存
4.  必要なら IntelliJ で実行 / npm run dev で動作確認

Day 1〜3 の言語演習では**写経推奨**(手で打って Kotlin の文法に慣れる)。Day 4 以降のレイヤー実装では**コピペ可**(構造の理解と組み合わせに集中する)。

### Ch.01 Git: 研修プロジェクトを開いて Git 状態を確認⏱ 15分

Day 0 で push した自分のリポジトリを IntelliJ で開き、Git 連携の動作確認

### 1-1. なぜ最初にGitをやるのか

Day 0 §7-6 で、配布物を自分の GitHub リポジトリ(`https://github.com/<あなたのユーザー名>/kotlin-training`)に push 済みです。Day 1 の冒頭では、**IntelliJ から自分のリポジトリを開いて Git 連携が動くこと**を確認します。理由は単純です。

- これから書くコードを **正しい場所に** 置く
- Day 1 の最後で **commit & push** する練習をするため、IDE と GitHub の連携を先に確認
- 「壊しても元に戻せる」 安心感をもって学習を始められる

ターミナルでの `git` コマンドはあえて使いません。実務でも IntelliJ の GUI からやることがほとんどです。Java 経験者にとっては、Eclipse の Git ビューと同じ感覚で使えます。

### 1-2. 手順 ─ IntelliJ で自分のプロジェクトを開く

> **💡 既に開いている場合はスキップでOK**
>
> Day 0 §7-6-B で「IntelliJ で `C:\work\kotlin-training`(親フォルダ) を開く」 までやっている場合は、本節はスキップして 1-3 に進んで構いません。本節は復習・再確認用です。

1 IntelliJ を起動 → Welcome画面 IntelliJ IDEA を起動すると Welcome 画面が表示される。すでにプロジェクトを開いている場合は `File → Close Project` で Welcome 画面に戻る。 2 「Open」ボタンを押す Welcome画面の「**Open**」をクリック(「Get from VCS」ではなく、ローカルのフォルダを開く方)。 3 kotlin-training フォルダ(親)を選択 フォルダ選択ダイアログで `C:\work\kotlin-training` を選択して OK。 **★ backend ではなく、 その親の kotlin-training** を開くこと(Day 0 §7-6-B Step 27 のⓘ補足参照: 3つのサブフォルダを1つの Git リポジトリで管理するため)。 4 Trust Project + Gradle 連携の確認 「Trust Project」 が出たら「Trust」 を選択。 Day 0 §7-6-B Step 28 で `backend/build.gradle.kts` を Link Gradle Project 済みなら、 Gradle Sync が自動で走る(初回は数分)。 まだの場合は backend/build.gradle.kts を右クリック →「Link Gradle Project」 を実行。 5 Git 連携の確認 Sync 完了後、 IntelliJ の**右下のステータスバーに「Git: main」**と表示されていれば、 IntelliJ が自分の GitHub リポジトリと連携できている。 表示されない場合は `Ctrl+Shift+A` でアクション検索 → 「Enable Version Control Integration」 → Git を選択(IntelliJ New UI では旧 VCS メニューが廃止されているため、 Day 0 §7-6-B Step 29 と同じ手順を取る)。 6 リモート設定を確認 `Git → Manage Remotes...`(IntelliJ のメニュー) で、`origin` が `https://github.com/<ユーザー名>/kotlin-training.git` に設定されていることを確認。これは Day 0 §7-6-B で `git remote add origin` で設定したもの。

> **⚠ つまづきポイント**
>
> - **「Git: main」が表示されない** → ルート選択を誤っている可能性。 `C:\work\kotlin-training/.git/` がプロジェクトルートに存在するか確認(`backend` を間違って単独で開いた場合は `backend/.git/` が無いので Git 連携されない ─ Day 0 §7-6-B からやり直す)
> - **Gradle sync で固まる** → ネットワーク・プロキシを確認。社内プロキシ環境では `gradle.properties` に設定を入れる必要があるかも
> - **JDK が見つからないエラー** → `File → Project Structure → Project` で JDK 21 を選択する
> - **「No remote configured」と出る** → Day 0 §7-6-B の `git remote add origin` 手順を再実行

### 1-3. プロジェクトの構造を確認

IntelliJ の左側 Project ビューで、Day 0 で push した内容が以下のように見えるはずです。これは Day 0 で配布された `kotlin-training-samples.zip` を展開し、自分の GitHub リポジトリに push したものです。

**プロジェクトルート/**

    kotlin-training/
    ├── README.md
    ├── backend/                       ← Spring Boot + Kotlin(Day 1〜5、7 で書く)
    │   ├── build.gradle.kts
    │   ├── settings.gradle.kts
    │   └── src/main/kotlin/com/example/training/
    │       ├── TrainingApplication.kt     ← 起動クラス(Day 0 から存在)
    │       ├── controller/HelloController.kt  ← 動作確認用
    │       ├── day1/                    ← Day 1 の写経・演習を書く場所
    │       │   ├── _01_basics/          ← 章ごとに空ディレクトリ用意
    │       │   ├── _02_null/
    │       │   ├── _03_dataclass/
    │       │   └── ...
    │       ├── day2/                    ← Day 2 の演習
    │       ├── day3/                    ← Day 3 の演習
    │       ├── controller/              ← Day 4 でレイヤー実装
    │       ├── service/
    │       ├── repository/
    │       ├── domain/                  ← Entity / DTOサブパッケージ(domain/dto/)を置く
    │       ├── config/                  ← Day 5 で SecurityConfig 追加
    │       └── exception/
    ├── frontend/                      ← Vue 3 + TypeScript(Day 6〜7 で書く)
    │   ├── package.json
    │   ├── src/
    │   │   ├── App.vue
    │   │   ├── main.ts
    │   │   ├── router/index.ts
    │   │   ├── views/HomeView.vue
    │   │   ├── components/             ← Day 6 で追加
    │   │   ├── stores/                 ← Day 6 で Pinia store 追加
    │   │   ├── api/                    ← Day 7 で API クライアント追加
    │   │   └── types/                  ← Day 4 以降で型定義
    │   └── ...
    └── infra/                         ← Docker 構成(Day 0 で起動)
        ├── docker-compose.yml         ← DB + 仕入先APIモック起動
        ├── initdb/init.sql            ← テーブル定義(初回起動時に自動実行)
        └── mock-api/                  ← 仕入先APIモック(Node.js)

    solutions/                       ← 各Day演習の参考解答(詰まった時に参照)
    ├── README.md
    ├── day2/                          ← 関数型・コレクション・DSL の解答
    ├── day3/                          ← コルーチン演習の解答
    ├── day4/                          ← 商品API 5層構成 完成版
    ├── day5/                          ← JWT認証 + Order Aggregate
    ├── day6/                          ← Vue 3 TODOアプリ
    └── day7/                          ← 演習①〜⑦ + 5-5 楽観排他

Day 1 では `backend/src/main/kotlin/com/example/training/day1/` 配下にコードを書いていきます。各章用のディレクトリが空のまま用意されているので、写経はそこに置きます。

このように**7日間ぶんすべてを単一のプロジェクトに集約**しているのは、IntelliJ で1回開けば全Dayが見渡せ、Day 4以降で Day 1-3 のKotlin 言語機能を自然に呼び出せるためです。

### 1-4. 動作確認: Hello, Kotlin!

環境が動くか試します。`backend/src/main/kotlin/com/example/training/day1/Hello.kt` を新規作成し、次のコードを書く。

**backend/src/main/kotlin/com/example/training/day1/Hello.kt**

```kotlin
package com.example.training.day1

fun main() {
    println("Hello, Kotlin!")
}
```

`main` 関数の左に表示される **▶ ボタン**(緑の三角)を押すと実行される。コンソールに `Hello, Kotlin!` と表示されれば成功です。

> **✓ ここまでチェック**
>
> - IntelliJ から研修リポジトリを clone できた
> - Gradle sync が完了した
> - Hello, Kotlin! が実行できた
>
> 3つ揃っていれば次へ進めます。エラーが残っていれば講師に声をかけてください。

### Ch.02 Kotlinとは何か ─ JVM言語、コンパイル、Javaとの関係⏱ 45分

「便利なJava」と思っている人ほど、最初にここを腑に落とす必要がある

### 2-1. 一言でいうと

Kotlin とは、**JetBrains社**(IntelliJ IDEA を作っている会社)が作ったプログラミング言語です。最大の特徴は、

> **📌 Kotlinの本質**
>
> **「Javaが動くところなら、どこでも動く」**言語として設計されている。
>
> Java の**仮想マシン (JVM)** 上で動く別の言語、というのが Kotlin の最も主要な姿。Java で書かれたライブラリも自由に呼び出せるし、Kotlin で書いたクラスを Java から呼び出すこともできる。

つまり、**Kotlin は Java を置き換えるのではなく、Java の上で動く別の構文**です。これが理解の出発点になります。

### 2-2. コンパイルの流れ ─ Java脳のチューニング

Java の場合、コードは `.java` → `javac` → `.class`(JVMバイトコード) → JVMが実行、という流れでした。

Kotlin もまったく同じ流れです。違うのは入口の **コンパイラだけ**。

［図（テキスト抽出）：.java ファイル / Hello.java / javac / .class / JVMバイトコード / JVM / (Java Virtual Machine) / 実行 / .kt ファイル / Hello.kt / kotlinc / .class / JVMバイトコード / JVM / (Java Virtual Machine) / 実行 / 同じJVMが / 両方を実行 / Java の場合 / Kotlin の場合 / → どちらも / 同じ「.class」を / 出力するので / 互換性あり］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図2-1: Java と Kotlin のコンパイル流れ。入口のソースが違うだけで、出力(.class)も実行環境(JVM)も完全に同じ。

重要なのは、**Kotlin から出力された .class は、Java の .class と完全に互換**だということ。だから:

- Java で書いたクラスを Kotlin から呼び出せる(`new ArrayList()` の代わりに `ArrayList()` など)
- Kotlin で書いたクラスを Java から呼び出せる
- 同じプロジェクトに Java と Kotlin のファイルを混在させられる(Gradle が両方コンパイルしてくれる)

### 2-3. Java と Kotlin のコードを並べてみる

同じ「Person クラスを作って名前を表示する」処理を、Java と Kotlin で並べます。Kotlin のほうがシンプルになりましたが、**コンパイル後に生成されるバイトコードは同じ**であることを意識してください。

Java

**Person.java**

```java
public class Person {
    private final String name;
    private final int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
}

// 使う側
Person p = new Person("Alice", 30);
System.out.println(p.getName());
```

Kotlin

**Person.kt**

```kotlin
class Person(
    val name: String,
    val age: Int
)

// 使う側
val p = Person("Alice", 30)
println(p.name)
```

同じ振る舞いをするコードが、Kotlin だと **大幅に短く**書けます。これは「Kotlinが頑張っている」のではなく、**Kotlinコンパイラが裏で getter/setter/コンストラクタ/finalフィールドを自動生成している**からです。

> **💡 「等価」とはどういうことか**
>
> 右の Kotlin コードをコンパイルすると、左の Java コードをコンパイルしたのと(ほぼ)同じ `.class` が出来上がります。`Person.kt` をビルドしたあと、`javap -p Person.class` で確認すると `getName()` や `getAge()` が確かに存在することがわかります。

### 2-4. Java脳がハマるポイント

#### (a) 「new」がない

Kotlin にはインスタンス生成の `new` キーワードがありません。クラス名を関数のように呼ぶだけ。

**インスタンス生成**

    // Java
    Person p = new Person("Alice", 30);

    // Kotlin
    val p = Person("Alice", 30)

#### (b) セミコロンを書かない

Kotlin では文末のセミコロンが省略可能(書いてもエラーにはならないが、書かないのが普通)。

#### (c) 型を後ろに書く

Java は `String name` のように「型 → 変数名」、Kotlin は `name: String` で「変数名 → コロン → 型」。最初は気持ち悪いが、型推論で型を省略できる場面が多いため、慣れると気にならなくなる。

**型の書き方**

    // Java
    String name = "Alice";
    int age = 30;

    // Kotlin (型を明示)
    val name: String = "Alice"
    val age: Int = 30

    // Kotlin (型推論で省略 ─ こちらが普通)
    val name = "Alice"
    val age = 30

#### (d) val と var

Java の `final String name` = Kotlin の `val name`。Java の `String name`(final なし) = Kotlin の `var name`。**Kotlin では「不変(val)」がデフォルト**という設計思想。これは Java の「`final` を後付けで書く」のと真逆。

> **⚠ Kotlinの大原則**
>
> 変数は **まず val で書く**。後から「あ、これ書き換える必要があるな」と気づいたときだけ `var` に変える。実務コードの 90% 以上は `val` で書ける、と考えて良い。

#### (e) プリミティブ型と参照型を区別しない

Java は `int` と `Integer`、`long` と `Long` のように、プリミティブ型と参照型(ラッパー型)を文法上 別物として扱う。Kotlin にはこの区別がなく、**すべて参照型風の名前で統一**される。

| 種類                       | Java                                                           | Kotlin                      |
|----------------------------|----------------------------------------------------------------|-----------------------------|
| 整数(8 / 16 / 32 / 64 bit) | `byte / short / int / long` と `Byte / Short / Integer / Long` | `Byte / Short / Int / Long` |
| 浮動小数点                 | `float / double` と `Float / Double`                           | `Float / Double`            |
| 文字                       | `char / Character`                                             | `Char`                      |
| 真偽値                     | `boolean / Boolean`                                            | `Boolean`                   |
| 文字列                     | `String`(元から参照型のみ)                                     | `String`(同じ)              |

これは**「コンパイル後にも参照型しか残らない」という意味ではない**。Kotlin コンパイラは文脈に応じて、Java で言うプリミティブ `int` とラッパー `Integer` を裏で自動的に使い分ける。**実行時のオーバーヘッドは Java と同じ**で、文法上の見た目だけが統一されている、という性能と書きやすさの両取りの設計。

> **💡 String はもともと参照型なので変化なし**
>
> Java では `String` はそもそも参照型しか存在しません(プリミティブ版はない)。`"hello"` リテラルも内部的には `String` オブジェクトです。なので Kotlin でも `String` の扱いは Java とまったく同じで、新しいルールを覚える必要はありません。一方で Kotlin の `String` には **Null安全**(`String` vs `String?`)と **文字列テンプレート**(`"$name"`)という別の改良が入っており、それらは 6-3 / 6-4 で扱います。

### 2-5. なぜKotlinが生まれたのか ─ 背景

JetBrains は IntelliJ IDEA を Java で書いていて、社内コードベースが巨大化していくに連れて Java の冗長さ・null安全の欠如・コレクション操作の使いにくさに困っていた。彼らの動機は明確で:

- **Java と 100% 互換**でないと意味がない(既存資産が膨大)
- **記述量を減らしたい**(getter/setter/equals/hashCode 自動生成、ボイラープレート削減)
- **NullPointerException(NPE)を撲滅したい**(コンパイル時に null チェックを強制)
- **関数型のスタイルを取り入れたい**(関数を値として扱う「高階関数」を自然に書けるように)

2011年に発表され、2016年に1.0リリース。2017年に Google が Android 公式言語に採用、2019年に「Android開発の第一言語」に格上げされたことで一気に普及。現在は Spring Boot も Kotlin を公式サポートしており、サーバーサイド Kotlin の採用企業も増えています。

### 2-6. 章末まとめ

> **✓ ここまでで押さえること**
>
> - Kotlin は JVM上で動く言語。Java と同じバイトコードを出力する。
> - Java と完全互換 ─ 相互呼び出しが可能。
> - Kotlin コンパイラは `kotlinc`(IntelliJ や Gradle が裏で実行する)。
> - Java脳との5つの差分: `new`なし / セミコロンなし / 型は後ろ / val優先 / プリミティブと参照型の区別なし。

**💡 小演習 2-1**

次のJavaコードを Kotlin で書き直してください。`backend/src/main/kotlin/com/example/training/day1/_01_basics/Ex01.kt` に書く。

**Java版(参考)**

    public class Product {
        private final String code;
        private final String name;
        private final int price;

        public Product(String code, String name, int price) {
            this.code = code;
            this.name = name;
            this.price = price;
        }
        // getter 省略
    }

    // 使う側
    Product p = new Product("P001", "りんごジュース", 150);
    System.out.println(p.getName() + " は " + p.getPrice() + " 円");

ヒント: クラス本体は 1行で書ける。出力は文字列テンプレート(`$`)を使うと `+` 連結より読みやすい(次の章で解説)。

### Ch.03 4つのコンパイルターゲット ─ KotlinはJVMだけじゃない⏱ 45分

「Kotlin = Java互換」だけだと、Kotlinの全体像が見えない

### 3-1. Kotlinは複数のプラットフォーム向けにコンパイルできる

前章で「Kotlin は JVM 上で動く」と言いましたが、これは Kotlin の**一面**にすぎません。Kotlin コンパイラは現在、以下の**4つのターゲット**に向けてバイトコードを生成できます。

［図（テキスト抽出）：Kotlin ソースコード / .kt / (同じ言語仕様) / ① JVM / → .class (JVMバイトコード) / 本研修のメインターゲット / サーバーサイド開発 / Spring Boot、Ktor、Micronaut / ② Android / → .dex (Dalvikバイトコード) / Google公式の第一言語(2019〜) / Jetpack Compose で宣言的UI / 99%以上のAndroidアプリ採用 / ③ Native / → 実行ファイル (LLVM経由) / iOS / Linux / Windows ネイティブ / JVMなしで動く / CLI/iOSアプリ / ④ JS / Wasm / → JavaScript / フロントエンド開発 / Webブラウザ / で実行 / Kotlin Multiplatform (KMP) / 同じビジ …］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図3-1: Kotlin の 4つのコンパイルターゲット。同じソースから複数の出力を作れる。

### 3-2. それぞれの位置づけ

| ターゲット    | 主な用途                                          | 代表的フレームワーク                     | 本研修との関係                                                     |
|---------------|---------------------------------------------------|------------------------------------------|--------------------------------------------------------------------|
| **JVM**       | サーバーサイドWeb、業務システム、バッチ処理       | Spring Boot, Ktor, Micronaut, Quarkus    | **本研修のメイン**。Day 4〜7 で **Kotlin + Spring Boot** を使う    |
| **Android**   | スマホアプリ開発(Android)                         | Jetpack Compose, Android SDK             | 研修範囲外。だが言語仕様は共通なので Day 1 の知識はそのまま使える  |
| **Native**    | iOS、CLI、組込み(LLVM 経由でネイティブコード生成) | Kotlin Multiplatform Mobile              | 研修範囲外                                                         |
| **JS / Wasm** | フロントエンドWeb、ブラウザ内ロジック             | Kotlin/JS, kotlin-react, Compose for Web | 研修ではフロントは Vue 3 + TypeScript を使う(Kotlin/JS は使わない) |

> **💡 「研修ではJVMだけ」と割り切る**
>
> 本研修では **JVMターゲットのみ**を扱います。Kotlin の本領は JVM 上のサーバーサイドで発揮されるので、これに集中するのが業務的に最もリターンが大きい選択です。
>
> ただし「Kotlin = サーバーだけの言語」と覚えると視野が狭くなります。**同じ言語で Android アプリも書ける、CLI ツールも書ける、Web フロントも書ける**という事実が、Kotlin の戦略的な強みです。

### 3-3. Kotlin Multiplatform (KMP) ─ 1つのコードを多プラットフォームへ

4つのターゲットがあるだけなら、それぞれ別の言語(Java、Swift、TypeScript)を使えば良いのでは? と思うかもしれません。**KMP** の真の価値は、**1つのKotlinコードを複数ターゲットで共有できる**点です。

［図（テキスト抽出）：Shared Kotlin Code / ビジネスロジック / API呼び出し / モデル / (複数プラットフォームで共通利用) / iOS (Native) / SwiftUI で画面 / ロジックはKotlinから呼ぶ / Android (JVM) / Compose で画面 / 同じKotlinコード / Web (JS / Wasm) / HTML/CSS で画面 / 同じロジックを呼ぶ］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図3-2: KMPでは「共通ロジック」を Kotlin で書き、各プラットフォームのUIだけを別々に作る。Java や Swift だけでは実現不可能な構成。

たとえば「商品検索」のAPI呼び出しロジックは、iOS でも Android でも Web でも本質的に同じです。KMP を使うと、この共通部分を Kotlin で1回書けば 3つのアプリで共有できる。**これは Java や TypeScript 単体ではできないことです**。

> **⚠ 注意: 研修では KMP はやらない**
>
> KMP はパワフルですが、設定が複雑でビルドツールの理解も要求されます。本研修では扱いません。ただし**「Kotlinの選択肢にはこういうものもある」**と知っておくと、技術選定の引き出しが広がります。

### 3-4. 章末まとめ

> **✓ ここまでで押さえること**
>
> - Kotlin は 4つのターゲット(JVM / Android / Native / JS)に向けてコンパイルできる。
> - 本研修は **JVM ターゲットのみ**(**Kotlin + Spring Boot**)。他は範囲外だが言語仕様は共通。
> - **KMP** を使うと、1つの Kotlin コードを iOS / Android / Web で共有できる。
> - 「JVM言語」というだけでない、Kotlin の幅広さ・戦略的な価値が見えてくる。

### Ch.04 フロントエンド/バックエンドのビルドパターン A / B / C⏱ 45分

Kotlin で Web を作るとき、フロントエンドとバックエンドをどう構成するか

### 4-1. なぜビルドパターンを学ぶのか

Kotlin + Spring Boot で Web アプリを作るとき、フロントエンド(画面)とバックエンド(API)をどう構成するかには大きく **3つのパターン**があります。実務での選択肢を知っておくと、技術選定や設計レビューで的確な判断ができます。

本研修では **パターンA(完全分離)** を採用します。これが現代の業務Web開発で**最も主流**だからです。

### 4-2. パターンA: 完全分離(本研修で採用)

フロントエンドとバックエンドを**完全に別プロジェクトとしてビルド・デプロイ**する構成。

［図（テキスト抽出）：Frontend Project / Vue 3 + TypeScript + Vite / npm run build → dist/ / ───────── / Nginx / 静的ホスティング / に配置 / Backend Project / Kotlin + Spring Boot + Gradle / gradle bootJar → .jar / ───────── / java -jar で起動 / REST API を公開 / Database / PostgreSQL / Docker起動 / HTTP/JSON / (REST) / JDBC / パターンA: 完全分離(本研修) / それぞれ独立にビルド・デプロイ。フロントは静的ファイル、バックはAPIサーバとして公開。］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図4-1: パターンA ─ フロントエンドとバックエンドが完全に独立した別プロジェクト。

| 項目           | 内容                                                                                                                                                                                                                                |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| フロントエンド | Vue 3 + TypeScript。`npm run build` で静的ファイル(HTML/JS/CSS) を出力。                                                                                                                                                            |
| バックエンド   | Kotlin + Spring Boot。`gradle bootJar` で実行可能 jar を出力。                                                                                                                                                                      |
| 通信           | REST API(JSON over HTTP)。<a href="#glossary-cors" style="color:var(--accent);text-decoration:underline">CORS</a>設定が必要(<a href="#glossary-cors" style="color:var(--accent);text-decoration:underline">→ 巻末 A-1 で解説</a>)。 |
| デプロイ       | フロントは Nginx / CDN。バックは別サーバで java -jar 起動。                                                                                                                                                                         |
| 採用例         | 大規模Webサービス、SPA、モバイル対応(将来Androidアプリも作れる)。                                                                                                                                                                   |

#### 長所

- フロントエンドとバックエンドを**別チームで並列開発**できる
- 同じバックエンドAPIを Web / モバイル / 外部システム から共有できる
- 技術選定が独立(フロントは Vue → React に移行可能、バックは Java → Kotlin に移行可能)
- スケールアウトしやすい(フロントエンドとバックエンドを別々にスケール)

#### 短所

- <a href="#glossary-cors" style="color:var(--accent);text-decoration:underline">CORS</a> の設定が必要(<a href="#glossary-cors" style="color:var(--accent);text-decoration:underline">→ 巻末 A-1 で解説</a>)
- 初期セットアップが少し複雑
- 小規模アプリではオーバースペック

### 4-3. パターンB: モノレポ(同一リポジトリ・別ビルド)

フロントエンドとバックエンドを**同じGitリポジトリ**に入れるが、ビルドとデプロイは別々に行う構成。

［図（テキスト抽出）：単一 Git リポジトリ / project-root/ / frontend/ / Vue 3 + TypeScript / 独自の package.json / npm run build / backend/ / Kotlin + Spring Boot / 独自の build.gradle.kts / gradle bootJar / パターンB: モノレポ / 特徴: / ・1つのリポジトリで管理 / ・ビルドは別々 / ・デプロイも別々 / ・PR管理がしやすい / ・整合性を保ちやすい］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図4-2: パターンB ─ 同じリポジトリだが、フロントエンドとバックエンドは独自のビルド・デプロイ。

#### 長所

- フロントエンドとバックエンドの**変更を1つのPR**で管理できる(API追加+画面追加の同期がしやすい)
- バージョン管理が単純(リポジトリが1つ)
- パターンAの長所はほぼ維持(独立ビルド・独立デプロイ)

#### 短所

- リポジトリが大きくなりがち
- CI/CD設定が少し複雑(片方だけのビルドをトリガーする工夫が必要)

### 4-4. パターンC: jar同梱(Kotlin + Spring Boot の静的リソース機能)

フロントの静的ファイルを**バックエンドのjarに含めて**1つにまとめる構成。

［図（テキスト抽出）：app.jar(1ファイル) / /static/ / index.html / main.js / main.css / (npmで事前ビルド済) / Kotlin + Spring Boot / Controller / Service / JPA / Repository / パターンC: jar同梱 / 特徴: / ・全部1ファイル / ・java -jar 1回でフロントエンド+バックエンド起動 / ・社内ツール、デモアプリ向き / ・CORS不要］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図4-3: パターンC ─ フロントの静的ファイルを jar の中に同梱。デプロイは jar 1つだけ。

#### 長所

- **デプロイが最も単純** ─ jar 1個だけサーバに置けば動く
- CORS が不要(同じオリジンから配信)
- 小規模社内ツール、デモ、PoCに最適

#### 短所

- フロントエンドとバックエンドが密結合 ─ 別々にスケールできない
- フロントだけ更新したい場合も jar 全体を再ビルド・再デプロイ
- モバイルなど他クライアントからの API 利用が難しい

### 4-5. 3パターン比較

| 項目       | A: 完全分離      | B: モノレポ   | C: jar同梱              |
|------------|------------------|---------------|-------------------------|
| リポジトリ | 別々             | 1つ           | 1つ(または別)           |
| ビルド     | 別々             | 別々          | npmビルド→jar内へコピー |
| デプロイ   | 別々(2サーバ)    | 別々(2サーバ) | jar 1つ                 |
| CORS       | 必要             | 必要          | 不要                    |
| スケール   | 独立             | 独立          | 同期                    |
| 並行開発   | ◎ 最適           | ○             | △                       |
| 規模の目安 | 中〜大規模       | 中規模        | 小規模・社内            |
| 採用主流度 | ★★★ (現代の主流) | ★★            | ★                       |

> **📌 なぜ本研修はパターンAなのか**
>
> 業務システム研修の目的は「実務で使える設計を身につける」こと。**大規模業務システムでは A が圧倒的に主流**(チーム分業、独立スケール、技術選定の柔軟性、モバイル対応)で、これを実体験することが受講者の市場価値を高めます。
>
> パターン B・C も知識として押さえておけば、小規模案件・社内ツール案件で適切な選択ができるようになります。

### 4-6. 章末まとめ

> **✓ ここまでで押さえること**
>
> - Web アプリのビルド構成には A(完全分離) / B(モノレポ) / C(jar同梱) の3パターンがある
> - 本研修は **A** を採用 ─ 現代業務開発の主流
> - パターンB は中規模、パターンC は小規模・社内向き
> - 選定軸: チーム規模、スケール要件、複数クライアント対応、デプロイ単純性

### 4-7. 本研修で採用する構成 ─ 全体像とソフトウェアスタック

ここまで A/B/C のパターンを抽象的に見てきました。本研修で採用するのは **パターンA(完全分離)**。「**フロント(HTML/TS/CSS で書かれた Vue.js)** → **<a href="#glossary-rest" style="color:var(--accent);text-decoration:underline">REST(JSON over HTTP)</a>**(<a href="#glossary-rest" style="color:var(--accent);text-decoration:underline">→ 巻末 A-4 で解説</a>) → **Spring Boot(Kotlin)** → **DB(PostgreSQL)**」という構成です。業務定義書の**第7章 アプリケーションアーキテクチャ**に対応する内容です。

#### 4-7-1. システム構成図(物理配置とプロトコル)

［図（テキスト抽出）：本研修のシステム構成 ─ フロント → REST → Spring Boot → DB / ① ブラウザ / Chrome / Edge / 受講者PC / localhost:5173 / ② Vue 開発サーバ / Vite + Vue 3 + TS / HTML/CSS/TS / :5173 (Node.js 22) / ③ Spring Boot / Kotlin 2.0 / SB 3.4 / 組み込み Tomcat / :8080 (JDK 21) / ④ PostgreSQL / RDBMS / :5432 (Docker) / DB: training / HTTP / REST / JSON/HTTP / JDBC / SQL / 3社並列 HTTP(Day 3 コルーチン題材) / ⑤ 仕入先APIモック(3社) / SUP001 アルファ食品 / SUP002 ベータ商 …］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図4-1: 本研修のシステム構成 ─ 4つの主要コンポーネント + 外部APIモック(業務定義書 図7-1 相当)

参考: 業務定義書 第7章 §7.1 からの原典抜粋

［画像：業務定義書 図7-1: アーキテクチャ図 - システム構成］（元HTMLの埋め込み画像。Markdown版では省略）

図4-1-b: 業務定義書「図7-1: アーキテクチャ図 - システム構成」原典(配布資料 `Kotlin演習_業務設計資料.docx` より転載)

上の図4-1(SVG版)は研修テキストでの解説用に詳細化されたもの、図4-1-b は業務定義書の原典です。**両者は同じシステムを表しており、本研修のシステム構成は業務定義書と整合しています**。受講者は研修中、コードを書きながら業務定義書(`Kotlin演習_業務設計資料.docx`)も適宜参照することで、「機能要件 ⇄ 実装」 の対応関係を意識できます。

この構成で受講者は **1台のPC内ですべてが動く**状態になります。Day 0 §7 で構築済み、Day 4 Ch.01-0 で「開発環境の全体像」として再掲します。

#### 4-7-2. ソフトウェアスタック(各サーバの中身)

続いて、上のシステム構成図の **② Vue 開発サーバ** と **③ Spring Boot** の中身がどう積み重なっているかを見ます。「自分が書くコードは、このスタックのどこに位置するのか」を意識すると学習がはかどります。

［図（テキスト抽出）：ソフトウェアスタック ─ 各サーバの中身を積み重ねで見る / ② Vue 開発サーバ(フロント側) / 画面コンポーネント (受講者が書く) / .vue ファイル(template / script / style) / Vue Router / Pinia / axios / ルーティング / 状態管理 / API呼出 / Vue 3 (フレームワーク) / TypeScript(コンパイル → JavaScript) / Vite(ビルドツール、HMR、dev server) / Node.js 22(実行環境、npm) / Day 6 で書く範囲: 上の2層 / 下の4層は環境として与えられる / ③ Spring Boot(バック側) / Controller/Service/Repository(受講者が書く) / .kt ─ @RestController / @Servic …］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図4-2: ソフトウェアスタック ─ Vue 開発サーバ と Spring Boot の中身、両側にまたがる横断ライブラリ(業務定義書 図7-2 相当)

#### 4-7-3. 受講者が「書く」のはどの層か

図4-2 の通り、本研修で受講者が直接書くのは**各スタックの一番上の2層**です。下の層(Vue / Vite / Spring Boot / JVM など)は配布物に組み込まれており、「使う」ことはあっても「書く」ことはありません。

| Day          | スタックのどこを書くか                                       | 具体的に何を書くか                                                      |
|--------------|--------------------------------------------------------------|-------------------------------------------------------------------------|
| **Day 1〜3** | バック側「Domain / DTO」相当の Kotlin 言語の基礎             | data class、Null安全、関数型、コルーチン(まだ Spring Boot は登場しない) |
| **Day 4〜5** | バック側 上2層(Controller/Service/Repository + Domain/DTO)   | 業務ロジック、エンティティ、JPA、トランザクション、認証                 |
| **Day 6**    | フロント側 上2層(画面コンポーネント + ルーティング/状態管理) | .vue ファイル、Vue Router、Pinia、axios で API 呼出                     |
| **Day 7**    | フロント + バック 両側を繋ぐ                                 | 業務シナリオ(UC07/UC08/UC11 等)を完成、フロント・バック連動を実装       |

> **📌 「データはJSONで橋渡しされる」── REST の本質**
>
> 図4-1 の中央矢印に書いた「**REST(JSON over HTTP)**」は、本研修で最も重要な接点です。Spring Boot 側で書いた Kotlin の `data class` は、Jackson が自動的に JSON に変換して HTTP レスポンスとして送り出します。Vue 側では axios が JSON を受け取って TypeScript の interface に流し込みます。**同じデータが「Kotlin オブジェクト → JSON → TypeScript オブジェクト → 画面の DOM」と4回姿を変えて、最後に画面に表示される** ─ これが業務システムのデータの流れの本質です(業務定義書 第9章「データの流れ全体図」も参照)。
>
> 各境界での変換が、フレームワークによって自動で行われるか / 手で書くかの違いはありますが、研修中に書くコードは**すべてこの変換チェーンのどこかを書いている**と意識すると、混乱しません。

### Ch.05 なぜKotlinはWeb・業務系で強いのか⏱ 30分

Spring Boot公式サポートと採用企業の動向

### 5-1. Spring Boot が Kotlin を公式サポート

Spring Boot 2.0 (2018年) から Spring Framework が **Kotlin を一級言語としてサポート**するようになりました。これは大きな転換点でした。

- Spring Initializr (start.spring.io) で「言語」として Java / Kotlin / Groovy が選べる
- 公式ドキュメントに Java と Kotlin のコードが両方掲載されている
- Kotlin DSL でビルド設定が書ける(`build.gradle.kts`)
- テストフレームワーク MockK、JUnit5 と Kotlin の相性が良い

つまり、Spring Boot の機能・エコシステムを**Javaと同じように**使えるうえに、**Kotlinならではの恩恵**(Null安全、data class、拡張関数、コルーチン)も受けられる、というのが現状です。

### 5-2. Kotlin が Web 開発で発揮する強み

#### (1) Null安全 → 本番障害の半分が消える

業務システムの本番障害で最も多いのは **NullPointerException(NPE)**。Kotlin はコンパイル時に null をチェックするため、Java で書いた業務システムから発生する NPE のほとんどが、Kotlin だとそもそも書けなくなる。

#### (2) data class → DTOやRequest/Responseが3行で書ける

Web API では「リクエスト・レスポンスのデータクラス」を大量に作る。Java では Lombok の `@Data` を使っても十数行、Kotlin の `data class` なら1行。コードレビューでクラス本体ではなく業務ロジックに集中できる。

#### (3) コルーチン → 非同期処理が「同期コードのように」書ける

外部API並列呼び出しなど、Java では CompletableFuture や RxJava で苦労する処理が、Kotlin のコルーチンを使うと **同期コードと同じ見た目**で書ける。研修では Day 5 で扱う。

#### (4) 拡張関数 → 既存クラスに後付けで機能を生やせる

Java では `StringUtils.isEmpty(s)` のような static ヘルパーがあちこちに散る。Kotlin の拡張関数なら `s.isEmpty()` として書けて、IDE 補完にも乗る。業務コードの可読性が上がる。

#### (5) 不変(immutable) ファースト → 並行処理での事故が減る

`val` がデフォルト、`List` も不変がデフォルト。並行処理で「いつのまにかリストが書き換えられて事故る」というJavaあるあるが起きにくい。

### 5-3. Java から Kotlin への移行コストは「小さい」

新しい言語を導入するときの最大の懸念は**「学習コスト」「既存資産との互換性」**。Kotlin はこの両方を解決しています。

| 懸念                            | Kotlinの答え                                                                                   |
|---------------------------------|------------------------------------------------------------------------------------------------|
| Java の知識は活かせる?          | ◎ JVM言語なので JVM/GC/型/コレクションの概念はそのまま。文法だけ覚えれば良い。                 |
| 既存の Java ライブラリは使える? | ◎ そのまま使える。Spring/Hibernate/Jackson/Apache Commons など全部使える。                     |
| 既存の Java コードと混ぜられる? | ◎ 同じプロジェクトに混在可。新規部分だけ Kotlin で書く段階的移行が可能。                       |
| IntelliJ で書きやすい?          | ◎ JetBrains が作った言語なので IntelliJ のサポートが最強。Java → Kotlin 自動変換ツールもある。 |
| ビルドは Java と同じ?           | ◎ Gradle / Maven そのまま。`kotlin` プラグインを追加するだけ。                                 |

### 5-4. 採用企業の動向 ─ サーバーサイドKotlin

日本国内・海外でサーバーサイド Kotlin の採用が進んでいます。代表的な例:

- **海外**: Netflix、Pinterest、Trello、Atlassian、Coursera、Expedia、N26(銀行)
- **日本国内**: マネーフォワード、LINE Yahoo、Cookpad、ZOZO、メルカリ、Money Forward、Wantedly

採用理由は概ね共通で、「Javaの資産を活かしつつ、コードが半分くらいになる」「NPE系のバグが大幅に減った」「Spring Boot との相性が抜群」というもの。

> **💡 業界トレンドを示す数字**
>
> JetBrains の「State of Developer Ecosystem 2024」によれば、サーバーサイド Kotlin の採用率は**年々増加傾向**。Java 開発者の半数以上が「Kotlin を学びたい / 既に使っている」と回答しています。「Kotlin が書ける Java エンジニア」は市場価値が高い。

### 5-5. 午前の総括

> **✓ Kotlin概論まとめ**
>
> - Kotlin は JVM上で動く別言語。Java と 100% 相互呼び出し可。
> - 4つのコンパイルターゲット ─ JVM / Android / Native / JS。研修は JVM のみ。
> - Web ビルド構成は A(完全分離) を採用 ─ 現代業務開発の主流。
> - Kotlin の強み: Null安全、data class、コルーチン、拡張関数、不変ファースト。
> - Java からの移行コストは小さく、採用企業も増加中。

これで Kotlin の「位置づけ」がクリアになりました。**休憩を挟んで、午後は手を動かしてKotlinの構文を体感していきます。**

### Ch.06 基本構文 + Null安全⏱ 90分

val / var、関数、文字列テンプレート、そして本日の主役 ─ Null安全

### 6-1. 変数: val と var

Java

**Java変数**

    // 再代入可能
    String name = "Alice";
    name = "Bob";  // OK

    // 再代入不可
    final String id = "P001";
    // id = "P002"; ← コンパイルエラー

Kotlin

**Kotlin変数**

    // 再代入可能 (var = variable)
    var name = "Alice"
    name = "Bob"  // OK

    // 再代入不可 (val = value)
    val id = "P001"
    // id = "P002" ← コンパイルエラー

> **⚠ Kotlinの大原則: val ファースト**
>
> 「変数はまず `val` で書く、後から書き換える必要に気づいたら `var` に変える」が鉄則。実務コードは 90% 以上が `val` で書ける。**Java の `final` を後付けで書くのと真逆**の発想です。

#### 型推論 ─ 型を書かなくて済む

Kotlin は **右辺から型を推論**します。冗長な型宣言は省略するのが普通です。

**型推論**

    val name = "Alice"      // String と推論
    val age = 30             // Int と推論
    val price = 150.5        // Double と推論
    val active = true        // Boolean と推論
    val items = listOf(1, 2, 3)  // List<Int> と推論

    // 必要なときは型を明示できる
    val count: Long = 100L
    val empty: List<String> = emptyList()

### 6-2. 関数の定義

Java

**Java**

```java
public int add(int a, int b) {
    return a + b;
}
```

Kotlin

**Kotlin**

```kotlin
fun add(a: Int, b: Int): Int {
    return a + b
}
```

#### 単一式関数 ─ 1行で書く

関数本体が式1つなら、`{}` も `return` も省略して `=` で書ける。

**単一式関数**

    fun add(a: Int, b: Int): Int = a + b

    // 戻り値型も推論できる(短い関数のみ推奨)
    fun add(a: Int, b: Int) = a + b

    // デフォルト引数
    fun greet(name: String, prefix: String = "Hello"): String =
        "$prefix, $name!"

    greet("Alice")              // → "Hello, Alice!"
    greet("Alice", "Hi")         // → "Hi, Alice!"

    // 名前付き引数 ─ 順番無視でも書ける、コードが読みやすい
    greet(name = "Alice", prefix = "Hi")

> **💡 Java脳との差分: デフォルト引数 & 名前付き引数**
>
> Java では「同じ関数名で引数違いの版を複数定義する(オーバーロード)」必要があった。Kotlin では**1つの関数定義で済む**。実務コードでは API メソッドのオプション引数を表すのに頻出。

### 6-3. 文字列テンプレート ─ 「+」連結をやめる

Java

**Java連結**

    String name = "Alice";
    int age = 30;

    // + 連結 (読みにくい)
    String msg = "name: " + name +
                 ", age: " + age;

    // String.format (引数と書式が離れる)
    String msg2 = String.format(
        "name: %s, age: %d", name, age);

Kotlin

**Kotlinテンプレート**

    val name = "Alice"
    val age = 30

    // $変数名 で埋め込み
    val msg = "name: $name, age: $age"

    // ${式} で式を埋め込み
    val msg2 = "name: $name, ${name.length}文字"

    println("$name は $age 歳")
    // → Alice は 30 歳

変数を埋め込むなら `$変数名`、式を埋め込むなら `${式}`。これだけ。**業務コードの文字列処理がほぼ全部これで書ける**。

### 6-4. 【ここから本題】Null安全 ─ Kotlinの最重要機能

業務システムの本番障害ランキング1位は、ほぼ間違いなく **NullPointerException(NPE)**。Kotlin はこの問題を**言語仕様レベル**で解決します。

#### Java: null は型システムの外

Java では「String 型の変数」は値が `null` かもしれないし、文字列かもしれない。コンパイラは区別しないので、null チェックを忘れると本番でNPEが出る。

#### Kotlin: null は型に組み込まれる

Kotlin では `String` と `String?`(疑問符付き)が**別の型**。前者は絶対に null にならず、後者は null になりうる。

同じ処理を Java と Kotlin で並べてみます。**同じバグが、Java では実行時、Kotlin ではコンパイル時に発覚**します。

JAVA

**UserService.java**

```java
public class UserService {
    public Integer nickLength(User u) {
        // uが null かもしれないことに気付かない
        // nickname も null かもしれない
        return u.getNickname().length();
        // → 実行時に NullPointerException が出るかもしれないが、
        //    コンパイルは通ってしまう
    }
}
```

KOTLIN

**UserService.kt**

```kotlin
class UserService {
    fun nickLength(u: User): Int {
        // User? なら受け取った時点でコンパイルエラー
        // nickname が String? なら .length は呼べない
        return u.nickname.length
        // nickname が nullable なら ?.length にしろ、と
        // IntelliJ がエラー赤線でその場で指摘してくれる
    }
}
```

> **✅ メリットの本質**
>
> Java で NPE が出るのは「本番に行ってから」「ユーザーが特定操作した時だけ」など、再現が難しい場面が多い。Kotlin は**コードを書いている最中**に IDE が赤線を引いてくれる。**本番障害が、開発時のエラーに前倒し**される。これは品質・コストの両面で計り知れない効果があります。

**Nullable / Non-nullable**

    val name: String = "Alice"      // 絶対に null じゃない
    // name = null  ← コンパイルエラー!

    val nick: String? = null       // null になりうる(? を付ける)
    val nick2: String? = "Al"       // 値が入ることもある

    // 普通のメンバアクセス
    println(name.length)               // OK
    // println(nick.length)  ← コンパイルエラー! ?. を使え、と怒られる

> **📌 これがKotlinの「Null安全」の本質**
>
> 「null が入る可能性のある変数」を**型システムで区別**することで、null チェック漏れを**コンパイル時に検出**できる。実行時のNPEではなく、コンパイル時のエラーになる ── これが Java との最大の違い。

### 6-5. Null安全演算子4種 ─ 使い分け

Null安全な型(`String?`等)を扱うために、Kotlin には**4種類の専用演算子**があります。Java では同じことを `if (x != null) { ... }` や三項演算子で延々と書いていた処理が、1〜2文字の演算子で表現できます。

| 用途                                | Java で書くと                      | Kotlin                  |
|-------------------------------------|------------------------------------|-------------------------|
| null じゃない時だけメソッド呼び出し | `x != null ? x.foo() : null`       | `x?.foo()`              |
| null の時はデフォルト値を使う       | `x != null ? x : "default"`        | `x ?: "default"`        |
| null じゃない時だけブロック実行     | `if (x != null) { ... x ... }`     | `x?.let { ... it ... }` |
| 絶対 null じゃないと言い切る        | (言語機能なし、設計レビューで指摘) | `x!!`(危険、最終手段)   |

では1つずつ見ていきます。

#### ① セーフコール `?.` ─ null なら処理を飛ばす

**セーフコール**

    val nick: String? = null

    // Java脳: nick.length → NPE
    // Kotlin: nick?.length
    val len = nick?.length      // nick が null なら len も null
    println(len)                // → null

    // チェーンも書ける
    val nameLength = product?.name?.length

**意味**: 左の値が null なら、右の処理を飛ばして全体を null にする。「null ならスキップ」のシンプルな短絡評価。

#### ② エルビス演算子 `?:` ─ null ならデフォルト値

**エルビス**

    val nick: String? = null

    // nick が null なら "(no nickname)" を使う
    val display = nick ?: "(no nickname)"
    println(display)            // → (no nickname)

    // セーフコールと組み合わせる ─ 業務でよく見る形
    val len = nick?.length ?: 0   // null なら 0

    // 早期return にも使える
    fun parse(s: String?): Int {
        val str = s ?: return -1      // null なら -1 を返して終了
        return str.toInt()
    }

**意味**: 左が null ならば右の値を使う。Java の `x != null ? x : default` の短縮形。

#### ③ let ─ null じゃないときだけ実行

**let**

    val nick: String? = "Al"

    // nick が null でないときだけ {} 内を実行
    nick?.let {
        println("nickname is $it")   // it = nick の中身
    }
    // nick が null なら何もしない

**意味**: 「null でないなら、それを使って何かする」が1行で書ける。詳しくは Ch8(スコープ関数) で扱う。

#### ④ Not-null assertion `!!` ─ 「null にはならないと明確である(私は確信している)」

**!!演算子**

    val nick: String? = "Al"

    // null じゃないことを保証(間違ってたらNPE)
    val len = nick!!.length

> **🚨 !! は最終手段**
>
> これを使うと「Kotlin の Null安全を投げ捨てて Java の世界に戻る」のと同じ。**業務コードに `!!` が出てきたら設計を見直すべき**。`?.` / `?:` / `let` でほぼ全ケース解決できる。

### 6-6. スマートキャスト ─ コンパイラの賢さ

Kotlin はコンパイラが「変数が null じゃない」と判断できる文脈では、`?.` を書かなくて良い。これを **スマートキャスト** と呼ぶ。

**スマートキャスト**

    fun describe(nick: String?) {
        // 1. null チェック後はスマートキャストが効く
        if (nick != null) {
            println("$nick, ${nick.length}文字")
            //                   ↑ ?. なしでOK!
            // この block 内では nick は String 型として扱える
        }

        // 2. 早期return パターン
        val n = nick ?: return
        // この行以降、n は String 型(非null)
        println(n.length)   // ?. 不要

        // 3. is チェック後もスマートキャストが効く
        val any: Any = "hello"
        if (any is String) {
            println(any.length)   // any は String 型として扱える
        }
    }

Java では `instanceof` でチェックしても、その後に再キャスト `((String) any).length()` が必要。Kotlin は**コンパイラが追いかけて**不要にしてくれる。

### 6-7. ハンズオン演習 6-1

次のJavaコードを Kotlin に書き換えてください。「Null安全演算子のフル活用」がテーマです。

**Java版(参考)**

    public String displayProductName(Product product) {
        if (product == null) {
            return "(no product)";
        }
        if (product.getName() == null) {
            return "(unnamed)";
        }
        return product.getName().toUpperCase();
    }

目標: **Kotlin で 1〜2行**に短縮する。`?.` と `?:` を使う。

▶ 解答例(クリック)

**Kotlin版**

    fun displayProductName(product: Product?): String =
        product?.name?.uppercase() ?: "(no product)"

    // product が null なら → "(no product)"
    // product.name が null なら → "(no product)" (※元コードと挙動がやや異なる)
    // 両方非null なら → 大文字化

    // 「unnamed」を区別したいなら段階的に:
    fun displayProductName2(product: Product?): String {
        product ?: return "(no product)"
        val name = product.name ?: return "(unnamed)"
        return name.uppercase()
    }

### 6-8. 章末まとめ

> **✓ ここまでで押さえること**
>
> - `val`(不変、final相当) と `var`(可変)。**val ファースト**で書く。
> - 型推論があるので、型は基本的に省略可。
> - 関数は `fun 名前(引数): 戻り値型 { ... }`。単一式なら `= 式`。
> - 文字列テンプレート `"$変数"` / `"${式}"` で `+` 連結をやめる。
> - **Null安全は型システムに統合**: `String`(非null) と `String?`(nullable) は別の型。
> - Null安全演算子: `?.` (セーフコール) / `?:` (エルビス) / `let` / `!!`(最終手段)。
> - スマートキャスト: 条件分岐後はコンパイラが型を絞り込んでくれる。

### Ch.07 data class / value class / object / companion object⏱ 90分

業務モデルを定義する4種のクラス。これを使いこなすのが Kotlin らしい設計の第一歩

### 7-1. data class ─ DTO/Entity の最強パターン

業務システムでは「IDと値を持っただけのクラス」が大量に出てくる。商品マスタ、注文、検索結果、API レスポンス…。**data class** はそれを書くための専用構文です。

Java (Lombok付き)

**Java**

```java
@Data
@AllArgsConstructor
public class Product {
    private final Long id;
    private final String janCode;
    private final String name;
    private final int unitPrice;
}
```

Kotlin

**Kotlin**

```kotlin
data class Product(
    val id: Long,
    val janCode: String,
    val name: String,
    val unitPrice: Int,
)
```

`data class` を付けると、Kotlin コンパイラが以下を**自動生成**します。

- `equals()` / `hashCode()` ─ **全プロパティが同じ値なら同じオブジェクト扱いにする「値同等性(同値判定)」のメソッド**を自動生成。Javaなら IDE で `equals/hashCode` を generate していた手作業が不要になる。
- `toString()` ─ `"Product(id=1, janCode=..., name=..., unitPrice=150)"` 形式
- `copy(...)` ─ 一部のプロパティだけ変えた新インスタンス生成
- `componentN()` ─ 分割代入で利用

**💡 「同じ」とは何か ─ 値同等性 と 同一インスタンス判定**

Javaでもよく出てくる話ですが、「2つのオブジェクトが同じ」には**2種類の判定**があります。

| 判定の種類               | Javaの書き方  | Kotlinの書き方 | 意味                                     |
|--------------------------|---------------|----------------|------------------------------------------|
| **値同等性(同値判定)**   | `a.equals(b)` | `a == b`       | 中身の値が同じか                         |
| **同一インスタンス判定** | `a == b`      | `a === b`      | メモリ上の同じオブジェクトを指しているか |

`data class` が自動生成するのは **値同等性** の方(`equals`/`hashCode`)。同じ id・同じ JAN コード・同じ名前・同じ価格を持った別インスタンスを「等しい」と判定してくれます。Javaでは**すべてのフィールドを並べた長大な `equals`/`hashCode` メソッドを手で書く(or IDE生成)**必要があり、フィールドが増えるたびに更新も必要ですが、Kotlin の `data class` はこれが **自動**。

※ Kotlin の `==` は中身で比較してくれるので、Javaから来た人が `==` を「参照比較」と思って書くとむしろ意図通り動きます。「参照そのものを比較したい」レアケースだけ `===` を使います。

#### 使ってみる

**data class 利用例**

    val apple = Product(
        id = 1L,
        janCode = "4901234...",
        name = "りんごジュース",
        unitPrice = 150,
    )

    // toString が自動実装されている
    println(apple)
    // → Product(id=1, janCode=4901234..., name=りんごジュース, unitPrice=150)

    // 値同等性
    val apple2 = Product(1L, "4901234...", "りんごジュース", 150)
    println(apple == apple2)   // → true (値が全部一致)

    // copy で一部だけ変える ─ 不変性を保ちつつ書き換える
    val discounted = apple.copy(unitPrice = 120)
    println(discounted.unitPrice)   // → 120
    println(apple.unitPrice)        // → 150 (元は変わらず)

> **📌 業務での使い所**
>
> - JPA Entity(`@Entity data class`)
> - REST API の Request / Response DTO
> - 検索条件オブジェクト(`data class ProductSearchCondition(...)`)
> - 値オブジェクトの組み合わせ表現(`data class OrderLine(...)`)

### 7-2. value class ─ 数量と金額の取り違えを防ぐ

業務システムで頻繁に起こる事故が、「**意味の違う int を取り違える**」こと。例えば:

**悪い設計の例**

    fun createOrder(productId: Int, quantity: Int, unitPrice: Int): Order {
        // ...
    }

    // 呼び出し ─ 引数を順番に渡すだけ
    createOrder(150, 1, 100)   // え、これ商品ID=150?  quantity=150?

すべて `Int` 型なので、コンパイラは順番違いを検出できない。本番障害になってから初めて気づく。

#### 解決策: value class で意味を型に付ける

**value class 定義**

    @JvmInline
    value class ProductId(val value: Long)

    @JvmInline
    value class Quantity(val value: Int) {
        init {
            require(value >= 0) { "Quantity must be non-negative" }
        }
    }

    @JvmInline
    value class Money(val value: Int) {
        init {
            require(value >= 0) { "Money must be non-negative" }
        }
        operator fun times(qty: Quantity): Money = Money(value * qty.value)
    }

    fun createOrder(productId: ProductId, quantity: Quantity, unitPrice: Money): Order {
        // ...
    }

    // 呼び出し ─ 型が違うので順番違いはコンパイルエラー
    createOrder(ProductId(150L), Quantity(1), Money(100))

    // createOrder(Quantity(1), ProductId(150L), Money(100)) ← コンパイルエラー!

    // 合計金額計算が型安全に書ける
    val total: Money = Money(100) * Quantity(3)   // Money(300)

> **💡 value class は実行時オーバーヘッドゼロ**
>
> `@JvmInline value class` は、コンパイル時にラップされた型として扱われるが、**実行時は中身の Int / Long のままになる**(インライン化される)。型安全のために new ProductId(150) のような余分なオブジェクト生成が起きないので、性能を犠牲にせず安全性が手に入る。

#### 業務でよく作る value class

| value class           | 意味       | 例                         |
|-----------------------|------------|----------------------------|
| `ProductId`           | 商品ID     | 商品マスタを引くキー       |
| `Quantity`            | 数量       | 仕入数量、販売数量、在庫数 |
| `Money` / `UnitPrice` | 金額       | 定価、仕入単価、合計       |
| `JanCode`             | JANコード  | 13桁の商品コード           |
| `UserId`              | ユーザーID | 顧客ID、担当者ID           |

### 7-3. object ─ シングルトン宣言が1行で済む

Java (シングルトン)

**Java**

```java
public class DateFormatter {
    private static final DateFormatter INSTANCE
        = new DateFormatter();
    private DateFormatter() {}
    public static DateFormatter getInstance() {
        return INSTANCE;
    }
    public String format(LocalDate d) { ... }
}

DateFormatter.getInstance().format(today);
```

Kotlin

**Kotlin**

```kotlin
object DateFormatter {
    fun format(d: LocalDate): String = ...
}

DateFormatter.format(today)
```

`object` キーワードで宣言するだけで、**シングルトン(常にインスタンスが1つ)** なクラスが作れる。アクセスは `クラス名.メソッド()`。スレッドセーフな初期化までコンパイラがやってくれる。

### 7-4. companion object ─ static の代わり

Kotlin には `static` キーワードがない。**クラスに紐づく静的なものは `companion object` に書く**。

Java (static)

**Java**

```java
public class Product {
    public static final int MAX_NAME = 100;

    public static Product empty() {
        return new Product(0L, "", "", 0);
    }
}

// 使う側
Product.MAX_NAME
Product.empty()
```

Kotlin

**Kotlin**

```kotlin
data class Product(
    val id: Long,
    val janCode: String,
    val name: String,
    val unitPrice: Int,
) {
    companion object {
        const val MAX_NAME = 100

        fun empty() = Product(0L, "", "", 0)
    }
}

// 使う側 ─ Javaと同じ書き味
Product.MAX_NAME
Product.empty()
```

> **💡 業務での使い所**
>
> - 定数を置く: `const val MAX_LENGTH = 100`
> - ファクトリメソッド: `fun fromJson(json: String): Product`
> - 静的なヘルパー: `fun validate(code: String): Boolean`

### 7-5. ハンズオン演習 7-1: ドメインモデル設計

次のクラスを定義してください。ファイルは `backend/src/main/kotlin/com/example/training/day1/_03_dataclass/Domain.kt`。

1.  `ProductId` ─ `Long` をラップする value class
2.  `Quantity` ─ `Int` をラップする value class(0以上をinitでチェック)
3.  `Money` ─ `Int` をラップする value class(0以上をinitでチェック)、`*` 演算子で `Quantity` と掛けて `Money` を返す
4.  `Product` ─ `id: ProductId` / `janCode: String` / `name: String` / `unitPrice: Money` を持つ data class
5.  `main` 関数で `Product` を1つ作って `println`、`Money * Quantity` で小計を計算する

▶ 解答例(クリック)

**Domain.kt**

```kotlin
package com.example.training.day1._03_dataclass

@JvmInline
value class ProductId(val value: Long)

@JvmInline
value class Quantity(val value: Int) {
    init { require(value >= 0) { "Quantity >= 0" } }
}

@JvmInline
value class Money(val value: Int) {
    init { require(value >= 0) { "Money >= 0" } }
    operator fun times(qty: Quantity): Money = Money(value * qty.value)
}

data class Product(
    val id: ProductId,
    val janCode: String,
    val name: String,
    val unitPrice: Money,
)

fun main() {
    val apple = Product(
        id = ProductId(1L),
        janCode = "4901234...",
        name = "りんごジュース",
        unitPrice = Money(150),
    )
    println(apple)

    val subtotal = apple.unitPrice * Quantity(3)
    println("小計: ${subtotal.value}円")
    // → 小計: 450円
}
```

### 7-6. 章末まとめ

> **✓ ここまでで押さえること**
>
> - `data class`: DTO/Entity/値オブジェクトの定型。`equals/hashCode/toString/copy` が自動生成。
> - `value class @JvmInline`: 「ProductId」「Quantity」「Money」などの**意味の違う基本型を区別**する。実行時オーバーヘッドゼロ。
> - `object`: シングルトン宣言が1行。
> - `companion object`: `static` 代わり。定数・ファクトリメソッドを置く。

### Ch.08 拡張関数 + ラムダ + スコープ関数⏱ 90分

「既存クラスにメソッドを生やす」「処理を高階関数で書く」が Kotlin らしさ

### 8-1. 拡張関数 ─ 既存クラスに後付けで機能追加

Java では「ヘルパークラスにstaticメソッドを置く」 (例: `StringUtils.isBlank(s)`) パターンが定番。Kotlin では **拡張関数** で、まるで元のクラスのメンバメソッドのように書ける。

Java (ヘルパー)

**Java**

```java
public class StringUtils {
    public static boolean isJanCode(String s) {
        return s != null && s.matches("\\d{13}");
    }
}

// 使う側
if (StringUtils.isJanCode(code)) { ... }
```

Kotlin (拡張関数)

**Kotlin**

```kotlin
fun String.isJanCode(): Boolean =
    this.matches(Regex("\\d{13}"))

// 使う側 ─ Stringのメンバメソッドのように呼べる
if (code.isJanCode()) { ... }
```

#### 定義のフォーマット

**拡張関数の構文**

    fun 対象の型.関数名(引数): 戻り値型 {
        // this で「対象の型のインスタンス」を参照
    }

    // 例: Int に「円に整形」する拡張関数
    fun Int.toYen(): String = "$this円"

    150.toYen()         // → "150円"

    // 例: Nullable に対しても定義できる
    fun String?.orEmpty2(): String = this ?: ""

    val nick: String? = null
    nick.orEmpty2()       // → ""

> **⚠ 拡張関数の正体**
>
> 「クラスにメソッドを追加した」ように見えるが、コンパイル後は**static メソッド**になる。第1引数として対象オブジェクトが渡されるだけ。「呼び出し方の糖衣構文」と理解する。
>
> つまり、**private フィールドにはアクセスできない**。public な API しか使えない。これは安全性の観点で実は望ましい。

#### 業務での使い所

- **標準クラスを業務語彙で扱う**: `String.isJanCode()`, `Int.toYen()`, `LocalDate.toYmd()`
- **業務クラスに「読み取り系」のメソッドを生やす**: `fun Product.priceWithTax(): Money`
- **APIラッパー**: `fun ResultSet.getProduct(): Product`

### 8-2. ラムダ ─ 関数を変数に入れる

Kotlin では**関数も「値」として扱える**。つまり「関数を変数に入れる」「関数を別の関数に引数として渡す」が自然にできる(専門用語ではこれを「関数が<a href="#glossary-firstclass" style="color:var(--accent);text-decoration:underline">一級市民</a>である」と言う ─ <a href="#glossary-firstclass" style="color:var(--accent);text-decoration:underline">→ 巻末 A-5 で解説</a>)。

「リストの各要素を2倍にする」という処理を、Java 8 と Kotlin で並べてみます。Java 8 でラムダが使えるようになって書きやすくはなりましたが、Kotlinはさらに一段シンプルです。

JAVA 8+

**DoubleList.java**

```java
List<Integer> nums = List.of(1, 2, 3);

// Stream に変換して map、最後にcollect で List に戻す
List<Integer> doubled = nums.stream()
    .map(x -> x * 2)
    .collect(Collectors.toList());

// または forEach + 副作用
nums.forEach(x -> System.out.println(x * 2));
```

KOTLIN

**DoubleList.kt**

```kotlin
val nums = listOf(1, 2, 3)

// List に直接 map がある(Stream不要)
val doubled = nums.map { it * 2 }

// forEach
nums.forEach { println(it * 2) }
```

| 違い             | Java 8+                           | Kotlin                                        |
|------------------|-----------------------------------|-----------------------------------------------|
| Stream 経由      | 必要 (`.stream() ... .collect()`) | 不要 (List に直接 `map`)                      |
| 引数 1つのラムダ | `x -> ...` と名前を書く           | `it` で暗黙参照できる                         |
| ラムダの記法     | `( ... )` の中に書く              | 最後の引数なら `{ ... }` を `()` の外に出せる |
| 戻り値の型       | 明示的に書くことが多い            | 型推論                                        |

> **✅ メリット**
>
> Kotlin のラムダは **「業務ロジック以外のノイズが最少」**になるように設計されています。Java 8 のラムダも便利ですが、Stream への変換、Collectorsの選択、ラムダ引数の名前付けと、業務本筋以外の記述が散らかります。Kotlin はそれらを言語仕様で削っているので、業務ロジック「何を、どう、どうしたいか」がそのまま読める。

#### Kotlinのラムダ詳細

**ラムダの基本**

    // ラムダを変数に代入
    val double = { x: Int -> x * 2 }

    println(double(5))           // → 10

    // 関数を引数に取る(高階関数)
    fun <T, R> List<T>.myMap(transform: (T) -> R): List<R> {
        val result = mutableListOf<R>()
        for (item in this) result.add(transform(item))
        return result
    }

    val doubled = listOf(1, 2, 3).myMap { it * 2 }
    // → [2, 4, 6]

#### ラムダのトリック ─ 最後の引数なら外に出せる

**ラムダの構文糖**

    // ラムダが最後の引数なら、() の外に出せる
    listOf(1, 2, 3).map({ x -> x * 2 })   // 普通の書き方
    listOf(1, 2, 3).map { x -> x * 2 }     // 外に出す

    // ラムダの引数が1つなら、暗黙の it が使える
    listOf(1, 2, 3).map { it * 2 }       // it = 各要素

### 8-3. スコープ関数5種 ─ let / run / apply / also / with

Kotlin の標準ライブラリには、「オブジェクトに対して一連の処理をする」ための**スコープ関数**が5つ用意されている。すべて似ているが、**使い分けの基準**がある。

**💡 Java と対比すると**

Java には対応する機能がない、Kotlin独自の便利機能です。Javaでは「null チェックの if 分岐」「一時変数の宣言」「オブジェクト初期化のためのメソッド連鎖」を毎回手で書いていましたが、Kotlin はこれらを**意図がはっきりわかる名前付きの関数**として標準化しています。

| やりたいこと                    | Java の典型コード                          | Kotlin のスコープ関数          |
|---------------------------------|--------------------------------------------|--------------------------------|
| nullじゃないときだけ実行        | `if (x != null) { ... x ... }`             | `x?.let { ... it ... }`        |
| オブジェクト初期化を1ブロックで | `Foo f = new Foo(); f.setA(1); f.setB(2);` | `Foo().apply { a = 1; b = 2 }` |
| 処理の途中でログ・副作用        | 一時変数に入れて println して return       | `... .also { log(it) } ...`    |

| 関数    | 対象の指し方       | 戻り値               | 用途                   |
|---------|--------------------|----------------------|------------------------|
| `let`   | `it` (or 名前付き) | ラムダの戻り値       | nullチェック・変換     |
| `run`   | `this` (省略)      | ラムダの戻り値       | 計算結果を返す         |
| `apply` | `this` (省略)      | **対象オブジェクト** | 初期化・設定           |
| `also`  | `it` (or 名前付き) | **対象オブジェクト** | ログ・副作用           |
| `with`  | `this` (省略)      | ラムダの戻り値       | 対象を非nullで連続操作 |

#### ① let ─ null じゃないときだけ実行 / 変換

**let**

    val nick: String? = "Al"

    // nullガード ─ 最頻出パターン
    nick?.let {
        println("nickname is $it")
    }

    // 変換に使う
    val len = nick?.let { it.length * 2 }   // nick が null なら len も null

    // it を別名にして可読性UP
    getCurrentUser()?.let { user ->
        println("User: ${user.name}")
    }

#### ② apply ─ オブジェクト初期化 / 設定

**apply**

    // JavaBeans風オブジェクトの初期化(this 経由でフィールド設定)
    val button = Button().apply {
        text = "OK"
        enabled = true
        width = 100
    }
    // button自身が戻り値なので、そのまま代入できる

    // データ詰め込み
    val request = HttpRequest().apply {
        method = "POST"
        body = json
        addHeader("Content-Type", "application/json")
    }

#### ③ also ─ ログや副作用

**also**

    // チェーンの途中でログ出力
    val products = findAllProducts()
        .also { println("取得件数: ${it.size}") }
        .filter { it.unitPrice.value > 100 }
        .also { println("フィルタ後: ${it.size}") }

#### ④ run ─ 計算して結果を返す

**run**

    // オブジェクトの複数プロパティを使って計算結果を返す
    val summary = product.run {
        "$name(JAN: $janCode) ${unitPrice.value}円"
        // this = product なので name / janCode / unitPrice が直接書ける
    }

#### ⑤ with ─ 対象を非nullで連続操作

**with**

    // 拡張ではない普通の関数。対象を引数で渡す
    val summary = with(product) {
        "$name: ${unitPrice.value}円"
    }

> **📌 使い分けの実用フローチャート**
>
> - **null チェック**したい? → `?.let { ... }`
> - オブジェクトを**初期化(設定)**して返したい? → `.apply { ... }`
> - チェーンの途中で**ログ・副作用**? → `.also { ... }`
> - オブジェクトのプロパティを使って**計算結果**を返したい? → `.run { ... }`
> - 非nullオブジェクトで**複数操作のグループ化**? → `with(obj) { ... }`
>
> 迷ったらまず `let` と `apply` の2つを使えるようにする。残り3つは慣れてから。

### 8-4. 同じ処理を5パターンで書き比べる

「Product を作って、税込価格を計算してログ出力する」を5パターンで書きます。**違いを実感**するための演習。

**5パターン**

    data class Product(val name: String, val price: Int)

    fun withTax(p: Product) = p.price * 110 / 100

    fun main() {
        // ① let (it を使う)
        Product("りんご", 150).let {
            println("${it.name}: 税込${withTax(it)}円")
        }

        // ② run (this を使う)
        Product("みかん", 100).run {
            println("$name: 税込${price * 110 / 100}円")
        }

        // ③ apply (オブジェクト自体が戻り値)
        val p3 = Product("ぶどう", 300).apply {
            println("$name: 税込${price * 110 / 100}円")
        }
        // p3 は Product 自身

        // ④ also (it を使い、オブジェクト自体が戻り値)
        val p4 = Product("バナナ", 200).also {
            println("${it.name}: 税込${withTax(it)}円")
        }

        // ⑤ with (this を使う)
        with(Product("パイナップル", 400)) {
            println("$name: 税込${price * 110 / 100}円")
        }
    }

### 8-5. 章末まとめ

> **✓ ここまでで押さえること**
>
> - **拡張関数**: 既存クラスにメソッドを生やせる(裏では static)。業務語彙を型に乗せる。
> - **ラムダ**: 関数を値として扱える。`{ x -> ... }` 形式、暗黙の `it`。
> - **スコープ関数5種**: `let`(null安全) / `apply`(初期化) / `also`(副作用) / `run`(計算) / `with`(連続操作)。
> - まず `let` と `apply` を使えるように。残り3つは慣れてから。

### Ch.09 総合演習: 在庫管理システムのドメインモデル⏱ 15分

本日学んだ機能を全部使う ─ 業務に近いミニ設計

### 9-0. そもそも「ドメイン」「ドメインモデル」とは

演習に入る前に、用語の整理をします。「ドメインモデル設計」という言葉は実務で頻繁に登場しますが、何を指すか曖昧なまま使われがちです。

#### ドメイン = そのシステムが扱う「業務の世界」

ドメイン(domain)は英語で「領域」「分野」という意味ですが、ソフトウェア開発では **「そのシステムが解決しようとしている、業務上の世界」** を指します。本研修であれば **仕入・在庫・販売管理** がドメインです。

> **📌 たとえ: 引っ越し業者の見積もり**
>
> あなたが **「引っ越し業者向けの見積もりシステム」** を作るとしたら、ドメインは「引っ越しの見積もり業務」です。そのドメインには、以下のような**業務固有の登場人物・概念**がいます。
>
> - **お客様**(氏名・引っ越し元住所・引っ越し先住所)
> - **引っ越し荷物**(段ボール何箱、ベッド・冷蔵庫・タンス…)
> - **距離**(km)
> - **料金**(基本料金 + 荷物量 × 単価 + 距離 × 単価 + オプション)
> - **見積書**(発行日・有効期限・料金内訳・お客様情報)
>
> これらは **「引っ越し業務」を理解している人なら自然に出てくる言葉**です。データベースの話でも、画面の話でも、Javaの話でもなく、純粋に **業務の言葉**です。

#### ドメインモデル = 業務の世界をコードで写し取ったもの

その業務の世界を、**プログラム上のクラスや関数で写し取ったもの**が **ドメインモデル** です。引っ越し業者の例なら:

**MovingDomain.kt**

```kotlin
// 業務に登場する「もの」をそのままクラスにする
data class Customer(val name: String, val from: Address, val to: Address)
data class Luggage(val item: String, val count: Int)
data class Estimate(
    val customer: Customer,
    val luggages: List<Luggage>,
    val distanceKm: Int,
    val issuedAt: LocalDate,
    val validUntil: LocalDate,
)
```

ポイントは、**業務の人が言う言葉と、コードに登場する言葉が一致している**こと。これは見た目以上に重要で、以下の恩恵があります。

> **💡 ドメインモデルがそろっていると…**
>
> - **業務担当者と会話できる** ─ 「`Estimate` の `validUntil` が切れたらどうしましょう?」と聞ける。エンジニアと業務担当者の橋渡しになる。
> - **新人が読んでも業務がわかる** ─ クラス図を見れば「あ、引っ越し業務ってこういう流れか」が伝わる。
> - **仕様変更に強い** ─ 業務側の概念で組み立てているので、画面のレイアウトを変えてもDBスキーマを変えてもドメインモデル自体は揺らがない。

#### 悪い例: 業務の言葉が消えたコード

逆に **ドメインモデルが弱いコード** はこうなります。

**BadExample.kt**

```kotlin
// 業務の言葉が消えて、汎用的すぎる
data class Data(
    val info1: String,    // 何のinfoか分からない
    val info2: String,
    val num1: Int,        // 何の数か分からない
    val num2: Int,
    val flag: Boolean,    // 何のフラグ?
)

fun calc(d: Data): Int = d.num1 * 3000 + d.num2 * 100
```

これだと「`num1` って何だっけ?」「`3000` って何の係数?」を毎回コードのコメントや別ドキュメントで確認する羽目になります。 **業務知識がコードから抜け落ちている**状態。

#### Kotlinの value class / data class はドメインモデル設計の強い味方

本日学んだ機能は、まさにこの**「業務の言葉をそのままコードに残す」** ために生まれたような道具です。

| 機能            | ドメインモデル設計での役割                                                              |
|-----------------|-----------------------------------------------------------------------------------------|
| **data class**  | 「業務上の概念」を最小限のコードで宣言する(`Customer`, `Product`, `Estimate` …)         |
| **value class** | 「業務上の数値・文字列」に意味の鎧を着せる(`ProductId` と `UserId` を取り違えない)      |
| **拡張関数**    | 業務ロジックを「`X.Y()` という業務の言い回し」のままコードに書ける(`line.totalValue()`) |
| **Null安全**    | 「ありえない null」をコンパイル時に弾く ─ 業務ルールを型で表現できる                    |

つまり**「Kotlinの言語機能 = ドメインモデルの表現ツール」**と捉えると、本日学んだことがどう活きるかがクリアになります。これから演習で、本研修の題材である **在庫管理** のドメインを実際に作ってみます。

### 9-1. 演習課題

業務設計資料(ER図)で見た商品マスタを、本日学んだ Kotlin の機能で表現してください。

要件:

1.  **value class** で意味づけする ─ `ProductId`, `JanCode`, `Money`, `Quantity`
2.  **data class** で `Product`(商品マスタ) を表現
3.  **data class** で `InventoryLine`(在庫1行)を表現 ─ Product と Quantity を持つ
4.  **拡張関数**で `InventoryLine` に「総額」を計算する関数を追加(`fun InventoryLine.totalValue(): Money`)
5.  `main` で 3つの `InventoryLine` を作って総額の合計を `let` で出力

ファイル: `backend/src/main/kotlin/com/example/training/day1/_04_exercise/Inventory.kt`

### 9-2. 解答例

▶ 解答(クリックで開閉)

**Inventory.kt**

```kotlin
package com.example.training.day1._04_exercise

// === value classで意味づけ ===
@JvmInline
value class ProductId(val value: Long)

@JvmInline
value class JanCode(val value: String) {
    init {
        require(value.matches(Regex("\\d{13}"))) {
            "JANコードは13桁の数字: $value"
        }
    }
}

@JvmInline
value class Money(val value: Int) {
    init { require(value >= 0) }
    operator fun times(qty: Quantity): Money = Money(value * qty.value)
    operator fun plus(other: Money): Money = Money(value + other.value)
}

@JvmInline
value class Quantity(val value: Int) {
    init { require(value >= 0) }
}

// === data class でモデル定義 ===
data class Product(
    val id: ProductId,
    val janCode: JanCode,
    val name: String,
    val unitPrice: Money,
)

data class InventoryLine(
    val product: Product,
    val quantity: Quantity,
)

// === 拡張関数で「総額」 ===
fun InventoryLine.totalValue(): Money = product.unitPrice * quantity

// === main ===
fun main() {
    val apple = Product(
        id = ProductId(1L),
        janCode = JanCode("4901234567890"),
        name = "りんごジュース",
        unitPrice = Money(150),
    )
    val orange = Product(ProductId(2L), JanCode("4901234567891"),
        "みかんジュース", Money(120))
    val grape  = Product(ProductId(3L), JanCode("4901234567892"),
        "ぶどうジュース", Money(200))

    val lines = listOf(
        InventoryLine(apple, Quantity(10)),
        InventoryLine(orange, Quantity(5)),
        InventoryLine(grape, Quantity(3)),
    )

    lines
        .map { it.totalValue() }
        .reduce { acc, m -> acc + m }
        .let { println("総在庫評価額: ${it.value}円") }
    // → 総在庫評価額: 2700円
}
```

> **💡 本日の核を1ファイルに凝縮**
>
> このコードに **本日学んだ全機能**が入っています ─ data class、value class、init バリデーション、operator overload(`+`, `*`)、拡張関数、ラムダ、`let`、文字列テンプレート、val/型推論。
>
> Java で書くと 4〜5倍の行数になり、しかも型安全性が低い。これが Kotlin の魅力です。

### Ch.10 Git: 本日の成果を commit & push⏱ 15分

IntelliJ の GUI で完結 ─ コマンドは使わない

### 10-1. なぜ最後にcommit & pushするのか

- 本日書いたコードが**消えないようにバックアップ**する
- 明日の Day 2 で「前日の続きから」を簡単にできる
- 講師がレビューしやすい
- 実務における「**1日の終わりに push する**」習慣を身につける

### 10-2. 手順 ─ IntelliJ から commit & push

1 Commit ダイアログを開く 画面左の縦バー、または `Cmd / Ctrl + K`(Commit) で開く。本日書いたファイルが「Changes」リストに表示される。 2 変更内容を確認 ファイル名をクリックすると差分が表示される。意図しないファイルが含まれていないか確認(`.idea/` などの IDE 設定ファイルは `.gitignore` で除外済みのはず)。 3 コミットメッセージを書く 「Commit Message」欄にメッセージを入力。例: `Day 1: 基本構文・Null安全・data/value class・拡張関数の演習完了` 4 Commit and Push を選ぶ 右下のボタン横の **▼** をクリックして「**Commit and Push...**」を選択。コミット完了後に Push ダイアログが表示される。 5 Push を実行 「Push」ボタンを押す。コミットが GitHub にアップロードされる。完了すると右下に「Push successful」と表示される。 6 GitHub で確認 ブラウザで GitHub のリポジトリページを開き、本日のコミットが表示されていれば成功。

> **💡 良いコミットメッセージのコツ**
>
> - **「何をしたか」を書く**: 「Day 1 演習完了」より「Day 1: data class と value class でドメインモデル定義」
> - **動詞で始める**: 「追加」「修正」「削除」「整理」
> - **50文字以内**で要点を: 詳細は本文に書く
> - 研修期間中は `[Day N]` プレフィックスを付けるとレビューしやすい

### 10-3. Day 1 完了!

> **🎉 お疲れさまでした**
>
> 本日達成したこと:
>
> - Kotlin の正体・コンパイル・4ターゲット・3ビルドパターンが説明できる
> - val/var、関数定義、文字列テンプレート、Null安全演算子(`?.`, `?:`, `let`)が使える
> - data class、value class、object、companion object を業務モデルに使い分けられる
> - 拡張関数とスコープ関数(let / apply / also / run / with)が使える
> - IntelliJ GUI で Git の clone・commit・push ができる
>
> 明日(Day 2)は「関数型・コレクション・エラーハンドリング」に進みます。sealed class や Kotlin 標準コレクション操作(map / filter / fold)で、より宣言的な書き方を覚えていきます。

> **📌 明日に向けての宿題(任意)**
>
> 余裕があれば、本日の演習で書いた `Inventory.kt` を以下の方向で拡張してみてください。明日の朝の話題にできます。
>
> - `InventoryLine` のリストから「在庫切れ(Quantity が 0)の商品だけ」を抽出してみる(`filter`)
> - 商品ごとの単価でソートしてみる(`sortedBy`)
> - 合計をもっと簡潔に書く方法を探してみる(`sumOf`)

## DAY 2 ─ 関数型・コレクション・DSL

Java脳の「forループ + if + 一時変数」から、Kotlinの「データの変換パイプライン」へ。Day 1 で学んだdata class・拡張関数・ラムダを土台に、業務システム開発で最も体感差が出る「コレクション操作の表現力」を身につける。

合計 9時間 前提: Day 1 修了 / Kotlin 言語の核を把握済 到達点: 関数型でコレクションを操作 + 業務DSLを設計できる

### Ch.00 本日の目標と進め方⏱ 5分

Day 2 を終えた時に、何ができるようになっていれば良いか

### 0-1. 本日のゴール

Day 2 の終わりには、次のことができるようになっていれば成功です。

- **関数型プログラミングの考え方**を自分の言葉で説明できる ─ 命令型との違いを言える
- **map / filter / reduce** を使い分けて、forループを使わずにデータ変換ができる
- **groupBy / sortedBy / sumOf / flatMap** 等の高度なコレクション操作で、業務集計を1行で書ける
- **Sequence** と List の違いを理解し、いつ Sequence を使うべきか判断できる
- **sealed class** でドメインのエラーを型として表現できる
- 簡単な**業務DSL**を設計・実装できる

### 0-2. 本日学ぶ内容 ─ Day 1との関係

Day 1 は「Kotlin の言語仕様の核」を学びました。Day 2 はそれらを**業務処理でどう活かすか**がテーマです。

| Day 1 で学んだこと   | Day 2 でこう活きる                                             |
|----------------------|----------------------------------------------------------------|
| data class           | コレクションの要素として大量に使う                             |
| 拡張関数             | List/Map に業務ロジックを追加(`fun List<Order>.totalAmount()`) |
| ラムダ・スコープ関数 | map / filter の中身として頻出                                  |
| Null安全             | コレクション操作チェーンの最後で安全に終わる                   |

**⚠ 本日の作業開始前に ─ 起動チェック**

**Day 2 でも起動が必要なサーバはありません。**Day 1 と同じく IntelliJ + JDK + Git で十分です。本日のコードはすべて main 関数で動く Kotlin 単体演習。Spring Boot や DB はまだ登場しません。

| 必要なもの                   | 状態                       |
|------------------------------|----------------------------|
| IntelliJ IDEA / JDK 21 / Git | Day 1 から引き続き起動済み |
| Docker / Spring Boot / Vue   | 本日は不要(Day 4 以降)     |

### Ch.01 関数型プログラミングとは⏱ 60分

Java脳との発想の違い ─ なぜ関数型が業務に効くのか

### 1-1. 命令型 vs 関数型 ─ 同じ処理を2通りで書く

「注文リストから、合計金額が1万円超のものだけ取り出し、金額順に並べる」という処理を考えます。Java も 8 以降ならラムダ式が使えるので、3つの書き方を並べてみます。

Java(命令型・伝統スタイル)

**Imperative.java**

```java
// 1. 一時リストを用意
List<Order> result = new ArrayList<>();

// 2. ループしながら条件判定して詰める
for (Order o : orders) {
    if (o.getAmount() > 10000) {
        result.add(o);
    }
}

// 3. ソート
result.sort(Comparator.comparingInt(Order::getAmount));

// → 「どう処理するか」の手順を書く
```

Java 8+ Stream(関数型寄り)

**Stream.java**

```java
List<Order> result = orders.stream()
    .filter(o -> o.getAmount() > 10000)
    .sorted(Comparator.comparingInt(Order::getAmount))
    .collect(Collectors.toList());

// Java 8 以降は Stream API で関数型風に書ける
// ただし .stream() と .collect(...) で前後を挟む必要がある
```

Kotlin(関数型)

**Functional.kt**

```kotlin
val result = orders
    .filter { it.amount > 10000 }
    .sortedBy { it.amount }

// → 「何をしたいか」を書く
// .stream() も .collect() も不要、List に直接演算子が生えている
// 引数1個のラムダなら名前を書かず it でアクセスできる
```

> **📌 発想の違い**
>
> - **命令型(Java 伝統)**: 「どう処理するか(How)」を一つひとつ書く。ループ・条件分岐・一時変数の組み合わせ。
> - **関数型(Java Stream / Kotlin)**: 「何をしたいか(What)」を宣言する。**データの流れ**(パイプライン)として書く。
> - **Java Stream vs Kotlin**: 思想は同じだが、Kotlin の方が記述が短く、コレクションに直接演算子が生えている分シンプル。
>
> 「注文を、金額1万円超でフィルタして、金額順に並べる」── 業務要件と読みたい順番にコードが並ぶ。これが関数型のスタイル。

### 1-2. なぜ関数型が業務システムに効くのか

業務システムの本質は**データの変換**です。顧客マスタから請求書を作る、注文履歴から月次集計を作る、検索条件で結果を絞り込む… すべて「データの集合 → 別のデータの集合」への変換。これは関数型の得意分野です。

| 業務処理               | 関数型での表現                                                                 |
|------------------------|--------------------------------------------------------------------------------|
| 未払いの請求書だけ抽出 | `invoices.filter { it.unpaid }`                                                |
| 金額を税込みに変換     | `items.map { it.copy(price = it.price * 1.1) }`                                |
| 顧客ごとに購入額を合計 | `orders.groupBy { it.customer }.mapValues { (_, v) -> v.sumOf { it.amount } }` |

> **✅ メリット**
>
> - **業務要件 ≒ コード**: 「顧客ごとに合計」が `groupBy { customer }` + `sumOf` に1対1対応。仕様書と読み合わせが容易。
> - **バグの混入余地が減る**: 一時変数・ループ変数・終了条件・配列インデックスといった**手作業の地雷が減る**。
> - **テストが書きやすい**: 副作用のない純粋関数はテストが楽。入力 → 期待出力の対応が明確。

### 1-3. 関数型の3つの柱

#### 柱① イミュータブル(不変)

一度作ったデータは**書き換えない**。書き換えたい時は**新しいデータを作る**。Day 1 で学んだ `val` + `data class` + `copy()` の組み合わせがこれを実現する。

**📌 「マナー」ではなく「型システムによる強制」が本質**

Java でも「気をつけて変数を移し替えれば不変のように書ける」のですが、それは**書き手の自己規律(マナー・コーディング規約) に依存している**状態です。Kotlin の本質は、**不変性を言語仕様レベルで強制する**点にあります。

| 観点                   | Java(マナーで対応)                                      | Kotlin(型システムで強制)                                                                                       |
|------------------------|---------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| 変数の再代入           | `final` を付け忘れるとできてしまう                      | `val` 既定。書き換えたいなら明示的に `var`                                                                     |
| クラスのフィールド変更 | `setter` を作らないように気をつける                     | `data class(val ...)` で setter が言語仕様として存在しない                                                     |
| コレクションの変更     | `Collections.unmodifiableList` でラップする等の規約頼み | `List<T>`(不変ビュー) と `MutableList<T>` が**型として別物**。不変側で `.add()` を呼ぶとコンパイルエラーになる |
| レビューでの担保       | 「ここは書き換えないでね」を毎回口頭で約束              | そもそもコンパイルが通らない = レビュー不要                                                                    |

つまり「Java でも不変的に書ける」のは、**毎ファイルで毎回 final や規約を徹底する人的コスト**を払う代わりにそうしているのであって、Kotlin は**その人的コストを言語仕様が肩代わり**してくれます。「変えられる/変えられない」を型レベルで分離することで、「うっかりここで書き換えていた」が仕組みとして発生しません。

Java: 「気を付けないと変わる」

**Mutable.java**

```java
public class Order {
    private int amount;
    public void setAmount(int a) { amount = a; }
    public int getAmount() { return amount; }
}

Order order = new Order();
order.setAmount(5000);

// 別のメソッドに渡すと…
doSomething(order);
// 中で setAmount を呼ばれていないか?
// 呼び出し側はソースを開いてチェックするしかない

// 防ぐにはコーディング規約で
// 「setterを作るな」「fieldを final に」と全員に徹底する必要
```

Kotlin: 「変えられない」が型で保証

**Immutable.kt**

```kotlin
data class Order(val amount: Int)
//                  ^^^ val なので setter が存在しない(言語仕様)

val order = Order(amount = 5000)

// 別のメソッドに渡しても、order.amount は絶対に変わらない
// (型システムが保証するので、呼び出し先のコードを見る必要なし)
doSomething(order)

// 「金額を変える」処理は、別インスタンスを返す形でしか書けない
val updated = order.copy(amount = 6000)
// updated は別物。order は依然として 5000。
```

> **✅ 本質的な恩恵**
>
> - **関数の引数として渡しても安全**: 「渡した後で勝手に書き換えられているかも」という疑念がいらない
> - **並行処理で事故が減る**: 複数スレッドから同時アクセスされても、誰も書き換えないのでデータ競合が起きない(コルーチンの章 Day 3 で活きる)
> - **レビュー・テストが軽くなる**: 「この変数、どこかで書き換えられてない?」を追跡する必要がない
> - **処理の前後で状態が確定する**: 「処理前のorder」「処理後のupdatedOrder」が別変数として残り、デバッグや監査ログで履歴が追える

#### 柱② 副作用を最小化する

**副作用**とは、関数の戻り値以外で外界に影響を与えること。グローバル変数の書き換え、ファイル書き込み、DB更新、コンソール出力など。副作用のない関数を**純粋関数**と呼びます。

**PureVsImpure.kt**

```kotlin
// 純粋関数: 同じ引数なら必ず同じ結果。外界に何もしない。
fun addTax(price: Int): Int = (price * 1.1).toInt()

// 不純な関数: 外部変数を変更してしまう
var totalSold = 0
fun sell(price: Int): Int {
    totalSold += price       // 副作用!
    return addTax(price)
}
```

**📌 関数型の心得 ─ 副作用は「外側に追い出す」**

「副作用を**ゼロにする**」のは不可能です(DBに書かないと業務にならないし、画面に表示もできない)。重要なのは**副作用がある場所を限定する**こと。

**本質: ビジネスロジックは「相手の都合」を知らなくていい**

もっと本質を言えば、副作用を外に追い出すのは **「ビジネスロジック側が、呼び出し元・ログの出し方・保存先などの<u>相手の都合</u>を知らないで済むようにする」** ためです。逆に言うと、**副作用 = 相手の都合(人間都合・呼び出し元都合)** と言い換えられます。

| 副作用の例                      | 「誰の都合」か                                                  |
|---------------------------------|-----------------------------------------------------------------|
| ログ出力(printlnやログ書き込み) | 運用者・開発者(人間)の都合 ─ 「あとで何が起きたか追えるように」 |
| DB書き込み                      | 保存先(永続化基盤)の都合 ─ 「データを残したい」                 |
| HTTPレスポンス返却              | 呼び出し元(Webクライアント)の都合 ─ 「結果を受け取りたい」      |
| 外部APIへの通知                 | 連携先システムの都合 ─ 「変更を知らせてほしい」                 |

これらは全部、**業務ルール本体(=「注文の合計金額はこう計算する」)とは無関係な、外側の事情**です。業務ルールに「ついでにログ出して」「ついでにDBに書いて」を混ぜると、業務ルール自体が肥大化してテストもしづらくなる。

**例え話 ─ レストランの厨房とホール**

厨房(=ビジネスロジック)では、シェフは「材料 → 料理」というレシピだけに集中したい。同じ材料を渡せば同じ料理ができる、純粋な作業です。シェフは「お客様が誰か」「会計はいくらか」「賄いログをつけるか」を知る必要はありません。一方、ホール(=入出力) では「お客様から注文を受ける」「料理をテーブルに運ぶ」「会計する」「日報を書く」といった**相手の都合 = 副作用**を引き受けます。

もし厨房の中でシェフがいちいち「お客様の表情をうかがって料理を変える」「会計帳簿を直接書く」「日報の文面を考える」をやっていたら、レシピは混乱し、レシピだけ別の店で使い回したい時にも不要な処理がついてきてしまう。

**純粋関数の3つの恩恵**

- **テストしやすい**: 「材料 → 料理」が決まっているので、入力と出力で一発検証。DB起動もモック準備も不要
- **再利用しやすい**: 別の Controller、別のバッチ、別のUI から、<u>業務ルール本体だけ</u>を呼び出して使い回せる
- **業務ルールが純粋に読める**: 「これは業務上のロジック?それとも運用やログのためのコード?」が分離されているので、業務担当者とコードを読み合わせる時にも認識がブレない

関数型の発想は**「厨房は純粋関数で、ホール(Controller / Repository) で副作用を扱う」**という分業。これを Day 4 のレイヤー設計で実践します。

| 役割                   | レストランの例え         | 業務システムでの実装                                                  |
|------------------------|--------------------------|-----------------------------------------------------------------------|
| 純粋なビジネスロジック | 厨房(シェフ)             | Service クラス内の計算関数 / ドメインモデル                           |
| 外界と接する副作用     | ホール(ウェイター・会計) | Controller(HTTPリクエスト/レスポンス)、Repository(DB読み書き)、Logger |

#### 柱③ 関数を値として扱う(高階関数)

Day 1 で学んだ通り、Kotlin では関数も「値」。「関数を引数に取る関数」を**高階関数**と言い、これがコレクション操作の根幹です。Java も 8 以降は関数インターフェイス(`Function`, `Predicate` 等) のおかげで似たことが書けますが、扱いやすさには差があります。

Java 8+ ラムダ / メソッド参照

**HigherOrder.java**

```java
// 関数を変数に入れる(Function は関数型インターフェイス)
Function<Integer, Integer> doubler = x -> x * 2;
Function<Integer, Integer> tripler = x -> x * 3;

// 関数を引数に渡す
List<Integer> result = nums.stream()
    .map(doubler)
    .collect(Collectors.toList());

// メソッド参照(::は静的・インスタンスメソッドへの参照)
nums.stream().forEach(System.out::println);

// ただし関数型インターフェイスの種類が多い
// Function / Predicate / Consumer / Supplier / BiFunction ...
// 用途ごとに型を覚える必要がある
```

Kotlin

**HigherOrder.kt**

```kotlin
// 関数を変数に入れる(関数型は (Int) -> Int のように直接書ける)
val doubler: (Int) -> Int = { x -> x * 2 }
val tripler: (Int) -> Int = { x -> x * 3 }

// 関数を引数に渡す
val result = nums.map(doubler)

// 関数参照(:: は Kotlin の関数参照演算子)
nums.forEach(::println)

// 関数型インターフェイスは不要
// 型は (Int) -> Int / (String, Int) -> Boolean のように直接記述
// 引数1個のラムダは it で暗黙参照: { it * 2 }
```

| 違い                   | Java 8+                                                         | Kotlin                    |
|------------------------|-----------------------------------------------------------------|---------------------------|
| 関数の型表記           | `Function<Integer, Integer>` のように関数型インターフェイス経由 | `(Int) -> Int` と直接記述 |
| 引数1個のラムダ        | `x -> ...` と名前を書く                                         | `{ it * 2 }` で暗黙参照   |
| 関数型インターフェイス | Function / Predicate / Consumer など多数を覚える                | 不要(言語が直接サポート)  |
| 戻り値の関数           | 戻り値型に `Function<...>` を書く                               | 普通の関数型を返すだけ    |

**高階関数の実例**

    // map は「変換ルール(関数)」を引数に取る高階関数
    val doubled = listOf(1, 2, 3).map { it * 2 }
    //                                  ^^^^^^^^^^^
    //                              これが map に渡される関数

    // filter は「条件判定(関数)」を引数に取る高階関数
    val evens = listOf(1, 2, 3, 4).filter { it % 2 == 0 }

### 1-4. ハンズオン演習 1-1

**💡 演習**

次の命令型コード(Javaスタイル)を、Kotlin の関数型スタイルで書き直してください。

**Ex01_Imperative.kt**

```kotlin
val prices = listOf(100, 250, 80, 340, 150)

// 200円以上の商品の税込価格合計(現状: 命令型)
var total = 0
for (p in prices) {
    if (p >= 200) {
        total += (p * 1.1).toInt()
    }
}
println(total)
```

ヒント: `filter` → `map` → `sum` または `sumOf` で1行に書ける。

### 1-5. 章末まとめ

> **✓ Ch.1 のポイント**
>
> - 命令型は「どう」、関数型は「何を」を書く
> - 業務システム = データ変換の集まり = 関数型と相性が良い
> - 関数型の3本柱: イミュータブル / 副作用最小化 / 高階関数

### Ch.02 コレクション操作の基礎⏱ 105分

map / filter / reduce ─ 関数型の三種の神器

### 2-1. List / Set / Map の作り方

Kotlin のコレクションは**イミュータブルがデフォルト**。可変版は明示的に `Mutable*` を付ける。

**CollectionBasics.kt**

```kotlin
// === イミュータブル(推奨) ===
val nums: List<Int> = listOf(1, 2, 3)
val names: Set<String> = setOf("alice", "bob")
val ages: Map<String, Int> = mapOf("alice" to 30, "bob" to 25)

// 要素追加はできない(コンパイルエラー)
// nums.add(4)  ← Error

// === ミュータブル(必要なときだけ) ===
val mutableNums = mutableListOf(1, 2, 3)
mutableNums.add(4)             // OK

// === Map のアクセス ===
val aliceAge = ages["alice"]      // → 30 (Int?)
val ages2 = ages + ("charlie" to 28)   // 新しいMapを作る
```

> **💡 Java の List との関係**
>
> Kotlin の `List<T>` は、JVM上では **Javaの `java.util.List` と同じ**。コンパイル後のバイトコードレベルでは区別なし。Kotlin が「読み取り専用ビュー」と「書き込み可能ビュー」を**型システム上で分離**してくれているだけ。

#### Map の `to` 中置記法

`"alice" to 30` という記法は、`Pair` オブジェクトを作る Kotlin 標準ライブラリの**中置関数**。`Pair("alice", 30)` と等価。

### 2-2. map ─ 各要素を変換する

**map** は「リストの各要素を別の値に変換した、新しいリスト」を返す。最もよく使うコレクション操作です。

［図（テキスト抽出）：入力 List\<Int\> / 1 / 2 / 3 / 4 / map { it \* 10 } / × 10 / 出力 List\<Int\> / 10 / 20 / 30 / 40 / 特徴 / 入力と同じ要素数 / 1対1で変換 / 型が変わってもOK］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図2-1: map は「リストの各要素を1対1で別の値に変換」する

**MapExamples.kt**

```kotlin
// 例1: 数値を2倍に
val doubled = listOf(1, 2, 3).map { it * 2 }
// → [2, 4, 6]

// 例2: 商品から商品名だけ取り出す(型が Product → String に変わる)
data class Product(val id: Long, val name: String, val price: Int)
val products = listOf(
    Product(1, "りんご", 150),
    Product(2, "みかん", 100),
)
val names: List<String> = products.map { it.name }
// → ["りんご", "みかん"]

// 例3: 税込価格に変換(Product を別の Product に変換)
val taxIncluded: List<Product> = products.map {
    it.copy(price = (it.price * 1.1).toInt())
}
```

### 2-3. filter ─ 条件に合うものだけ残す

**filter** は「条件が true になる要素だけを集めた、新しいリスト」を返す。

**FilterExamples.kt**

```kotlin
// 例1: 偶数だけ
val evens = listOf(1, 2, 3, 4, 5).filter { it % 2 == 0 }
// → [2, 4]

// 例2: 1万円以上の注文
val bigOrders = orders.filter { it.amount >= 10000 }

// 例3: null を除外(専用版 filterNotNull)
val values: List<String?> = listOf("a", null, "b")
val nonNull: List<String> = values.filterNotNull()
// → ["a", "b"] (型からnullが消える!)

// 例4: 反対(条件に合わないものを残す)
val notFree = items.filterNot { it.price == 0 }
```

**💡 map と filter を組み合わせる ─ パイプライン**

filter と map を**つなげて**使うのが関数型の真骨頂。

**Pipeline.kt**

```kotlin
// 「1万円以上の注文の、税込金額一覧」
val bigOrderTaxAmounts = orders
    .filter { it.amount >= 10000 }     // 1万円以上
    .map { (it.amount * 1.1).toInt() } // 税込
```

業務要件の日本語と1対1で読める。コードレビューでも仕様書と突き合わせやすい。

### 2-4. reduce / fold ─ 集計する

**reduce / fold** は「リスト全体を1つの値に集約」する。合計、最大、文字列連結など。

#### reduce

**ReduceExample.kt**

```kotlin
// 合計
val total = listOf(1, 2, 3, 4).reduce { acc, n -> acc + n }
// → 10
// 内部の動き: ((1+2)+3)+4 = 10

// 最大値
val max = listOf(3, 1, 4, 1, 5).reduce { a, b -> if (a > b) a else b }
// → 5
```

#### fold ─ 初期値を指定できる

**FoldExample.kt**

```kotlin
// 初期値 0 から合計を計算
val total = listOf(1, 2, 3).fold(0) { acc, n -> acc + n }

// 文字列連結 ─ 型が変わる(List<Int> → String)
val joined = listOf(1, 2, 3).fold("") { acc, n -> "$acc[$n]" }
// → "[1][2][3]"

// 空リストでも安全(reduce は空だと例外)
val emptyOk = emptyList<Int>().fold(0) { a, b -> a + b }   // → 0
// emptyList<Int>().reduce { a, b -> a + b }   ← 例外!
```

> **⚠ reduce と fold の使い分け**
>
> - **reduce**: 空リストの可能性がない + 結果の型が要素と同じ
> - **fold**: 空リストの可能性がある or 結果の型が変わる
>
> 業務コードでは**fold の方が安全**。空でも例外にならない。

#### 専用ショートカット ─ sum / sumOf / max / min など

実は合計や最大値には**専用関数**があって、reduce/fold を直接書くことはあまりない。

**Shortcuts.kt**

```kotlin
val nums = listOf(1, 2, 3, 4)
nums.sum()                  // → 10
nums.max()                  // → 4 (空だと例外)
nums.maxOrNull()            // → 4 (空だと null)
nums.average()              // → 2.5
nums.count()                // → 4
nums.count { it > 2 }       // → 2

// オブジェクトのプロパティで集計したい時は sumOf
orders.sumOf { it.amount }              // 注文金額合計
products.maxByOrNull { it.price }       // 最高価格の商品
```

### 2-5. Java の Stream との対比

Java 8+ で同じことを書こうとすると、Stream API を経由する必要があります。

JAVA 8+ Stream

**Stream.java**

```java
List<Integer> result = orders.stream()
    .filter(o -> o.getAmount() >= 10000)
    .mapToInt(Order::getAmount)
    .boxed()
    .collect(Collectors.toList());

int total = orders.stream()
    .mapToInt(Order::getAmount)
    .sum();
```

KOTLIN

**Kotlin.kt**

```kotlin
val result = orders
    .filter { it.amount >= 10000 }
    .map { it.amount }

val total = orders.sumOf { it.amount }
```

| 違い                 | Java Stream                      | Kotlin                 |
|----------------------|----------------------------------|------------------------|
| `.stream()` 呼び出し | 必要                             | 不要(List 直接)        |
| プリミティブ用変種   | `mapToInt`, `mapToLong` 等別関数 | 統一の `map`           |
| 結果の収集           | `.collect(Collectors.toList())`  | そのまま `List` が返る |
| 合計                 | `.mapToInt(...).sum()`           | `sumOf { ... }`        |

### 2-6. ハンズオン演習 2-1

**💡 演習**

以下のデータに対して、関数型でコードを書いてください。ファイル: `backend/src/main/kotlin/com/example/training/day2/_02_collection/Ex02.kt`

**Ex02.kt(出発点)**

```kotlin
data class Sale(val product: String, val qty: Int, val unitPrice: Int)

val sales = listOf(
    Sale("りんご", 10, 150),
    Sale("みかん", 5, 100),
    Sale("ぶどう", 3, 500),
    Sale("いちご", 8, 300),
)

// (1) 各販売の小計(qty * unitPrice)のリストを作る
// (2) 売上1000円以上の販売の商品名一覧
// (3) 全販売の総合計売上額
// (4) 単価が最も高い商品の名前
```

### Ch.03 高度なコレクション操作⏱ 90分

groupBy / sortedBy / flatMap / associateBy ─ 業務集計の必殺技

### 3-1. groupBy ─ グルーピング

「顧客ごと」「カテゴリごと」「日付ごと」と**キーごとに集約**するのが groupBy。業務集計の8割はこれで書けます。

**GroupBy.kt**

```kotlin
data class Order(val customer: String, val product: String, val amount: Int)

val orders = listOf(
    Order("田中", "りんご", 300),
    Order("田中", "みかん", 200),
    Order("佐藤", "いちご", 500),
    Order("佐藤", "ぶどう", 800),
    Order("鈴木", "りんご", 150),
)

// 顧客ごとに注文をグループ化
val byCustomer: Map<String, List<Order>> = orders.groupBy { it.customer }
// → {田中=[Order(田中,りんご,300), Order(田中,みかん,200)],
//    佐藤=[Order(佐藤,いちご,500), Order(佐藤,ぶどう,800)],
//    鈴木=[Order(鈴木,りんご,150)]}

// 顧客ごとの注文金額合計
val totalByCustomer: Map<String, Int> = orders
    .groupBy { it.customer }
    .mapValues { (_, list) -> list.sumOf { it.amount } }
// → {田中=500, 佐藤=1300, 鈴木=150}
```

> **💡 業務でよくあるパターン**
>
> - 商品カテゴリ別の売上集計
> - 担当者別のタスク数
> - 月別の請求金額
> - ステータス別の件数(`orders.groupBy { it.status }.mapValues { it.value.size }`)

### 3-2. sortedBy / sortedByDescending ─ 並び替え

**Sorting.kt**

```kotlin
// 金額の昇順
val cheap = products.sortedBy { it.price }

// 金額の降順
val expensive = products.sortedByDescending { it.price }

// 複数キー: カテゴリ → 価格の順でソート
val sorted = products.sortedWith(
    compareBy({ it.category }, { it.price })
)
```

### 3-3. flatMap ─ ネストを平らにする

**flatMap** は「List のリスト」を「フラットなリスト」に変換しつつ、各要素を変換する。

**FlatMap.kt**

```kotlin
data class Customer(val name: String, val orders: List<Order>)

val customers = listOf(
    Customer("田中", listOf(Order("田中", "りんご", 300), Order("田中", "みかん", 200))),
    Customer("佐藤", listOf(Order("佐藤", "いちご", 500))),
)

// 全顧客の全注文をフラットなリストに
val allOrders: List<Order> = customers.flatMap { it.orders }
// → [Order(田中,りんご,300), Order(田中,みかん,200), Order(佐藤,いちご,500)]

// 比較: map だと List<List<Order>> になってしまう
val nested: List<List<Order>> = customers.map { it.orders }
```

> **📌 「親子関係」の処理に欠かせない**
>
> 顧客→注文、注文→明細、カテゴリ→商品、プロジェクト→タスク… 親子1対多の関係を「全件フラットに見たい」場面で flatMap が活躍。

### 3-4. associate / associateBy ─ List → Map 変換

キーをひとつ決めて List を Map に変換する。「IDで引きたい」「名前で検索したい」の時の定番。

**Associate.kt**

```kotlin
val products = listOf(
    Product(1, "りんご", 150),
    Product(2, "みかん", 100),
)

// ID をキーにした Map に変換
val byId: Map<Long, Product> = products.associateBy { it.id }
// → {1=Product(1,りんご,150), 2=Product(2,みかん,100)}

val apple = byId[1L]   // ID 1 で素早く引ける

// キーと値を両方カスタマイズしたい時
val nameToPrice: Map<String, Int> = products.associate {
    it.name to it.price
}
// → {りんご=150, みかん=100}
```

### 3-5. その他の便利関数 ─ 早見表

| 関数                 | 用途                        | 例                                                      |
|----------------------|-----------------------------|---------------------------------------------------------|
| `take(n)`            | 先頭n件                     | `list.take(3)`                                          |
| `drop(n)`            | 先頭n件を除く残り           | `list.drop(3)`                                          |
| `chunked(n)`         | n個ずつに分割               | `list.chunked(2)`                                       |
| `zip(other)`         | 2リストを並行に組み合わせ   | `names.zip(ages)`                                       |
| `distinct()`         | 重複除去                    | `list.distinct()`                                       |
| `distinctBy { ... }` | キー指定で重複除去          | `orders.distinctBy { it.customer }`                     |
| `partition { ... }`  | 条件でTrue組とFalse組に二分 | `val (paid, unpaid) = invoices.partition { it.isPaid }` |
| `any { ... }`        | 1つでも条件を満たすか       | `orders.any { it.amount > 10000 }`                      |
| `all { ... }`        | すべて条件を満たすか        | `orders.all { it.isPaid }`                              |
| `none { ... }`       | 1つも条件を満たさないか     | `orders.none { it.isCancelled }`                        |

> **💡 標準ライブラリの威力**
>
> Kotlin の `kotlin.collections` パッケージには**200以上の関数**が定義されている。覚える必要はないが、「こういう処理がしたい時に専用関数がありそう」と当たりをつけて IntelliJ の補完(`list.` で出てくる候補)を眺めると、書きたい処理がほぼ見つかる。

### 3-6. ハンズオン演習 3-1

**💡 演習: 売上集計**

以下のデータに対し、関数型で集計してください。

**Ex03.kt(出発点)**

```kotlin
data class SaleRecord(
    val customerId: Long,
    val productCategory: String,
    val amount: Int,
    val date: java.time.LocalDate,
)

val sales: List<SaleRecord> = ...   // 1000件くらい

// (1) 顧客ごとの購入総額 ─ Map<Long, Int> を返す
// (2) カテゴリごとの売上TOP1 ─ Map<String, SaleRecord> を返す
// (3) 1日に複数回購入した顧客のID一覧
// (4) 全期間で最も購入額が多かった顧客のID
```

### Ch.04 Sequence ─ 遅延評価⏱ 60分

大きなデータを効率よく処理する

### 4-1. List と Sequence の違い ─ 中間リストの有無

これまで使ってきた List のチェーンは、**各ステップで中間リストを作る**。100万件のリストを `filter` → `map` → `take(10)` すると、filter後と map後に巨大な中間リストが生成される。

**Sequence** はこの中間リストを**作らない**。**遅延評価**と言って、最後の `toList()` や `take(10)` などの**終端操作**が呼ばれて初めて、必要な分だけ計算する。

［図（テキスト抽出）：List のチェーン: 各ステップで全件を処理 / 入力 / 100万件 / filter後 / 中間50万件 / map後 / 中間50万件 / take(10)後 / 10件 / 巨大な / 中間リスト / メモリ消費大 / Sequence のチェーン: 必要な分だけ計算 / 入力 / 100万件 / filter / (中間なし) / map / (中間なし) / take(10) / 10件 / 中間リストなし / メモリ消費小 / ※ Sequence は、要素ごとに「filter → map → take」のパイプラインを通すイメージ。 / 10件取れた時点でそれ以降の要素は処理されない。］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図4-1: List と Sequence の違い ─ 中間リストの有無と評価タイミング

### 4-2. 使い方

**SequenceExample.kt**

```kotlin
// 大きな List を Sequence に変換
val result = bigList
    .asSequence()                // ここから遅延評価モード
    .filter { it.amount > 1000 }
    .map { it.copy(amount = (it.amount * 1.1).toInt()) }
    .take(10)
    .toList()                   // ここで初めて計算が走る

// 無限シーケンスも作れる(List ではできない)
val evens = generateSequence(0) { it + 2 }
    .take(5)
    .toList()                   // → [0, 2, 4, 6, 8]
```

### 4-3. いつ Sequence を使うべきか

| 場面                                | List か Sequence か   | 理由                                 |
|-------------------------------------|-----------------------|--------------------------------------|
| 要素数が少ない(数百以下)            | **List**              | Sequenceのオーバーヘッドの方が大きい |
| 要素数が多い + 中間段階がたくさん   | **Sequence**          | 中間リストが省ける                   |
| take(n) や first { ... } で早期終了 | **Sequence**          | 必要な分だけ計算で済む               |
| 無限ストリーム                      | **Sequence のみ可能** | List では作れない                    |
| 結局全件処理する(toList で終わる)   | List                  | Sequenceの利点なし                   |

> **⚠ デフォルトは List で良い**
>
> 業務システムの大半のケースでは **List で問題ない**。「数十万件以上を扱う」「早期終了が頻繁にある」と判明してから Sequence に切り替えるのが正解。最初から Sequence を使うと、デバッグやIDEの型表示で却って混乱することもある。

### Ch.05 sealed class でドメインエラー⏱ 60分

業務エラーを「例外」ではなく「型」で扱う

### 5-1. なぜ「業務エラー」を例外で扱うとつらいのか

Java で「在庫不足」「与信限度額超過」などの業務エラーを表現する時、例外(`throw new InventoryShortageException(...)`) を使うのが定番でした。しかしこれには課題があります。

> **⚠ 例外でエラーを表現する課題**
>
> - **シグネチャに現れない**: 関数が何のエラーを投げるかコードを開かないと分からない(Checked Exception は使われなくなった)
> - **処理フローが見えにくい**: try-catch でジャンプするので、コードの流れが読みにくい
> - **本物の異常と業務エラーが混在**: `NullPointerException`(バグ) と `InventoryShortage`(想定内エラー)が同じ仕組みで扱われる
> - **網羅チェックがない**: 全エラー種別を caller が処理しているかコンパイラが教えてくれない

**💡 発想の原点 ─ 「リターンコードでエラーを返す」の現代版**

「sealed class でエラーを表現する」と聞くと新しい話に思えますが、実は**古典的な「リターンコード方式」(C言語などで `int` を返して 0=成功 / -1=エラー1 / -2=エラー2 とする手法) の現代版**と捉えると分かりやすいです。

歴史的な流れ:

| 時代                                                     | エラー表現                                       | 課題                                                                     |
|----------------------------------------------------------|--------------------------------------------------|--------------------------------------------------------------------------|
| 古典(C等)                                                | 戻り値の数値(0=成功, 負=エラー種別)              | 「-3って何だっけ?」型情報がない、無視できてしまう                        |
| Java(オブジェクト指向)                                   | 例外(throw / try-catch)                          | シグネチャに現れない、全部キャッチで握りつぶせる、業務エラーと異常の混在 |
| 現代の関数型(Kotlin sealed / Rust Result / Scala Either) | **戻り値の型として表現**(成功と各エラーが別の型) | (課題が解消される)                                                       |

つまり sealed class は **「業務上のエラーを return 値で返す」という古典スタイルに戻りつつ、<u>型システムで強化</u>することで「種別を勝手に増やせない」「処理漏れが起きない」を保証するアプローチ**です。「例外でひとくくり」にせず、業務シナリオごとに別の型として明確に表現することで、コード上で何が起こりうるのかが一目で分かります。

### 5-2. sealed class ─ 限定された継承

**sealed class** は「継承できるサブクラスを**同じファイル内に限定**」する仕組み。これにより**取りうる値が有限**であることをコンパイラに保証させる。

**OrderResult.kt**

```kotlin
// 注文処理の結果を型で表現
sealed class OrderResult {
    data class Success(val orderId: Long) : OrderResult()
    data class InventoryShortage(
        val product: String, val needed: Int, val available: Int
    ) : OrderResult()
    data class CreditLimitExceeded(
        val customer: String, val overAmount: Int
    ) : OrderResult()
    object SystemDown : OrderResult()
}
```

注文サービスが「成功 / 在庫不足 / 与信超過 / システム障害」の**どれか1つ**を返すことが、関数のシグネチャだけで明確になる。

**OrderService.kt**

```kotlin
class OrderService(...) {
    fun placeOrder(req: OrderRequest): OrderResult {
        if (!hasInventory(req)) return OrderResult.InventoryShortage(...)
        if (!checkCredit(req))  return OrderResult.CreditLimitExceeded(...)
        val id = saveOrder(req)
        return OrderResult.Success(id)
    }
}
```

### 5-3. when で網羅チェック

sealed class の結果を `when` で扱うと、コンパイラが**全ケースが処理されていることを検証**してくれる。新しいエラー種別が追加されたら、caller のコードが**コンパイルエラーになる**ので漏れが防げる。

**OrderController.kt**

```kotlin
val message = when (val result = orderService.placeOrder(req)) {
    is OrderResult.Success ->
        "注文番号: ${result.orderId} を受け付けました"

    is OrderResult.InventoryShortage ->
        "${result.product} の在庫が ${result.needed} 個必要ですが、${result.available} 個しかありません"

    is OrderResult.CreditLimitExceeded ->
        "${result.customer} の与信限度を ${result.overAmount} 円超えています"

    OrderResult.SystemDown ->
        "システムが一時的に利用できません。しばらく経ってからお試しください"
}
// ← when 式なので else 不要。1つでも書き忘れるとコンパイルエラー
```

> **✅ メリット ─ 「漏れない」エラー処理**
>
> 後日「ポイント不足」というエラーを追加すると、コンパイラが「OrderControllerでまだ処理されていない」と教えてくれる。**ドメインの拡張が型システムによって安全に伝播**する ─ これは例外モデルでは絶対にできないこと。

### 5-4. Result型風の自作

「成功 or 失敗」をジェネリックに表現したい時は、自分でResult型を作れる。

**DomainResult.kt**

```kotlin
sealed class DomainResult<out T, out E> {
    data class Ok<out T>(val value: T) : DomainResult<T, Nothing>()
    data class Err<out E>(val error: E) : DomainResult<Nothing, E>()
}

// 使用例
fun divide(a: Int, b: Int): DomainResult<Int, String> =
    if (b == 0) DomainResult.Err("0除算はできません")
    else DomainResult.Ok(a / b)

when (val r = divide(10, 0)) {
    is DomainResult.Ok -> println("結果: ${r.value}")
    is DomainResult.Err -> println("エラー: ${r.error}")
}
```

> **💡 例外との使い分け指針**
>
> - **業務上の想定内のケース**(在庫不足・与信超過・入力不正など) → sealed class で型として表現
> - **本物の異常**(DB接続失敗・OutOfMemory・NPE) → 例外のままで OK
>
> 「これは業務シナリオの分岐?」「これは予期せぬ異常?」を分けて考えるのが肝。

### Ch.06 DSL構築入門⏱ 75分

Kotlin DSL の正体 ─ レシーバー付きラムダ

### 6-1. DSL とは何か

**DSL(Domain Specific Language、ドメイン特化言語)**とは、特定の問題領域に特化した、まるで専用言語のように見える記法のこと。Kotlin は**ホスト言語(Kotlin)の中に DSL を組み込む**のが得意な言語です。

**📌 例え話 ─ 「料理レシピ本」と「料理プログラム」**

みなさんが料理レシピ本を読むとき、こんな風に書かれていますよね:

```
カレーライス

  材料:

    肉 300g

    玉ねぎ 2個

    にんじん 1本

  手順:

    1. 玉ねぎを切る

    2. 鍋で炒める
```

これを Java のクラス・メソッド呼び出しで普通に書くと、こうなります:

```
Recipe r = new Recipe("カレーライス");

r.addIngredient(new Ingredient("肉", 300, "g"));

r.addIngredient(new Ingredient("玉ねぎ", 2, "個"));

r.addStep(new Step(1, "玉ねぎを切る"));
```

意味は同じでも、**料理人にとっては最初のレシピ本の書き方の方が圧倒的に読みやすい**。これを目指すのが DSL です。Kotlin で書くと:

```
recipe("カレーライス") {

  ingredients {

    肉(300, g)

    玉ねぎ(2, 個)

  }

  steps {

    step("玉ねぎを切る")

  }

}
```

レシピ本に近づきました。これは**普通のKotlinコード(関数呼び出しの組み合わせ)**でありながら、見た目はレシピ本そのもの。**使う人(料理人=業務担当者) の言葉**でコードが書けるのが DSL の本質です。

#### JSON / YAML のような構造化テキストとの比較

DSL のイメージを**JSON や YAML のような構造化テキスト**と対比すると分かりやすいかもしれません。両者は**「人が読み書きしやすい階層構造」**を持つ点で似ていますが、決定的な違いがあります。

YAML / JSON (構造化テキスト)

**recipe.yaml**

```yaml
recipe:
  name: "カレーライス"
  ingredients:
    - name: "肉"
      amount: 300
      unit: "g"
    - name: "玉ねぎ"
      amount: 2
      unit: "個"
  steps:
    - "玉ねぎを切る"
    - "鍋で炒める"
```

Kotlin DSL

**recipe.kt**

```kotlin
recipe("カレーライス") {
    ingredients {
        肉(300, g)
        玉ねぎ(2, 個)
    }
    steps {
        step("玉ねぎを切る")
        step("鍋で炒める")
    }
}
```

| 観点       | JSON / YAML                        | Kotlin DSL                                                                           |
|------------|------------------------------------|--------------------------------------------------------------------------------------|
| 正体       | **データの記述** ─ ただのテキスト  | **実行可能なコード** ─ Kotlin のプログラム                                           |
| 書ける内容 | key=value、リスト、ネスト構造      | 関数呼び出し、変数参照、計算式、条件分岐、ループ、外部呼び出しなど Kotlin の式すべて |
| 動的な値   | 書けない(`amount: 300` は固定値)   | 書ける(`肉(stockCount * 2, g)` のように計算可能)                                     |
| 型チェック | パーサーで検証(実行時にエラー発覚) | **コンパイラが検証** ─ 型の間違いはコンパイル時に発覚                                |
| IDE 補完   | YAMLスキーマがあれば多少           | **普通のKotlinコード並み**に効く                                                     |
| 必要なもの | パーサー(JSON/YAML ライブラリ)     | Kotlin コンパイラだけ ─ 別パーサー不要                                               |

> **📌 一言でまとめると**
>
> JSON / YAML は**「データ」**(静的な記述)。Kotlin DSL は**「データに見えるコード」**(動的に実行されるプログラム) です。
>
> Kotlin DSL は、JSON/YAML のような**読みやすい階層構造**を保ちながら、**「関数呼び出し」「変数参照」「条件分岐」**のような**プログラム的な処理**を埋め込めるのが本質。「データの形をしたコード」と理解すると分かりやすいです。
>
> 本研修の `build.gradle.kts` で `kotlin("jvm") version "2.0.21"` という記述ができるのも、内側で関数呼び出しがされているから。これが JSON ファイルだったら、関数呼び出しを書く機能はありません。

#### 身近な DSL の例 ─ build.gradle.kts

実はすでに皆さんは Kotlin DSL を使っています。本研修で使う `build.gradle.kts` がまさに DSL です:

**build.gradle.kts(Gradle Kotlin DSL)**

```groovy
plugins {
    id("org.springframework.boot") version "3.4.0"
    kotlin("jvm") version "2.0.21"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

これは「ビルド設定ファイル」という業務領域に特化したDSL。**普通のKotlinコード**なのに、まるで設定ファイルの専用言語のように見える。`plugins { ... }`、`dependencies { ... }` はすべて関数呼び出しです。

#### DSL のメリット ─ 「業務の言葉でコードを書ける」

DSL の真の価値は**「コードと業務の言葉のギャップを埋める」**こと。レシピ本のように、業務担当者が読んでも内容が分かるコードが書ける。例えば「在庫管理システム」を作るなら:

```
出荷指示書 {

  宛先 = "田中商店"

  商品("りんご") { 数量 = 100; 単価 = 150 }

  商品("みかん") { 数量 = 50;  単価 = 100 }

}
```

業務担当者が読んでも理解できる。これが DSL の威力です。

| 有名な Kotlin DSL           | 用途                                    |
|-----------------------------|-----------------------------------------|
| Gradle Kotlin DSL           | ビルド設定(本研修で使用)                |
| Spring DSL (RouterFunction) | Spring Boot ルーティング(Day 5で扱う)   |
| Ktor サーバー               | Webサーバーのルーティング・ミドルウェア |
| kotlinx.html                | HTMLをタイプセーフに生成                |
| Exposed                     | SQL DSL(JPAの代替)                      |
| Kotest                      | テストの記述                            |

### 6-2. DSLの正体 ─ レシーバー付きラムダ

Kotlin DSL を可能にする仕組みは**レシーバー付きラムダ**(関数リテラル with receiver)。「ラムダの中で `this` が指す対象を指定できる」機能です。

#### 普通のラムダ vs レシーバー付きラムダ

**LambdaWithReceiver.kt**

```kotlin
// 普通のラムダ: (StringBuilder) -> Unit
val normal: (StringBuilder) -> Unit = { sb ->
    sb.append("hello")
    sb.append("!")
}

// レシーバー付きラムダ: StringBuilder.() -> Unit
val withReceiver: StringBuilder.() -> Unit = {
    append("hello")      // this.append(...) と同じ
    append("!")          // this. を省略できる
}
```

`StringBuilder.() -> Unit` は「`StringBuilder` がレシーバー(=ラムダ内で this として参照される対象)になる」という型。これを使うと、ラムダの中で**特別な命令体系**(=DSL)が使えるように見えるわけです。

### 6-3. 簡単な業務DSLを作ってみる

「商品マスタを定義する DSL」を作ってみます。完成形はこうなります。

**使い手のコード(完成形)**

    val catalog = catalog {
        product(1, "りんご") {
            price = 150
            category = "果物"
        }
        product(2, "みかん") {
            price = 100
            category = "果物"
        }
        product(3, "牛乳") {
            price = 200
            category = "飲料"
        }
    }

    println(catalog.totalValue())

これを実現する実装側はこうです。

**DSL定義側**

    // データクラス(ターゲット)
    data class Product(val id: Long, val name: String, val price: Int, val category: String)

    // 1. Productのビルダー
    class ProductBuilder(val id: Long, val name: String) {
        var price: Int = 0
        var category: String = ""
        fun build() = Product(id, name, price, category)
    }

    // 2. Catalogのビルダー
    class CatalogBuilder {
        private val products = mutableListOf<Product>()

        // レシーバー付きラムダを引数に取る
        fun product(id: Long, name: String, init: ProductBuilder.() -> Unit) {
            val builder = ProductBuilder(id, name)
            builder.init()      // init を builder の文脈で実行
            products.add(builder.build())
        }

        fun build() = Catalog(products.toList())
    }

    data class Catalog(val products: List<Product>) {
        fun totalValue(): Int = products.sumOf { it.price }
    }

    // 3. エントリポイントのトップレベル関数
    fun catalog(init: CatalogBuilder.() -> Unit): Catalog =
        CatalogBuilder().apply(init).build()

> **📌 DSLの構成要素**
>
> - **エントリ関数**: `catalog { ... }` ─ レシーバー付きラムダを受け取って、対応する Builder を組み立てる
> - **Builder クラス**: 中の `var` プロパティ・メソッドが「DSLの語彙」になる
> - **ラムダの実行**: `builder.init()` または `builder.apply(init)` でラムダを Builder の文脈で実行
> - **build()**: 最後にイミュータブルなドメインオブジェクトを返す

### 6-4. なぜ業務システムで DSL を使うか

| 場面               | DSL がない場合          | DSL がある場合                 |
|--------------------|-------------------------|--------------------------------|
| マスタデータ初期化 | SQLのINSERTを大量に書く | 業務の言葉でセットアップを記述 |
| テストデータ準備   | setUp()でnew()を並べる  | DSLで意図が明確に              |
| 業務ルール定義     | if-elseを連ねる         | 業務担当者にも読める記述       |
| API仕様定義        | Yaml or アノテーション  | 型安全な DSL                   |

> **⚠ DSLは万能薬ではない**
>
> DSL は**同じ構造の繰り返し**(同じパターンで大量のデータを宣言するなど)に使う時に最大の威力を発揮する。一度しか使わない処理や、複雑なロジックを無理にDSL化すると、かえって読みにくくなる。「これは DSL にしたほうが何度も使われるか?」を考えて採用すること。

### 6-5. ハンズオン演習 6-1

**💡 演習: 出荷指示書 DSL**

以下のような書き方ができる「出荷指示書 DSL」を実装してください。

**Ex06.kt(目標)**

```kotlin
val shipment = shipment {
    to = "田中商店"
    deliveryDate = LocalDate.of(2025, 11, 20)
    item("りんご") {
        quantity = 100
        unitPrice = 150
    }
    item("みかん") {
        quantity = 50
        unitPrice = 100
    }
}

println(shipment.totalAmount())   // → 20000
```

必要なクラス: `Shipment`(完成形), `ShipmentBuilder`, `ItemBuilder`, トップレベル関数 `shipment(...)`

### Ch.07 総合演習: 在庫管理ロジック⏱ 15分

本日学んだ機能をすべて使う ─ 関数型で在庫を分析する

### 7-1. 演習課題

Day 1 で設計した `InventoryLine` ドメインモデルを使って、以下の集計を関数型で実装してください。データは大量(数千件) の在庫データを想定。

**InventoryAnalysis.kt**

```kotlin
data class InventoryLine(
    val warehouseId: String,        // 倉庫ID
    val product: Product,
    val quantity: Quantity,
    val arrivedAt: LocalDate,         // 入荷日
)

val inventory: List<InventoryLine> = loadInventory()

// (1) 倉庫ごとの総在庫評価額 ─ Map<String, Money>
//     ヒント: groupBy + mapValues + sumOf

// (2) カテゴリ別の在庫件数 TOP3 ─ List<Pair<String, Int>>
//     ヒント: groupBy + mapValues { it.size } + entries.sortedByDescending + take(3)

// (3) 入荷から30日以上経過した在庫のみ抽出 ─ List<InventoryLine>
//     ヒント: filter + LocalDate.now().minusDays(30)

// (4) 「30日以上経過 + 単価1000円超」の在庫を倉庫ごとに集計し、
//      評価額の高い倉庫TOP3を返す ─ List<Pair<String, Money>>

// (5) DSLで「分析レポート」を生成する
//     val report = inventoryReport(inventory) { ... } の形式
```

> **📌 業務でこのスキルが活きる場面**
>
> - 月次・四半期の在庫評価レポート
> - 滞留在庫(売れずに残っている在庫)の検知
> - 倉庫別・カテゴリ別のKPIダッシュボード
> - 仕入計画の根拠データ作成
>
> これらすべてが、**Kotlinのコレクション操作20行程度**で書ける。SQLでやっていた処理の多くをアプリ層でも表現できる、というのが Kotlin の強みです。

### Ch.08 Git: 本日の成果を commit & push⏱ 15分

演習結果を GitHub に push して Day 2 を終える

### 8-1. 手順

1 変更内容の確認 IntelliJ の Git ツールウィンドウで「Local Changes」を開き、Day 2 で書いたファイル(`day2/` 配下) を確認。 2 Commit 変更ファイルを選択 → 「Commit」ボタン。コミットメッセージは「Day 2: 関数型・コレクション・DSL 演習完了」のように内容がわかるものを書く。 3 Push 「Commit and Push...」または Commit 後に「Push」ボタンで GitHub に反映。 4 GitHub で確認 ブラウザで自分のリポジトリを開き、push されたコミットを確認。

### 8-2. Day 2 のまとめ

> **✓ 本日身につけたこと**
>
> - 関数型プログラミングの3本柱: イミュータブル / 副作用最小化 / 高階関数
> - map / filter / reduce / fold によるデータ変換パイプライン
> - groupBy / sortedBy / flatMap / associateBy など業務集計の必殺技
> - List と Sequence の使い分け(遅延評価)
> - sealed class でドメインエラーを型として表現
> - レシーバー付きラムダによる Kotlin DSL の構築

> **📅 Day 3 に向けて**
>
> 明日(Day 3)は **コルーチン**を1日かけて扱います。複数のAPI呼び出しを並列化、長時間処理のキャンセル、Flow による非同期ストリームなど、業務システムで頻出する非同期処理を Kotlin らしく書く方法を学びます。事前準備は不要ですが、関数型の発想(Day 2)とNull安全(Day 1)は前提として使うので、不安な箇所があれば復習しておくと良いです。

## DAY 3 ─ コルーチン・構造化並行性

Java の Thread / CompletableFuture / RxJava で苦労していた並列処理を、Kotlin の suspend 関数とコルーチンで「同期コードの見た目」のまま書く。**呼び出し側がどう制御したいか(待つ/タイムアウト/失敗時/キャンセル/集約)**を Java 時代から変わらない発想で整理しつつ、Kotlin の標準命令でそれをシンプルに表現する方法を学ぶ。なお、非同期・並列処理は「順不同で良い処理」にだけ適用するもの ─ Day 3 はこの設計哲学を貫きます。

合計 9時間 前提: Day 1〜2 修了 / Java の Thread や Future の概念を理解 到達点: 並列処理の業務コードを自信を持って書ける

### Ch.00 本日の目標と進め方⏱ 5分

Day 3 を終えた時に、何ができるようになっていれば良いか

### 0-1. 本日のゴール

- **なぜコルーチンが必要か**を、Java の非同期処理の歴史を踏まえて説明できる
- **suspend 関数**と通常の関数の違いを理解し、書き分けられる
- **async / awaitAll** で複数のAPI呼び出しを並列化できる(実務最頻出)
- **withTimeout / withTimeoutOrNull** でタイムアウトを設定できる
- **構造化並行性**(CoroutineScope / Job / Dispatcher)を理解し、キャンセル伝搬の挙動を予測できる
- コルーチン内の**例外処理**(try-catch、SupervisorJob、CoroutineExceptionHandler) を使い分けられる
- **Flow** で非同期ストリームを扱える
- **Spring Boot の Controller** を suspend 関数として書ける

### 0-2. 本日の構成 ─ 実務で必要になる順

コルーチンは概念が多いので、教科書順(理論 → 応用)ではなく **「業務で実際に書く順番」**で進めます。

| 章   | テーマ                             | 実務での使用頻度               |
|------|------------------------------------|--------------------------------|
| Ch.1 | なぜコルーチンが必要か             | 動機の理解(全員必須)           |
| Ch.2 | 非同期処理の用語整理と制御の枠組み | ★★★ 全章の地図                 |
| Ch.3 | suspend 関数の基礎                 | ★★★ 毎日使う                   |
| Ch.4 | 並列実行(async/awaitAll)           | ★★★ 最頻出 ─ 厚めに            |
| Ch.5 | タイムアウト・リトライ・キャンセル | ★★★ 業務必須 ─ 厚めに          |
| Ch.6 | 構造化並行性 / Dispatcher          | ★★ 設計時に理解必須            |
| Ch.7 | 例外処理                           | ★★ ハマりポイント多い          |
| Ch.8 | Flow                               | ★ 非同期ストリームを扱う時のみ |
| Ch.9 | Spring Boot 連携(予告)             | ★ Day 4 で本格的に扱う         |

**⚠ 本日の作業開始前に ─ 起動チェック**

**Day 3 では Docker のモックAPIサーバ(3社) が必要です**(Ch.05 で並列見積取得の演習をします)。DBはまだ不要ですが、まとめて起動しても支障ありません。

| 必要なもの                   | 状態                   | 確認方法                           |
|------------------------------|------------------------|------------------------------------|
| IntelliJ / JDK / Git         | 引き続き起動済み       | ─                                  |
| **Docker Desktop**           | 起動済み               | タスクトレイのクジラアイコンが緑色 |
| **モックAPI 3社(9001-9003)** | 起動済み               | 下記コマンドを実行                 |
| Spring Boot / Vue            | 本日は不要(Day 4 以降) | ─                                  |

**起動コマンド**(コマンドプロンプトで実行):

**本日の起動チェック手順**

    # 1. Docker コンテナの状態確認
    $ cd C:\work\kotlin-training\infra
    $ docker compose ps
    → supplier-mock-a / supplier-mock-b / supplier-mock-c が STATUS=Up なら OK

    # 2. もし止まっていたら起動
    $ docker compose up -d

    # 3. 各モックの動作確認(ブラウザでも可)
    $ curl http://localhost:9001/api/health
    → {"status":"UP","supplier":"SUP001"} などが返れば成功
    $ curl http://localhost:9002/api/health   # SUP002
    $ curl http://localhost:9003/api/health   # SUP003

### Ch.01 なぜコルーチンが必要か⏱ 45分

Java 非同期処理の歴史と、Kotlin のアプローチ

### 1-1. 業務システムでも非同期処理が必要な場面

「業務システムは同期処理で十分」と思いがちですが、実は非同期処理が必要な場面は意外と多い。

- **複数の外部 API を呼ぶ**: 在庫確認 + 与信チェック + 配送可否確認 を順番に呼ぶと3秒。並列なら1秒
- **外部システム連携**: 決済システム、配送API、SNS連携 などの応答待ち
- **バッチ処理**: 1万件の請求書を順次処理する代わりに、100件ずつ並列処理
- **タイムアウト制御**: 「3秒以内に応答がなければエラー」を確実に実装
- **長時間処理のキャンセル**: ユーザーが画面を閉じたら処理を中断

### 1-2. Java の非同期処理 ─ これまでの選択肢と課題

Java で非同期処理を書く方法は何度も進化してきました。まず**「3つの外部APIに並列でリクエストして結果を集める」**という典型業務シナリオを、各手法でどう見えるかを図にしてみます。

［図（テキスト抽出）：① Thread + Future.get() / submit→Future / get() 待ち / ⚠ スレッド / ブロック / ⚠ 例外が / ラップされる / ② CompletableFuture / supplyAsync / thenCombine / thenApply / exceptionally / ⚠ thenXxx の使い分けが多い / try-catch ではなく専用API / スタックトレースが追えない / ③ RxJava / Reactor / Mono / zip / map / flatMap / timeout / onErrorResume / ⚠ 演算子(operator)が膨大 / 学習コストが高い / デバッグが困難 / いずれも共通の課題: / 戻り値が Future / Mono 等に変わる / 同期コードと別世界になる / キャンセ …］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図1-1: Java の3つの非同期処理スタイルと、それぞれの課題

#### ① Thread + ExecutorService(Java 5〜)

**ThreadStyle.java**

```java
ExecutorService executor = Executors.newFixedThreadPool(10);
Future<Inventory> invF = executor.submit(() -> inventoryApi.check(productId));
Future<Credit> credF = executor.submit(() -> creditApi.check(customerId));

// get() でブロックして待つ
Inventory inv = invF.get();
Credit cred = credF.get();

// 課題:
// - get() はスレッドをブロックする
// - ExecutorService の管理(shutdown忘れ)
// - 例外処理が ExecutionException でラップされる
```

#### ② CompletableFuture(Java 8〜)

**CompletableFutureStyle.java**

```java
CompletableFuture<Inventory> invF = CompletableFuture.supplyAsync(() -> inventoryApi.check(productId));
CompletableFuture<Credit> credF = CompletableFuture.supplyAsync(() -> creditApi.check(customerId));

CompletableFuture<OrderResult> result = invF.thenCombine(credF, (inv, cred) -> {
    if (!inv.isAvailable()) return new OrderResult.InventoryShortage(...);
    if (!cred.isApproved()) return new OrderResult.CreditExceeded(...);
    return new OrderResult.Success(...);
}).exceptionally(ex -> new OrderResult.SystemError(ex));

// 課題:
// - thenCombine/thenApply/thenCompose の使い分けが難しい
// - エラーの流れ(exceptionally)も含めると複雑
// - try-catch ではなく専用APIの理解が必要
// - ネストが深くなると読めなくなる
```

#### ③ RxJava / Reactor(Java 8〜)

**RxJavaStyle.java**

```java
Mono<OrderResult> result = Mono.zip(
    inventoryApi.checkMono(productId),
    creditApi.checkMono(customerId)
).map(tuple -> {
    Inventory inv = tuple.getT1();
    Credit cred = tuple.getT2();
    // ... 判定処理
}).timeout(Duration.ofSeconds(3)).onErrorResume(...);

// 課題:
// - Mono/Flux、operator(map/flatMap/switchMap/...)が多数
// - 学習コストが非常に高い
// - スタックトレースが追いにくい(チェーン中で例外が起きると場所がわからない)
// - デバッグが困難
```

> **⚠ 共通の課題**
>
> - **関数の戻り値が Future / CompletableFuture / Mono などに変わる** ─ 「非同期色(async coloring)」と呼ばれる現象
> - 同期コードと別世界になる ─ `String → CompletableFuture<String>` に変えるとそれを呼ぶ側も全部書き換え
> - 例外処理が独自APIに ─ try-catch ではなく `.exceptionally` / `.onErrorResume`
> - キャンセル・タイムアウトの実装が煩雑

### 1-3. Kotlin コルーチンのアプローチ

Kotlin コルーチンは、これらの問題に対して**「非同期コードを同期コードの見た目で書く」**という解を出します。同じシナリオを Kotlin で書くと、こうなります。

［図（テキスト抽出）：withTimeout(3.seconds) { ... } ─ 3秒のタイムアウト / └ coroutineScope { ... } ─ 並列実行スコープ / async { invApi.check() } / 在庫確認 / async { credApi.check() } / 与信確認 / async { shipApi.check() } / 配送可否確認 / process(inv.await(), cred.await(), ship.await()) / ↑ 3つすべての結果が揃ったら次へ。普通のメソッド呼び出しに見える。 / ✓ try-catch でそのまま例外処理 ✓ 戻り値の型はそのまま(Future不要) / ✓ withTimeout で囲むだけでタイムアウト ✓ 1つ失敗で他もキャンセル(自動) / 並列実行されているが、コードは上から下へ普通に読め …］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図1-2: Kotlin コルーチンによる並列処理 ─ Java の各課題を解決

#### 同じ処理を Java と Kotlin で並べる

Java CompletableFuture

**Java.java**

```java
CompletableFuture
    .supplyAsync(() -> inv.check())
    .thenCombine(
        CompletableFuture.supplyAsync(() -> cred.check()),
        (i, c) -> process(i, c))
    .orTimeout(3, TimeUnit.SECONDS)
    .exceptionally(ex -> handleError(ex));
```

Kotlin コルーチン

**Kotlin.kt**

```kotlin
try {
    withTimeout(3.seconds) {
        val inv = async { invApi.check() }
        val cred = async { credApi.check() }
        process(inv.await(), cred.await())
    }
} catch (e: TimeoutCancellationException) {
    handleError(e)
}
```

> **✅ Kotlin コルーチンのメリット**
>
> - **普通の Kotlin コードに見える**: if / for / try-catch がそのまま使える
> - **スタックトレースが追える**: チェーンではなく通常の関数呼び出しなので、例外発生箇所が分かる
> - **キャンセル・タイムアウトが標準装備**: `withTimeout { ... }` で囲むだけ
> - **軽量**: 1スレッド上に何万ものコルーチンを動かせる(Threadより圧倒的に軽い)

### 1-4. コルーチンとは「中断・再開できる関数」

用語の整理:

| 用語                       | 意味                                                                 |
|----------------------------|----------------------------------------------------------------------|
| **コルーチン (Coroutine)** | 「中断と再開ができる関数」のこと。スレッドの一段軽い概念。           |
| **suspend 関数**           | コルーチンの中で実行できる、中断可能な関数                           |
| **CoroutineScope**         | コルーチンの実行範囲。「ここで起動したコルーチンはここで管理される」 |
| **Dispatcher**             | コルーチンを「どのスレッド」で動かすかの担当者                       |
| **Job**                    | コルーチンのライフサイクルを表すハンドル                             |

> **💡 イメージ: スレッドとコルーチンの違い**
>
> **スレッド**はOSが管理する重い実行単位(1個あたり数MBのメモリ)。1台のPCで数千が限界。
>
> **コルーチン**は Kotlin ランタイムが管理する軽い実行単位(1個あたり数KB)。1スレッド上で何万でも動かせる。
>
> 「重い処理(I/O待ち、ネットワーク待ち) で実際にブロックされるのはスレッドだけ。コルーチンは I/O 待ちの間、スレッドを離して別のコルーチンを動かす」── これが軽量さの源。

### Ch.02 非同期処理の用語整理と制御の枠組み⏱ 60分

「非同期・並列・並行」の違いと、呼び出し側が指定したい5つの制御

### 2-1. 「非同期」という言葉の混乱を整理する

業界では「非同期」という言葉が文脈によって違う意味で使われており、Day 3 の内容を理解する前に整理が必要です。

| 用語                      | 意味                                                                                    | 典型シーン                                                  |
|---------------------------|-----------------------------------------------------------------------------------------|-------------------------------------------------------------|
| **同期 (synchronous)**    | 呼び出した処理が終わるまで**待つ**。完了してから次の行へ進む                            | 普通の関数呼び出し、DB の SQL 発行                          |
| **非同期 (asynchronous)** | 呼び出した処理を**待たずに**、次の行へ進む。後で結果を受け取る(または受け取らない)      | ボタンクリックハンドラ、API呼び出しを投げて画面を先に進める |
| **並行 (concurrent)**     | 複数の処理を**同時期に進める**。物理的に同時かは問わない(1コアでも交互に実行すれば並行) | 1つの Web サーバーで多数のリクエストを捌く                  |
| **並列 (parallel)**       | 複数の処理を**物理的に同時実行**する。マルチコア前提                                    | CPU 4コアでソートを並列実行、複数の API を同時に叩く        |

> **⚠ フロント業界の「非同期」と本研修の「非同期」**
>
> **フロントエンド業界**では「非同期」と言うと「投げっぱなしで応答を待たない」(JavaScript の `fetch()` や `setTimeout` など) のイメージが強い。これは本研修で言う「**launch**(投げっぱなしコルーチン)」に相当します。
>
> 一方、**本研修の Day 3** で扱うのはもっと広く、「**呼び出した処理を別ライン(別スレッド・別コルーチン)で進めながら、呼び出し側でどう制御するか**」というテーマ全体です。具体的には:
>
> - **非同期 (待たない)**: `launch`
> - **並列 (同時に複数走らせて全部の結果を集める)**: `async + await`
> - **並行 (同じ Service で大量のリクエストを同時期に捌く)**: コルーチン全体の仕組み
>
> つまり Day 3 のテーマは厳密には「**並列・並行処理を、簡単に書ける道具としての コルーチン**」です。「非同期処理」という呼び方は便宜上のものとご理解ください。

### 2-2. そもそも非同期・並列処理を使う場面 ─ 「順不同で良い」処理に限る

非同期・並列処理は**すべての処理に適用すべきではありません**。これは設計上の重要な判断です。

> **📌 非同期・並列を使うべきか? の判断基準**
>
> 下記の条件を**すべて**満たす場合のみ、非同期・並列にすべきです:
>
> - **順序に依存しない**: A の結果が B の入力にならない(A → B の依存がない)
> - **独立して実行できる**: それぞれの処理が別の場所のリソース(別 API、別 DB テーブル)を扱う
> - **並列にする価値がある**: 各処理に時間がかかる(I/O待ち、重い計算) のでまとめると速くなる

| シナリオ                                         | 非同期・並列にすべきか | 理由                                                   |
|--------------------------------------------------|------------------------|--------------------------------------------------------|
| 在庫API + 与信API + 配送API を一度に問い合わせる | ✓ する                 | 互いに独立、順序関係なし、各々が遅い                   |
| 注文を作成してから、その注文IDで明細を作成する   | ✗ しない               | 明細作成は注文ID(=前の結果)に依存                      |
| ログ出力(ユーザー応答に関係ない)                 | △ してもよい           | 結果を待たないなら投げっぱなし(launch)で良い           |
| 軽い文字列処理を 100 個ループする                | ✗ しない               | 並列化のオーバーヘッドの方が大きい。普通のループで十分 |
| 1万件のレコードを集計する(I/Oなし)               | △ 場合による           | CPU重ければ並列化の価値あり。軽ければ普通に書く        |

> **⚠ 「すべて非同期化」のアンチパターン**
>
> 「コルーチンが速いから」「モダンだから」と**すべての処理を非同期化する**のは間違いです。本来順序が必要な処理を無理に並列にして、後から「やっぱり順序が必要」となって `await` やキャンセル制御を駆使するのは本末転倒。**順不同で良い処理にだけ、非同期・並列を使う**のが正しい設計です。

### 2-3. 制御の枠組み ─ 呼び出し側が指定したい5つの命令

非同期・並列処理を実行する時、呼び出し側は**「処理にどんな制御をかけたいか」**を指定する必要があります。これは Java の Thread / Future の時代から本質的に変わっていません。コルーチンが変えたのは**「これらの制御をシンプルに書ける標準命令を用意した」**という点です。

［図（テキスト抽出）：呼び出し側(制御する側) / 命令を出す / ① 起動 / 待つ / 待たない / ② タイムアウト / いつまで待つか / ③ 失敗時の挙動 / リトライ / 無視 / 伝搬 / ④ キャンセル要求 / 途中で止める / ⑤ 複数実行の集約 / 全完了待ち / 早い者勝ち / 片方失敗時の扱い / 命令 / 呼ばれた側(処理) / 命令を受けて反応する / 起動 → 実行中 / 結果を返す or 投げっぱなし / 時間内に終わる → 結果 / 時間切れ → 中断+例外 / 成功 → 結果を返す / 失敗 → 再試行 or 例外 / キャンセル要求受信 / 中断して後片付け / 各処理が独立して進行・完了 / 結果を順次 or 全部揃って呼び出し元へ戻す］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図2-1: 呼び出し側の5つの制御命令と、呼ばれた側の反応

### 2-4. 5つの制御に対する Kotlin の命令対応表

Kotlin コルーチンは、上記の5つの制御に対して**標準の命令(関数)**を用意しています。Day 3 では、これらを各章で1つずつ詳しく学んでいきます。

| 制御したいこと                               | Kotlinの命令                     | 意味                                          | 章          |
|----------------------------------------------|----------------------------------|-----------------------------------------------|-------------|
| **① 起動 (待たない)**                        | `launch { ... }`                 | 投げっぱなしで起動、結果を受け取らない        | Ch.3        |
| **① 起動 (結果を待つ)**                      | `async { ... }.await()`          | 結果を返すコルーチン、await で受け取る        | Ch.3 / Ch.4 |
| **② タイムアウト**                           | `withTimeout(3.seconds) { ... }` | 指定時間内に終わらなければ自動キャンセル+例外 | Ch.5        |
| **③ 失敗時の挙動 (例外伝搬)**                | 普通の `try-catch`               | 同期コードと同じ構造で例外処理                | Ch.7        |
| **③ 失敗時の挙動 (リトライ)**                | `retry { ... }` (自作ヘルパー)   | 指数バックオフでN回再試行                     | Ch.5        |
| **③ 失敗時の挙動 (一部許容)**                | `supervisorScope { ... }`        | 子の失敗を他の子に伝搬させない                | Ch.7        |
| **④ キャンセル要求**                         | `job.cancel()`                   | 協調的キャンセル要求                          | Ch.5 / Ch.6 |
| **⑤ 複数実行の集約 (全完了待ち)**            | `listOf(...).awaitAll()`         | 全部の結果が揃うまで待つ                      | Ch.4        |
| **⑤ 複数実行の集約 (1つ失敗で他キャンセル)** | `coroutineScope { ... }`         | 1つでも失敗したらscope全体を失敗扱い          | Ch.6        |
| **⑤ 複数実行の集約 (一部失敗OK)**            | `supervisorScope { ... }`        | 子の失敗を許容して他は継続                    | Ch.7        |

> **✅ 制御の考え方は Java と同じ ─ 道具がシンプルになっただけ**
>
> 上記の制御項目自体は、Java の Thread / Future / CompletableFuture / RxJava の時代から**変わっていません**。並列処理を書く上で、呼び出し側が指定したいことは常にこの5つです。
>
> Kotlin コルーチンが変えたのは、これらを**「同期コードの見た目」で、短く、かつ間違えにくく書けるようにした**こと。Day 3 の各章では、これらの命令を一つひとつ詳しく見ていきます。

### 2-5. Day 3 のロードマップ ─ 各章で何を学ぶか

上記の制御命令を、章を追って学んでいきます。

| 章   | テーマ                             | 主な制御命令                                                  |
|------|------------------------------------|---------------------------------------------------------------|
| Ch.3 | suspend 関数とコルーチン基礎       | `suspend` / `launch` / `async` / `runBlocking`                |
| Ch.4 | 並列実行(最頻出)                   | `async` + `awaitAll`                                          |
| Ch.5 | タイムアウト・リトライ・キャンセル | `withTimeout` / 自作`retry` / `job.cancel()`                  |
| Ch.6 | 構造化並行性                       | `coroutineScope` / `Job` / `Dispatcher`                       |
| Ch.7 | 例外処理                           | `try-catch` / `supervisorScope` / `CoroutineExceptionHandler` |
| Ch.8 | Flow ─ 非同期ストリーム            | `Flow` / `collect` / `StateFlow`                              |
| Ch.9 | Spring Boot 連携                   | suspend Controller                                            |

### Ch.03 suspend 関数とコルーチン ─ 基礎⏱ 60分

最小限の道具で「動かしてみる」

### 3-1. suspend 関数 ─ 「中断・再開できる関数」

Day 3 で何度も登場する **suspend 関数** を、最初にしっかり押さえます。

#### 3-1-1. suspend キーワードの意味

Kotlin で関数の頭に `suspend` 修飾子を付けると、その関数は**「途中で中断して、後で再開できる関数」**になります。普通の関数との違いは下記:

| 観点         | 普通の関数 `fun`             | suspend 関数 `suspend fun`                                    |
|--------------|------------------------------|---------------------------------------------------------------|
| 処理の進み方 | 呼ばれたら最後まで一気に実行 | 途中で中断できる(`delay`、I/O待ちなど) ─ 再開地点を覚えておく |
| 呼べる場所   | どこからでも呼べる           | 他の suspend 関数 or コルーチンスコープの中からのみ           |
| 戻り値       | 普通の型(`String`等)         | 同じく普通の型(`Future`のようにラップされない)                |
| スレッド     | 呼び出しスレッドで実行       | 中断中はスレッドを離す(別コルーチンに譲る) ─ これが軽量さの源 |

**SuspendBasics.kt**

```kotlin
// 普通の関数 ─ 中断できない
fun greet(name: String): String = "Hello, $name"

// suspend 関数 ─ 中断可能
suspend fun fetchUser(id: Long): User {
    delay(1000)         // ←★ ここで中断(1秒後に再開)
    return userApi.get(id)  // ← suspend な userApi.get も内部で中断可能
}
```

#### 3-1-2. 「中断」とは具体的に何が起きているか

`delay(1000)` や HTTP リクエストの応答待ちなど、**「待たなければならない時間」**に出会うと、suspend 関数は以下のように振る舞います:

1.  現在の処理状態(ローカル変数、どの行を実行中か) を**記録**する
2.  スレッドを**解放**する(他のコルーチンや他の処理に譲る)
3.  待ち時間が経過 / I/Oが完了したら、Kotlin ランタイムが空いたスレッドを拾って**処理を再開**する

**📌 Thread.sleep との決定的な違い**

`Thread.sleep(1000)` は**スレッドそのものを止める**。そのスレッドは1秒間、何の仕事もできません。一方 `delay(1000)` は**コルーチンだけを中断**し、スレッドは別のコルーチンに譲られます。同じ1秒待ちでも、スレッド資源の使われ方が全然違う:

|                                | Thread.sleep(1000)              | delay(1000)              |
|--------------------------------|---------------------------------|--------------------------|
| 1万個のタスクが各々1秒待つとき | 1万スレッド必要(現実的に不可能) | 数十スレッドで全部捌ける |
| キャンセル                     | キャンセル不可                  | 協調的キャンセル可能     |
| 呼べる場所                     | どこでも                        | suspend 関数の中だけ     |

#### 3-1-3. suspend 関数が呼び出せる場所

suspend 関数は**「中断ポイントがどこか」をコンパイラが追跡する必要があり**、普通の関数からは呼べません。呼べるのは下記の2か所:

**どこから呼べるか**

    // ① 他の suspend 関数の中から呼べる
    suspend fun processOrder() {
        val user = fetchUser(1L)   // OK
        // ...
    }

    // ② コルーチンスコープの中から呼べる
    runBlocking {
        val user = fetchUser(1L)   // OK
    }

    // ✗ 普通の関数から呼ぶとコンパイルエラー
    fun normalFunction() {
        val user = fetchUser(1L)   // ✗ ERROR: Suspend function 'fetchUser' should be called only from a coroutine or another suspend function
    }

> **💡 つまり「コルーチンの世界」と「普通の世界」を分ける関所**
>
> `suspend` 修飾子は、その関数が**「コルーチンの世界に属している」**ことを宣言する関所。**普通の世界と非同期の世界の境界に runBlocking などのブリッジを置く**(Ch.3-3 で詳述)、というのが Kotlin コルーチンの基本設計です。

### 3-2. runBlocking ─ 同期世界と非同期世界のブリッジ

suspend 関数は **「他の suspend 関数 / コルーチンスコープの中」でしか呼べない**(Ch.2-1 で述べた制約)。 ということは、最初の一段目の呼び出しはどうやって始めるのか? ─ そこを橋渡ししてくれるのが `runBlocking` です。

> **📌 runBlocking の役割 ─ 「同期コードの世界」と「コルーチンの世界」の境界線**
>
> 呼び出し側(普通の関数や Java コード)は同期で動いていますが、内側で suspend 関数を呼びたい。この**境界線**で「同期側はブロックして待つ。内側ではコルーチンとして動く」を実現するのが runBlocking です。
>
> 使う場面は決まっていて、以下の3つの**境界線**でだけ使います:
>
> - **main 関数のエントリポイント**: プログラム全体は同期的に起動するので、最初に runBlocking で内側のコルーチン世界を開く
> - **JUnit テスト**: テストランナーは同期的に呼ぶので、テストの中で suspend 関数を呼ぶには境界が必要(より望ましいのは `kotlinx-coroutines-test` の `runTest`)
> - **Java コードから Kotlin の suspend 関数を呼ぶ**: Java側はコルーチンを知らないので、ブリッジが必要

**RunBlocking.kt**

```kotlin
fun main() = runBlocking {       // ← 同期側(main)と非同期側(コルーチン)の境界
    println("開始")
    val user = fetchUser(1L)   // suspend 関数を呼べる(境界の内側だから)
    println("取得完了: ${user.name}")
}
```

> **⚠ アプリの中身では使わない**
>
> 境界線として置く以外の場所、たとえば「Spring Boot の Controller の中」「Service クラスの中」では runBlocking は**使いません**。なぜなら:
>
> - 呼び出し元のスレッドを**ブロック**してしまい、コルーチンの利点(スレッド効率)が消える
> - Spring Boot の Controller は `suspend fun` として書けば、runBlocking なしで境界が自動的に管理される(Ch.8 で扱う)
> - Service の中で suspend 関数を呼びたい時は、Service 側も `suspend fun` にすれば、境界を作らずにそのまま呼べる
>
> つまり**「アプリの外周(エントリポイント) で1回だけ使うもの」**と覚えると整理がつきます。

### 3-3. launch ─ コルーチンを起動する

`launch` はコルーチンを起動する基本ビルダー。「投げっぱなし」(結果を待たない)で使う。

**Launch.kt**

```kotlin
fun main() = runBlocking {
    println("main start")

    launch {                       // 新しいコルーチンを起動
        delay(1000)
        println("コルーチン: 1秒経過")
    }

    println("main end")             // すぐに表示される
}

// 出力:
// main start
// main end
// コルーチン: 1秒経過    (1秒後)
```

> **💡 重要な動き**
>
> runBlocking の内側で launch されたコルーチンが「終わるまで runBlocking ブロック自体が終了しない」。つまり「main end」を表示した後、launch のコルーチンが完了するのを待ってから main 関数全体が終了する。これが**構造化並行性**(Ch.5で詳しく扱う)の基本。

### 3-4. delay ─ Thread.sleep の代替

`delay` は「コルーチンを指定時間中断する」関数。Java の `Thread.sleep` と似ているが、決定的な違いがある。

|            | Thread.sleep       | delay                                        |
|------------|--------------------|----------------------------------------------|
| 動作       | スレッドをブロック | コルーチンを中断(スレッドは別の処理に使える) |
| 呼べる場所 | どこでも           | suspend 関数の中 or コルーチンスコープのみ   |
| キャンセル | キャンセル不可     | キャンセル可能(Ch.4で扱う)                   |

**DelayDemo.kt**

```kotlin
fun main() = runBlocking {
    val start = System.currentTimeMillis()

    // 10万個のコルーチンを起動し、それぞれが1秒 delay する
    val jobs = (1..100_000).map {
        launch {
            delay(1000)
        }
    }
    jobs.forEach { it.join() }

    val elapsed = System.currentTimeMillis() - start
    println("完了: ${elapsed}ms")
}

// 出力例: 完了: 1234ms
// → 10万個を直列でやれば10万秒、Thread.sleepでも10万スレッドは無理。
//   コルーチンなら1秒ちょっとで完了する。これが軽量さの実感。
```

### 3-5. ハンズオン演習 3-1

> **💡 演習: 最初のコルーチン**
>
> 以下を実装してください。ファイル: `backend/src/main/kotlin/com/example/training/day3/_02_basics/Ex02.kt`
>
> 1.  suspend 関数 `fetchProduct(id: Long): Product` を作る。中で `delay(500.milliseconds)` してから固定の Product を返す。
> 2.  main 関数で、productId 1〜5 を**直列で**fetch して結果一覧を表示する。トータル時間を計測。
> 3.  所要時間が約2.5秒(500ms × 5)になることを確認。
>
> (Ch.4 で並列化して 500ms に短縮します)

**🗺 全体の骨格(位置関係のガイド)**

「`fetchProduct` は どこに書くのか」「`runBlocking` は 何に被せるのか」 が掴みにくい場合は、 まずこの骨格をコピーして TODO を埋めてみてください。**`fetchProduct` はトップレベル(main の外)**に、**`main` は `runBlocking { ... }` で囲む**、 という位置関係が肝です。

**backend/src/main/kotlin/com/example/training/day3/\_02_basics/Ex02.kt(骨格)**

```kotlin
package com.example.training.day3._02_basics

import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlin.time.Duration.Companion.milliseconds

// ① 固定データを返すための型(Product)
data class Product(val id: Long, val name: String, val price: Int)

// ② ★ ここはトップレベル(main の外)。 中断できる関数なので suspend を付ける
suspend fun fetchProduct(id: Long): Product {
    // TODO: delay(500.milliseconds) で 500ms 待ってから、 固定の Product を返す
}

// ③ ★ main は普通の関数。 = runBlocking { ... } で「コルーチン世界」 への入口を作る
fun main() = runBlocking {
    val start = System.currentTimeMillis()

    // TODO: id を 1L..5L で順番に回し、 fetchProduct(id) を呼んで結果を集める
    //       「直列」 なので for ループで1件ずつ await すれば OK(async は使わない)

    val elapsed = System.currentTimeMillis() - start
    println("完了: ${elapsed}ms")
}
```

**位置関係のポイント:**

- `fetchProduct` と `main` は**横並びのトップレベル関数**。 ネストしません。
- `runBlocking { ... }` の <u>中</u>でだけ suspend 関数(`fetchProduct`)が呼べる。 外で呼ぶとコンパイルエラー。
- `fun main() = runBlocking { ... }` の `=` は「main の中身は runBlocking ブロックそのもの」 という単一式表現(Day 1 で学んだ Kotlin の式関数)。
- **直列**なので `for (id in 1L..5L) { fetchProduct(id) }` のような単純なループで OK。 ここでは `async`/`await` はまだ使いません(次の Ch.4)。

### Ch.04 並列実行 ─ 実務最頻出⏱ 60分

async / awaitAll で複数の API を並列に呼ぶ

### 3-1. async / await ─ 結果を返すコルーチン

`launch` は「投げっぱなし」だが、`async` は**結果を返す**コルーチン。`Deferred<T>`(Future の Kotlin 版)を返し、`await()` で結果を取得する。

**AsyncBasic.kt**

```kotlin
suspend fun fetchInventory(productId: Long): Inventory {
    delay(500)   // API呼び出しを模擬
    return Inventory(...)
}
suspend fun fetchCredit(customerId: Long): Credit {
    delay(500)
    return Credit(...)
}
suspend fun fetchShipping(address: String): Shipping {
    delay(500)
    return Shipping(...)
}

fun main() = runBlocking {
    val start = System.currentTimeMillis()

    // === 並列実行 ===
    val inv = async { fetchInventory(1L) }
    val cred = async { fetchCredit(100L) }
    val ship = async { fetchShipping("東京") }

    // 3つの結果が揃うまで待つ
    val result = OrderInfo(inv.await(), cred.await(), ship.await())

    println("${System.currentTimeMillis() - start}ms")
    // → 約500ms(直列なら1500ms)
}
```

［図（テキスト抽出）：直列実行: 1500ms / fetchInventory 500ms / fetchCredit 500ms / fetchShipping 500ms / 0ms / 1500ms / 並列実行: 500ms / fetchInventory 500ms / fetchCredit 500ms / fetchShipping 500ms / 0ms / 500ms］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図3-1: 直列実行(1500ms) vs 並列実行(500ms) ─ 3つのAPIの応答時間が同じ時、所要時間は1/3

### 3-2. awaitAll ─ 同じ処理を多数並列に

「100件の商品IDから一括で在庫を取得」のようにループで並列実行したい時は `awaitAll`。

**AwaitAll.kt**

```kotlin
suspend fun fetchAllInventories(productIds: List<Long>): List<Inventory> = coroutineScope {
    productIds
        .map { id -> async { fetchInventory(id) } }
        .awaitAll()
}

fun main() = runBlocking {
    val ids = (1L..100L).toList()
    val start = System.currentTimeMillis()

    val all = fetchAllInventories(ids)

    println("100件取得: ${System.currentTimeMillis() - start}ms")
    // → 約500ms(100件直列だと50秒)
}
```

> **📌 業務でよく使うパターン**
>
> - **マイクロサービス間連携**: 5つの内部APIを並列で呼んで集約
> - **バッチ処理**: 何万件のデータを並列で処理
> - **外部API一括取得**: 商品IDリストから一括で詳細情報取得
> - **ダッシュボード**: 売上・在庫・顧客数 などのKPIを並列取得して表示

### 3-3. coroutineScope ─ 並列実行の安全な土台

上の例で出てきた `coroutineScope` は**「並列で実行する複数のコルーチンを、一括管理する」**関数。重要な性質があります。

> **✅ coroutineScope の3つの保証**
>
> 1.  **全コルーチンが完了するまで関数を抜けない** ─ 「待ち忘れ」が起きない
> 2.  **1つでも失敗したら、他もキャンセル** ─ 不要な処理を続けない
> 3.  **呼び出し元がキャンセルされたら、内部もキャンセル** ─ キャンセル伝搬

**CoroutineScopeBehavior.kt**

```kotlin
suspend fun placeOrder(): OrderResult = coroutineScope {
    val inv = async { invApi.check() }
    val cred = async { credApi.check() }    // もし credApi が例外を出すと…
    val ship = async { shipApi.check() }

    // inv も ship も自動でキャンセルされて、coroutineScope全体が例外を投げる
    OrderResult.success(inv.await(), cred.await(), ship.await())
}
```

これが Java の `CompletableFuture` や `ExecutorService` にはない大きな利点。「片方が失敗したのに、もう片方の処理が裏で動き続ける」というリソースリークが原理的に起きない。

### 3-4. 並列度を制限したい時 ─ ThreadPool 的な使い方

「100万件を一気に並列実行するとAPIに迷惑」「DBコネクション枯渇」などの場合は**並列度の制限**が必要。

**LimitedParallelism.kt**

```kotlin
// (a) chunked で分割して逐次実行
val results = ids.chunked(10).flatMap { batch ->
    coroutineScope {
        batch.map { id -> async { fetchInventory(id) } }.awaitAll()
    }
}
// → 10件並列 × 10バッチを順次実行

// (b) Semaphore で同時実行数を制限
val semaphore = Semaphore(10)
val results = ids.map { id ->
    async {
        semaphore.withPermit { fetchInventory(id) }
    }
}.awaitAll()
```

### 3-5. ハンズオン演習 3-1

> **💡 演習: 並列化で高速化**
>
> Ch.2 演習で作った直列版を、async + awaitAll で並列化してください。
>
> - 所要時間が約500ms に短縮されることを確認(直列版は約2.5秒だった)
> - 応用: 100件の商品を fetch する場合の所要時間を、並列化で測定

### Ch.05 タイムアウト・リトライ・キャンセル⏱ 60分

業務システムで必須の防御策

### 4-1. withTimeout ─ 一定時間で打ち切り

「外部APIが3秒以内に返答しないなら諦める」は業務システムの基本。`withTimeout` で囲むだけ。

**Timeout.kt**

```kotlin
import kotlin.time.Duration.Companion.seconds

// (a) withTimeout: タイムアウト時に例外を投げる
try {
    val result = withTimeout(3.seconds) {
        slowApi.call()
    }
} catch (e: TimeoutCancellationException) {
    // タイムアウト発生
}

// (b) withTimeoutOrNull: タイムアウト時に null を返す
val result = withTimeoutOrNull(3.seconds) {
    slowApi.call()
}
if (result == null) {
    // タイムアウト
}
```

> **💡 使い分け**
>
> - `withTimeout`: タイムアウトを「異常」として扱いたい(エラーレスポンスを返す等)
> - `withTimeoutOrNull`: タイムアウトを「想定内」として扱いたい(キャッシュにフォールバック等)

> **ⓘ IntelliJ の黄色警告「Long型はDuration型に変換可能」 について**
>
> `delay(1000)`、 `withTimeout(3000)` のように **Long(ミリ秒) を渡す書き方**を使うと、 IntelliJ が次の黄色マークを出します:
>
> *「従来の Long 型オーバーロードは Duration 型に変換可能です」*
>
> これは**エラーではなく改善提案**で、 そのままでも動作します。 Kotlin 1.6 で `kotlin.time.Duration` が安定化したため、 `delay(1.seconds)` や `withTimeout(3.seconds)` のように <u>単位を明示する書き方が推奨</u>になりました。 本研修では Duration 版で統一しており、 警告は出ません。
>
> 書き換えると単位の取り違え(ミリ秒のつもりが秒だった、 等)も防げるので、 黄色警告が出たらクリックして「Replace 'milliseconds' with extension property」 のクイックフィックスを当てるのが楽です。

### 4-2. リトライパターン

外部APIの一時的な障害に対しては、リトライを実装することが多い。コルーチンを使うとシンプル。

**Retry.kt**

```kotlin
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.seconds

suspend fun <T> retry(
    times: Int = 3,
    initialDelay: Duration = 100.milliseconds,
    factor: Double = 2.0,
    block: suspend () -> T
): T {
    var currentDelay = initialDelay
    repeat(times - 1) { attempt ->
        try {
            return block()
        } catch (e: Exception) {
            log.warn("Attempt ${attempt + 1} failed: ${e.message}")
            delay(currentDelay)
            currentDelay = currentDelay * factor   // Duration の演算子オーバーロード
        }
    }
    return block()  // 最後の試行(例外はそのまま投げる)
}

// 使い方
val result = retry(times = 3) {
    externalApi.call()
}
// → 1回目失敗 → 100ms後リトライ → 失敗 → 200ms後リトライ → 失敗なら例外
```

> **⚠ リトライは慎重に**
>
> 無条件のリトライは**障害を悪化させる**ことがある。下記を必ず守ること:
>
> - リトライ対象を限定する(冪等な操作のみ、特定の例外のみ等)
> - 指数バックオフを使う(リトライ間隔を倍々に増やす)
> - 最大リトライ回数を設定
> - サーキットブレーカーパターン併用を検討

### 4-3. キャンセルの仕組み

コルーチンは**協調的キャンセル**を採用している。「キャンセル要求」が出たら、コルーチン側が**明示的にチェック**して中断する。

**Cancellation.kt**

```kotlin
val job = launch {
    repeat(100) { i ->
        delay(100)              // delay はキャンセル可能
        println("処理中... $i")
    }
}

delay(500)
job.cancel()                        // キャンセル要求
job.join()                          // 完全停止を待つ
// → 約5回出力で停止
```

#### キャンセルできない処理に注意

**UncancellableLoop.kt**

```kotlin
val job = launch {
    var i = 0
    while (i < 1_000_000_000) {     // CPU密集なループ
        i++
        // suspend ポイント(delay等) がないので、キャンセルチェックされない
    }
}
job.cancel()   // 効かない!

// 解決策: 定期的に suspend するか、isActive をチェック
val job2 = launch {
    var i = 0
    while (isActive && i < 1_000_000_000) {
        i++
    }
}
```

**📌 キャンセル可能な処理 / 不可能な処理**

| 処理                    | キャンセル可能?                   |
|-------------------------|-----------------------------------|
| `delay()`               | ✓ 可能                            |
| `withTimeout()`         | ✓ 可能                            |
| 他の suspend 関数(基本) | ✓ 可能                            |
| 純粋なCPU処理ループ     | ✗ 不可能(`isActive` チェック追加) |
| `Thread.sleep()`        | ✗ 不可能(`delay()` に置き換える)  |

### 4-4. ハンズオン演習 4-1

> **💡 演習: タイムアウト付き API 呼び出し**
>
> 1.  `slowApi(delay: Long): String` という suspend 関数を作る。引数で指定された ms だけ delay して固定文字列を返す。
> 2.  3秒のタイムアウト付きで `slowApi(2000)` と `slowApi(4000)` をそれぞれ呼ぶ。前者は成功、後者は `TimeoutCancellationException` になることを確認。
> 3.  リトライヘルパー `retry(3)` でラップして、ランダムに失敗する API でも最終的に成功することを確認(80%失敗するモック を使う)。

### Ch.06 構造化並行性 ─ CoroutineScope / Job / Dispatcher⏱ 60分

コルーチンを「親子関係」で管理する

### 5-1. 構造化並行性とは ─ CoroutineScopeが果たす5つの責務

コルーチンは**親子関係を持って階層的に管理**される。**CoroutineScope**(親)は単なる「実行範囲」ではなく、子コルーチンの**ライフサイクル管理者**として5つの責務を担います。

［図（テキスト抽出）：CoroutineScope (親) / 例: coroutineScope { ... } / supervisorScope { ... } / runBlocking { ... } / async (子) / fetchInventory() / async (子) / fetchCredit() / async (子) / fetchShipping() / launch (子) / logActivity() / launch (孫) / notifyAdmin() / CoroutineScopeの5つの責務 / ① 終了待ち / すべての子が / 終わるまで親も / 抜けない / → 待ち忘れゼロ / ② キャンセル伝搬 / 親がキャンセル / されたら子も孫も / 全部キャンセル / → リークなし / ③ 例外の伝搬 / 子の例外が / 親まで上がり / 兄弟もキャンセ …］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図5-1: CoroutineScopeが管理する5つの責務 ─ 子コルーチンの生死を統一的に扱う

### 5-2. 5つの責務を一つひとつ見る

#### 責務①: 終了待ち ─ 「待ち忘れ」が仕組みとして発生しない

JavaのExecutorServiceでは「submitした後、futureに get() するのを忘れる」「shutdown() し忘れる」がリソースリークの定番でした。`coroutineScope { ... }`では**全ての子コルーチンが完了するまで、scope自体が return しない**ので、待ち忘れが仕組み上 起きません。

**WaitAll.kt**

```kotlin
suspend fun placeOrder(): OrderResult = coroutineScope {
    val inv = async { invApi.check() }
    val cred = async { credApi.check() }
    // ↑ 2つの async を起動

    process(inv.await(), cred.await())
    // ↑ 両方の結果を待つ。仮にawaitを書き忘れても、
    //   coroutineScope は2つの子が終わるまで return しない
}
// ← この時点で必ず inv と cred は両方完了している
```

#### 責務②: キャンセル伝搬 ─ リソースリーク防止

親 scope が外側からキャンセルされると、**すべての子と孫が自動的にキャンセル**されます。Java の Thread / Future では「親が死んでも子が裏で動き続ける」リソースリークが頻発していましたが、コルーチンではあり得ません。

**CancelPropagation.kt**

```kotlin
val job = scope.launch {              // 親
    val child1 = launch { ... }      // 子1
    val child2 = async { ... }       // 子2
}

delay(100)
job.cancel()    // → child1も child2も自動的に停止する
```

#### 責務③: 例外の伝搬 ─ 失敗の即時検知

子の1つが例外を出すと、**その例外は親まで上がり、残りの兄弟もキャンセル**される。これにより「片方失敗、もう片方は無駄に動いてしまった」が起きません(無駄を許容したい場合は `supervisorScope` を使う ─ Ch.6 で扱う)。

#### 責務④: Dispatcher 管理 ─ 子は親のスレッド設定を継承

子コルーチンは明示しなければ**親の Dispatcher を引き継ぐ**。「親が IO スレッドで動いているなら、子も IO スレッドで動く」と統一されます。これでスレッドポリシーがコード全体で散らからない。Dispatcherの詳細は 5-5 で扱います。

#### 責務⑤: タイムアウト・キャンセル機構が組み合わせ可能

scope を `withTimeout` で囲むと、**その内側のすべての子コルーチンに時間制限が適用**される。子の数が増えても1か所変えるだけ。

**ScopeComposition.kt**

```kotlin
suspend fun fetchAll(): OrderInfo = withTimeout(3.seconds) {
    coroutineScope {
        val a = async { fetchA() }
        val b = async { fetchB() }
        val c = async { fetchC() }
        OrderInfo(a.await(), b.await(), c.await())
    }
}
// → 3秒以内に a, b, c すべてが完了しないと TimeoutCancellationException
//   タイムアウト時、未完了の子は自動的にキャンセルされる
```

> **✅ 構造化並行性の効能 ─ 「親」がすべて面倒を見てくれる**
>
> これらの5つの責務は、Java の `ExecutorService` / `CompletableFuture` では**各自で個別に書く必要**がありました。リソースリーク・例外伝搬漏れ・タイムアウト未適用などのバグの温床。Kotlin では「scope を作る」だけでこれらすべてが自動で適切に処理されます。

### 5-3. CoroutineScope と「協調的キャンセル」の関係

「責務②: キャンセル伝搬」を本当に効かせるには、**子コルーチン側が協調する**必要があります。これを**協調的キャンセル**と呼びます(Ch.4 でも触れた通り)。

イメージとしては、親が「もうやめていいよ」と札を立てるが、子は**定期的に札を確認して**初めて「あ、やめよう」と判断する仕組み。札の確認タイミング = `suspend` ポイント(`delay`, 他の suspend 関数呼び出し)です。

［図（テキスト抽出）：協調する子(キャンセル可能) / launch { repeat(100) { delay(100); 処理 } } ← delay(suspend) が札の確認タイミング / 協調しない子(キャンセル不能) / launch { while(true) { 重い計算 } } ← suspendポイントがない=札を見ない=止まらない / 対策: while(isActive) { ... } を使うか、定期的に yield() を呼ぶ / ⚠ Thread.sleep() はキャンセル不可。delay() に置き換える］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図5-2: 協調的キャンセル ─ 子コルーチンが「札を確認する」協調が必要

### 5-4. CoroutineScope の作り方 ─ 4パターン

| 作り方                            | 用途                                                           |
|-----------------------------------|----------------------------------------------------------------|
| `runBlocking { ... }`             | main / テスト用。スレッドをブロック                            |
| `coroutineScope { ... }`          | suspend 関数内で並列実行。子が終わるまで待つ                   |
| `CoroutineScope(...)` 作成        | 長生きするスコープ(Spring の Bean等)。明示的にキャンセルが必要 |
| `viewModelScope / lifecycleScope` | Android 用(ライフサイクルに紐付く)                             |

**ScopePatterns.kt**

```kotlin
// パターン1: suspend 関数の中で並列処理 ─ 最頻出
suspend fun fetchOrderInfo(orderId: Long): OrderInfo = coroutineScope {
    val order = async { fetchOrder(orderId) }
    val customer = async { fetchCustomer(order.await().customerId) }
    OrderInfo(order.await(), customer.await())
}

// パターン2: 長生きするバックグラウンド処理 (Spring Service の常駐スコープ)
class BackgroundService {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    fun start() {
        scope.launch {
            while (isActive) {
                pollExternalSystem()
                delay(5000)
            }
        }
    }

    fun shutdown() {
        scope.cancel()      // 必ず最後にキャンセル
    }
}
```

### 5-5. Job ─ コルーチンのライフサイクル

launch / async が返すのは `Job` または `Deferred`(Jobの子インターフェイス)。これでコルーチンの状態を見たり制御したりできる。

**JobLifecycle.kt**

```kotlin
val job = launch {
    // 何か処理
}

job.isActive         // 実行中か
job.isCompleted      // 完了したか
job.isCancelled      // キャンセルされたか

job.cancel()           // キャンセル要求
job.join()             // 完了を待つ
job.cancelAndJoin()    // キャンセルして完了を待つ(よく使う)
```

### 5-6. Dispatcher ─ どのスレッドで動かすか

Dispatcher は**「コルーチンをどのスレッドで実行するか」**を決める担当者です。これを理解するには、まず**「スレッド」と「スレッドプール」**の関係を押さえる必要があります。初学者の人もここで一度立ち止まって、概念から確認しましょう。

#### そもそもスレッドとは?

**スレッド**は「処理を順番に実行していく1本の作業ライン」のこと。プログラムは普通、1本のスレッド(=1本の作業ライン) で上から下へと順に処理を進めます。これを**シングルスレッド**と言います。

でも、たとえば「3つの外部APIに問い合わせる」場合、1本のスレッドだと「API1 を待つ → 返ってくる → API2 を待つ → 返ってくる → API3 を待つ」と直列にしか動けない。これを**並列にしたい**とき、複数のスレッドを使って同時に動かします。これが**マルチスレッド**。

［図（テキスト抽出）：シングルスレッド: 1本の作業ラインで順番に処理 ─ 全部直列 = 遅い / API1を待つ(1秒) / API2を待つ(1秒) / API3を待つ(1秒) / 所要時間: 合計3秒 / マルチスレッド: 3本の作業ラインで同時に処理 ─ 並列 = 速い / スレッドA: API1を待つ / スレッドB: API2を待つ / スレッドC: API3を待つ / 所要時間: 1秒(3本が同時並行)］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図5-3: シングルスレッド vs マルチスレッド ─ 作業ラインの本数で並列度が決まる

#### なぜスレッドプールが必要か ─ スレッドは作るのにコストがかかる

「並列にしたいなら、必要な分だけスレッドを作ればいいじゃない?」と思うかもしれませんが、スレッドの作成は**OSが管理する重い処理**(メモリ確保、OS内部のスケジューラへの登録など) で、1個作るのに数ミリ秒〜数十ミリ秒かかります。リクエストごとに毎回新しいスレッドを作っていると:

- スレッド作成のコスト自体が処理時間の大半を占める
- 同時に1000リクエスト来たら1000本のスレッドを作る → メモリが枯渇する
- スレッド数が増えすぎるとOSのスケジューラが疲弊して逆に遅くなる

そこで**あらかじめ何本かのスレッドを作っておいて、それを使い回す**仕組みが **スレッドプール** です。

#### 例え話: スレッドプール = 銀行の窓口チーム

銀行を想像してください。お客様(=処理タスク)は次々と来店しますが、行員(=スレッド)は限られた人数しかいません。すべてのお客様を捌くため、銀行は**あらかじめ決まった人数の行員チーム(=スレッドプール)**を準備しておきます。

お客様が来ると、空いている行員が対応します。全員が対応中なら、次のお客様は順番待ち。1人のお客様の対応が終わったら、その行員は次のお客様を取りに行く ─ という仕組み。

これと同じで、スレッドプールは**「事前に用意した複数のスレッドで、来た仕事を順次捌いていく」**仕組みです。

［図（テキスト抽出）：待ち行列(コルーチン一覧) / fetchInventory / fetchCredit / fetchShipping / processOrder / logActivity / …他多数 / Dispatcher / が割り振る / スレッドプール (行員チーム) / スレッド T1 / → fetchInventory 実行中 / スレッド T2 / → fetchCredit 実行中 / スレッド T3 / → fetchShipping 実行中 / スレッド T4 / → 空き(次の仕事を待機) / スレッド数を事前に決めておく(例: 64個) / 処理完了 / 完了結果 / 処理結果が / 呼び出し元へ / ※ スレッドが I/O待ち(API応答待ち) のとき、コルーチンはスレッドを離して別の仕事に譲る / → 64本のスレッドで何千・何万のコルーチンを処理できる(これが軽量 …］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図5-4: スレッドプールの仕組み ─ Dispatcher が「待ち行列のタスクを、空きスレッドに割り当てる」

#### Dispatcher = スレッドプールへの「振り分け係」

ここでようやく **Dispatcher** が登場します。Dispatcher は**「来たコルーチンを、どのスレッドプールに割り振るか」を決める司令塔**です。

Kotlin は**用途別に3つのスレッドプール**を最初から用意してくれていて、Dispatcher を指定することで「どのチームに任せるか」を選べます。

> **📌 用語整理**
>
> - **スレッド**: 処理を実行するOSの作業ライン。1本のスレッドは1本の作業ライン。
> - **スレッドプール**: あらかじめ用意した複数のスレッドの集まり。タスクが来たら空いているスレッドが拾って実行する。スレッドを毎回作るコストを回避できる。
> - **Dispatcher**: コルーチンを「どのスレッドプールに割り振るか」を決める司令塔。Kotlinが用意した3つのプール(Default / IO / Main) のいずれかを指定する。

#### Kotlin が用意している3つの主要 Dispatcher

3つのスレッドプールは**用途別に最適化**されています。「どんな処理に使うか」で選びます。

| Dispatcher               | 用途                                              | スレッド数         | 例え                                           |
|--------------------------|---------------------------------------------------|--------------------|------------------------------------------------|
| `Dispatchers.Default`    | CPU集約な計算(ソート、変換、暗号化、画像処理)     | CPUコア数          | 頭脳労働窓口(計算が早い行員)                   |
| `Dispatchers.IO`         | I/O待ち(DB、API、ファイル) ← 業務システムで最頻出 | 最大64〜(設定可能) | 受付窓口(待ち時間が長いタスクの受付係を多めに) |
| `Dispatchers.Main`       | UI更新(Android / デスクトップ)                    | 1(UIスレッド)      | 表向きの掲示板(更新できる人は1人だけ)          |
| `Dispatchers.Unconfined` | 特殊用途。実務ではあまり使わない                  | 不定               | (初学者は無視してOK)                           |

> **💡 なぜ IO だけスレッドが多めなのか?**
>
> I/O待ち(DBの応答待ち、外部APIの応答待ち) は、**スレッドが「待っているだけ」で何もしていない**時間が長い。そのため、CPUコア数より多くのスレッドを用意しても問題なく、むしろ並行処理数を稼げる。一方、CPU集約な計算はスレッドを増やしてもコア数より速くは動かないので、Defaultはコア数に絞る。

#### 使い方: withContext で切り替え

**Dispatcher.kt**

```kotlin
// withContext で Dispatcher を切り替え
suspend fun processOrder(id: Long): Result {
    val order = withContext(Dispatchers.IO) {
        orderRepo.findById(id)   // DB アクセス → IO Dispatcher
    }

    val total = withContext(Dispatchers.Default) {
        complexCalculation(order)    // 重い計算 → Default Dispatcher
    }

    return Result(order, total)
}
```

> **💡 業務システムでの基本姿勢**
>
> Spring Boot の suspend Controller は**デフォルトで適切な Dispatcher** が選ばれる。基本的に `Dispatchers.IO` や `Dispatchers.Default` を明示的に指定するのは:
>
> - 同期的なブロッキングAPI(JDBC、Java の InputStream など)を呼ぶ時 → `Dispatchers.IO`
> - 重い CPU 計算を行う時 → `Dispatchers.Default`
>
> R2DBC や WebClient のような non-blocking ライブラリを使っている場合は、Dispatcher を意識する必要はほぼない。

### 5-7. キャンセル伝搬の挙動と CancellationException

**CancelPropagation.kt**

```kotlin
val parent = launch {           // 親コルーチン
    val child1 = launch {        // 子1
        try {
            delay(5000)
        } catch (e: CancellationException) {
            println("child1 キャンセルされた")
            throw e   // 必ず再throwすること!
        }
    }
    val child2 = launch {        // 子2
        delay(5000)
    }
}

delay(100)
parent.cancel()                  // 親をキャンセル
// → child1 も child2 も自動キャンセル
```

> **🚨 CancellationException を握りつぶさない**
>
> `try-catch (e: Exception)` で広く例外を捕まえると、`CancellationException` も捕まえてしまい、**キャンセル機構が壊れる**。catch したら必ず `throw e` で再throwするか、最初から `catch (e: CancellationException)` を除外する。
>
> 具体的には `kotlin.coroutines.cancellation.CancellationException` を別途キャッチして throw する。

### Ch.07 例外処理 ─ try-catch / SupervisorJob⏱ 60分

コルーチン特有のハマりポイント

### 6-1. 通常の try-catch でだいたいOK

suspend 関数内では **普通の try-catch がそのまま使える**。これがコルーチンの大きな利点。

**TryCatch.kt**

```kotlin
suspend fun fetchOrFallback(id: Long): User {
    return try {
        userApi.fetch(id)
    } catch (e: ApiException) {
        userCache.get(id) ?: defaultUser
    }
}
```

### 6-2. async の例外は await() 時に投げられる

**AsyncException.kt**

```kotlin
val deferred = async {
    throw RuntimeException("oops")
}

try {
    deferred.await()      // ここで例外が再投げされる
} catch (e: RuntimeException) {
    println("caught")
}
```

> **⚠ ただし coroutineScope 内では別の動き**
>
> `coroutineScope { ... }` の中で async が例外を出すと、**await() を呼ぶ前に** scope全体が伝搬し、coroutineScope自体が例外を投げる(他の子も自動キャンセルされる)。「await() で catch するから大丈夫」と思っていると意図しない動きになることがある。

**CoroutineScopeException.kt**

```kotlin
suspend fun tryParallel(): String = coroutineScope {
    val a = async { throw RuntimeException("A失敗") }
    val b = async { delay(5000); "B成功" }

    try {
        "${a.await()} / ${b.await()}"
    } catch (e: Exception) {
        // このcatchには到達しない!
        // coroutineScope全体が即座に失敗し、b もキャンセルされる
        "caught"
    }
}
// → 関数自体が RuntimeException("A失敗") を投げる
```

### 6-3. SupervisorJob ─ 子の失敗を親に伝搬させない

「片方のAPIが失敗しても、もう片方の結果は使いたい」「ダッシュボードの一部が表示できなくても、他は表示したい」という時は `supervisorScope` を使う。

**SupervisorScope.kt**

```kotlin
suspend fun fetchDashboard(): Dashboard = supervisorScope {
    val sales = async {
        try {
            salesApi.today()
        } catch (e: Exception) {
            null   // 失敗しても null を返して継続
        }
    }
    val stock = async {
        try {
            stockApi.current()
        } catch (e: Exception) {
            null
        }
    }

    Dashboard(
        sales = sales.await(),
        stock = stock.await(),
    )
}
```

|               | coroutineScope         | supervisorScope                  |
|---------------|------------------------|----------------------------------|
| 1つの子が失敗 | 他の子も全部キャンセル | 他の子は影響なし                 |
| 失敗の伝搬    | 親まで伝搬             | 親に伝搬しない(各子で個別に処理) |
| 用途          | 「全部成功が必須」     | 「一部失敗を許容」               |

### 6-4. CoroutineExceptionHandler ─ 投げっぱなしの例外を捕まえる

`launch` で起動した「投げっぱなし」コルーチンの未捕捉例外を扱う仕組み。

**ExceptionHandler.kt**

```kotlin
val handler = CoroutineExceptionHandler { _, ex ->
    log.error("Uncaught exception", ex)
}

val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO + handler)

scope.launch {
    throw RuntimeException("oops")
    // → handler に渡される
}
```

**💡 各機構の使い分けまとめ**

| 状況                                    | 道具                                 |
|-----------------------------------------|--------------------------------------|
| 個別の suspend 関数で例外を扱いたい     | 普通の try-catch                     |
| 並列処理の1つが失敗したら全体を諦める   | coroutineScope + try-catch(外側)     |
| 並列処理の1つが失敗しても他は続けたい   | supervisorScope + 子ごとに try-catch |
| launch の投げっぱなし例外をログ取りたい | CoroutineExceptionHandler            |

### Ch.08 Flow ─ 非同期ストリーム⏱ 60分

「値が時間をかけて、整い切らずに届く」シーンの道具

### 8-0. Flow をいつ使うのか? ─ 「整っていないデータが順次届く」場面

これまでの Day 3 では「**呼んでから結果が1つ返ってくる**」非同期処理を扱ってきました(`suspend fun fetchUser(): User`)。並列化・タイムアウト・キャンセル等の制御も全部、**「処理が始まる → 結果1つが揃って戻ってくる」**というモデルでした。

しかし業務には**「値が時間をかけて、整い切らずに順次届く」**シーンがあります。これは1個の値が戻ってくるのではなく、**値が次から次へとやってくるストリーム**です。Flow はこの用途に特化した型です。

> **📌 Flow が必要になる具体的なシーン**
>
> - **センサー・IoT機器からの計測値**: 1秒ごとに温度値が届く ─ いつまで届くか分からない、止めるまで続く
> - **<a href="#glossary-websocket" style="color:var(--accent);text-decoration:underline">WebSocket / SSE (Server-Sent Events)</a> などのサーバープッシュ**: サーバーから不定期にメッセージが押し込まれる(チャット、株価通知、注文通知など)。**WebSocket** は双方向通信(クライアント↔サーバー双方が送信可)、**SSE** はサーバー → クライアントの一方向通信専用で、HTTP接続を維持したまま継続的にイベントを受信する仕組み(<a href="#glossary-websocket" style="color:var(--accent);text-decoration:underline">→ 巻末 A-6 で詳細比較</a>)
> - **ファイル/ログの逐次読み取り**: 1GBのログファイルを行ごとに処理(全部メモリに読むとOOM)
> - **DBの大量レコード ストリーム取得**: 100万件のレコードを 1件ずつ受け取って集計(全部 List にすると OOM)
> - **定期ポーリングの結果**: 5秒おきに在庫数を取得して画面更新
> - **ユーザーの入力イベント**: 検索ボックスでタイピングするたびに候補を検索(`debounce` 等と組み合わせる)

#### List とは何が違うか ─ 「全部揃ってから」vs「届き次第」

もし「センサーの計測値を 10 分間集めて、その平均を出す」という処理を考えると:

| アプローチ                     | List で書く場合                               | Flow で書く場合                                 |
|--------------------------------|-----------------------------------------------|-------------------------------------------------|
| 処理開始タイミング             | 10 分間データを集めて、揃ったら一気に平均計算 | 1件届くたびに累積に足していく(リアルタイム集計) |
| メモリ使用量                   | 10 分間分の全データを保持                     | 累積値だけ保持(全データは保持しない)            |
| 結果が出るタイミング           | 10 分後                                       | 1件目から逐次更新可能                           |
| 「いつ終わるか分からない」入力 | 扱えない(揃わない)                            | 扱える(届くたびに処理)                          |

> **💡 ざっくり言うと**
>
> **List = 「全部揃った後の処理」** ─ DBに既にあるデータを集計する、画面に既にある選択肢を絞り込む、など。
>
> **Flow = 「整い切らずに届くデータの処理」** ─ センサー値が今もどんどん届いている、ログが今も書き込まれ続けている、など。
>
> 業務システムだと List で書く処理の方が圧倒的に多い。Flow が活きるのは**リアルタイム性が必要**か**データ量が膨大すぎて一括 List にできない**かのどちらかです。

### 8-1. Flow とは

Day 2 で学んだ `List<T>` は「**すべての値を即座に手に入れて**、まとめて処理する」ためのもの。一方 `Flow<T>` は「**値を時間をかけて1つずつ受け取る**」ためのもの。具体例で比べると違いが見えます。

［図（テキスト抽出）：List\<Int\> ─ 全ての値を一度に / \[1, 2, 3, 4, 5\] ← 全部一度にメモリに載っている / 処理時系列: / 取得 / List全体を処理(map/filter等) / 例: 既にDBから取得済みの注文1万件を集計する / Flow\<Int\> ─ 値を時間差で1つずつ / 1 / 2 / 3 / 4 / …続く / 処理時系列: / 1受信 / 2受信 / 3受信 / … / 例: センサーから1秒ごとに送られてくる温度データを順次集計 / 違いのポイント / • List: すべての値が手元にある状態。コレクション全体を一度に変換・集計 / • Flow: 値が時間をかけて到着する。届くたびに処理(また待つ)を繰り返す / • 操作APIは同じ感覚(map/filter/take/fold)が使える ─ Day 2の知識がそのまま活きる］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図8-1: List と Flow の違い ─ 「全部一度に」vs「時間差で1つずつ」

**📌 単一値 / 複数値 × 同期 / 非同期 のマトリクス**

Kotlin の「値を返す方法」を整理すると、こうなります。

<table class="styled-table" style="margin-top:6px">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr class="header">
<th></th>
<th>同期(値はその場で揃う)</th>
<th>非同期(値は時間をかけて届く)</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>単一の値</strong></td>
<td><code>T</code> (普通の戻り値)<br />
<code>fun fetchUser(): User</code></td>
<td><code>suspend fun(): T</code><br />
<code>suspend fun fetchUser(): User</code></td>
</tr>
<tr class="even">
<td><strong>複数の値</strong></td>
<td><code>List&lt;T&gt;</code><br />
<code>fun all(): List&lt;Order&gt;</code></td>
<td><code>Flow&lt;T&gt;</code><br />
<code>fun stream(): Flow&lt;Order&gt;</code></td>
</tr>
</tbody>
</table>

Flow が必要になる場面は**「値がいつ何個届くか分からない」「届くたびに処理したい」**状況。下記が典型例です。

#### 業務でFlowを使う典型シーン

- **DBの大量レコードを少しずつ流す**: 100万件の注文を `List` で一括取得するとメモリ枯渇 → Flowで1件ずつストリーミング処理
- **WebSocket / SSE などのプッシュ通知受信**: 送られてくる順に処理
- **ファイル/ログの行単位読み込み**: ファイル全体ではなく1行ずつ処理
- **センサー・IoT機器からの計測値**: 一定間隔で送られてくる値を時系列で処理
- **定期的なポーリング結果**: 5秒ごとに在庫状況を取得して画面に反映

### 8-2. Flow の基本

**FlowBasic.kt**

```kotlin
// Flow を作る
fun numbers(): Flow<Int> = flow {
    for (i in 1..5) {
        delay(100)     // 各値の間に時間がかかる
        emit(i)         // 値を流す
    }
}

// Flow を受け取る
fun main() = runBlocking {
    numbers().collect { value ->
        println("受信: $value")
    }
}
// 出力(各100ms間隔):
// 受信: 1
// 受信: 2
// 受信: 3
// 受信: 4
// 受信: 5
```

### 8-3. Flow の演算子 ─ Day 2 で学んだ List 操作と同じ感覚で使える

Day 2 で学んだ `map / filter / take / fold` などの操作 API が、**Flow にもそのまま揃っています**。コードレベルで見ると、List 用のコードと Flow 用のコードはほぼ書き換え不要 ─ これが Flow の最大の良さです。

#### 具体例: 同じ業務処理を List と Flow で書き比べる

「センサーから届いた測定値のうち、異常値(100超え) を Alert に変換し、最初の10件を取得する」という処理を、(a) Day 2 で学んだ List 操作 と (b) Flow 操作 の両方で書いてみます。

\(a\) Day 2 のスタイル: List 操作

**ListVersion.kt**

```kotlin
// 既にDBや配列から取得済みの大量データ
val readings: List<Reading> = loadAllReadings()

val alerts: List<Alert> = readings
    .filter { it.value > 100 }       // 異常値だけ
    .map { Alert(it.deviceId, it.value) }
    .take(10)                       // 最初の10件

alerts.forEach { sendNotification(it) }
```

\(b\) Day 3 のスタイル: Flow 操作

**FlowVersion.kt**

```kotlin
// センサーから時間差で届く測定値ストリーム
val readings: Flow<Reading> = sensorReadings()

readings
    .filter { it.value > 100 }       // 異常値だけ
    .map { Alert(it.deviceId, it.value) }
    .take(10)                       // 最初の10件
    .collect { sendNotification(it) }   // 1件届くたびに通知
```

> **✅ 違いはたった2か所**
>
> 1.  **入力の型**: `List<Reading>` ↔ `Flow<Reading>` ─ 「全部一度に」か「時間差で1つずつ」かが違うだけ
> 2.  **終端操作**: `forEach { ... }` ↔ `collect { ... }` ─ 「ループで全件処理」か「届くたびに処理」かが違うだけ
>
> 真ん中の `filter` → `map` → `take` は**完全に同じコード**。これが「Flow は非同期版の List」と言われる理由です。

#### Day 2 演算子 vs Flow 演算子 ─ 対応表

| 用途           | Day 2 で学んだ List 用    | Day 3 の Flow 用                           | 違い                                         |
|----------------|---------------------------|--------------------------------------------|----------------------------------------------|
| 各要素を変換   | `list.map { ... }`        | `flow.map { ... }`                         | 名前も書き方も同じ                           |
| 条件で絞り込み | `list.filter { ... }`     | `flow.filter { ... }`                      | 同じ                                         |
| 先頭n件取得    | `list.take(n)`            | `flow.take(n)`                             | 同じ                                         |
| 集計           | `list.fold(init) { ... }` | `flow.fold(init) { ... }`                  | Flow版はsuspend関数                          |
| 合計           | `list.sumOf { ... }`      | `flow.fold(0) { acc, x -> acc + x.value }` | Flow版は sumOf がないので fold で代用        |
| 各要素を処理   | `list.forEach { ... }`    | `flow.collect { ... }`                     | 名前が違うだけ。意味は「全要素を処理」で同じ |
| List化         | (既にList)                | `flow.toList()`                            | Flowを溜め込んでListに変換                   |

> **💡 学習が積み上がる ─ Day 2 の知識がほぼそのまま活きる**
>
> Day 2 でコレクション操作のチェーンに慣れていれば、Flow も**「型が `Flow<T>` になっただけのコレクション」**として扱える。新たに覚えるのは「`.collect` で終わらせる」「途中の `fold/sum` は suspend」くらい。これが Kotlin の**学習の積み上がりやすさ**。

#### もう一つの例: 業務ロジックの書き換え

Day 2 で書いたかもしれない「顧客ごとの購入額合計 TOP3」を、リアルタイムストリームに変えるとどうなるかを見てみます。

List版: バッチ集計(Day 2 想定)

**BatchAggregation.kt**

```kotlin
val orders: List<Order> = loadAllOrders()

val top3 = orders
    .filter { it.amount >= 1000 }
    .groupBy { it.customerId }
    .mapValues { (_, list) -> list.sumOf { it.amount } }
    .entries
    .sortedByDescending { it.value }
    .take(3)
```

Flow版: 100件溜まったら集計

**StreamAggregation.kt**

```kotlin
val orders: Flow<Order> = orderStream()

orders
    .filter { it.amount >= 1000 }
    .take(100)                // 100件たまるまで
    .toList()                  // ここで List に変換
    .groupBy { it.customerId } // 以降はDay 2のList操作
    .mapValues { (_, list) -> list.sumOf { it.amount } }
    .entries
    .sortedByDescending { it.value }
    .take(3)
```

> **📌 ハイブリッド ─ Flow と List を行き来できる**
>
> 業務では「ストリームで受け取って、あるところでまとめて集計したい」というシーンが多い。`flow.toList()` で一度 List に確定させてしまえば、その後は **Day 2 で学んだ List 操作がそのまま使えます**。「いつ Flow を List にするか」だけ意識すれば、操作のクセは2つ覚える必要はありません。

### 8-4. cold flow と hot flow ─ 「水道」と「放送局」の違い

Flow には2種類あり、性質がはっきり違います。先に概念をアナロジーで掴むと混乱しません。

> **📌 例え話 ─ 水道 と 放送局**
>
> **cold flow = 水道の蛇口**
>
> 蛇口は普段は閉まっていて、誰かが捻った(=collectした) 瞬間に初めて水が流れます。**蛇口ごとに別々の水源**から水が出る(2つの蛇口を捻れば、それぞれ独立に水を流す)。誰も捻らなければ、水は1滴も流れません。
>
> **hot flow = ラジオ放送局**
>
> 放送局は**常に番組を流し続けている**。ラジオの電源を入れた(=collectし始めた)瞬間から、その時放送されている番組が聞こえます。**複数の人が同じ放送を共有**して聞く。電源を入れる前の番組は聞き逃します。

［図（テキスト抽出）：cold flow(蛇口) ─ collectされるたびに別々の水源 / cold Flow / collector A / 1,2,3,4,5... / cold Flow / collector B / 1,2,3,4,5... / ⇒ A と B は別の Flow インスタンスを持ち、それぞれ独立に値を受け取る / ⇒ 誰も collect しなければ何も起きない(蛇口を捻る人がいないと水は出ない) / hot flow(放送局) ─ 1つの値を全員で共有 / hot Flow / (常時動作中) / …→5→6→7→… / collector A / collector B / collector C / ⇒ 1つの Flow を A・B・C で共有、同じ値を同時に受け取る / ⇒ collect 開始前の値は受け取れない / 用途のイメージ / cold: 1回限りの処理 ─ 「 …］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図8-2: cold flow と hot flow の挙動の違い

#### 具体例で違いを実感する

cold Flow の例

**ColdFlow.kt**

```kotlin
fun orders(): Flow<Order> = flow {
    // collect された時に毎回 DB アクセス
    orderRepo.findAll().forEach { emit(it) }
}

// 使う側
orders().collect { println(it) }   // 1回目: DB取得→流れる
orders().collect { println(it) }   // 2回目: もう一度DB取得→流れる
// → 別々の処理(別の蛇口を捻った形)
```

hot Flow (StateFlow) の例

**HotFlow.kt**

```kotlin
class InventoryService {
    // 現在の在庫数を保持する
    private val _stock = MutableStateFlow(100)
    val stock: StateFlow<Int> = _stock

    fun consume(qty: Int) { _stock.value -= qty }
}

// 使う側 ─ 複数の画面で同じ stock を購読
service.stock.collect { updateScreenA(it) }
service.stock.collect { updateScreenB(it) }
// → 在庫変動時に両画面が同じ値で更新される
```

| 観点           | cold flow                                | hot flow (StateFlow / SharedFlow)               |
|----------------|------------------------------------------|-------------------------------------------------|
| イメージ       | 蛇口(捻ると水が出る)                     | 放送局(常に番組が流れている)                    |
| 動作           | collect された時に毎回ゼロから流す       | 常に最新値を保持、複数の購読者で共有            |
| 購読者ごとの値 | 各購読者ごとに独立(別インスタンス)       | 全員が同じ値を共有                              |
| collect 前の値 | (関係なし)                               | 受け取れない(放送中の番組のみ)                  |
| 用途           | 1回限りの値取得(DBクエリ、API、ファイル) | 状態の共有(UI状態、設定値、リアルタイム通知)    |
| 典型例         | `flow { ... }`                           | `MutableStateFlow(...)` / `MutableSharedFlow()` |

> **💡 Day 3 では cold flow が分かれば十分**
>
> StateFlow / SharedFlow は**状態管理**のための高度な機能で、Day 5(Spring Boot 高度) や、Vue 3 とのリアルタイム連携で本格的に扱います。Day 3 では「`flow { emit(...) }` で値を流して、`collect` で受け取る」cold flow の基本だけ押さえれば十分です。

### 8-5. ハンズオン演習 8-1

> **💡 演習: 注文のリアルタイム集計**
>
> 1.  1秒ごとにランダムな金額の注文を発行する `fun orderStream(): Flow<Int>` を作る
> 2.  そのうち 500円以上のものだけ抽出し、5件ぶんの合計を返す
> 3.  `map / filter / take / fold` を組み合わせて1つのチェーンで書く

### Ch.09 Spring Boot との連携 ─ 予告編⏱ 15分

明日 Day 4 で本格的に扱う ─ コルーチンの実用先を雰囲気だけ把握

### 9-1. Day 3 のコルーチン技術は Day 4 でこう活きる

Day 3 で学んだ `suspend / async / await / withTimeout / coroutineScope` は、Day 4 で書く Spring Boot の Controller・Service の中で**普通に使える**ようになっています。Spring Boot 3 + Spring MVC は `suspend fun` をネイティブに理解するからです。

**OrderController.kt(Day 4 で詳しく扱います)**

```kotlin
@RestController
class OrderController(
    private val orderService: OrderService,
) {
    @GetMapping("/orders/{id}")
    suspend fun getOrder(@PathVariable id: Long): OrderInfo =
        orderService.fetchInfo(id)   // suspend 関数をそのまま呼べる
}
```

> **✅ Spring Boot 3 + Kotlin が実現する世界(Day 4 で実感)**
>
> - Controller のメソッドを `suspend fun` で書ける
> - 並列API呼び出し(`async + awaitAll`) が Service の中で普通に書ける
> - `withTimeout`、try-catch、`supervisorScope` がそのまま使える
> - クライアントが接続を切ったら自動でコルーチンがキャンセル(キャンセル伝搬)

> **💡 詳細は Day 4 へ**
>
> Day 4 Ch.2 で**suspend Controller の書き方・WebFlux との比較・JPA との連携注意点(Dispatcher切り替え)**を本格的に扱います。Day 3 はここまで。本日学んだコルーチンの道具が、明日からの実装で具体的にどう活きるかを楽しみにしておいてください。

### Ch.10 総合演習: 在庫システムの並列処理⏱ 15分

本日学んだ機能をすべて使う

### 9-1. 演習課題: 注文受付サービス

顧客からの注文を受け取り、3つの外部APIに並列で問い合わせて結果を返す`OrderOrchestrator`を実装してください。

**OrderOrchestrator.kt**

```kotlin
data class OrderRequest(val customerId: Long, val productId: Long, val qty: Int)

sealed class OrderResponse {
    data class Success(val orderId: Long, val deliveryDate: LocalDate) : OrderResponse()
    data class PartiallyAvailable(val reason: String, val alternative: String?) : OrderResponse()
    object SystemError : OrderResponse()
    object Timeout : OrderResponse()
}

class OrderOrchestrator(
    private val inventoryApi: InventoryApi,
    private val creditApi: CreditApi,
    private val shippingApi: ShippingApi,
) {
    suspend fun placeOrder(req: OrderRequest): OrderResponse {
        // 要件:
        // 1. 3つのAPIを並列で呼ぶ(in:在庫確認 / cred:与信確認 / ship:配送可否)
        // 2. 全体のタイムアウトは3秒
        // 3. inventoryApi が失敗したらすぐ PartiallyAvailable を返す(他もキャンセル)
        // 4. creditApi の失敗は3回まで自動リトライ(指数バックオフ)
        // 5. shippingApi が失敗してもOK(=配送日推定を null にして処理続行)
        // 6. 全成功なら Success を返す
        TODO()
    }
}
```

> **📌 設計のヒント**
>
> - 全体を `withTimeout(3.seconds) { ... }` で囲む
> - 外側は `coroutineScope`(in失敗で全キャンセルしたい)
> - credit のリトライは `retry()` ヘルパー
> - shipping の「失敗OK」は try-catch + `null` fallback
> - `TimeoutCancellationException` を catch して `OrderResponse.Timeout` を返す
> - その他の例外で `OrderResponse.SystemError`

### Ch.11 Git: 本日の成果を commit & push⏱ 15分

Day 3 を終える

### 10-1. Day 3 のまとめ

> **✓ 本日身につけたこと**
>
> - コルーチンが必要な理由 ─ Java の非同期処理の課題
> - suspend 関数 / launch / runBlocking の基本
> - async + awaitAll による並列API呼び出し(実務最頻出)
> - withTimeout / withTimeoutOrNull によるタイムアウト
> - リトライパターン(指数バックオフ)
> - キャンセル機構と協調的キャンセル
> - 構造化並行性(CoroutineScope / Job / Dispatcher)
> - 例外処理(try-catch / supervisorScope / CoroutineExceptionHandler)
> - Flow の基本 ─ 非同期ストリーム
> - Spring Boot との連携(suspend Controller)

> **📅 Day 4 に向けて**
>
> 明日からはいよいよ Spring Boot 3 × Kotlin の実装に入ります。Day 4 では Controller / Service / Repository のレイヤー設計、JPA Entity を Kotlin で書く時の注意点、Validation、エラーハンドリング基礎 を扱います。本日学んだコルーチンは Day 4 の Controller で日常的に使います。

## DAY 4 ─ Spring Boot × Kotlin 基礎

Day 1〜3 で学んだ Kotlin の力を、Spring Boot 3 の世界に持ち込む日。Controller / Service / Repository のレイヤー設計、JPA Entity を Kotlin で書く流儀、Validation、エラーハンドリング ─ サーバーサイドKotlin の標準的な書き方を一通り押さえる。

合計 9時間 前提: Day 1〜3 修了 / Spring Boot の基礎(別研修済) 到達点: 業務 REST API を Kotlin らしく書ける

### Ch.00 本日の目標と進め方⏱ 5分

Day 4 を終えた時に、何ができるようになっていれば良いか

### 0-1. 本日のゴール

- **build.gradle.kts** を読み解いて、依存性の追加・更新ができる
- Spring Boot の **Controller / Service / Repository** をKotlinらしく書ける
- **suspend Controller** で並列API呼び出しを実装できる(Day 3 の応用)
- JPA Entity を Kotlin で書く時の**data class罠**を理解し、回避できる
- **Validation**(@Valid、独自バリデータ) を実装できる
- **@RestControllerAdvice** で業務例外を集中ハンドリングできる

### 0-2. Day 1〜3 の活用ポイント

| これまでに学んだこと         | Day 4 でこう活きる               |
|------------------------------|----------------------------------|
| data class / Null安全(Day 1) | DTO・リクエスト/レスポンスモデル |
| 拡張関数(Day 1)              | Entity ↔ DTO の変換関数          |
| 関数型・コレクション(Day 2)  | Service 内の集計ロジック         |
| sealed class(Day 2)          | 業務エラーの型表現               |
| コルーチン(Day 3)            | suspend Controller、並列処理     |

**⚠ 本日の作業開始前に ─ 起動チェック**

**Day 4 から DB と Spring Boot が必須**になります。Ch.01-0 で開発環境の全体像と起動順序を詳しく扱いますが、ここでは「最低限これが起動していれば作業できる」状態だけ整えます。

| 必要なもの                          | 状態                   | 確認方法                                                            |
|-------------------------------------|------------------------|---------------------------------------------------------------------|
| IntelliJ / JDK / Git                | 引き続き起動済み       | ─                                                                   |
| **Docker Desktop**                  | 起動済み               | タスクトレイのクジラアイコンが緑色                                  |
| **PostgreSQL(:5432)**               | 起動済み               | `docker compose ps` で `training-postgres` が Up                    |
| **仕入先APIモック 3社(:9001-9003)** | 起動済み               | 同上(`supplier-mock-a/b/c` が Up)                                   |
| **Spring Boot(:8080)**              | 本日中に起動           | Ch.05 以降で IntelliJ から起動 → `http://localhost:8080/api/health` |
| Vue                                 | 本日は不要(Day 6 以降) | ─                                                                   |

**本日の起動コマンド**

    # 1. Docker(DB + モックAPI 3社、合計4コンテナ)を起動
    $ cd C:\work\kotlin-training\infra
    $ docker compose up -d

    # 2. 状態確認
    $ docker compose ps
    → training-postgres / supplier-mock-a / supplier-mock-b / supplier-mock-c が全て STATUS=Up

    # 3. DB の接続確認(A5:SQL Mk-2 から)
    → localhost:5432 / training / training_user / training_pass で接続できれば OK

Spring Boot 自体の起動は Ch.05 以降で行います。本章 Ch.01-0 で「**1-0. 開発環境の全体像**」 で起動順序とホットリロードの仕組みを詳しく説明します。

### Ch.01 プロジェクト構成と build.gradle.kts⏱ 45分

Gradle Kotlin DSL で書かれたビルド設定を読み解く

> **ⓘ Day 4 以降のファイル配置について(よくある疑問)**
>
> 受講者から「ZIP に `day4/` ディレクトリが無いのは正しい?」 という質問をよくいただきます。 **これは意図通り**です。
>
> - **Day 1〜3**: 学習順を分かりやすくするため、 ZIP に `day1/_01_basics/`、 `day2/_04_dsl/` のような <u>章番号付きディレクトリ</u>を用意していました。 各章の Kotlin 言語機能を1ファイルにまとめて Run できる形です。
> - **Day 4〜**: Spring Boot のレイヤー設計を学ぶため、 章番号ではなく **`controller/`、 `service/`、 `repository/`、 `domain/`、 `exception/` のレイヤー別ディレクトリ**に直接ファイルを配置します。 ZIP にこれらの空ディレクトリが既に用意されているので、 そこに本日書くファイルを置いていきます。
>
> つまり「`day4/`」 という名前のディレクトリは ZIP に存在しません。 これは **「どのレイヤーに何を置くか」 自体が Day 4 の学習対象**だからです。 配置先は本章 §1 のディレクトリツリーで明示します。

**⚠ スケルトン と solutions/ の関係 ─ コピペ元ではない**

「`solutions/day4/` のファイル数や階層と、 `backend/` 配下のスケルトンが違う」 と感じたら、 それは正常です。 両者は<u>別の目的を持つ別物</u>です。

| 項目           | スケルトン(`backend/`)                        | solutions(`solutions/day4/`)                      |
|----------------|-----------------------------------------------|---------------------------------------------------|
| **役割**       | 受講者が<u>ここに書き足す</u>                 | 完成例を<u>読む</u>ための参照(コピペ元ではない)   |
| **パッケージ** | `com.example.training.controller` 等          | 受講者と同じ `com.example.training.controller` 等 |
| **初期状態**   | controller/, service/, ... が空(Day 4 開始時) | Day 4 完成版が全部入り                            |
| **ファイル数** | 受講者が書いた分だけ増える                    | 完成版なのでテキスト指示より多い場合も            |

**正しい使い方**:

1.  テキストのコードブロックを<u>スケルトン側</u>(`backend/.../controller/ProductController.kt`)に書く
2.  詰まったら `solutions/day4/` を<u>読む</u>
3.  solutions の各ファイルは受講者と**同じパッケージ**(`com.example.training.controller`、 `com.example.training.service`、 等) で書かれているので、 必要であればコピペも可能(ただし「自分で書いてから参照」 を強く推奨)
4.  **コピーする場合の配置先**: 各解答ファイルの<u>冒頭コメント</u>に「コピー先: backend/src/...」 のパスを記載しています。 一覧は `solutions/README.md` の「解答ファイルの配置先」 表を参照。 特に**テストファイル(`...Test.kt`)は `src/test/` 配下**(`src/main/` ではない) なので注意。 以前に置いた古いファイルが残っていると過去の不具合が再発するため、 必ず<u>上書き</u>してください

**なぜ solutions のディレクトリは day4/ day5/ day7/ で分かれているのか**: ファイル管理の都合上、 各 Day までの到達点をスナップショットとして残しています(Day 4 用 / Day 5 で機能追加した版 / Day 7 で完成した版)。 ディレクトリ名は便宜上の分類で、 中のファイルはどれも受講者と同じ `com.example.training.xxx` パッケージで書かれています。 Day 4 で詰まった時は `solutions/day4/` を、 Day 5 で詰まった時は `solutions/day5/` を、 と<u>その Day の到達点</u>を参照するのが想定です。

### 1-0. 開発環境の全体像 ─ どこで何が動いて、どう繋がるか

Day 4 から Spring Boot を本格的に起動します。その前に、**開発中のシステム全体がどこでどう動いているか**を整理しておきましょう。これを理解しないと「コード書き換えても画面が変わらない」「Docker は何のために起動しているのか」と混乱します。

［図（テキスト抽出）：開発環境の全体像 ─ 受講者PC上で何が動いているか / 🖥 受講者PC(Windowsホスト) ─ ここから起動する3つのプロセス / ① ブラウザ / Chrome / Edge / localhost:5173 を開く / 受講者が触る画面 / ② Vue 開発サーバ(npm run dev) / ホスト直接実行(Node.js 22) / ポート 5173 / Vite HMR で .vue 保存 → / 画面が自動更新 / /api/\* は :8080 にproxy / ③ Spring Boot / (bootRun / IntelliJ Run) / ホスト直接実行(JDK 21) / ポート 8080 / DevTools で .kt 保存 → / 自動再起動(数秒) / HTTP / proxy / /api/\* / 📝 IntelliJ IDEA(Spring Boot …］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図1-0: 開発環境の全体像 ─ アプリ本体はホスト直接実行、外部依存(DB・モックAPI) だけ Docker で起動

#### ホットリロードの仕組み ─ コード保存だけで動作確認できる

研修中に「.kt や .vue ファイルを書き換えるたびに、毎回サーバを止めて起動し直す」のは時間の無駄です。本研修の構成では、**ファイル保存だけで自動的に再起動・更新**される仕組みが入っています。

| 対象                                      | 仕組み                                        | 速度                                              | 有効化方法                                                                                                     |
|-------------------------------------------|-----------------------------------------------|---------------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| **Vue(.vue, .ts, .css)**                  | Vite の HMR(Hot Module Replacement)           | **瞬時(1秒未満)**、画面の状態を保ったまま部分更新 | 標準で有効、追加設定不要                                                                                       |
| **Spring Boot(.kt)**                      | `spring-boot-devtools`(クラスパス監視+再起動) | 2〜5秒で完全再起動、JVM プロセスは生きたまま      | build.gradle.kts に `developmentOnly("spring-boot-devtools")` 追加済み。IntelliJ で「Auto-make」を有効化(後述) |
| **application.yml / messages.properties** | DevTools が同様に再起動                       | 同上 2〜5秒                                       | 同上                                                                                                           |
| **build.gradle.kts(依存追加など)**        | Gradle Sync が必要                            | 10〜30秒                                          | IntelliJ が「Load Gradle Changes」ボタンを表示するのでクリック                                                 |

> **💡 IntelliJ で Spring Boot DevTools を有効化する手順(初回1回だけ)**
>
> DevTools は「クラスファイルが更新されたら再起動」する仕組み。ただし IntelliJ はデフォルトで保存時にコンパイル(ビルド) しないので、以下を有効化します:
>
> 1.  `File → Settings → Build, Execution, Deployment → Compiler`
> 2.  「**Build project automatically**」をチェック
> 3.  `Settings → Advanced Settings` で「**Allow auto-make to start even if developed application is currently running**」をチェック
> 4.  これで `.kt` ファイルを保存(Ctrl+S) → IntelliJ が自動コンパイル → DevTools が変更検知 → Spring Boot が自動再起動
>
> 手動で再起動したい場合は、IntelliJ の `Ctrl+F9`(Build Project)でも DevTools がトリガーされます。

#### 3つのプロセスの起動順序(毎日の作業フロー)

研修中は、毎朝(または再起動が必要になった時)以下の順番で起動します:

<table class="styled-table">
<colgroup>
<col style="width: 25%" />
<col style="width: 25%" />
<col style="width: 25%" />
<col style="width: 25%" />
</colgroup>
<thead>
<tr class="header">
<th>順</th>
<th>何を起動するか</th>
<th>コマンド / 操作</th>
<th>起動確認</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>1</td>
<td>Docker(DB + モックAPI)</td>
<td><code>cd kotlin-training/infra</code><br />
<code>docker compose up -d</code></td>
<td><code>docker compose ps</code> で 4 コンテナが Up</td>
</tr>
<tr class="even">
<td>2</td>
<td>Spring Boot(バックエンド)</td>
<td>IntelliJ で TrainingApplication.kt を Run<br />
または <code>cd backend; gradlew bootRun</code></td>
<td>http://localhost:8080/api/health で {"status":"UP"}</td>
</tr>
<tr class="odd">
<td>3</td>
<td>Vue(フロントエンド)</td>
<td><code>cd frontend</code><br />
<code>npm run dev</code></td>
<td>http://localhost:5173 で画面表示</td>
</tr>
</tbody>
</table>

1回起動すれば、あとはコードを保存するだけで①②③ が自動で同期します。明示的に停止するまで各プロセスは生き続けます。

> **⚠ よくある混乱と対処**
>
> - **「画面が変わらない」** → Vue の HMR は画面の状態保持を優先するため、構造変更時はブラウザを<u>手動リロード(F5)</u>すると確実
> - **「Spring Boot が再起動されない」** → IntelliJ で「Build project automatically」が有効か確認、または `Ctrl+F9` で手動ビルドトリガー
> - **「DBの内容が想定と違う」** → Docker の永続ボリュームが残っている。`docker compose down -v && docker compose up -d` で初期化からやり直し
> - **「ポート 5432/8080/5173 が使われている」** → 既存プロセスを kill するか、別ポートに変更
> - **「IntelliJで自動ビルドが動かない」** → 上記の「Allow auto-make to start...」 を確認

### 1-1. ディレクトリ構成

Spring Boot + Kotlin の典型的なプロジェクト構成:

**プロジェクトディレクトリ(ZIPの backend/ ─ Day 1 以降ずっと使う)**

    backend/
    ├── build.gradle.kts           # ← ビルド設定(Kotlin DSL)
    ├── settings.gradle.kts
    ├── gradle/
    ├── gradlew                    # ← Gradle Wrapper(IntelliJで自動生成)
    ├── src/
    │   ├── main/
    │   │   ├── kotlin/
    │   │   │   └── com/example/training/
    │   │   │       ├── TrainingApplication.kt    # ← エントリポイント
    │   │   │       ├── controller/           # ← Controller層(本日追加)
    │   │   │       ├── service/              # ← Service層(本日追加)
    │   │   │       ├── repository/           # ← Repository(本日追加)
    │   │   │       ├── domain/               # ← ドメインモデル(本日追加)
    │   │   │       │   └── dto/              # ← DTO(Request/Response、 §2-2 で学ぶ)
    │   │   │       ├── exception/            # ← 例外+ControllerAdvice(本日追加)
    │   │   │       ├── config/               # ← 設定クラス(Day 5 で SecurityConfig)
    │   │   │       ├── day1/  day2/  day3/   # ← Day 1〜3 の言語演習(既存)
    │   │   └── resources/
    │   │       ├── application.yml
    │   │       └── messages.properties       # ← エラーメッセージ定義
    │   └── test/
    │       └── kotlin/com/example/training/  # ← テストコード(本日以降追加)

> **📌 Kotlin のソースは src/main/kotlin/ 配下**
>
> Java の場合は `src/main/java` だが、Kotlin は `src/main/kotlin` を使う。混在も可能だが、本研修では Kotlin のみで統一する。

### 1-2. build.gradle.kts を読む

Day 2 で「Gradle Kotlin DSL も DSL の一種」と学びました。Spring Boot プロジェクトの設定を読み解いていきます。

**build.gradle.kts(主要部分)**

```groovy
plugins {
    id("org.springframework.boot") version "3.4.0"
    id("io.spring.dependency-management") version "1.1.6"
    kotlin("jvm") version "2.0.21"
    kotlin("plugin.spring") version "2.0.21"           // ★ Kotlin用
    kotlin("plugin.jpa") version "2.0.21"              // ★ JPA用
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")        // コルーチン
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.9.0")     // Spring連携
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")         // JSON
    runtimeOnly("org.postgresql:postgresql")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21)
    }
}
```

#### Kotlin 専用プラグインの役割

| プラグイン                | 役割                                                  |
|---------------------------|-------------------------------------------------------|
| `kotlin("jvm")`           | Kotlin → JVMバイトコードへのコンパイル                |
| `kotlin("plugin.spring")` | Spring が要求する「open class」を自動的に当てる(後述) |
| `kotlin("plugin.jpa")`    | JPA が要求する「no-arg constructor」を自動生成(後述)  |

> **💡 kotlin("plugin.spring") がないとどうなる?**
>
> Kotlin のクラスは**デフォルトで final**(継承できない)。Spring は実行時にクラスを継承して <a href="#glossary-aop" style="color:var(--accent);text-decoration:underline">AOP</a>(@Transactionalなど、<a href="#glossary-aop" style="color:var(--accent);text-decoration:underline">→ 巻末 A-7 で解説</a>)を実装するので、`open` なクラスでないと動作しない。`plugin.spring` は `@Component`、`@Service`、`@Controller` などが付いたクラスを自動的に open にしてくれる。

### 1-3. アプリケーション起動クラス

ZIP には既に `TrainingApplication.kt` が用意されているので、Day 4 では新規作成ではなく既存を読み解きます。`com.example.training` パッケージ直下に配置することで、**その配下のすべてのサブパッケージ**(controller, service, day1, day2, day3 等) を Spring がスキャン対象に含めてくれます。

**backend/src/main/kotlin/com/example/training/TrainingApplication.kt**

```kotlin
package com.example.training

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class TrainingApplication

fun main(args: Array<String>) {
    runApplication<TrainingApplication>(*args)
}
```

> **💡 Java との違い**
>
> - クラスが空でも `{}` ブロックすら省略可能
> - `main` は**トップレベル関数**(クラスのstaticメソッド不要)
> - `runApplication<T>(*args)`: `SpringApplication.run(...)` の Kotlin 拡張関数。型引数で起動クラスを指定
> - `*args`: スプレッド演算子。`Array<String>` を可変長引数として展開

### Ch.02 Controller を Kotlin で書く⏱ 75分

@RestController、suspend Controller、リクエスト/レスポンスモデル

### 2-1. シンプルな Controller

**ProductController.kt**

```kotlin
@RestController
@RequestMapping("/api/products")
class ProductController(
    private val productService: ProductService,    // ← コンストラクタインジェクション
) {
    @GetMapping
    fun list(): List<ProductResponse> =
        productService.findAll().map { it.toResponse() }

    @GetMapping("/{id}")
    fun get(@PathVariable id: Long): ProductResponse =
        productService.findById(id).toResponse()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody @Valid req: CreateProductRequest): ProductResponse =
        productService.create(req.janCode, req.name, req.category, req.safetyStock).toResponse()
}
```

> **📌 Kotlin らしい書き方のポイント**
>
> - **コンストラクタインジェクション**: `val` で受けるだけ。`@Autowired` 不要(Spring 4.3 以降)
> - **単一式関数**: `fun list() = ...` 形式で `return` も `{}` も不要
> - **拡張関数で変換**: `Entity.toResponse()` をData class の拡張関数として定義(後述)

### 2-2. リクエスト/レスポンスモデル(DTO)

API の入出力には、Entity と分けて **DTO(Data Transfer Object)** を作るのが定石。Kotlin の `data class` が最適です。

**ⓘ DTO の基本 ─ 「どこに」「どう作って」「Entity と何が違うのか」(初学者向け)**

DTO は概念だけだとイメージしづらいので、 配置・作り方・Entity との関係を整理します。

**① どこに配置するか(配置場所のあるべき姿)**

本研修では `domain/` パッケージの下に `dto/` サブパッケージを切ってそこに置きます。 ZIP のスケルトンディレクトリは Day 4 開始時点では以下の構成:

```
backend/src/main/kotlin/com/example/training/
├── controller/    ← @RestController を置く
├── service/       ← ビジネスロジック
├── repository/    ← DB アクセス
├── domain/        ← Entity(DBのテーブルに対応するクラス)
│   └── dto/       ← ★ DTO を置く(自分でディレクトリを作る)
├── exception/     ← カスタム例外、 ControllerAdvice
└── config/        ← Spring 設定クラス
```

これは「<u>同じ責務のファイルは同じディレクトリ</u>」 という Spring Boot のレイヤー設計の慣例です。 受講者の方は Day 4 で `controller/`、 `service/` 等の<u>既存空ディレクトリ</u>(ZIPに用意済み) に該当ファイルを書き、 DTO は `domain/dto/` として <u>新規にサブディレクトリを作って</u>そこに置きます。

> **💡 dto/ をトップ直下に置く流派もある**
>
> プロジェクトによっては `com.example.training.dto` として<u>トップ直下</u>に `dto/` を独立配置する流派もあります(層責務をフラットに並べる考え方)。 本研修は「**DTO は外部接点の言葉だが、 ドメインの『同種の表現』 として扱う**」 の方針で `domain/dto/` 配下に置きます。 どちらでも実装上の動作は同じです。

**② どうやって作るか ─ 自動生成?手書き?**

**手書き**です。 Kotlin の `data class` で <u>必要なフィールドだけ</u>を持つクラスを宣言します。

```
data class CreateProductRequest(
    val janCode: String,
    val name: String,
    val category: String,
    val safetyStock: Int = 20,
)
```

これだけで「key:value の組合せを Service や Repository に引き回すオブジェクト」 が完成。 自動生成ツール(MapStruct 等) もありますが、 Kotlin の `data class` は3行で書けるので**手書きで十分**です。 むしろ「<u>何のフィールドを持つか</u>」 自体が設計判断なので、 自分で書く意義があります。

**③ Entity との関係 ─ なぜ別に作るのか**

DTO と Entity は別物です。 役割が違うので両方必要です:

<table class="styled-table" style="font-size:13px;">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr class="header">
<th>項目</th>
<th>Entity(<code>domain/</code> 直下)</th>
<th>DTO(<code>domain/dto/</code>)</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>役割</strong></td>
<td>DB のテーブル1行と対応</td>
<td>API リクエスト/レスポンスの形</td>
</tr>
<tr class="even">
<td><strong>持つフィールド</strong></td>
<td>テーブルの全列(id, 作成日時, 更新日時, など全部)</td>
<td>API に必要な項目だけ(計算後の値、 別テーブル結合結果も含む)</td>
</tr>
<tr class="odd">
<td><strong>変わる理由</strong></td>
<td>DB スキーマ変更時</td>
<td>API バージョン変更時、 画面要件の変更時</td>
</tr>
<tr class="even">
<td><strong>例</strong></td>
<td><code>ProductEntity(id, janCode, name, category, safetyStock, createdAt, updatedAt)</code></td>
<td><code>ProductResponse(id, janCode, name, category, safetyStock)</code><br />
※ <u>createdAt/updatedAt等の内部列はレスポンスに含めない</u></td>
</tr>
</tbody>
</table>

「Entity をそのまま返せばいいのでは?」 と思いがちですが、 ① 内部 DB 構造を API に晒すと変更時に困る、 ② 不要な情報(`deletedAt` 等の論理削除フラグ) も送ってしまう、 ③ JSON 化時に循環参照で無限ループする、 などの問題が出るので**必ず分けます**。

**④ Entity ↔ DTO の変換** ─ 次の §2-3 で<u>拡張関数</u>で書く方法を学びます。 通常は `Converters.kt` や `ProductMapping.kt` のような変換用ファイルを `domain/dto/` パッケージ内に置きます。 ZIP の `solutions/day4/dto/Converters.kt` に参考実装あり。

**ProductDto.kt**

```kotlin
// リクエスト ─ product テーブル(init.sql)の列に対応
data class CreateProductRequest(
    @field:NotBlank
    @field:Pattern(regexp = "\\d{13}", message = "JANコードは13桁の数字")
    val janCode: String,

    @field:NotBlank
    @field:Size(max = 100)
    val name: String,

    @field:NotBlank
    @field:Size(max = 20)
    val category: String,

    @field:Min(0)
    val safetyStock: Int = 20,
)

// レスポンス
data class ProductResponse(
    val id: Long,
    val janCode: String,
    val name: String,
    val category: String,
    val safetyStock: Int,
)
```

> **⚠ @field: プレフィックスに注意**
>
> Kotlin のプロパティは複数の場所(field、getter、setter、parameter) に展開される。Bean Validation は**field** に付ける必要があるので `@field:` プレフィックスを書く。これを忘れるとバリデーションが効かない。

### 2-3. 拡張関数で Entity ↔ DTO の変換を書く

Day 1 で学んだ拡張関数が活躍します。Entity から DTO への変換は、変換用クラスを作らず**拡張関数で簡潔に**書くのが Kotlin らしいスタイル。

**ProductMapping.kt**

```kotlin
fun Product.toResponse() = ProductResponse(
    id = id ?: error("未永続化"),
    janCode = janCode.value,
    name = name,
    category = category,
    safetyStock = safetyStock,
)

fun CreateProductRequest.toDomain() = Product(
    janCode = JanCode(janCode),
    name = name,
    category = category,
    safetyStock = safetyStock,
)
```

これにより Controller 側のコードは `productService.create(req.toCommand()).toResponse()` のように**パイプライン**で書けて、Day 2 で学んだ関数型スタイルが Web レイヤーでも活きます。

> **⚠ よくある落とし穴: IntelliJ の「インターフェースを作成しますか?」 quick fix**
>
> `import com.example.training.domain.dto.toResponse` や `import com.example.training.domain.dto.toEntity` を書いた時、 該当する拡張関数がまだ定義されていないと、 IntelliJ は赤い波線とともに次のような quick fix(電球マーク) を提案します:
>
> - 「インターフェース 'toResponse' を作成しますか?」
> - 「クラス 'toResponse' を作成しますか?」
> - 「関数 'toResponse' を作成しますか?」
>
> **これらの quick fix は使わないでください**。 クリックすると **空のスタブ(`interface toResponse` や `fun toResponse() {}`)が勝手に生成され、 ビルドは通るが意図と全く違うコードになります**。 一見「警告が消えた」 ように見えるのが厄介です。
>
> **正しい対処**:
>
> 1.  quick fix を<u>クリックしない</u>(Esc で閉じる)
> 2.  上のコード例のように `Converters.kt`(または `ProductMapping.kt`) を `domain/dto/` パッケージに作成し、 拡張関数を定義する
> 3.  import を正しく書く: `import com.example.training.domain.dto.toResponse`(拡張関数は<u>パッケージレベル</u>で import する点に注意)
> 4.  もし誤って空のスタブを作ってしまった場合は、 生成されたファイル(`toResponse.kt` 等の見慣れないファイル) を削除して、 上記手順をやり直す
>
> IntelliJ は「定義のない関数 → スタブ生成」 を反射的に提案するため、 <u>拡張関数の存在を IDE が認識する前のタイミング</u>で誤クリックしやすい操作です。 「電球マークが出たら一旦止まる」 を習慣化してください。

### 2-4. suspend Controller ─ Day 3 の応用

Spring Boot 3 では Controller のメソッドを `suspend fun` として書くと、コルーチン上で実行されます。複数の API を並列で呼ぶようなケースで威力を発揮。

**SuspendController.kt**

```kotlin
@RestController
@RequestMapping("/api/orders")
class OrderController(
    private val inventoryClient: InventoryClient,
    private val creditClient: CreditClient,
    private val shippingClient: ShippingClient,
) {
    @PostMapping("/check")
    suspend fun check(@RequestBody req: OrderCheckRequest): OrderCheckResponse = coroutineScope {
        val inv = async { inventoryClient.check(req.productId) }
        val cred = async { creditClient.check(req.customerId) }
        val ship = async { shippingClient.check(req.address) }

        OrderCheckResponse(
            inventory = inv.await(),
            credit = cred.await(),
            shipping = ship.await(),
        )
    }
}
```

> **✅ Day 3 で学んだことがそのまま使える**
>
> Controller の中で `coroutineScope` / `async` / `await` が普通に書ける。Spring 側がクライアント切断時の自動キャンセル、リクエストごとのコルーチンスコープ管理を引き受けてくれる。

#### クライアントが切断するとどうなる?

HTTPリクエストの**クライアントが接続を切ったり、タイムアウトしたり**すると、Spring Boot は自動的にコルーチンを**キャンセル**します。Day 3 で学んだ「親がキャンセルされたら子も自動キャンセル」が、リクエストの寿命に自然に紐づくわけです。

#### WebFlux(Mono / Flux)との関係

Spring には Reactor(`Mono` / `Flux`) を使う **WebFlux** という選択肢もあります。歴史的には「Spring で非同期APIを書くなら WebFlux」という時代もありましたが、**Kotlin を使う場合は普通の Spring MVC + `suspend fun` で十分**です。

| 観点         | Spring MVC + suspend                                               | Spring WebFlux + Mono/Flux                                    |
|--------------|--------------------------------------------------------------------|---------------------------------------------------------------|
| 記述スタイル | 普通の Kotlin コード(if/for/try-catchが使える)                     | Reactor のオペレータチェーン(map / flatMap / switchMap / ...) |
| 学習コスト   | 低い(Day 3 のコルーチンを学べばOK)                                 | 高い(オペレータが多数、デバッグも難しい)                      |
| 性能         | WebFlux と実用上ほぼ同等(suspend Controller も内部で non-blocking) | 伝統的に non-blocking のリファレンス実装                      |
| 本研修       | **こちらを採用**                                                   | 使わない(学習コストに見合わない)                              |

> **📌 結論**
>
> Kotlin を使う現代の Spring Boot アプリでは、**Spring MVC + suspend Controller** が事実上のベストプラクティスです。WebFlux を覚えなくても、性能・記述性の両面で困りません。

#### JPA との連携注意点 ─ Dispatchers.IO への切り替え

1つ重要な注意: **JPA(Hibernate) は内部でブロッキング I/O を使います**。これを suspend 関数の中でそのまま呼ぶと、せっかくの軽量さが台無しになります(JPA がスレッドを長時間ブロックしてしまう)。なので Service 側で `Dispatchers.IO` へ切り替えるのが正解です。

**JpaWithCoroutine.kt**

```kotlin
@Service
class OrderService(
    private val orderRepository: OrderRepository,
) {
    suspend fun findById(id: Long): Order? = withContext(Dispatchers.IO) {
        // ↑ withContext で IO Dispatcher に切り替えてから JPA を呼ぶ
        orderRepository.findById(id).orElse(null)
    }
}
```

> **💡 もっと進めたいなら R2DBC**
>
> JPA の代わりに **R2DBC**(non-blocking なDB アクセスライブラリ) を使うと、`Dispatchers.IO` への切り替えが不要になります。ただし R2DBC は JPA ほど機能が揃っていない(複雑なリレーション、@OneToMany 等が制限される) ため、本研修では JPA を採用しています。R2DBC は別途、必要に応じて検討してください。

### 2-5. パラメータの受け取りパターン

**RequestPatterns.kt**

```kotlin
// パスパラメータ
@GetMapping("/{id}")
fun get(@PathVariable id: Long): ProductResponse = ...

// クエリパラメータ
@GetMapping
fun search(
    @RequestParam(required = false) keyword: String?,
    @RequestParam(defaultValue = "0") page: Int,
    @RequestParam(defaultValue = "20") size: Int,
): Page<ProductResponse> = ...

// リクエストボディ
@PostMapping
fun create(@RequestBody @Valid req: CreateProductRequest): ProductResponse = ...

// ヘッダ
@GetMapping("/me")
fun me(@RequestHeader("X-User-Id") userId: Long): UserResponse = ...

// 認証済みユーザー(Day 5 で扱う)
@GetMapping("/my")
fun my(@AuthenticationPrincipal user: AppUser): List<OrderResponse> = ...
```

> **💡 Null安全をフル活用**
>
> クエリパラメータが optional なら `String?`、必須なら `String`。Kotlin のNull安全がそのまま機能するので、Java で `required = false` なのに `String` で受けてしまうバグを防げます。
>
> *※ ここに出てきた `search()` のパターンは、 Day 7 Ch.03(検索フォーム+CRUD) と Ch.03.5(業務系一覧3画面) で**本格的に組み立てます**。 そこでは複数の optional パラメータを JPA Specification で AND 検索に組み立てるところまで進みます。*

### 2-6. ハンズオン演習 2-1

> **ⓘ HTTPステータスコード ─ 「201」「204」 は 正常 です(初学者向け)**
>
> 下の演習や、 これまでのコード例で `POST` は **201 Created**、 `DELETE` は **204 No Content** を返すように書かれています。 200 以外の番号が出てくると「エラー?」 と思いがちですが、 これらは**すべて正常**です。 「2 で始まるコード(2xx)」 = 成功、 と覚えてください。
>
> - **200 OK**: 一番無難な成功。 GET や PUT の成功で使う。 「ボディに結果が入っている」
> - **201 Created**: 新規作成成功。 POST で使う。 「サーバー側でリソース(=データの実体)が作られた」 ことを明示。 単なる 200 だと「読めた」 のか「作れた」 のか分からないので、 POST のときは 201 で区別する。
> - **204 No Content**: 成功したがレスポンスボディは空。 DELETE で使う。 「削除完了。 返すデータはない(なぜなら消したから)」 という意味。 単なる 200 だとボディに何か入っているはずだが、 削除では返すものがないので 204。
>
> つまり、 **同じ「成功」 でも操作の種類によって番号を使い分けている**だけです。 「`POST` が 201、 `DELETE` が 204」 という対応は REST API の業界標準で、 フロントエンド側も「2xx なら成功」 と判定するのが普通です。
>
> エラーは **4xx**(クライアント側のミス、 例: `404 Not Found`)、 **5xx**(サーバー側のバグ、 例: `500 Internal Server Error`)。 詳細な一覧は**巻末「付録 B: HTTPステータスコード早見表」**を参照してください。

> **💡 演習**
>
> 商品(Product) の CRUD API を実装してください。
>
> - `GET /api/products`: 全件取得
> - `GET /api/products/{id}`: ID指定で取得
> - `POST /api/products`: 新規作成(`CreateProductRequest` を受け取り、201 を返す)
> - `PUT /api/products/{id}`: 更新
> - `DELETE /api/products/{id}`: 削除(204 No Content)
>
> Service と Repository は次の章で本格的に作るので、ここでは**仮実装(モック)**で OK です。

### Ch.03 Service / Repository レイヤー設計⏱ 75分

DDDの観点でレイヤーを切る ─ 副作用の追い出し場所

### 3-1. データはフロントから DB までどう姿を変えるか

Spring Boot のレイヤーに踏み込む前に、**フロントエンドからの HTTP リクエストが、最終的に DB に保存されるまで、データがどんな姿で受け渡されていくか**を確認します。これが理解できると、なぜレイヤーを分ける必要があるのかが見えます。

［図（テキスト抽出）：① フロントエンド / Vue / React / HTML / JSON 形式の HTTP body / ② Controller / DTO(Request) / CreateProductRequest / ③ Service / Domain(業務概念) / Product (ドメインモデル) / ④ Repository / Entity(DB対応) / ProductEntity / JSONをパース / DTO→Domain変換 / Domain→Entity変換 / ⑤ DB / テーブル: product / INSERT/UPDATE / Entity / ProductEntity / Domain / Product / DTO(Response) / ProductResponse / フロントへ / JSON / Domain←Entity / DTO←Doma …］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図3-1: フロントから DB までのデータの旅 ─ 各層でデータが違う「姿」になる

**📌 各層で型を分ける理由 ─ 「外の都合」と「内の都合」を切り離す**

同じ「商品」というデータでも、4つの異なる関心事(=姿) を持ちます。これらを**同じクラスで兼ねさせない**のが原則です:

| 姿                         | 誰の都合に応じる                             | 変更されるタイミング                     |
|----------------------------|----------------------------------------------|------------------------------------------|
| **DTO**(Request/Response)  | フロントエンドの都合 ─ API仕様、画面表示項目 | 画面が増減 / API のバージョンアップ時    |
| **Domain**(ドメインモデル) | 業務の都合 ─ ビジネスルール、業務概念        | 業務ルール変更時(発注上限、割引ルール等) |
| **Entity**                 | データベースの都合 ─ テーブル設計、外部キー  | DBスキーマ変更 / インデックス追加時      |

これらが同じクラスだと、**「画面の項目を変えたいだけなのに DB スキーマも変える羽目になる」**(逆も同じ)。各層を独立して進化させられるよう、変換コードを書く**代償としての疎結合**を選びます。

> **💡 Day 4 の規模感では Domain を省略してもよい**
>
> 厳密にやるなら**DTO → Domain → Entity** の3層変換が理想ですが、小〜中規模のシステムや初期段階では**DTO → Entity** の2層に省略してもOK です(Domain と Entity を兼ねる)。本研修も Day 4 では基本的に2層、Day 5 の DDD パートで Domain を独立させる構成にしています。
>
> 大規模化・複雑化した時に、Entity から Domain を分離する判断ができれば良い、というスタンスです。

### 3-2. レイヤー構成 ─ Day 2 で学んだ「副作用は外側に」の実装

Day 2 で「ビジネスロジックは純粋関数で、副作用は外側のレイヤーで」と学びました。Spring Boot ではこれを**レイヤー構造**として実装します。

［図（テキスト抽出）：レイヤー構造 / Controller(副作用 ─ HTTP の境界) / リクエスト受付 / DTO変換 / レスポンス返却 / HTTPステータス決定 / Service(ビジネスロジックの司令塔) / ユースケースの組み立て、トランザクション境界、ドメインの呼び出し / Domain(純粋なビジネスルール) / エンティティ・値オブジェクト・ドメインサービス ─ Day 2 で書いた純粋関数の世界 / Repository / Infrastructure(副作用 ─ DBの境界) / JPA / DB 永続化、外部 API 呼び出し、メール送信 / 外側 / (HTTP) / 中間 / (調整役) / 中心 / (純粋) / 外側 / (DB等) / 依存 / 依存方向: 外側 → 中心のみ(Domain は他の何にも依存しない、 純粋関数の核)］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図3-1: 4層構造 ─ Domain を中心に、両側に副作用レイヤーを置く

> **📌 依存方向の鉄則 ─ Domain は何にも依存しない**
>
> Controller / Service / Repository は Domain に依存して良いが、**Domain は外側のクラス(Spring、JPA、HTTPなど) に依存してはいけない**。Day 2 で学んだ「純粋関数」を実装上で守るための重要な制約です。
>
> - Domainクラスに `@Entity` や `@RestController` を付けない(後述: Entity は別途用意)
> - Domainクラスから Repository を直接呼ばない(Service が橋渡しする)

### 3-3. Service の実装

**ProductService.kt**

```kotlin
@Service
@Transactional(readOnly = true)
class ProductService(
    private val productRepository: ProductRepository,
) {
    fun findAll(): List<Product> =
        productRepository.findAll().map { it.toDomain() }

    fun findById(id: Long): Product =
        productRepository.findById(id).orElseThrow { ProductNotFoundException(id) }
            .toDomain()

    @Transactional
    fun create(janCode: String, name: String, category: String, safetyStock: Int): Product {
        if (productRepository.existsByJanCode(janCode)) {
            throw DuplicateJanCodeException(janCode)
        }
        val entity = ProductEntity(
            janCode = janCode,
            name = name,
            category = category,
            safetyStock = safetyStock,
        )
        return productRepository.save(entity).toDomain()
    }
}
```

> **💡 @Transactional のクラスレベル指定**
>
> クラスレベルで `@Transactional(readOnly = true)` を付けて、書き込みメソッドだけ個別に `@Transactional` で上書きするのが定番。読み取り中心のサービスでパフォーマンスとミスを両立できる。

### 3-4. Repository インターフェイス

JPA(Spring Data) を使う場合、Repository はインターフェイス1個で済む。Spring が実装を自動生成。

**ProductRepository.kt**

```kotlin
interface ProductRepository : JpaRepository<ProductEntity, Long> {
    fun findByJanCode(janCode: String): ProductEntity?
    fun existsByJanCode(janCode: String): Boolean
    fun findAllByCategory(category: String): List<ProductEntity>

    @Query("SELECT p FROM ProductEntity p WHERE p.name LIKE %:keyword%")
    fun searchByName(@Param("keyword") keyword: String): List<ProductEntity>
}
```

> **📌 Domain と Entity を分ける選択**
>
> 本研修では**Domain(ビジネスロジック用)**と **Entity(JPA永続化用)**を分ける構成を採用します。理由は Domain を JPA に依存させたくないから(Ch.4 でJPAアノテーションの制約を見ます)。実プロジェクトでは規模に応じて「Entity と Domain を同じクラスにする」「完全に分ける」を選びます。

### Ch.04 JPA Entity を Kotlin で書く⏱ 90分

data class の罠 / open / no-arg ─ Kotlin × JPA の独特なクセを押さえる

### 4-1. なぜ JPA × Kotlin は注意が必要か

JPA(Hibernate) は**「クラスを継承できる」「引数なしコンストラクタがある」**ことを前提に作られた仕組みです。一方 Kotlin はデフォルトで:

- クラスが **final**(継承不可)
- コンストラクタの引数は**すべて必須**(引数なしコンストラクタが存在しない)

これを解決するのが **kotlin-spring** プラグインと **kotlin-jpa** プラグイン(Ch.1で見た)です。これらが自動的に:

- `@Entity`、`@Embeddable` 等のクラスを `open` にする
- JPAが要求する no-arg コンストラクタを自動生成する

### 4-2. data class を Entity にしてはいけない

Day 1 で「不変なドメインモデルは data class」と学びましたが、**JPA Entity に data class を使うのは避ける**のが定石です。理由は以下:

> **⚠ data class × JPA Entity の罠**
>
> - **equals/hashCode が全プロパティで自動生成される** → Lazy Loading のプロキシで NPE / 無限ループ
> - **copy() が遅延読み込みされていない関連を呼んでしまう** → 想定外の SQL 発行
> - **toString() で関連エンティティを全部出力** → ログにDB全体が出てしまうことも

#### 推奨パターン: 普通のクラスとして書く

**ProductEntity.kt**

```kotlin
@Entity
@Table(name = "product")
class ProductEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    val id: Long? = null,

    @Column(name = "jan_code", nullable = false, unique = true, length = 13)
    var janCode: String,

    @Column(name = "product_name", nullable = false, length = 100)
    var name: String,

    @Column(nullable = false, length = 20)
    var category: String,

    @Column(name = "safety_stock", nullable = false)
    var safetyStock: Int = 20,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
) {
    // equals/hashCode は ID ベースで自前実装
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ProductEntity) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int = id?.hashCode() ?: 0

    override fun toString(): String =
        "ProductEntity(id=$id, name=$name)"
}
```

> **ⓘ なぜ @Column(name = ...) を明示するのか**
>
> init.sql の列名は `product_id`、 `jan_code`、 `product_name`、 `safety_stock`、 `created_at` のような**スネークケース**。 一方 Kotlin のプロパティは `id`、 `janCode`、 `name`、 `safetyStock`、 `createdAt` の**キャメルケース**。 この対応を `@Column(name = "...")` で明示します(自動命名規則に頼ると本番で事故りやすい)。

> **💡 var を使ってよい**
>
> Day 1 で「`val` を使え」と言ったのに、ここで `var` ?と思うかもしれません。JPA Entity に限っては、フレームワークがフィールドを書き換える前提なので `var` が必要(`val` でも一部動くが、Hibernate がリフレクションで書き換えるので意図しない挙動の元)。
>
> **Entity は永続化の都合に従う / Domain は純粋関数の都合に従う** と覚えると、なぜ分けるのかが腑に落ちます。

### 4-3. Entity と Domain の変換

Entity と Domain を分けるなら、両者を行き来する変換が必要です。Day 1 の拡張関数が再び活躍します。

**Product (Domain)**

    // Domain ─ 純粋なビジネス概念
    data class Product(
        val id: Long?,
        val janCode: JanCode,
        val name: String,
        val category: String,
        val safetyStock: Int,
    ) {
        init {
            require(name.isNotBlank()) { "商品名は必須" }
            require(safetyStock >= 0) { "安全在庫は0以上" }
        }

        // ビジネスルール
        fun isLowStock(currentStock: Int): Boolean = currentStock < safetyStock
    }

    // JANコード(13桁)のvalue class ─ ドメイン用語を型にする
    @JvmInline
    value class JanCode(val value: String) {
        init {
            require(value.length == 13) { "JANコードは13桁" }
            require(value.all { it.isDigit() }) { "JANコードは数字のみ" }
        }
    }

**EntityMapping.kt(拡張関数)**

```kotlin
// Entity → Domain
fun ProductEntity.toDomain(): Product = Product(
    id = id,
    janCode = JanCode(janCode),
    name = name,
    category = category,
    safetyStock = safetyStock,
)

// Domain → Entity
fun Product.toEntity(): ProductEntity = ProductEntity(
    id = id,
    janCode = janCode.value,
    name = name,
    category = category,
    safetyStock = safetyStock,
)
```

### 4-4. Embeddable(値オブジェクト) を Kotlin で書く

Day 1 で学んだ value class(JVM上の軽量ラッパー) は JPA では使えませんが、JPA の **@Embeddable** なら Kotlin でも自然に書けます。

**Address.kt**

```kotlin
@Embeddable
class Address(
    @Column(name = "zip_code", length = 10)
    var zipCode: String,

    @Column(name = "prefecture", length = 10)
    var prefecture: String,

    @Column(name = "city", length = 100)
    var city: String,
)

@Entity
@Table(name = "customers")
class CustomerEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false)
    var name: String,

    @Embedded
    var address: Address,
)
```

### Ch.05 Validation(Bean Validation)⏱ 60分

入力検証を宣言的に書く

> **ⓘ 本章のコード例について(設計上の注意)**
>
> 本章のコード例(`CreateProductRequest` の price/categoryId、 `CategoryRepository`、 `@CategoryExists` 等) は、 **「5種類のバリデーションを5層に分けて書く」 という考え方を学ぶための拡張題材**です。 価格・カテゴリマスタの存在チェック・複合バリデーション等、 実務でよく出るパターンを意図的に多く盛り込んでいます。
>
> 一方、 本研修の実際の DB スキーマ(`infra/initdb/init.sql`)では `product` テーブルに `price` 列はなく、 `category` も別テーブルではなく `VARCHAR(20)` 列です(業務設計資料参照)。 Day 4 §7 の演習および ZIP の `solutions/day4/` はこの<u>実スキーマに準拠した形</u>で書かれているため、 本章の §5-4-2 の `CreateProductCommand` や `categoryId` の例とは構造が異なります。
>
> **使い分け**: 本章 = 「バリデーション層別設計の考え方」 を学ぶ、 §7 演習 = 「実DBスキーマに沿った商品CRUD」 を実装。 両方とも価値があり、 受講者は両方を経験することで「教育題材 ↔ 実スキーマ」 のギャップを実感できます。

### 5-1. 標準アノテーション

Jakarta Bean Validation の標準アノテーションを使います。Kotlin では `@field:` プレフィックスを忘れずに。

**ValidationExamples.kt**

```kotlin
data class CreateUserRequest(
    @field:NotBlank(message = "名前は必須です")
    @field:Size(min = 1, max = 50, message = "名前は1〜50文字")
    val name: String,

    @field:NotBlank
    @field:Email(message = "メールアドレス形式で入力してください")
    val email: String,

    @field:Min(0)
    @field:Max(150)
    val age: Int,

    @field:Pattern(regexp = "^[0-9]{3}-[0-9]{4}$", message = "郵便番号は123-4567形式")
    val zipCode: String,

    @field:Valid      // ネストしたオブジェクトもバリデート
    val address: AddressRequest,
)
```

#### 主要なアノテーション

| アノテーション     | 用途                                 |
|--------------------|--------------------------------------|
| `@NotNull`         | null 不可(Kotlin の Null安全と併用)  |
| `@NotBlank`        | 文字列が空文字・空白文字のみではない |
| `@NotEmpty`        | コレクション/文字列が空でない        |
| `@Size(min, max)`  | 長さの範囲                           |
| `@Min / @Max`      | 数値の範囲                           |
| `@Email`           | メールアドレス形式                   |
| `@Pattern(regexp)` | 正規表現                             |
| `@Past / @Future`  | 日付の過去/未来チェック              |

### 5-2. Controller で発火させる

**UserController.kt**

```kotlin
@RestController
class UserController(private val userService: UserService) {
    @PostMapping("/users")
    fun create(@RequestBody @Valid req: CreateUserRequest): UserResponse =
    //                            ^^^^^^^ ← これがないとバリデーション動かない
        userService.create(req).toResponse()
}
```

バリデーションエラー時は `MethodArgumentNotValidException` が投げられる。これを Ch.6 の `@RestControllerAdvice` で集中処理します。

### 5-3. 独自バリデータ ─ 業務ルールを宣言的に書く

標準アノテーション(`@NotBlank` や `@Size` 等)では、**1つの項目の形式チェック**はできても、業務独自のルールには対応できません。実務でよく出てくるパターンを 3 種類見ていきます。

#### パターン①: 単項目の形式チェック ─ JANコード

「商品の JAN コードは 8桁または 13桁の数字」のような**1項目内で完結する**業務ルール。形式チェックを独自アノテーションにまとめます。

**JanCodeValidator.kt**

```kotlin
// 1. アノテーション定義
@Target(AnnotationTarget.FIELD)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [JanCodeValidator::class])
annotation class JanCode(
    val message: String = "JANコードは8桁または13桁の数字です",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = [],
)

// 2. バリデータ実装
class JanCodeValidator : ConstraintValidator<JanCode, String> {
    override fun isValid(value: String?, ctx: ConstraintValidatorContext): Boolean {
        if (value == null) return true   // null は @NotNull に任せる
        return value.matches(Regex("^([0-9]{8}|[0-9]{13})$"))
    }
}

// 3. 使う
data class ProductRequest(
    @field:JanCode
    val janCode: String,
    ...
)
```

#### パターン②: 複数項目間の整合性チェック ─ 「その他」を選んだら備考必須

業務でよくあるのが**項目間の依存関係**。例えば「理由」をプルダウン選択させて、「その他」を選んだ場合だけ「備考」を必須にしたいケース。1項目ごとのアノテーションでは表現できないので、**クラスレベル**に独自アノテーションを付けます。

**OtherReasonRequiresNoteValidator.kt**

```kotlin
// 1. クラスレベルのアノテーション
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [OtherReasonRequiresNoteValidator::class])
annotation class OtherReasonRequiresNote(
    val message: String = "「その他」を選んだ場合は備考が必須です",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = [],
)

// 2. バリデータ実装 ─ オブジェクト全体を見る
class OtherReasonRequiresNoteValidator : ConstraintValidator<OtherReasonRequiresNote, ReturnRequest> {
    override fun isValid(req: ReturnRequest?, ctx: ConstraintValidatorContext): Boolean {
        if (req == null) return true
        // 「その他」以外なら備考は任意
        if (req.reason != ReturnReason.OTHER) return true
        // 「その他」なら備考必須
        val ok = !req.note.isNullOrBlank()
        if (!ok) {
            ctx.disableDefaultConstraintViolation()
            ctx.buildConstraintViolationWithTemplate("「その他」選択時は備考が必須です")
                .addPropertyNode("note")   // ← どの項目のエラーかを指定
                .addConstraintViolation()
        }
        return ok
    }
}

// 3. 使う ─ クラス全体にアノテーション
@OtherReasonRequiresNote
data class ReturnRequest(
    val orderId: Long,
    val reason: ReturnReason,   // DEFECTIVE / WRONG_ITEM / OTHER
    val note: String? = null,
)
```

> **📌 他の項目間チェックの例**
>
> - **パスワードと確認用パスワードが一致しているか**
> - **「開始日」が「終了日」より前か**
> - **「会員ランク=ゴールド」のときだけ「ポイント倍率」が指定可能**
> - **「配送方法=日時指定」のときだけ「希望日時」が必須**
>
> このような**「A の値によって B の要否が決まる」**パターンはどれも、クラスレベルの独自バリデータで実装します。

#### パターン③: マスタの存在チェック ─ DBアクセスが必要なバリデーション

「指定されたカテゴリIDがマスタに存在するか」「指定された顧客IDが有効か」など、**DBを引いて確認する必要があるバリデーション**。これは Bean Validation でも実装できますが、注意点があります。

**CategoryExistsValidator.kt**

```kotlin
// 1. アノテーション定義
@Target(AnnotationTarget.FIELD)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [CategoryExistsValidator::class])
annotation class CategoryExists(
    val message: String = "指定されたカテゴリは存在しません",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = [],
)

// 2. バリデータ実装 ─ Repository を DI で受け取る
@Component
class CategoryExistsValidator(
    private val categoryRepository: CategoryRepository,    // ← DI 可能
) : ConstraintValidator<CategoryExists, Long> {
    override fun isValid(value: Long?, ctx: ConstraintValidatorContext): Boolean {
        if (value == null) return true
        return categoryRepository.existsById(value)
    }
}

// 3. 使う
data class ProductRequest(
    @field:CategoryExists
    val categoryId: Long,
    ...
)
```

> **⚠ DBアクセスバリデータは慎重に**
>
> マスタの存在チェックを Bean Validation に載せるのは**便利だが落とし穴も多い**です:
>
> - **競合状態の問題**: バリデーション時点でカテゴリが存在しても、Service が INSERT する直前に削除されているかもしれない。最終的な整合性は DBの**外部キー制約**に任せる方が安全
> - **パフォーマンスの問題**: バリデーションのために毎リクエスト DB を引くと、無駄なクエリが増える
> - **例外と整合性のずれ**: バリデーションは「入力データそのもの」の検証が本来の役割で、外部状態に依存するチェックは Service 層で行う方が筋が良い
>
> 判断としては:
>
> - **軽い参照で済む**かつ**入力エラーとして 400 で返したい** → Bean Validation の独自バリデータでOK
> - **業務処理の途中で判定する**(在庫引当、与信判定など) → Service 層で例外を投げる(Ch.6 の `@RestControllerAdvice` で統一処理)

**💡 「データ単体の検証」と「業務ルールの検証」の住み分け**

| 検証の種類                         | 例                                     | 実装場所                    |
|------------------------------------|----------------------------------------|-----------------------------|
| 形式・桁数・範囲                   | 名前は1〜50文字、年齢は0〜150          | 標準アノテーション          |
| 項目間の整合性                     | その他選択時は備考必須                 | クラスレベル独自バリデータ  |
| マスタの存在(軽量)                 | カテゴリID が存在するか                | 独自バリデータ or Service層 |
| 業務ルール(在庫、与信、権限)       | 在庫が足りているか、与信枠は十分か     | Service層で例外を投げる     |
| 整合性(競合・トランザクション境界) | 同じ商品IDの重複登録、最終的な在庫確定 | DBの制約 + Service層        |

### 5-4. バリデーションの実装場所マトリクス ─ Service の関心事の分離とどう繋がるか

5-3 までで「バリデーションには5種類ある」と分かりましたが、研修受講者にとって本当に重要なのは「**自分のクラスにこのチェックを書いていいのか**」という判断です。本節では、5種類のバリデーションを**Controller / DTO / 独自バリデータ / Service / Repository / DB**のどこに書くかを明示し、Service層の責務(=業務ルールの実行と整合性の保証)に集中させる方法を示します。

#### 5-4-1. 5種類のバリデーション × 5層の実装場所マトリクス

下の表は、Day 4 で扱う代表的なバリデーション5種類について、「**どの層に書くのが正解か**」を○/△/×で示したものです。「○」が第一選択、「△」も状況によってあり、「×」は**そこに書いてはいけない**(関心事の分離が崩れる)を意味します。

<table class="styled-table" style="font-size:13px">
<colgroup>
<col style="width: 20%" />
<col style="width: 20%" />
<col style="width: 20%" />
<col style="width: 20%" />
<col style="width: 20%" />
</colgroup>
<thead>
<tr class="header">
<th>バリデーションの種類</th>
<th style="text-align: center;">DTO(@field 上)</th>
<th style="text-align: center;">独自Validator</th>
<th style="text-align: center;">Service層</th>
<th style="text-align: center;">Repository / DB</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>① 単項目(形式・桁数・範囲)</strong><br />
例: 名前1〜50文字、年齢0〜150</td>
<td style="text-align: center; color: #2E7D32; font-weight: 700;">○<br />
標準アノテーション</td>
<td style="text-align: center;">△<br />
形式が複雑なら</td>
<td style="text-align: center; color: #c00;">×</td>
<td style="text-align: center; color: #c00;">×</td>
</tr>
<tr class="even">
<td><strong>② 項目間整合性(同じリクエスト内)</strong><br />
例: 「その他」選択時は備考必須、開始日&lt;終了日</td>
<td style="text-align: center; color: #c00;">×</td>
<td style="text-align: center; color: #2E7D32; font-weight: 700;">○<br />
クラスレベル独自バリデータ</td>
<td style="text-align: center; color: #c00;">×</td>
<td style="text-align: center; color: #c00;">×</td>
</tr>
<tr class="odd">
<td><strong>③ マスタの存在</strong><br />
例: カテゴリID が存在するか</td>
<td style="text-align: center; color: #c00;">×</td>
<td style="text-align: center;">△<br />
軽量で 400 で返したいなら</td>
<td style="text-align: center; color: #2E7D32; font-weight: 700;">○<br />
業務処理と一体で取得</td>
<td style="text-align: center;">△<br />
FK 制約で最終保証</td>
</tr>
<tr class="even">
<td><strong>④ 業務ルール(状態依存)</strong><br />
例: 在庫が足りているか、与信枠は十分か、ステータス遷移可能か</td>
<td style="text-align: center; color: #c00;">×</td>
<td style="text-align: center; color: #c00;">×</td>
<td style="text-align: center; color: #2E7D32; font-weight: 700;">○<br />
業務例外を投げる</td>
<td style="text-align: center; color: #c00;">×</td>
</tr>
<tr class="odd">
<td><strong>⑤ 整合性(競合・トランザクション境界)</strong><br />
例: 同じ商品IDの重複登録、在庫の最終確定</td>
<td style="text-align: center; color: #c00;">×</td>
<td style="text-align: center; color: #c00;">×</td>
<td style="text-align: center;">△<br />
Service が DB制約を活用</td>
<td style="text-align: center; color: #2E7D32; font-weight: 700;">○<br />
UNIQUE / FK / CHECK</td>
</tr>
</tbody>
</table>

> **📌 表から読み取る原則**
>
> - **「データ自身の制約」 (①②) は DTO/独自バリデータで完結** ─ DB や他データに依存しないため、リクエストが届いた瞬間に判断可能。Controller の `@Valid` で発火するので、Service 層は <u>「正しい形式のデータが来た」 と仮定して書ける</u>
> - **「外部状態に依存する制約」 (③④) は Service層で実行** ─ DB 引きや業務処理の流れの中で判断する。Service が業務ロジックの主役なので、業務ルールも Service に集約する
> - **「最後の砦」 (⑤) は DB の制約に任せる** ─ 並行リクエストや競合状態に対する最終的な整合性保証は、DB の UNIQUE / FK / CHECK 制約で担保する。Service はその例外をキャッチして適切な業務例外に変換する
> - **「全部 Service」 はアンチパターン** ─ ①②を Service に書くと「業務ロジックと形式チェックの混在」が起きて、Service が肥大化する。①②は宣言的に DTO に書き、Service には<u>業務ルールだけ</u>を集中させる

**💡 よくある誤解 ─ 「Service にマスタ存在チェック」 は全メソッドで動くわけではない**

「Service にマスタ存在チェック」 と聞くと、「商品の参照(GET)時にも毎回カテゴリ存在チェックが走るのでは?」という違和感を持つ方がいます。**結論から言えば、動きません。**これは Service 設計の重要なポイントです。

「Service にマスタ存在チェック」 と言っても、**「全 Service メソッドで毎回実行される」 のではなく、「業務上必要なメソッドにだけ書く」** ─ これが関心事の分離の本質です。

| 処理                           | Service メソッド            | マスタ存在チェック | 理由                                                     |
|--------------------------------|-----------------------------|:------------------:|----------------------------------------------------------|
| 商品登録 POST                  | `create()`                  |       ○ 実行       | 新規 Product に Category を紐付けるため<u>取得が必要</u> |
| 商品更新 PUT(カテゴリ変更あり) | `update()`                  |       ○ 実行       | 新しい Category を紐付けるため取得が必要                 |
| 商品参照 GET                   | `findById()`                |       × 不要       | FK制約で登録時点で保証済み、再チェック不要               |
| カテゴリ一覧 GET               | `CategoryService.findAll()` |       × 不要       | そもそも存在チェックの対象がない、一覧返すだけ           |

**大事な発想の転換**: Service 5-4-2 のコードで `categoryRepository.findById(cmd.categoryId)` を書いているのは、<u>「存在チェックそのもの」 が目的ではなく、「後で Product にカテゴリを紐付けるための取得」 が主目的</u> です。結果として「存在しなければ例外」 になるだけ。**「取得 = 後で使う」と「チェック = 業務処理の前提」が一体**になっており、これが Service に書く正当性の根拠です。

逆に Bean Validation の `@CategoryExists` を DTO に書くと、「商品名だけ更新したいリクエスト」 でも `categoryId` が含まれている限り毎回 DB を引いてしまい、**かえって無駄なクエリが増える**ケースもあります。「Service が業務処理に必要なときだけ取得する」 設計のほうが、結果的に効率も保守性も良くなります。

#### 5-4-2. 商品登録(UC04)の完全実装 ─ 5種類のバリデーションを各層に分離

「商品マスタへの新規登録」 という単純なユースケースを題材に、5種類のバリデーションが**実際にどう各層に分かれて書かれるか**をコードで示します。受講者が業務システムを実装する際の「お手本」 になるパターンです。

**業務要件(架空)**:

- 商品名: 1〜100文字、必須 → **①単項目**
- JANコード: 8桁または13桁の数字 → **①単項目(独自形式)**
- カテゴリID: マスタに存在する有効なカテゴリ → **③マスタ存在**
- 標準価格: 仕入価格より高い → **②項目間整合性**
- 同じJANコードの商品は重複登録不可 → **④業務ルール**(または ⑤ DB制約)
- ログインユーザーが商品登録権限を持つ → **④業務ルール(権限)**

**各層の役割と実装**:

**domain/dto/CreateProductRequest.kt ── ①②を担当**

```kotlin
// ① 単項目の形式チェック (標準アノテーション + 独自@JanCode)
// ② 項目間整合性 (クラスレベル @PriceMustBeHigherThanCost)
@PriceMustBeHigherThanCost            // ← ② クラスレベル独自バリデータ
data class CreateProductRequest(
    @field:NotBlank
    @field:Size(min = 1, max = 100)
    val name: String,                  // ← ① 標準で済む

    @field:JanCode                     // ← ① 形式が複雑なので独自バリデータ
    val janCode: String,

    @field:NotNull
    val categoryId: Long,               // ← ③は Service で(DB引きが必要)

    @field:Min(0)
    val standardPrice: Int,              // ← ① 範囲チェックは標準で

    @field:Min(0)
    val costPrice: Int,                  // ← ① 範囲チェックは標準で
)
// 「価格 > 仕入価格」 は @PriceMustBeHigherThanCost で クラス全体を見て判定
```

**controller/ProductController.kt ── ①②の発火だけ**

```kotlin
@RestController
class ProductController(private val productService: ProductService) {
    @PostMapping("/api/products")
    fun create(@RequestBody @Valid req: CreateProductRequest): ProductResponse =
        //                            ^^^^^^^^^^^^^^^^^^^^ ← @Valid で ①② が自動発火
        // ここに到達した時点で、①②は通過済み(失敗時は 400 が返る)
        productService.create(req.toCommand()).toResponse()
}
// Controller には if 文や validate() 呼出は一切書かない
//   → Service の入口に着いた時点で「データの自己整合性は OK」 と保証される
```

**service/ProductService.kt ── ③④を担当(業務ロジックの主役)**

```kotlin
@Service
class ProductService(
    private val productRepository: ProductRepository,
    private val categoryRepository: CategoryRepository,
    private val currentUser: CurrentUserProvider,
) {
    @Transactional
    fun create(cmd: CreateProductCommand): Product {
        // ④ 業務ルール: 権限チェック ── 業務処理に必須の前提
        if (!currentUser.hasRole("PRODUCT_ADMIN")) {
            throw PermissionDeniedException("商品登録権限がありません")
        }

        // ③ マスタの存在: カテゴリ取得と同時に「存在しなければ例外」
        //    DB引きが必要なので Service の責務。後で実体を業務処理にも使う。
        val category = categoryRepository.findById(cmd.categoryId)
            .orElseThrow { NotFoundException("カテゴリ", cmd.categoryId) }

        // ④ 業務ルール: 重複チェック ── 業務観点の判定
        if (productRepository.existsByJanCode(cmd.janCode)) {
            throw BusinessException("このJANコードは既に登録されています: ${cmd.janCode}")
        }

        // 業務ロジック本体 ── 全てのチェックを通過したので、ここからは「正しい状態」を前提に書ける
        val product = Product.from(cmd, category)
        return productRepository.save(product)
        // → ここで ⑤ 「同時実行された別リクエストとの最終的な整合性」 は DB の UNIQUE 制約に委ねる
    }
}
```

**db/migration/V1\_\_create_product.sql ── ⑤を担当(最後の砦)**

```sql
-- ⑤ 整合性: 並行登録への防御は DB 制約で保証する
--    Service が existsByJanCode でチェックしても、その直後に
--    別リクエストが同じ JAN で INSERT したら防げない。最終的に UNIQUE 制約が止める。
CREATE TABLE product (
    id            BIGINT PRIMARY KEY,
    jan_code      VARCHAR(13) NOT NULL UNIQUE,    -- ← ⑤ 同一JAN の重複登録を防ぐ
    category_id   BIGINT NOT NULL REFERENCES category(id),  -- ← ⑤ 削除済みカテゴリへの参照を防ぐ
    name          VARCHAR(100) NOT NULL,
    standard_price INT NOT NULL CHECK (standard_price >= 0),  -- ← ⑤ 形式の最終ガード
    cost_price    INT NOT NULL CHECK (cost_price >= 0),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 5-4-3. Service層が「やらないこと」 ─ 関心事の分離が明確になる

上の Service コードを見直すと、**Service が書いていないこと**がいくつもあることに気づきます。これこそが「関心事の分離」 の本質です。

| Service が書かないこと                    | その理由(誰が代わりにやるか)                                                           |
|-------------------------------------------|----------------------------------------------------------------------------------------|
| JAN コードが13桁の数字か                  | **DTO + @JanCode** が Controller 到達前に弾く。Service には正しいデータしか来ない。    |
| 商品名が空でないか                        | **DTO + @NotBlank** が同様に弾く。Service は `cmd.name` を信頼して使える。             |
| 標準価格 \> 仕入価格 か                   | **クラスレベル @PriceMustBeHigherThanCost** が同じく Controller 到達前に判定。         |
| HTTP ステータスコード(400 / 500 等)の判断 | **@RestControllerAdvice**(Ch.06)が業務例外を HTTP に変換。Service は例外を投げるだけ。 |
| JSON のシリアライズ                       | **Jackson** が DTO ↔ JSON を自動変換。Service は Kotlin オブジェクトだけ扱う。         |

> **📌 Service層の唯一の責務 ─ 「業務ルールを実行する」**
>
> Service層が引き受けるのは**「業務処理の流れ」と「業務ルールに違反したら例外を投げる」**だけです。具体的には:
>
> - **業務上意味のあるデータ取得**(カテゴリ取得、ユーザー取得など、後の処理で使うもの)
> - **業務ルールに違反しないかの判定**(在庫、与信、権限、状態遷移など、DBや外部状態に依存するもの)
> - **業務処理の実行**(エンティティ生成、保存、更新)
> - **トランザクション境界の宣言**(@Transactional)
>
> 逆に、**形式チェック・項目間整合性・HTTPステータス・JSON変換・SQL組み立て**は他の層に任せます。これが守られている Service コードは、業務ロジックだけが書かれた<u>「業務仕様書をそのままコードにしたような」読みやすさ</u>になります。

#### 5-4-4. フロントエンド側のバリデーション ─ どこまで重複させるか

「フロントエンドでも入力チェックはできるのに、なぜバックエンドでも書くのか?」「同じバリデーションを2回書くのは無駄では?」という疑問は当然出てきます。両者の役割分担と、現実的にどう実装するかを整理します。

**大原則: バックエンドでのバリデーションは「必須」、フロントは「あればUX向上」**

> **⚠ 鉄則: バックエンドのバリデーションは絶対に省略しない**
>
> フロントエンドは**クライアント側で動く**ため、悪意のあるユーザーは:
>
> - ブラウザのDevToolsでJSを書き換えて、バリデーションを無効化する
> - API を直接叩く(curl / Postman 等)ことで、ブラウザの検証を完全にバイパスする
> - 古いブラウザや JavaScript が無効な環境からアクセスする
>
> つまり、**フロントのバリデーションは突破可能**です。データの整合性・セキュリティ・業務ルールの最終的な砦は**必ずバックエンド側**。フロントは「ユーザー体験を良くするための補助的な仕掛け」と位置付けます。

**それぞれの担当範囲**:

| バリデーションの種類                       | フロントで実施            | バックエンドで実施 | 備考                                                              |
|--------------------------------------------|---------------------------|--------------------|-------------------------------------------------------------------|
| **必須項目チェック**                       | ✓ する                    | ✓ する(必須)       | フロントは「赤い枠 + メッセージ」、バックは最終防衛               |
| **文字数・桁数・範囲**                     | ✓ する                    | ✓ する(必須)       | 同じルールを両方に書く                                            |
| **形式チェック(メール / 郵便番号 / 電話)** | ✓ する                    | ✓ する(必須)       | 正規表現は同じものを両側に                                        |
| **項目間の整合性**                         | △ できる                  | ✓ する(必須)       | UXを良くするならフロントでもチェック、バックでは必ず              |
| **マスタの存在チェック**                   | △ 可能(API呼び出しが必要) | ✓ する(必須)       | フロントで頻繁にチェックするとAPI負荷増、バックエンドに任せて良い |
| **業務ルール(在庫・与信)**                 | ✗ できない                | ✓ する(必須)       | リアルタイム性・整合性の問題で、バック専属                        |
| **認可(ロール/権限)**                      | △ 表示制御のみ            | ✓ する(必須)       | フロントは「ボタンを隠す」、バックは「API呼び出しを拒否」         |

#### 5-4-5. 同じバリデーションを共通で扱えるか?

結論から言うと**「完全な共通化は難しいが、ルール定義の共有はできる」**です。実装上の選択肢は次の通り:

<table class="styled-table">
<colgroup>
<col style="width: 25%" />
<col style="width: 25%" />
<col style="width: 25%" />
<col style="width: 25%" />
</colgroup>
<thead>
<tr class="header">
<th>アプローチ</th>
<th>方法</th>
<th>メリット</th>
<th>デメリット</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>① 両側で別々に書く(現実的な多数派)</td>
<td>フロント: Vee-Validate / Zod 等<br />
バック: Bean Validation</td>
<td>各技術の最適解で書ける</td>
<td>ルールを二重に書く ─ 変更時の同期忘れに注意</td>
</tr>
<tr class="even">
<td>② OpenAPI スキーマから自動生成</td>
<td>OpenAPI 仕様で min/max/pattern 等を定義し、フロント・バックの両方のコードを生成</td>
<td>定義が1か所</td>
<td>ツール導入と運用コスト、独自バリデータは別途</td>
</tr>
<tr class="odd">
<td>③ JSON Schema を共有</td>
<td>共通の JSON Schema を両側で参照</td>
<td>定義が1か所</td>
<td>独自ルールが書きにくい</td>
</tr>
<tr class="even">
<td>④ バックエンドのエラーレスポンスをフロントが表示するだけ(フロント側バリデなし)</td>
<td>フロントは送信、エラーが返ったら表示</td>
<td>ロジックが1か所</td>
<td>毎回サーバー往復、UXが劣る</td>
</tr>
</tbody>
</table>

> **📌 本研修での方針**
>
> **方針①(両側で別々に書く)** を採用します。理由:
>
> - 研修規模では学習コストが最も低い
> - 各技術(Spring Boot Validation / Vee-Validate)を素直に学べる
> - 業務寄りの独自バリデータ(マスタ存在、項目間整合性)は、結局フロント・バックで実装方法が違うので共通化は限定的
>
> そして**「同じ形式チェック(文字数、桁数、必須)は意識して両側に書く」「業務ルール系はバックのみ」**と役割分担を明確にします。フロントエンドのバリデーション実装は **Day 7 Ch.2 「フォーム実装」**で扱います。

#### 5-4-6. 独自(業務ルール)バリデーションの分担例

具体的に「商品登録フォーム」のバリデーション要件を、フロント・バック どちらで実装するかを表にしてみます。

| バリデーション                      | フロント側                              | バック側(Bean Validation)    | バック側(Service層)          |
|-------------------------------------|-----------------------------------------|------------------------------|------------------------------|
| 商品名 1〜100 文字、必須            | ✓(即時フィードバック)                   | ✓ `@NotBlank @Size`          | ─                            |
| 価格 0以上、整数                    | ✓(数値入力制限)                         | ✓ `@Min(0)`                  | ─                            |
| JANコード 8桁or13桁                 | ✓(正規表現)                             | ✓ `@JanCode` 独自バリデータ  | ─                            |
| カテゴリ「その他」選択時は備考必須  | ✓(動的に必須表示)                       | ✓ クラスレベル独自バリデータ | ─                            |
| カテゴリIDがマスタに存在する        | △(ドロップダウンから選択させれば防げる) | △ 独自バリデータでも可       | ✓(より確実)                  |
| 同じJANコードの商品が既に存在しない | ✗(タイミング次第で外れる)               | ✗(競合の問題)                | ✓(DBの一意制約 + 例外で処理) |
| 登録者にカテゴリの権限がある        | △(画面で非表示)                         | ✗                            | ✓(Spring Security)           |

> **✅ 役割分担の指針(まとめ)**
>
> - **形式・桁数・項目間整合性**: フロント=即時UX、バック=最終防衛 ─ 両方に同じルールを書く
> - **マスタ存在・業務ルール**: バック専属。フロントはUI設計で防ぐ(プルダウン化、入力制限等)
> - **認可・整合性**: バック専属。フロントは表示制御のみ

### Ch.06 例外ハンドリング(@RestControllerAdvice)⏱ 60分

業務例外を集中処理して、適切なHTTPステータスとエラーレスポンスを返す

### 6-1. 戦略 ─ 業務例外 vs システム例外

Day 2 で sealed class によるエラー表現を学びましたが、Web API のレイヤーでは**例外を投げる方が自然**な場面も多い(深い呼び出しの中で発生するエラー、Spring の Bean Validation など)。両者を使い分けるのが現実的です。

| 分類                 | 例                           | 戦略                                                     |
|----------------------|------------------------------|----------------------------------------------------------|
| 業務例外(想定内)     | 商品が見つからない、在庫不足 | 独自Exception を投げる → ControllerAdvice で 400系に変換 |
| システム例外(想定外) | DB接続失敗、NPE              | そのまま伝搬 → ControllerAdvice で 500 に変換            |
| 入力エラー           | バリデーション失敗           | Spring の `MethodArgumentNotValidException` をハンドル   |

### 6-2. 業務例外の定義

**Exceptions.kt**

```kotlin
// 業務例外の基底 ─ sealed にすると「業務例外の種類」がこのファイルで一覧できる
sealed class BusinessException(message: String) : RuntimeException(message)

/** 商品が見つからない → 404 */
class ProductNotFoundException(id: Long) :
    BusinessException("商品が見つかりません(id=$id)")

/** JANコード重複 → 422 */
class DuplicateJanCodeException(janCode: String) :
    BusinessException("JANコードが重複しています: $janCode")
```

### 6-3. @RestControllerAdvice で集中処理

**GlobalExceptionHandler.kt**

```kotlin
// エラーレスポンスの統一フォーマット(code + message + 任意のdetails)
data class ErrorResponse(val code: String, val message: String, val details: List<String>? = null)

@RestControllerAdvice
class GlobalExceptionHandler {

    // 業務例外: 商品が見つからない → 404
    @ExceptionHandler(ProductNotFoundException::class)
    fun handleProductNotFound(e: ProductNotFoundException) = ResponseEntity
        .status(HttpStatus.NOT_FOUND)
        .body(ErrorResponse("PRODUCT_NOT_FOUND", e.message ?: ""))

    // 業務例外: JANコード重複 → 422(意味は分かるが業務ルールで処理できない)
    @ExceptionHandler(DuplicateJanCodeException::class)
    fun handleDuplicateJan(e: DuplicateJanCodeException) = ResponseEntity
        .status(HttpStatus.UNPROCESSABLE_ENTITY)  // 422
        .body(ErrorResponse("DUPLICATE_JAN_CODE", e.message ?: ""))

    // バリデーションエラー → 400 + フィールド別エラーを details に
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(e: MethodArgumentNotValidException) = ResponseEntity
        .status(HttpStatus.BAD_REQUEST)
        .body(ErrorResponse(
            code = "VALIDATION_FAILED",
            message = "入力エラー",
            details = e.bindingResult.fieldErrors.map { "${it.field}: ${it.defaultMessage}" },
        ))

    // Domain 層の require(...) が投げる IllegalArgumentException → 400
    // (JanCode の13桁チェックなど、 init { require(...) } の防衛が最終防衛線として効く)
    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArg(e: IllegalArgumentException) = ResponseEntity
        .status(HttpStatus.BAD_REQUEST)
        .body(ErrorResponse("INVALID_ARGUMENT", e.message ?: "不正な引数"))
}
```

> **✅ メリット**
>
> - 各 Controller で try-catch を書かなくて済む(Controller が業務ロジックに集中できる)
> - エラーレスポンス形式が全 API で統一される
> - 新しい例外を追加したら、ハンドラを1か所追加するだけ

### 6-4. エラーレスポンスの一貫した形

**レスポンス例**

    // NotFound (404)
    {
      "code": "PRODUCT_NOT_FOUND",
      "message": "商品が見つかりません(id=999)",
      "details": null
    }

    // Validation Error (400) ─ details にはフィールド別エラーが「field: message」形式の配列で入る
    {
      "code": "VALIDATION_FAILED",
      "message": "入力エラー",
      "details": [
        "name: 商品名は必須です",
        "safetyStock: 安全在庫は0以上です"
      ]
    }

> **💡 フロントエンドとの取り決め**
>
> エラーレスポンスは**フロントエンドとの契約**。「code を見て分岐」「details にフィールド別のエラーがあれば表示」など、取り決めを最初に固めると Vue (Day 6) 側のハンドリングも一貫します。

### Ch.07 総合演習: 商品APIの実装⏱ 60分

本日学んだ機能を全部使う ─ Controller / Service / Repository / Validation / 例外

### 7-1. 演習課題

仕入・在庫・販売管理システムの**商品マスタAPI**を実装してください。

#### API仕様

| メソッド | パス                 | 説明                              |
|----------|----------------------|-----------------------------------|
| GET      | `/api/products`      | 商品一覧(カテゴリでフィルタ可能)  |
| GET      | `/api/products/{id}` | 商品詳細                          |
| POST     | `/api/products`      | 新規登録(201, バリデーション付き) |
| PUT      | `/api/products/{id}` | 更新(200)                         |
| DELETE   | `/api/products/{id}` | 削除(204)                         |

#### 要件

1.  **レイヤー**: Controller / Service / Repository / Domain / Entity の5層構成
2.  **Validation**: 商品名(必須・100文字以内)、 カテゴリ(必須・20文字以内)、 安全在庫(0以上)、 JANコード(13桁の数字)
3.  **例外**: 商品が見つからない場合は 404(`PRODUCT_NOT_FOUND`)、 JANコード重複は 422(`DUPLICATE_JAN_CODE`)
4.  **変換**: Entity ↔ Domain ↔ DTO の変換はすべて拡張関数
5.  **テスト**: 主要ケース3つ以上のテストを書く(成功 / NotFound / バリデーション失敗)

**ⓘ テストの書き方ガイド ─ 初めて Controller テストを書く方へ**

「テスト書け」 と言われても何から始めれば、 という方向けに具体的な手順を示します。 ZIP の `solutions/day4/test/ProductControllerTest.kt` も併せて参照してください。

**テストファイルの場所**:

```
backend/src/test/kotlin/com/example/training/controller/ProductControllerTest.kt
       ↑↑↑↑                                              ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
       main ではなく test            テスト対象クラス名 + Test を末尾につけるのが慣例
```

**テストの基本構造 ─ Given/When/Then パターン**:

1.  **Given**(準備): Fake(偽の Service)に「呼ばれたら何を返すか」 を設定
2.  **When**(実行): `mockMvc.perform(...)` で API を叩く
3.  **Then**(検証): `.andExpect(status().isXxx)` で期待結果を確認

**主要3ケースのテスト観点**:

| テストケース            | 確認したいこと                                                     | HTTPステータス  | Fake の振る舞い設定                                        |
|-------------------------|--------------------------------------------------------------------|-----------------|------------------------------------------------------------|
| POST 商品作成成功       | 正常データで 201 が返り、 レスポンスに id が入る                   | 201 Created     | `fakeService.stubbedProduct = Product(...)`                |
| GET 存在しないID        | NotFound 例外 → 404 と エラーコード "PRODUCT_NOT_FOUND"            | 404 Not Found   | `fakeService.notFoundId = 999L`(override 側で例外を投げる) |
| POST バリデーション失敗 | 不正データ(空文字、 JANコード短い等) で 400 と "VALIDATION_FAILED" | 400 Bad Request | 不要(Service に到達しない)                                 |

**使うアノテーション/ライブラリ**:

- `@WebMvcTest(ProductController::class)` ─ Controller 層だけを起動(DB なし、 高速)
- `@TestConfiguration` + `@Bean` ─ テスト用の Service を Spring の Bean として登録
- **Fake(手書きの偽実装)** ─ 本物の `ProductService` を継承し、 必要なメソッドだけ振る舞いを差し替える(後述の理由でモックライブラリを使わない)
- `@Test` ─ JUnit 5 のテストメソッドマーカー(`org.junit.jupiter.api.Test`)
- `mockMvc.perform(post("/api/products")...)` ─ HTTP リクエスト送信のシミュレーション

> **ⓘ なぜ MockK ではなく Fake(手書きの偽実装)なのか**
>
> Spring で Kotlin のモックを使う方法として MockK / springmockk の `@MockkBean` が有名ですが、 これらは内部で **byte-buddy / JVMTI エージェント**を使います。 このエージェントは Gradle キャッシュ(`.gradle/caches/...`) に置かれた jar を bootstrap クラスローダーに登録しようとしますが、 **ユーザー名やパスに日本語など ASCII 以外の文字が含まれると URL 変換に失敗**し、 `appendToBootstrapClassLoaderSearch` で `IllegalArgumentException` が出てテストが起動できません(例: `C:\Users\(日本語名)\.gradle\caches\...\mockk-agent-jvm.jar`)。
>
> そこで本研修では、 **エージェントを一切使わない「手書き Fake」方式**を採用します。 `@Service` 付きの `ProductService` は kotlin-spring プラグインで `open` になるため、 継承して必要なメソッドだけ `override` できます。 依存する `ProductRepository`(インターフェース) は JDK 標準の `java.lang.reflect.Proxy` で空実装を作ります。 これはどんな環境(日本語パス含む) でも確実に動作します。
>
> **Fake と Mock の違い**: Mock はライブラリが動的に偽オブジェクトを生成するもの、 Fake は自分で書いた軽量な実装です。 どちらも「本物の代わり」ですが、 Fake は外部ライブラリ・エージェントに依存しないぶん環境差で壊れません。

**テスト1件の最小サンプル**:

**ProductControllerTest.kt(抜粋)**

```kotlin
@WebMvcTest(ProductController::class)
@Import(ProductControllerTest.FakeConfig::class)
class ProductControllerTest @Autowired constructor(
    private val mockMvc: MockMvc,
    private val fakeService: FakeProductService,
) {
    // 本物の ProductService を継承し、 使うメソッドだけ override した Fake
    class FakeProductService : ProductService(dummyRepository()) {
        var stubbedProduct: Product? = null
        var notFoundId: Long? = null

        override fun findById(id: Long): Product {
            if (id == notFoundId) throw ProductNotFoundException(id)
            return stubbedProduct ?: throw ProductNotFoundException(id)
        }
        override fun create(janCode: String, name: String, category: String, safetyStock: Int): Product =
            stubbedProduct!!

        companion object {
            // ProductRepository の空実装を JDK Proxy で生成(MockK 不要)
            fun dummyRepository(): ProductRepository =
                Proxy.newProxyInstance(
                    ProductRepository::class.java.classLoader,
                    arrayOf(ProductRepository::class.java),
                ) { _, method, _ -> throw UnsupportedOperationException("Fake: ${method.name} は未使用") }
                    as ProductRepository
        }
    }

    @TestConfiguration
    class FakeConfig {
        // Bean は1つだけ。 戻り値型を FakeProductService にしておけば、
        // Controller が要求する ProductService としても、 テストが要求する FakeProductService としても注入できる
        @Bean fun productService(): FakeProductService = FakeProductService()
    }

    @BeforeEach
    fun resetFake() {
        // テスト間で Fake の状態を残さない(テスト独立性の基本)
        fakeService.stubbedProduct = null
        fakeService.notFoundId = null
    }

    @Test
    fun `GET 存在しないID ─ 404 が返る`() {
        // Given: 999 を「存在しないID」として設定
        fakeService.notFoundId = 999L

        // When + Then: 404 と エラーコードを検証
        mockMvc.perform(get("/api/products/999"))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("PRODUCT_NOT_FOUND"))
    }
}
```

**実行方法**: IntelliJ で テストファイルを開き、 クラス名 / メソッド名横の緑▶ボタンをクリック、 または右クリック → Run。 全テストは `./gradlew test` でも実行可。 **この Fake 方式はエージェントを使わないので、 IntelliJ ランナー / Gradle どちらでも、 日本語ユーザー名の環境でも動きます。**

**⚠ 参考: もし MockkDefinition.kt:88 や appendToBootstrapClassLoaderSearch でエラーが出る場合**

上記の Fake 方式なら起きませんが、 もし `@MockkBean` や `mockk()` を使う書き方に変えると、 JDK 21 + 一部環境で次のエラーが出ることがあります:

```
Caused by: java.lang.ExceptionInInitializerError at MockkDefinition.kt:88 (または JvmMockKGateway)
    Caused by: java.lang.IllegalArgumentException
        at sun.instrument.InstrumentationImpl.appendToBootstrapClassLoaderSearch
        at io.mockk.proxy.jvm.dispatcher.BootJarLoader.loadBootJar
```

これは MockK / Mockito が使うエージェント jar のパスに **日本語などASCII外の文字が含まれる**と URL 変換で失敗するのが主因です(JEP-451 の動的エージェント制限も関与)。 重要なのは、 **テストコードでモックを書いていなくても、 `build.gradle.kts` の依存に MockK / Mockito が残っているだけで失敗する**点です(クラスパスに存在するだけで初期化が走るため)。 対処の優先順:

1.  **最も確実**: Fake 方式(`java.lang.reflect.Proxy` + 継承) を使い、 かつ `build.gradle.kts` から **MockK / springmockk / Mockito の依存をすべて取り除く**。 `spring-boot-starter-test` は Mockito を transitive で含むので `exclude(group = "org.mockito", ...)` で除外する(配布の `build.gradle.kts` は対応済み)。 エージェントを使うライブラリが classpath に1つも無くなれば、 環境に一切依存しなくなる
2.  参考: 環境変数 `GRADLE_USER_HOME` を `C:\gradle-home` など ASCII のみのパスに変えてキャッシュ位置を移す方法もあるが、 **jar の一時展開先など別のパスに日本語が残ると解決しないことがある**(実際に効かなかった事例あり)。 確実なのは上記1の「エージェントを使うライブラリを classpath から無くす」 方法

> **📌 設計のヒント**
>
> - Entity: `ProductEntity`、`CategoryEntity`
> - Domain: `Product`、`Category`(data class)
> - Request/Response: `CreateProductRequest`、`UpdateProductRequest`、`ProductResponse`
> - Command(Service層への入力): `CreateProductCommand`
> - 例外: `ProductNotFoundException`、`DuplicateJanCodeException` 等

### Ch.08 Git: 本日の成果を commit & push⏱ 15分

Day 4 を終える

### 8-1. Day 4 のまとめ

> **✓ 本日身につけたこと**
>
> - Spring Boot + Kotlin プロジェクトの構成と build.gradle.kts の読み方
> - kotlin-spring / kotlin-jpa プラグインの役割(open / no-arg)
> - Controller を Kotlin で書く ─ コンストラクタインジェクション、suspend Controller
> - DTO ↔ Entity ↔ Domain の変換を拡張関数で
> - レイヤー設計 ─ Domain を中心に、副作用を外側へ
> - JPA Entity を Kotlin で書く時の罠と回避策(data class を避ける)
> - Bean Validation と独自バリデータ
> - @RestControllerAdvice による集中例外ハンドリング

> **📅 Day 5 に向けて**
>
> 明日(Day 5)は **Spring Boot 高度**。DDD的な設計の深掘り、Spring Security による認証・認可、トランザクション管理の細部、N+1問題と JPA チューニング、キャッシュ、監視/メトリクス を扱います。本日作った商品APIに認証と性能改善を加えていきます。

## DAY 5 ─ Spring Boot 高度

Day 4 で作った API に、本格的な業務システムに必要な要素を積み上げる日。DDD(ドメイン駆動設計)の実装、Spring Security による認証・認可、トランザクションの細部、JPA の性能チューニング、キャッシュ、監視・メトリクス。

合計 9時間 前提: Day 4 修了 到達点: 本番運用に耐える Spring Boot API が書ける

### Ch.00 本日の目標と進め方⏱ 5分

Day 5 を終えた時に、何ができるようになっていれば良いか

### 0-1. 本日のゴール

- DDD の**Aggregate / ValueObject / DomainService** を Kotlin で書ける
- **Spring Security** で認証・認可・CORS の基本設定ができる
- **@Transactional** の挙動を正しく理解し、伝搬・ロールバックを使い分けられる
- **N+1問題**を識別し、fetch join / @EntityGraph で解決できる
- **Spring Cache** でメソッドキャッシュを実装できる
- **ログ・メトリクス・ヘルスチェック**を本番品質で設定できる

**⚠ 本日の作業開始前に ─ 起動チェック**

**Day 5 は Day 4 と同じ起動状態**。DB + Spring Boot が必要です(認証・トランザクション・複数テーブル更新を扱うため)。

| 必要なもの                                    | 状態                   | 確認方法                                                |
|-----------------------------------------------|------------------------|---------------------------------------------------------|
| IntelliJ / JDK / Git                          | 起動済み               | ─                                                       |
| **Docker (PostgreSQL + モックAPI 4コンテナ)** | 起動済み               | `docker compose ps` で 4 つ全て Up                      |
| **Spring Boot(:8080)**                        | IntelliJ から Run      | `http://localhost:8080/api/health` で `{"status":"UP"}` |
| Vue                                           | 本日は不要(Day 6 以降) | ─                                                       |

Day 4 から状態が引き継がれている前提です。停止していたら `docker compose up -d` を再実行し、IntelliJ から `TrainingApplication.kt` を Run してください。

### Ch.01 ドメイン駆動設計(DDD)の実装⏱ 90分

Aggregate / ValueObject / DomainService ─ Kotlin が威力を発揮する分野

### 1-0. そもそも DDD とは何か

**DDD**(**D**omain-**D**riven **D**esign、**ドメイン駆動設計**)は、Eric Evans が2003年に提唱した、大規模・複雑な業務システムを**「業務(ドメイン)を中心に据えて設計する」**方法論です。※「ドメイン駆動**開発**」と訳されることもありますが、原語は「design(設計)」なので**「ドメイン駆動設計」**が正確な訳。

> **📌 DDD が解決しようとした問題**
>
> 従来の業務システム開発でよくあった問題:
>
> - **業務担当者とエンジニアの会話がずれる**: 業務側は「請求書」と言い、エンジニアは「InvoiceTable.tbl_id」と呼ぶ。言葉が違うと認識もズレる
> - **ビジネスロジックがあちこちに散らばる**: 同じ計算ロジックが Controller、Service、SQL の3か所に書かれている
> - **業務ルール変更が大事になる**: 「割引ルールの変更」のような**業務的には小さな変更**が、技術的には大きな改修になってしまう
> - **データベース中心の設計の限界**: テーブル設計から始めると、業務的に意味のある単位(例: 「注文+明細をセットで扱う」)が見えにくい

#### DDD の核となる考え方

- **業務(ドメイン)を主役にする**: コード上の名前・モデル構造を、業務担当者が使う言葉(ユビキタス言語) と一致させる
- **業務ルールはドメインモデルに集約**: 「割引はこう計算する」「在庫はこう管理する」というロジックを、業務概念に対応するクラスの中にまとめる
- **外部都合(DB / HTTP / 認証など) からドメインを守る**: ドメインモデルは技術的な詳細(JPAアノテーション、HTTPステータス等)を知らない、純粋なオブジェクトとして書く

#### 本研修で扱う DDD の範囲

DDD は**方法論として奥が深く**、本格的に学ぶには分厚い書籍 1〜2 冊分のボリュームがあります。本研修では深入りせず、**Kotlin で実装する上で特に効果が大きい 4 つの構成要素**に絞って扱います。

| DDD用語                              | 意味                                                                                             | 本研修での扱い               |
|--------------------------------------|--------------------------------------------------------------------------------------------------|------------------------------|
| **Value Object**(値オブジェクト)     | 同じ値なら同一とみなす不変オブジェクト(例: 金額、住所、メールアドレス)                           | Ch.1-2 で扱う                |
| **Entity**(エンティティ)             | ID で識別される、ライフサイクルを持つオブジェクト(例: 注文、ユーザー)                            | Day 4 の Entity と概念は同じ |
| **Aggregate Root**(集約ルート)       | 関連する Entity/ValueObject をまとめた一貫性の単位(例: 「注文+明細+配送先」をひとかたまりで扱う) | Ch.1-3 で扱う                |
| **Domain Service**(ドメインサービス) | 複数の集約にまたがる業務ルール(例: 在庫引当ロジック、料金計算ロジック)                           | Ch.1-4 で扱う                |

> **💡 DDD は「全部やる/全部やらない」ではない**
>
> DDD は哲学が大きいので、「DDD を全部適用する」と意気込むと逆に複雑になります。実務では:
>
> - **業務的に複雑な部分だけ** DDD のパターンを適用する(例: 注文・在庫まわりは丁寧に、マスタCRUDは普通に)
> - **用語(ユビキタス言語)の統一**だけでも価値がある
> - **Value Object と Aggregate** が一番効果が大きい(これは本研修で扱う)
>
> 「ちょうど良い分量で取り入れる」のが現実的です。

### 1-1. なぜ DDD が Kotlin に合うか

DDD は**「ドメイン(業務領域) を中心に設計する」**方法論。Kotlin の data class、value class、sealed class、拡張関数といった機能は、DDD の概念を表現するのに非常に適しています。

| DDD 概念                     | Kotlin での実装                         |
|------------------------------|-----------------------------------------|
| Value Object(値オブジェクト) | data class / value class                |
| Entity(エンティティ)         | 普通のクラス + ID識別                   |
| Aggregate Root(集約ルート)   | 普通のクラス + 整合性ルール             |
| Domain Service               | 普通のクラス(Spring の @Service とは別) |
| Domain Event                 | data class + sealed class               |
| Repository インターフェイス  | interface(Domain側)                     |
| 業務エラー                   | sealed class(Day 2 で学んだ)            |

### 1-2. Value Object ─ 値の意味を型で表現

「100円」と「100個」は両方とも `Int` ですが、意味が違います。これを**別の型**として扱うのが Value Object。

プリミティブ型をそのまま使う

**Primitive.kt**

```kotlin
fun placeOrder(productId: Long, quantity: Int, price: Int) {
    // 引数の順序を間違えても気付けない
    // placeOrder(quantity, productId, price)  ← コンパイル通る
}
```

Value Object で意味を型化

**ValueObject.kt**

```kotlin
@JvmInline
value class ProductId(val value: Long)
@JvmInline
value class Quantity(val value: Int)
@JvmInline
value class Money(val yen: Int) {
    operator fun plus(other: Money) = Money(yen + other.yen)
    operator fun times(qty: Quantity) = Money(yen * qty.value)
}

fun placeOrder(productId: ProductId, quantity: Quantity, price: Money) { ... }
// 順序間違えるとコンパイルエラー
```

> **📌 Value Object の3つの利点**
>
> - **型安全**: 「商品IDのつもりが顧客IDを渡した」が型エラーで検出
> - **意味が読める**: 引数のシグネチャだけで「これは何の値か」が分かる
> - **振る舞いをまとめられる**: `Money` に `+` や `*` を定義して、金額計算を自然に書ける

### 1-3. Aggregate ─ 整合性を守る単位

Aggregate(集約) は**「常に整合性を保つべきオブジェクトのまとまり」**。注文(Order) と注文明細(OrderLine) のように、一緒に変更されるべきものを1つの単位にする。

**Order.kt**

```kotlin
// Aggregate Root
class Order private constructor(
    val id: OrderId,
    val customerId: CustomerId,
    private val _lines: MutableList<OrderLine>,
    var status: OrderStatus,
        private set,
) {
    val lines: List<OrderLine> get() = _lines.toList()   // 外側からは読み取り専用

    // 整合性ルール: 注文確定後は明細追加不可
    fun addLine(productId: ProductId, qty: Quantity, price: Money) {
        require(status == OrderStatus.DRAFT) {
            "確定済みの注文には明細を追加できません"
        }
        require(qty.value > 0) { "数量は1以上" }
        _lines.add(OrderLine(productId, qty, price))
    }

    fun totalAmount(): Money = _lines.map { it.subtotal() }.fold(Money(0)) { a, b -> a + b }

    fun confirm() {
        require(_lines.isNotEmpty()) { "空の注文は確定できません" }
        status = OrderStatus.CONFIRMED
    }

    companion object {
        fun create(customerId: CustomerId): Order =
            Order(
                id = OrderId(UUID.randomUUID().toString()),
                customerId = customerId,
                _lines = mutableListOf(),
                status = OrderStatus.DRAFT,
            )
    }
}

data class OrderLine(val productId: ProductId, val qty: Quantity, val price: Money) {
    fun subtotal(): Money = price * qty
}

enum class OrderStatus { DRAFT, CONFIRMED, SHIPPED, CANCELLED }
```

> **✅ Aggregate の効能**
>
> - 「整合性を保つロジック」をクラス内部に閉じ込められる(外から不整合な変更ができない)
> - `require` で前提条件を明示的にチェック(Day 1 で学んだ Null安全の派生形)
> - Aggregate 単位でトランザクションを切る = ロック範囲の設計が明確

### 1-4. Domain Service ─ どこにも置けないロジック

「複数の Aggregate にまたがるロジック」「特定のエンティティに自然に属さないルール」は **Domain Service** として独立させます。

**PricingService.kt**

```kotlin
// 「商品の現在価格は、定価 × キャンペーン × 顧客ランク割引」のような
// 複数の集約にまたがるロジック
class PricingService(
    private val campaignRepository: CampaignRepository,
) {
    fun priceFor(product: Product, customer: Customer): Money {
        val base = product.listPrice
        val campaignDiscount = campaignRepository.activeFor(product.id)
            ?.discount ?: 0
        val rankDiscount = customer.rank.discountRate

        return base.multiply(1.0 - campaignDiscount - rankDiscount)
    }
}
```

### Ch.02 Spring Security 基礎⏱ 90分

認証・認可・CORS の基本

### 2-1. 認証(Authentication) と 認可(Authorization)

| 用語 | 意味                                | 例                                    |
|------|-------------------------------------|---------------------------------------|
| 認証 | 「あなたは誰?」を確認する           | ログインID + パスワード、JWT トークン |
| 認可 | 「あなたに何を許可するか?」を決める | 管理者のみ商品削除可能                |

### 2-2. SecurityFilterChain の設定

Spring Security 6 の標準スタイル ─ `SecurityFilterChain` Bean で設定:

**SecurityConfig.kt**

```kotlin
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig {
    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain = http
        .csrf { it.disable() }                // REST API では CSRF 不要が多い
        .cors { }                              // CORS は別 Bean で設定
        .authorizeHttpRequests {
            it
                .requestMatchers("/api/auth/**").permitAll()         // ログインは認証不要
                .requestMatchers("/actuator/health").permitAll()    // ヘルスチェック
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
        }
        .sessionManagement {
            it.sessionCreationPolicy(SessionCreationPolicy.STATELESS)  // JWT
        }
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter::class.java)
        .build()

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()
}
```

> **💡 ヘルスチェック( /actuator/health )とは**
>
> 上のコード中に出てくる `/actuator/health` は**ヘルスチェック**のためのエンドポイントです。**「このサーバーは生きているか / 正常に動いているか」を外部から問い合わせるためのURL**で、本番運用で必須の仕組み。
>
> - **ロードバランサ**(AWS ALB、nginx 等) が定期的(数秒〜数十秒間隔) にこのURLを叩き、200 が返らないインスタンスは「故障」と判断して振り分け対象から除外
> - **Kubernetes** の liveness probe / readiness probe で使われる(死んだコンテナを自動で再起動)
> - **監視ツール**(Datadog、Mackerel 等) が定期チェックでアラート発火
>
> `/actuator/health` を呼ぶと `{"status":"UP"}` のような JSON が返ります。**ロードバランサが認証なしで叩く必要がある**ので、上のコードで `permitAll()`(認証不要) にしているのです。詳しくは **Ch.6 Actuator** で扱います。

### 2-3. JWT 認証 ─ ステートレスな認証

マイクロサービスやSPAでは**JWT(JSON Web Token)**を使う認証が一般的。サーバーはセッションを持たず、**トークンの中に「認証済み利用者の識別情報」(ユーザーID、社員番号、メールアドレスなど)**と**権限情報**(ロール、有効期限) が署名付きで含まれます。

**📌 JWT トークン vs セッショントークン**

「認証済みの利用者を識別する」という目的は同じですが、両者は仕組みが全く違います:

| 観点             | セッショントークン(従来型)                                      | JWT トークン                                               |
|------------------|-----------------------------------------------------------------|------------------------------------------------------------|
| トークンの中身   | **ランダムなID文字列のみ**(例: `abc123xyz`)                     | **利用者情報そのものが入っている**(JSON形式、署名付き)     |
| 利用者の特定方法 | サーバー側のセッションストア(DB/Redis等) を引いて利用者と紐付け | トークンの中身を直接読む(サーバー側ストア不要)             |
| 典型例           | Spring の `HttpSession`、PHPSESSID 等                           | SPA / モバイル / マイクロサービス間で広く使われる          |
| サーバー側状態   | **あり**(セッションストア)                                      | **なし**(ステートレス)                                     |
| スケールアウト   | セッションストアの共有が必要                                    | サーバーが独立 ─ 簡単                                      |
| 失効・取り消し   | サーバー側で削除すれば即時失効                                  | 有効期限切れまで失効できない(別途ブラックリスト管理が必要) |

**JWT の中身(JSON、デコードすれば誰でも読める)**

    {
      "sub": "1234567",           // ←★ 認証済み利用者のID(ユーザーID/社員番号など)
      "name": "山田太郎",
      "email": "yamada@example.com",
      "roles": ["USER", "MANAGER"],
      "iat": 1715000000,           // 発行時刻(issued at)
      "exp": 1715003600            // 有効期限(expiration、1時間後)
    }
    // ↑ この JSON が Base64エンコードされ、サーバー秘密鍵での署名と一緒にトークン化される
    // ↑ 内容は誰でも読めるが、署名を検証することで「改ざんされていない」ことを確認できる

> **⚠ JWT は「暗号化」ではなく「署名」**
>
> JWT の中身(ペイロード)は **Base64エンコードされているだけ**で、誰でも内容を読めます。 守られているのは「**改ざんされていない**」ことだけ ─ サーバーが秘密鍵で**署名**することで、内容を書き換えられても署名検証で弾けるという仕組みです。**パスワードや個人情報など、見られて困るデータを JWT に入れてはいけません**。

**ⓘ JWT の中身をローカルで確認する方法**

JWT をデコードするオンラインツール(jwt.io 等) は便利ですが、 **本番環境の有効な JWT を外部サイトに貼り付けるとアクセストークンが第三者に漏洩するリスク**があります。 業務でデバッグする際は、 必ず<u>ローカル環境で完結する手段</u>を使いましょう。 JWT は 3つの Base64URL 文字列を `.` でつないだ形式(`ヘッダ.ペイロード.署名`) なので、 ヘッダ・ペイロードは Base64URL デコードするだけで JSON が得られます。

**方法1: PowerShell(Windows、 追加インストール不要)**

**PowerShell ─ JWT のペイロードを表示**

```powershell
# $jwt 変数にJWTを入れる(例として短く改行を入れていますが実際は1行で)
$jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMSIsInJvbGUiOiJBRE1JTiJ9.xxxxxx"

# . で分割した2番目(ペイロード)を取り出して Base64URL → Base64 → JSON
$payload = $jwt.Split('.')[1].Replace('-','+').Replace('_','/')
while($payload.Length % 4) { $payload += '=' }
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload)) | ConvertFrom-Json | ConvertTo-Json
```

**方法2: bash + jq(Mac / Linux / WSL)**

**bash ─ JWT のペイロードを表示**

```bash
jwt="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMSIsInJvbGUiOiJBRE1JTiJ9.xxxxxx"
# 2番目(ペイロード)を取り出して Base64URL → Base64 に変換
p=$(echo "$jwt" | cut -d. -f2 | tr '_-' '/+')
# 長さが4の倍数になるまで = でパディング(これがないと base64 -d が失敗することがある)
while [ $(( ${#p} % 4 )) -ne 0 ]; do p="$p="; done
echo "$p" | base64 -d | jq .
```

**方法3: IntelliJ プラグイン「JWT Helper」 をインストール**

- File → Settings → Plugins → Marketplace で「**JWT Helper**」 を検索しインストール
- 右クリックメニュー → 「JWT Helper」 でデコード結果が IDE 内に表示される
- 外部送信なし、 業務で安心して使える

**方法4: VS Code 拡張機能「JWT Debugger」**

- 拡張機能タブで「JWT Debugger」 を検索しインストール
- コマンドパレット → 「JWT Debugger: Decode」 で貼り付け
- 同じく外部送信なし

**方法5: Kotlin で書く(本研修の応用)**

本研修で使う `jjwt` ライブラリには `Jwts.parser().parseSignedClaims()` があり、 検証も同時にできます。 簡易な「中身だけ見たい」 ケースなら、 Kotlin で `Base64.getUrlDecoder()` を使えば外部依存なしで実装できます。

［図（テキスト抽出）：クライアント / Vue 3 / SPA / Spring Boot API / セッション持たない / ① POST /auth/login (id + password) / ② JWTトークン発行 / { user_id, roles, expires } に署名 / ③ GET /api/products / Authorization: Bearer \<JWT\> / ④ JWT を検証 → ユーザー特定 → レスポンス返却 / ポイント: サーバー側にセッション情報を持たないので、スケールアウトしやすい］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図2-1: JWT 認証の流れ ─ ステートレス認証

### 2-4. メソッドレベル認可 ─ 複雑な認可条件をコードに近い場所で書く

#### そもそも「メソッドレベル認可」とは

Spring Security の認可には2つのレイヤーがあります:

| レイヤー               | 場所                                                | 書ける内容                                                                          |
|------------------------|-----------------------------------------------------|-------------------------------------------------------------------------------------|
| **URLレベル認可**      | `SecurityFilterChain`(2-2 で設定)                   | 「`/api/admin/**`はADMIN ロールのみ」など、URL パターン単位                         |
| **メソッドレベル認可** | Controller / Service のメソッドに直接アノテーション | 「<u>引数</u>に応じた認可」「<u>戻り値</u>に応じた認可」「<u>複雑な条件式</u>」など |

メソッドレベル認可は、**`@PreAuthorize` や `@PostAuthorize` アノテーションをメソッドに付ける**ことで、そのメソッドが呼ばれる前後に Spring が認可ルールを検証します。内部的には Spring AOP のプロキシ(<a href="#glossary-aop" style="color:var(--accent);text-decoration:underline">→ 巻末 A-7 で解説</a>)で実現されています。

#### どのような時に役立つか

URLレベル認可だけでは表現しきれない、**引数や状態に応じた認可**が必要な場面で活躍します:

| シナリオ                                                 | URLレベル認可  | メソッドレベル認可         |
|----------------------------------------------------------|----------------|----------------------------|
| 「/api/admin/\*\* は ADMIN 限定」                        | ✓ こちらが向く | 不要                       |
| 「自分の注文だけ閲覧可能(他人の注文IDを指定したら拒否)」 | ✗ できない     | ✓ `#orderId` を見て判定    |
| 「自分自身の情報のみ更新可能 ─ 管理者は誰でも可」        | ✗ できない     | ✓ `or` 条件で書ける        |
| 「投稿の作者本人 or モデレーターのみ削除可能」           | ✗ できない     | ✓ 戻り値や引数を見て判定   |
| 「下書きステータスの記事のみ編集可能」                   | ✗ できない     | ✓ オブジェクトの状態で判定 |

#### SpEL(Spring Expression Language)で柔軟に書ける

`@PreAuthorize` の中身は SpEL という Spring 独自の式言語で書きます。よく使う書き方:

| SpEL 式                                                          | 意味                                         |
|------------------------------------------------------------------|----------------------------------------------|
| `hasRole('ADMIN')`                                               | ADMIN ロールを持っている                     |
| `hasAnyRole('ADMIN', 'MANAGER')`                                 | ADMIN または MANAGER のロールを持っている    |
| `isAuthenticated()`                                              | ログイン済み(anonymous でない)               |
| `#userId == authentication.principal.id`                         | 引数 userId が、ログイン中のユーザーIDと一致 |
| `hasRole('ADMIN') or #userId == authentication.principal.id`     | ADMIN または 本人                            |
| `@orderService.isOwnedBy(#orderId, authentication.principal.id)` | Bean のメソッドを呼んで判定(複雑な条件)      |

**MethodSecurity.kt**

```kotlin
@RestController
class UserController(private val userService: UserService) {

    // ① シンプル: 管理者のみ呼べる
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/users")
    fun listAllUsers(): List<UserResponse> =
        userService.findAll().map { it.toResponse() }

    // ② 引数を見る: 管理者 OR 自分自身のみ削除可能
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    @DeleteMapping("/api/users/{userId}")
    fun delete(@PathVariable userId: Long) {
        userService.delete(userId)
    }

    // ③ 戻り値を見る: 取得した注文の所有者が本人と一致するか後検証
    @PostAuthorize("returnObject.userId == authentication.principal.id or hasRole('ADMIN')")
    @GetMapping("/api/orders/{orderId}")
    fun getOrder(@PathVariable orderId: Long): OrderResponse =
        orderService.findById(orderId).toResponse()
}
```

> **📌 @PreAuthorize と @PostAuthorize の違い**
>
> - **@PreAuthorize**: メソッド**実行前**に判定。失敗したらメソッドが実行されない。**引数**を見られる(`#userId`)
> - **@PostAuthorize**: メソッド**実行後**に判定。失敗したら結果を返さず例外を投げる。**戻り値**を見られる(`returnObject`)
>
> 一般に **@PreAuthorize の方が安全・効率的**(無駄な処理が走らない)。@PostAuthorize は「取得した結果を見ないと判定できない」場合のみ使います。

**💡 有効化に必要な設定**

メソッドレベル認可を使うには、Configuration クラスに `@EnableMethodSecurity` を付ける必要があります。

**SecurityConfig.kt(追記)**

```kotlin
@Configuration
@EnableWebSecurity
@EnableMethodSecurity      // ←★ これが必要
class SecurityConfig { ... }
```

### 2-5. CORS 設定 ─ Vue (Day 6) との連携準備

**CorsConfig.kt**

```kotlin
@Configuration
class CorsConfig {
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val config = CorsConfiguration().apply {
            allowedOrigins = listOf("http://localhost:5173")   // Vue dev server
            allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
            allowedHeaders = listOf("*")
            allowCredentials = true
        }
        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/api/**", config)
        return source
    }
}
```

> **💡 CORS とは**
>
> ブラウザの安全機能で、「JS で別ドメインのAPIを呼ぶ時はサーバー側の許可が要る」というルール。Vue が `localhost:5173` で動き、Spring Boot が `localhost:8080` で動く ─ これは「別ドメイン」扱いになるので CORS 設定が必須。Day 7 で実際に Vue から呼ぶ時に効いてきます。

### 2-6. セキュリティ関連エラーのハンドリング

セキュリティ系で発生する例外は、Spring Security が独自に投げる**専用例外**があり、適切な HTTP ステータスとレスポンスに変換する必要があります。Day 4 で書いた `@RestControllerAdvice` に統合するのが定石です。

#### セキュリティで発生する典型例外と HTTP ステータス

| 例外                          | 発生シーン                                            | 返すべきHTTPステータス                        |
|-------------------------------|-------------------------------------------------------|-----------------------------------------------|
| `AuthenticationException` 系  | トークンなし、無効、期限切れ ─ **認証失敗**           | **401 Unauthorized**                          |
| `AccessDeniedException`       | 認証は OK だが、ロール・権限が足りない ─ **認可失敗** | **403 Forbidden**                             |
| `BadCredentialsException`     | ログイン時にパスワードが間違っている                  | 401 Unauthorized                              |
| `ExpiredJwtException`(jjwt等) | JWT の有効期限切れ                                    | 401 Unauthorized(`token_expired`のヒント返却) |
| `SignatureException`(jjwt等)  | JWT の署名検証失敗 ─ 改ざんの疑い                     | 401 Unauthorized                              |

> **📌 401 と 403 の使い分け**
>
> - **401 Unauthorized** = 「**あなたが誰か分からない**」  
>   → ログインしていない、トークンが無効、期限切れ。クライアント側は**ログイン画面に誘導**するのが定石
> - **403 Forbidden** = 「**あなたが誰かは分かったが、その操作はできない**」  
>   → ログイン済みだが権限不足。クライアント側は**「権限がありません」表示**に留め、ログイン画面には誘導しない
>
> この区別をつけずに両方 401 で返すと、フロント側で「ログイン画面に飛ばすべきか」「権限不足を表示すべきか」の判断ができなくなります。

#### 実装例 ─ ControllerAdvice でハンドリング

> **📌 ControllerAdvice は「自動発火」 ─ 自分で呼ばない**
>
> 下記の `@RestControllerAdvice` + `@ExceptionHandler` のメソッドは、**自分でコードから呼び出すものではありません**。Spring が以下の仕組みで自動的に呼び出してくれます:
>
> 1.  HTTPリクエストが Controller のメソッドを呼ぶ
> 2.  その中で例外がスローされる(Controller 内、Service 内、Repository 内 ─ 呼び出し階層のどこでも)
> 3.  例外が Controller の外まで伝搬する
> 4.  Spring の **HandlerExceptionResolver** が、登録された `@RestControllerAdvice` から**例外の型と一致する `@ExceptionHandler` メソッドを探して**呼び出す
> 5.  そのメソッドの戻り値が HTTP レスポンスとして返される
>
> 仕組みは <a href="#glossary-aop" style="color:var(--accent);text-decoration:underline">巻末 A-7 の AOP プロキシ</a>と同じ発想です。「`@ExceptionHandler` アノテーションを付けたメソッドを、Spring が起動時に登録 → 該当例外が出たら自動的に呼ぶ」というディスパッチが裏で動いています。

**使う側(Controller)─ いつものコード、特別なことはしない**

    @RestController
    class OrderController(private val orderService: OrderService) {
        @PostMapping("/api/orders")
        fun create(@RequestBody req: CreateOrderRequest): OrderResponse {
            // この中で AccessDeniedException や AuthenticationException が投げられても
            // 自分で catch する必要はない ─ Spring が自動的に SecurityExceptionHandler を呼んでくれる
            return orderService.create(req).toResponse()
        }
    }

つまり**呼び出し側のコードは普通に書くだけ**。例外を投げると、Spring が探して `SecurityExceptionHandler` のメソッドにディスパッチ ─ これが自動エラーハンドリングの本質です。

**SecurityExceptionHandler.kt**

```kotlin
@RestControllerAdvice
class SecurityExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    // ① 認証失敗(401)
    @ExceptionHandler(AuthenticationException::class)
    fun handleAuthentication(e: AuthenticationException): ResponseEntity<ErrorResponse> {
        log.warn("認証失敗: ${e.message}")
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse(code = "unauthorized", message = "認証に失敗しました"))
    }

    // ② JWT 期限切れ(401 + ヒント)
    @ExceptionHandler(ExpiredJwtException::class)
    fun handleExpired(e: ExpiredJwtException): ResponseEntity<ErrorResponse> {
        log.warn("JWT期限切れ")
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse(code = "token_expired", message = "トークンの有効期限が切れました。再ログインしてください"))
    }

    // ③ 認可失敗(403)
    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(e: AccessDeniedException): ResponseEntity<ErrorResponse> {
        log.warn("権限不足: ${e.message}")
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ErrorResponse(code = "forbidden", message = "この操作を行う権限がありません"))
    }
}

data class ErrorResponse(val code: String, val message: String)
```

#### SecurityFilterChain での扱い ─ フィルタ層の例外

注意点として、**JWTフィルタ内**(`SecurityFilterChain` の途中) で発生する例外は、まだ Controller に到達していないため、上記の `@RestControllerAdvice` では**キャッチできません**。フィルタ内では専用の**AuthenticationEntryPoint** / **AccessDeniedHandler** を使います。

**JwtAuthEntryPoint.kt**

```kotlin
// 認証フィルタで例外発生時(Controllerに到達しない)
@Component
class JwtAuthEntryPoint(private val objectMapper: ObjectMapper) : AuthenticationEntryPoint {
    override fun commence(
        req: HttpServletRequest,
        res: HttpServletResponse,
        e: AuthenticationException
    ) {
        res.status = HttpStatus.UNAUTHORIZED.value()
        res.contentType = MediaType.APPLICATION_JSON_VALUE
        res.characterEncoding = "UTF-8"
        res.writer.write(objectMapper.writeValueAsString(
            ErrorResponse(code = "unauthorized", message = "認証に失敗しました")
        ))
    }
}

// SecurityConfig に登録
@Bean
fun filterChain(http: HttpSecurity, jwtEntryPoint: JwtAuthEntryPoint): SecurityFilterChain = http
    // ... 既存の設定
    .exceptionHandling {
        it.authenticationEntryPoint(jwtEntryPoint)   // 認証エラー時のハンドラ
        it.accessDeniedHandler { req, res, ex ->
            res.status = HttpStatus.FORBIDDEN.value()
            res.contentType = MediaType.APPLICATION_JSON_VALUE
            res.writer.write("""{"code":"forbidden","message":"権限がありません"}""")
        }
    }
    .build()
```

> **⚠ エラーレスポンスで漏らしてはいけない情報**
>
> - **スタックトレース**: 本番では絶対に外部に返さない(内部実装、ライブラリのバージョン、ファイルパスがバレる)
> - **「ユーザー名が存在しない」と「パスワードが違う」の区別**: ログイン失敗時は**常に同じメッセージ**(「IDまたはパスワードが正しくありません」) を返す。区別できると、ユーザー名総当たり攻撃の手がかりになる
> - **SQLエラーの詳細**: 「Column 'password' cannot be null」のような DB エラーをそのまま返さない
>
> これらは**サーバー側のログには詳細を出す、レスポンスには汎用的なメッセージ**、という使い分けが原則です。

### Ch.03 トランザクション管理(@Transactional)⏱ 60分

伝搬・ロールバック ─ 業務システムでハマる落とし穴

### 3-1. @Transactional の基本

**TransactionalBasic.kt**

```kotlin
@Service
@Transactional(readOnly = true)
class OrderService(...) {

    fun findById(id: Long): Order = ...   // readOnly (高速)

    @Transactional                       // 書き込み用に上書き
    fun placeOrder(req: PlaceOrderRequest): Order {
        val order = Order.create(req.customerId)
        req.items.forEach { order.addLine(it.productId, it.qty, it.price) }
        return orderRepository.save(order)
    }
}
```

> **📌 @Transactional の本質**
>
> メソッドの開始時に DB トランザクションを開始し、正常終了でコミット、例外で**ロールバック**。これを宣言的に実現するのが `@Transactional`。内部的には Spring が AOP プロキシでメソッドを包む(だから Kotlin の `kotlin-spring` プラグインで open にする必要があった)。

### 3-2. 複数テーブル同時更新 ─ トランザクションが本領を発揮するシーン

業務システムで `@Transactional` が最も重要なのは、**1つの業務操作で複数テーブルを同時に更新する**場面です。トランザクションは**「全部成功 or 全部失敗」**を保証してくれます。

#### 業務シナリオ: 「注文を確定する」処理

「注文を確定する」というユーザーの1つの操作の裏では、複数テーブルへの書き込みが連動します:

［図（テキスト抽出）：@Transactional 「register()」 ─ 全部成功 or 全部失敗 / ① sale テーブル / INSERT 販売ヘッダ / ② sale_detail テーブル / INSERT 明細(複数行) / ③ inventory テーブル / UPDATE 在庫を減算 / ④ stock_movement / INSERT 在庫履歴 / ↓ どれか1つでも失敗したら ─ 4つすべてロールバックされる / 例: ③在庫が足りなくて失敗 → ①販売ヘッダもINSERTされなかったことになる］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図3-1: 1つの業務操作で複数テーブルを同時更新する例

#### 実装コード

**PlaceOrderService.kt**

```kotlin
@Service
class PlaceOrderService(
    private val orderRepository: OrderRepository,
    private val orderLineRepository: OrderLineRepository,
    private val inventoryRepository: InventoryRepository,
    private val auditLogRepository: AuditLogRepository,
) {
    @Transactional
    fun placeOrder(req: PlaceOrderRequest): Order {
        // ① 注文ヘッダを INSERT
        val order = orderRepository.save(Order.create(req.customerId))

        // ② 明細を INSERT(複数行)
        req.items.forEach { item ->
            orderLineRepository.save(OrderLine(order.id, item.productId, item.qty, item.price))

            // ③ 在庫テーブルを UPDATE
            val inv = inventoryRepository.findByProductId(item.productId)
                ?: throw ProductNotFoundException(item.productId)
            if (inv.stock < item.qty)
                throw InventoryShortageException(item.productId, item.qty, inv.stock)
            inventoryRepository.save(inv.consume(item.qty))
        }

        // ④ 監査ログを INSERT
        auditLogRepository.save(AuditLog("注文確定", order.id, Instant.now()))

        return order
    }
}
```

> **✅ @Transactional が保証してくれること**
>
> - **原子性(Atomicity)**: 4つの操作は**「全部成功」か「全部失敗」のどちらか**。「注文だけ作って在庫を減らし忘れる」「在庫を減らしたが注文が消えた」のような中途半端な状態にならない
> - **一貫性(Consistency)**: トランザクション開始時と終了時で、DBが業務ルール的に矛盾しない状態
> - **分離性(Isolation)**: 同時実行中の別トランザクションから途中状態が見えない(分離レベルによる)
> - **永続性(Durability)**: コミットされたら障害があっても消えない
>
> これが ACID 特性。`@Transactional` は宣言的にこれを実現してくれます。

#### 業務システムで複数テーブル更新が必要になる典型例

| 業務操作         | 影響するテーブル                                                      |
|------------------|-----------------------------------------------------------------------|
| 販売確定         | sale / sale_detail / inventory / stock_movement                       |
| 送金処理         | account(from)残高減算 / account(to)残高加算 / transaction 記録        |
| ユーザー登録     | user / user_profile / user_role / mail_queue(初回メール送信用)        |
| 商品の論理削除   | product / product_category(関連削除) / cart(該当商品をカートから削除) |
| 会員ランクアップ | user(rank更新) / point_history / coupon(特典クーポン発行)             |

#### 複数テーブル更新時の注意点

**⚠ 注意点1: 長時間トランザクションを避ける**

トランザクションが長く続くと、その間 DB の行ロックが保持され、他のリクエストがロック待ちで遅延します。**外部API呼び出しやファイル処理はトランザクションの外で**行うのが原則。

**悪い例 vs 良い例**

    // ✗ 悪い例: 外部APIをトランザクション内で呼ぶ
    @Transactional
    fun placeOrder(req: PlaceOrderRequest) {
        orderRepository.save(...)
        creditCheckApi.check(...)   // ← 外部API、3秒かかる…
        inventoryRepository.save(...)
    }
    // → 3秒間 order テーブルにロックがかかり、他のリクエストが詰まる

    // ○ 良い例: 外部API先に呼ぶ、DB処理だけトランザクションで
    fun placeOrder(req: PlaceOrderRequest) {
        creditCheckApi.check(...)             // トランザクション外
        placeOrderInTransaction(req)        // トランザクション内は DB だけ
    }
    @Transactional
    fun placeOrderInTransaction(req: PlaceOrderRequest) { ... }

> **⚠ 注意点2: テーブル更新の順序を統一する(デッドロック対策)**
>
> 2つの並行トランザクションが、異なる順序でテーブルをロックすると**デッドロック**が発生します。プロジェクト全体で**テーブル更新の順序を決めておく**のが鉄則(例: 「常に order → inventory → audit の順序」)。

> **⚠ 注意点3: 同一クラス内呼び出しで @Transactional が効かない**
>
> これは Spring AOP プロキシの仕組み上の制約。**3-5 のハマりやすい落とし穴**で詳しく扱います。複数テーブル更新ロジックを別 Service に切り出した場合、呼び出し元が `@Transactional` でラップされていることを確認してください。

> **⚠ 注意点4: readOnly=true は書き込みメソッドに付けない**
>
> クラスに `@Transactional(readOnly = true)` を付けてデフォルトを読み取り専用にした場合、書き込みメソッドには **必ず `@Transactional` で上書き**する(3-1 のコード参照)。忘れると**書き込みが silently失敗**(DB によっては例外を出さない) する危険があります。

> **⚠ 注意点5: 例外時のロールバック条件に注意**
>
> 3-4 で詳述しますが、デフォルトでは**RuntimeException と Error のみロールバック**。checked Exception(Java の `IOException` 等) を投げてもコミットされてしまいます。Kotlin では全例外が RuntimeException 扱いなので意識する場面は少ないが、Java と相互運用する場合や、特定例外で挙動を変えたい場合は `rollbackFor` を明示。

### 3-3. 伝搬(Propagation) ─ ネストした呼び出し時の挙動

`@Transactional` メソッドの中で別の `@Transactional` メソッドを呼んだ時、トランザクションがどう振る舞うかが**伝搬属性**です。

| Propagation              | 挙動                                     | 用途                                     |
|--------------------------|------------------------------------------|------------------------------------------|
| **REQUIRED**(デフォルト) | 既にあれば参加、なければ新規作成         | 大半のケース                             |
| **REQUIRES_NEW**         | 既存があっても一旦停止して新規作成       | ログ書き込み等、親が失敗しても保存したい |
| **NESTED**               | セーブポイントで一部だけロールバック可能 | 部分失敗を許容                           |
| **SUPPORTS**             | あれば参加、なくてもOK                   | 読み取り専用ユーティリティ               |

**Propagation.kt**

```kotlin
@Service
class OrderService(private val auditLogService: AuditLogService) {

    @Transactional
    fun placeOrder(req: PlaceOrderRequest): Order {
        val order = orderRepository.save(...)
        auditLogService.log("注文確定", order.id)
        return order
    }
}

@Service
class AuditLogService {
    // 注文がロールバックしても監査ログは残したい
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun log(event: String, orderId: OrderId) {
        auditLogRepository.save(AuditLog(event, orderId, Instant.now()))
    }
}
```

### 3-4. ロールバック ─ どの例外でロールバックするか

> **⚠ デフォルトの罠**
>
> `@Transactional` のデフォルトでは、**RuntimeException(と Error)はロールバック、checked Exception はコミット**。Kotlin はすべて RuntimeException 扱いなので**意識する必要は少ない**が、Javaから呼ぶ場合や、特定の例外だけロールバック対象にしたい場合は明示します。

**RollbackFor.kt**

```kotlin
@Transactional(rollbackFor = [Exception::class])
fun placeOrder(req: PlaceOrderRequest) {
    // 全例外でロールバック
}

@Transactional(noRollbackFor = [WarningException::class])
fun processWithWarning() {
    // WarningException ではロールバックしない
}
```

### 3-5. ハマりやすい落とし穴

**🚨 同じクラス内呼び出しは効かない**

Spring の `@Transactional` は AOP プロキシで実装されているため、**同じクラスのメソッドを内部から呼んでも効かない**。

**Pitfall.kt**

```kotlin
@Service
class OrderService {
    fun outer() {
        inner()   // ← この呼び出しはプロキシを通らない!
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun inner() {
        // REQUIRES_NEW にならない(外側と同じトランザクションに参加してしまう)
    }
}
```

対策: 別クラスに切り出すか、`ApplicationContext` から自分自身を取得して呼ぶ(後者は推奨しない)。

### Ch.04 N+1問題と JPA チューニング⏱ 75分

「リスト1回 + N回」を「JOIN 1回」にする

### 4-1. N+1 問題とは

「注文一覧を取得して、各注文の顧客名を表示する」というシンプルな処理で発生する代表的な性能問題です。

［図（テキスト抽出）：N+1問題: 販売10件 + 顧客10件取得で 11 クエリ / SELECT \* FROM sale ← 1回目(N件取得) / SELECT \* FROM customer WHERE customer_id = 1 ← 顧客取得 (1回目) / SELECT \* FROM customer WHERE customer_id = 2 ← 顧客取得 (2回目) / … / SELECT \* FROM customer WHERE customer_id = 10 ← 顧客取得 (10回目) / ⚠ 合計11クエリ / 100件なら101クエリ / JOIN で解決: 1クエリで済む / SELECT s.\*, c.\* FROM sale s JOIN customer c ON s.customer_id = c.customer_id / ✓ 1クエリ］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図4-1: N+1問題 ─ ループ内で毎回SQLが発行される

**N+1の発生例**

    // これがN+1を引き起こす
    val orders: List<OrderEntity> = orderRepository.findAll()  // クエリ1
    orders.forEach {
        println(it.customer.name)  // ← 毎回 LAZY ロードでSQL発行
    }

### 4-2. 解決策① ─ JPQL の fetch join

**FetchJoin.kt**

```kotlin
interface OrderRepository : JpaRepository<OrderEntity, Long> {
    @Query("SELECT o FROM OrderEntity o JOIN FETCH o.customer")
    fun findAllWithCustomer(): List<OrderEntity>
}
```

### 4-3. 解決策② ─ @EntityGraph

**EntityGraph.kt**

```kotlin
interface OrderRepository : JpaRepository<OrderEntity, Long> {
    @EntityGraph(attributePaths = ["customer", "lines"])
    override fun findAll(): List<OrderEntity>
}
```

> **💡 fetch join と @EntityGraph の使い分け**
>
> - **fetch join**: 単発の JPQL に書き込む(細かい制御が効く、WHERE 句と組み合わせ可能)
> - **@EntityGraph**: 既存のメソッドに「ついでに取ってくる関連」を宣言的に指定(コードがシンプル)

### 4-4. 解決策③ ─ Batch Size(@BatchSize)

「親 100件 + 子1万件」のような大きなデータでは fetch join が逆に遅くなることも。**Batch Size** で「IN 句で複数件まとめて取得」する戦略が有効。

**BatchSize.kt**

```kotlin
@Entity
class OrderEntity(
    ...
    @OneToMany(mappedBy = "order")
    @BatchSize(size = 50)   // 50件まとめてIN句で取得
    val lines: MutableList<OrderLineEntity> = mutableListOf(),
) { ... }
```

### Ch.05 キャッシュ(Spring Cache)⏱ 45分

頻繁アクセスされる読み取り結果をキャッシュする

### 5-1. Spring Cache の基本

Spring Cache はメソッドレベルでキャッシュを宣言できる仕組み。バックエンドは Caffeine(インメモリ)、Redis(分散) など差し替え可能。

**CacheConfig.kt**

```kotlin
@Configuration
@EnableCaching
class CacheConfig {
    @Bean
    fun cacheManager(): CacheManager {
        val caffeine = Caffeine.newBuilder()
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .maximumSize(1000)

        val manager = CaffeineCacheManager("products", "categories")
        manager.setCaffeine(caffeine)
        return manager
    }
}
```

**CachedService.kt**

```kotlin
@Service
class ProductService(...) {

    @Cacheable("products", key = "#id")
    fun findById(id: Long): Product = ...    // 初回のみDB、2回目以降はキャッシュ

    @CacheEvict("products", key = "#id")
    fun update(id: Long, command: UpdateProductCommand): Product = ...   // 更新時に削除

    @CacheEvict("products", allEntries = true)
    fun refreshAll() { ... }   // 全削除
}
```

### 5-2. いつキャッシュを使うか

| 適している               | 適していない     |
|--------------------------|------------------|
| 読み取り頻度が高い       | 書き込みが多い   |
| 結果がしばらく変わらない | 常に最新値が必要 |
| 計算/DB問い合わせが重い  | 処理が軽い       |
| マスタデータ・参照系     | 注文・取引データ |

> **⚠ キャッシュは「整合性問題の温床」**
>
> 更新したのにキャッシュが古いまま返る、複数インスタンスでキャッシュがズレる、メモリ枯渇、など落とし穴も多い。**本当に必要な箇所だけ**に絞り、TTL(有効期限) を必ず設定すること。

### Ch.06 ログ・監視・メトリクス⏱ 60分

本番運用に必要な可視性の確保

### 6-0. ログのスタイル ─ テキストログとログ収集基盤の使い分け

本番ログをどう設計するかは、**システムの規模・運用体制・予算**によって変わります。**テキストログ**と**ログ収集基盤(構造化ログ)**は、対立する選択肢ではなく**規模に応じた使い分け**です。

> **📌 本研修で使うロギングライブラリ ─ Logback(Spring Boot のデフォルト)**
>
> Java/Kotlin のロギングライブラリには Logback、Log4j2、java.util.logging などがありますが、**Spring Boot のデフォルトは Logback**です。本研修もこれを使います。
>
> - **SLF4J**: ロギングの抽象化API(`LoggerFactory.getLogger(...)` など)。コードはこのAPIに対して書く
> - **Logback**: SLF4J の実装。実際のログ出力先(コンソール / ファイル / JSON 等) を担当
> - **logback-spring.xml**: ログのフォーマット・出力先・ローテーション等を設定するファイル(本章で書き方を扱う)
>
> Spring Boot は`spring-boot-starter`を入れた時点で Logback が自動的に組み込まれているため、追加の依存追加は不要です。本章のテキストログ・構造化ログ の両方とも、Logback の設定で実現します。

#### スタイル①: テキストログ ─ 単体システムや小規模で有用

サーバー1〜数台で運用する単体システムでは、**ファイルにテキスト形式で書き出す**従来型のログが十分に有用です。`tail -f` や `grep` で人間が直接読めるのが利点。

**テキストログの出力例**

    2026-05-14 10:23:45.123 INFO  [http-nio-8080-exec-3] o.t.OrderService - 注文確定 orderId=12345 userId=789
    2026-05-14 10:23:45.234 INFO  [http-nio-8080-exec-3] o.t.InventoryService - 在庫減算 productId=42 qty=2
    2026-05-14 10:23:45.345 WARN  [http-nio-8080-exec-3] o.t.PaymentService - 与信API レスポンス遅延 elapsed=2530ms
    2026-05-14 10:23:45.456 ERROR [http-nio-8080-exec-3] o.t.OrderService - 注文確定失敗 orderId=12345
        o.t.InventoryShortageException: 在庫不足: productId=42, needed=2, available=1
            at o.t.InventoryService.consume(InventoryService.kt:45)
            at o.t.OrderService.placeOrder(OrderService.kt:78)

**logback-spring.xml(テキストログ + ローテーション)**

```xml
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/app.log</file>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} %-5level [%thread] %logger{36} - %msg%n</pattern>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/app.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
            <maxFileSize>100MB</maxFileSize>
            <maxHistory>30</maxHistory>       <!-- 30日分保管 -->
            <totalSizeCap>3GB</totalSizeCap>   <!-- 合計3GB超えたら古いものから削除 -->
        </rollingPolicy>
    </appender>
    <root level="INFO">
        <appender-ref ref="FILE"/>
    </root>
</configuration>
```

> **✅ テキストログの良いところ**
>
> - **人間が直接読める**: `tail -f logs/app.log` でリアルタイム監視、`grep "ERROR"` で素早く異常検索
> - **追加ツール不要**: サーバーに SSH してログを見るだけ。インフラコストゼロ
> - **調査が直感的**: スタックトレースが連続した行で読める。「この時刻に何が起きたか」を時系列で追える
> - **軽量**: 構造化に比べて出力サイズが小さく、I/O 負荷も少ない

#### スタイル②: 構造化ログ + ログ収集基盤 ─ 中〜大規模で必要

マイクロサービス化、複数台サーバー、複数環境の運用になると、テキストログでは**「全サーバー横断で検索したい」「特定リクエストを最初から最後まで追いたい」「アラートを設定したい」**といった要望に応えられません。ここで**JSON形式の構造化ログ**を **ログ収集基盤(Elastic Stack / Loki / Datadog / CloudWatch Logs)**に集約する設計が登場します。

**構造化ログの出力例(JSON)**

    {"@timestamp":"2026-05-14T10:23:45.123Z","level":"INFO","logger":"o.t.OrderService","thread":"http-nio-8080-exec-3","message":"注文確定","orderId":12345,"userId":789,"requestId":"abc-123-def"}
    {"@timestamp":"2026-05-14T10:23:45.234Z","level":"ERROR","logger":"o.t.OrderService","message":"注文確定失敗","orderId":12345,"exception":"InventoryShortageException","requestId":"abc-123-def"}

> **✅ ログ収集基盤の良いところ**
>
> - **横断検索**: `level=ERROR AND requestId=abc-123-def` のようなクエリで、複数サーバー・複数サービスを横断検索
> - **集計・可視化**: ダッシュボードで「直近1時間のエラー率」「レスポンス時間の分布」を可視化
> - **アラート**: 「5分間に同じエラーが10回出たら通知」のような自動通知
> - **長期保管**: ファイルローテーションでなく、専用ストレージで数か月〜数年の保管
> - **分散トレーシング**: 1つのリクエストが複数サービスを跨いだ時の全経路を追跡

#### どちらを選ぶか? ─ 判断指針

| 観点         | テキストログ                           | ログ収集基盤(構造化)                             |
|--------------|----------------------------------------|--------------------------------------------------|
| システム規模 | サーバー 1〜数台、単体システム         | 複数サーバー、マイクロサービス、複数環境         |
| 運用体制     | SSH で直接見られる、専任担当者あり     | 運用チームと開発チームが分かれている             |
| 予算         | 追加コストほぼゼロ                     | 基盤の構築・運用コスト(SaaS なら従量課金)        |
| 調査方法     | tail / grep / awk で人間が対応         | UI 上でクエリ・ダッシュボード                    |
| 長期保管     | ローテーションで30日〜数か月           | 専用ストレージで数か月〜数年                     |
| アラート     | 外部ツール(Nagios等)と連携             | 基盤に組み込み                                   |
| 典型ユース   | 社内システム、小規模サービス、開発環境 | 本番のサービス、SaaS、複数サービスを跨ぐシステム |

> **💡 ハイブリッド ─ 両方やる構成も多い**
>
> 実際の本番システムでは、**テキストログをファイル出力しつつ、ログエージェント(Fluentd、Filebeat 等)が読み取って収集基盤に送る**ハイブリッド構成が多く採用されます。これで:
>
> - 緊急時はサーバーに SSH して直接ファイルを見る(基盤がダウンしても)
> - 普段は収集基盤の UI で横断調査
>
> の両方のメリットを享受できます。

#### 本研修での扱い

以降のセクションでは、**構造化ログ(JSON出力)**を中心に解説します(現代の Web アプリ開発で主流のため)。ただし、**テキストログでも上記の logback-spring.xml の例**で十分に運用できることを覚えておいてください。テキストログでも MDC(リクエストID付与) や ログレベルの使い分けは同じように使えます。

### 6-1. 構造化ログ ─ JSON で書く時代

中〜大規模の本番ログは**JSON形式**で出力し、ログ集約基盤(Elastic Stack、Datadog、CloudWatch等) で検索・集計するのが定石。

**logback-spring.xml**

```xml
<configuration>
    <springProfile name="prod">
        <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
            <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
        </appender>
        <root level="INFO">
            <appender-ref ref="JSON"/>
        </root>
    </springProfile>
</configuration>
```

#### Kotlin での Logger 取得パターン

**Logger.kt**

```kotlin
// パターン1: companion object
class OrderService {
    companion object {
        private val log = LoggerFactory.getLogger(OrderService::class.java)
    }
}

// パターン2: トップレベルの拡張プロパティ(より Kotlin らしい)
inline fun <reified T> T.logger(): Logger = LoggerFactory.getLogger(T::class.java)

class OrderService {
    private val log = logger()
}
```

#### MDC(Mapped Diagnostic Context) でトレース

リクエストごとに ID を振ってログに含めると、後から特定リクエストの全ログを追跡できる。

**RequestIdFilter.kt**

```kotlin
@Component
class RequestIdFilter : OncePerRequestFilter() {
    override fun doFilterInternal(
        req: HttpServletRequest, res: HttpServletResponse, chain: FilterChain
    ) {
        val id = req.getHeader("X-Request-Id") ?: UUID.randomUUID().toString()
        MDC.put("requestId", id)
        try {
            chain.doFilter(req, res)
        } finally {
            MDC.clear()
        }
    }
}
```

### 6-2. Spring Boot Actuator ─ 運用エンドポイント

Actuator は**運用向けエンドポイント**(ヘルスチェック、メトリクス、設定確認 等) を一発で追加できる仕組み。

**build.gradle.kts**

```groovy
implementation("org.springframework.boot:spring-boot-starter-actuator")
implementation("io.micrometer:micrometer-registry-prometheus")
```

**application.yml**

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
```

#### 主要エンドポイント

| エンドポイント         | 用途                             |
|------------------------|----------------------------------|
| `/actuator/health`     | ヘルスチェック(ロードバランサ用) |
| `/actuator/info`       | アプリ情報(バージョン等)         |
| `/actuator/metrics`    | JVM・HTTP・DB のメトリクス       |
| `/actuator/prometheus` | Prometheus 形式で公開            |

### 6-3. カスタムメトリクス(Micrometer)

業務固有の指標(注文数、エラー率、特定API のレスポンスタイム) も Micrometer で記録できる。

**CustomMetrics.kt**

```kotlin
@Service
class OrderService(
    private val meterRegistry: MeterRegistry,
) {
    private val orderCounter = meterRegistry.counter("orders.placed")
    private val orderAmountSummary = meterRegistry.summary("orders.amount")

    @Transactional
    fun placeOrder(req: PlaceOrderRequest): Order {
        val order = ...
        orderCounter.increment()
        orderAmountSummary.record(order.totalAmount().yen.toDouble())
        return order
    }
}
```

> **💡 メトリクスの3種類**
>
> - **Counter**: 増えるだけのカウンタ(注文数、エラー数)
> - **Gauge**: 現在値(キュー長、接続中ユーザー数)
> - **Timer / Summary**: 時間や値の分布(レスポンスタイム、注文金額)

### Ch.07 総合演習: 認証付き在庫API + 性能チューニング⏱ 60分

Day 4 で作った API に認証・性能改善・監視を追加する

### 7-1. 演習課題

Day 4 で作った商品API に、以下を追加してください。

1.  **JWT 認証**を実装する
    - `POST /api/auth/login` でログイン → JWT 発行
    - JWT がないリクエストは 401
    - 商品取得(GET)は誰でも、商品作成/更新/削除は `ROLE_ADMIN` のみ
2.  **注文API**を Aggregate 設計で実装
    - `Order` Aggregate Root + `OrderLine`
    - 確定済み注文には明細追加できない(`require` で防御)
    - `Money`、`Quantity`、`OrderId` を value class で表現
3.  **N+1 問題の解消**: 注文一覧で顧客名と明細を fetch join で取得
4.  **キャッシュ**: カテゴリマスタを `@Cacheable` で5分キャッシュ
5.  **メトリクス**: 注文回数・注文金額を Micrometer で記録、`/actuator/prometheus` で確認
6.  **監査ログ**: 注文確定時に `REQUIRES_NEW` で監査ログを別トランザクションで保存

> **📌 設計のヒント**
>
> レイヤーは Day 4 と同じ(Controller / Service / Domain / Entity / Repository)。Aggregate は Domain 層の中心に置く。Spring Security の設定は `SecurityConfig` を1ファイル追加。

### Ch.08 Git: 本日の成果を commit & push⏱ 15分

Day 5 を終える

### 8-1. Day 5 のまとめ

> **✓ 本日身につけたこと**
>
> - DDDの実装(Value Object / Aggregate / Domain Service)を Kotlin で書ける
> - Spring Security + JWT 認証・認可・CORS
> - @Transactional の伝搬・ロールバック・落とし穴
> - N+1問題の検出と解消(fetch join / @EntityGraph / @BatchSize)
> - Spring Cache(Caffeine)とキャッシュ戦略の考え方
> - 構造化ログ + MDC + Actuator + Micrometer

> **📅 Day 6 に向けて**
>
> 明日(Day 6)はサーバー側を一旦離れて、**フロントエンドの Vue 3** に入ります。React や Angular との比較、Composition API、リアクティビティ、コンポーネント、Pinia による状態管理 ─ 基礎を一通り押さえます。Day 7 で本日作った Spring Boot API と Vue を結合します。

## DAY 6 ─ Vue 3 基礎

サーバーサイドを離れて、フロントエンドの Vue 3 へ。React/Angular との位置づけ、Composition API、リアクティビティ、コンポーネント、ルーティング、状態管理(Pinia) ─ 業務系SPAを書くための基礎を1日で押さえる。

合計 9時間 前提: HTML/CSS/JavaScript の基礎 + TypeScript の経験(あると尚良し) 到達点: Vue 3 のSPAアプリを Composition API で書ける

### Ch.00 本日の目標と進め方⏱ 5分

Day 6 を終えた時に、何ができるようになっていれば良いか

### 0-1. 本日のゴール

- **Vue 3 と React/Angular との位置づけ**を説明できる
- Vue プロジェクトを Vite で**セットアップ**できる
- **テンプレート構文**(v-if / v-for / v-bind / v-on / v-model) を使いこなせる
- **Composition API** で `ref` / `reactive` / `computed` / `watch` を使い分けられる
- **コンポーネント間の通信**(props / emits / slots) を実装できる
- **Pinia** でグローバル状態を管理できる
- **Vue Router** でルーティングできる

**⚠ 本日の作業開始前に ─ 起動チェック**

**Day 6 は Vue 単体の演習が中心**。Vue dev server だけ起動できれば作業を進められますが、API 連携の動作確認をする場合は Spring Boot + Docker も起動が必要です。

| 必要なもの                        | 状態           | 確認方法                               |
|-----------------------------------|----------------|----------------------------------------|
| IntelliJ / JDK / Git              | 起動済み       | ─                                      |
| VS Code または IntelliJ(Vue 編集) | 起動済み       | (IntelliJ なら Vue.js プラグイン要)    |
| **Node.js 22(npm)**               | セット済み     | `node --version` → v22.x               |
| **Vue dev server(:5173)**         | 本日中に起動   | Ch.04 以降で `npm run dev`             |
| Docker / Spring Boot              | 章末で起動推奨 | API 連携の動作確認時に必要(Ch.06 以降) |

**本日の起動手順(Vue dev server)**

    # 初日(Day 6 最初の起動時)のみ実行
    $ cd C:\work\kotlin-training\frontend
    $ npm install   # 初回のみ、依存ライブラリのDL(2-3分)

    # 以降毎回
    $ npm run dev
    → VITE v5.x ready in 800 ms / Local: http://localhost:5173/

    # Vite HMR が効くので、起動したら .vue を編集する度に画面が自動更新される

### Ch.01 Vue 3 の世界へ⏱ 45分

React/Angularとの違い、Composition API、TypeScript の位置づけ

### 1-1. Vue とは ─ JavaScript フレームワークの位置づけ

Web フロントエンドの主要フレームワーク3つを並べると:

|                  | React          | Angular                    | Vue 3                          |
|------------------|----------------|----------------------------|--------------------------------|
| 開発元           | Meta(Facebook) | Google                     | コミュニティ(Evan You)         |
| 位置づけ         | UIライブラリ   | フルスタックフレームワーク | プログレッシブフレームワーク   |
| 記述             | JSX(JS拡張)    | HTML テンプレート + TS     | HTML テンプレート + JS/TS(SFC) |
| 学習曲線         | 中             | 急                         | 緩やか                         |
| 業務システム適性 | ○              | ◎(大規模)                  | ◎(中規模)                      |
| 日本での採用     | 多い           | 金融・SI 系で多い          | SI・受託で多い                 |

**📌 「フルスタック」「プログレッシブ」「UIライブラリ」とは**

表に出てくる3つの「位置づけ」は、**その技術がどこまでの機能をデフォルトで持っているか**を表します。Web アプリ開発に必要な部品を考えてみましょう:

- ① 画面の描画(コンポーネント・テンプレート)
- ② ルーティング(画面遷移、URL管理)
- ③ 状態管理(画面間で共有するデータ)
- ④ HTTP通信(APIアクセス)
- ⑤ フォーム・バリデーション
- ⑥ テスト、ビルド、開発サーバー

| 位置づけ                                | デフォルトで持つもの                                                                                      | 例え                                                          |
|-----------------------------------------|-----------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| **UIライブラリ(React)**                 | ①のみ。②〜⑥は外部ライブラリを選んで自分で組み合わせる                                                     | 「単品の調味料」 ─ 自分でレシピを組み立てる                   |
| **プログレッシブフレームワーク(Vue)**   | ①が中心だが、②〜⑥も公式またはコミュニティが用意した推奨ライブラリがある。必要なものだけ段階的に追加できる | 「組み合わせ自由なセットメニュー」 ─ 必要に応じて足していける |
| **フルスタックフレームワーク(Angular)** | ①〜⑥がすべて公式に統合済み。最初から「全部入り」                                                          | 「フルコースのコース料理」 ─ 出てきたものを順番に食べる       |

**「プログレッシブ」**(progressive=「段階的に進む」の意) は Vue の最大の特徴。**小さく始めて、必要に応じて機能を足していける**柔軟さを意味します。「最初は画面描画だけ Vue で、後からルーティングを足し、さらに状態管理を足す」といった段階的導入が可能。これが「学習曲線が緩やか」の理由でもあります。

> **📌 Vue を選ぶ理由(本研修)**
>
> - **学習曲線が緩やか**: HTML/CSS/JS の延長で書ける
> - **業務システム向きの機能が揃っている**: ルーティング、状態管理、フォーム、バリデーションのエコシステムが豊富
> - **TypeScript 対応**: Vue 3 は TypeScript ファーストで設計されている
> - **SFC(Single File Component)**: 1ファイルに HTML/CSS/JS を集約 = レビューしやすい

### 1-2. Vue 2 と Vue 3 の違い ─ Composition API の登場

Vue 3 では新しい書き方**「Composition API」**が導入されました。Vue 2 の「Options API」と比較して、ロジックの再利用性と TypeScript との相性が大きく向上しています。

Vue 2 / Options API(古い)

**OptionsApi.vue**

```vue
<script>
export default {
  data() {
    return { count: 0 }
  },
  computed: {
    doubled() { return this.count * 2 }
  },
  methods: {
    increment() { this.count++ }
  },
  mounted() { console.log('mounted') }
}
</script>
```

Vue 3 / Composition API(推奨)

**CompositionApi.vue**

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
const increment = () => { count.value++ }

onMounted(() => { console.log('mounted') })
</script>
```

> **✅ Composition API の利点**
>
> - **関連するロジックがまとまる**: data/computed/methodsで分散しない
> - **ロジックの再利用が容易**: 「composable(Hooks のような)」関数として切り出せる
> - **TypeScript と相性が良い**: 型推論が効きやすい
> - **this を使わない**: バインディングのハマりがない

本研修ではすべて **Composition API + \<script setup\>** 構文で進めます。

### 1-3. なぜ TypeScript を使うか

Day 1 で「Kotlin の Null安全は素晴らしい」と学びました。JavaScript には**静的な型がない**ため、コンパイル時に型エラーが検出されず、null/undefined が想定外の場所で送られてきて実行時にエラーになる ─ Java で頻発した NullPointerException と同じ問題がフロントでも起きていました。

**TypeScript** はこれを補完する型システム。JavaScript を**静的型付け**に拡張した上位互換言語で、Kotlin が Java に対して提供したものと同じ役割をします。

#### JavaScript と TypeScript の対比 ─ Kotlin と Java の対比(そっくり)

JavaScript ─ 型がない

**user.js**

```javascript
// 引数の型がコードから分からない
function greet(user) {
  return `Hello, ${user.name}!`
}

// どんな値でも渡せる(実行時にエラー)
greet(null)              // 実行時: Cannot read property 'name' of null
greet({ age: 30 })       // 実行時: undefined と表示される
greet("田中")             // 実行時: 文字列にnameはないので undefined
```

TypeScript ─ 型がある

**user.ts**

```typescript
// 引数の型を明示
interface User { name: string; age: number }

function greet(user: User): string {
  return `Hello, ${user.name}!`
}

// 型に合わないとコンパイルエラー(実行前に分かる)
greet(null)              // ✗ コンパイルエラー: 'null' は User 型ではない
greet({ age: 30 })       // ✗ コンパイルエラー: 'name' が不足
greet("田中")             // ✗ コンパイルエラー: string は User ではない
```

| 観点                      | JavaScript                 | TypeScript                                         |
|---------------------------|----------------------------|----------------------------------------------------|
| 型システム                | 動的(実行時に決まる)       | **静的**(コンパイル時に検証)                       |
| null / undefined の安全性 | どこにでも入り込める       | 明示的に `?` を付けないと入れられない(strict mode) |
| 関数のシグネチャ          | 引数・戻り値の型は不明     | 引数・戻り値の型を強制                             |
| IDE の補完                | 限定的(動的なので推測困難) | 強力(完全な補完・リファクタリング)                 |
| 実行時の動作              | そのまま実行可能           | JS にコンパイルされてから実行(型情報は消える)      |
| 導入コスト                | すぐ書ける                 | tsconfig.json と少しの学習が必要                   |

#### サーバー / フロントで対応する関係

| 役割                       | サーバー                              | フロント                                                  |
|----------------------------|---------------------------------------|-----------------------------------------------------------|
| 動的・歴史が長い言語       | Java                                  | JavaScript                                                |
| 静的・型安全・モダンな後継 | Kotlin                                | TypeScript                                                |
| 追加されたもの             | Null安全 / data class / 拡張関数 など | 型注釈 / interface / ジェネリクス / null安全(strict mode) |

> **✅ Kotlin と TypeScript の相性が良い理由**
>
> Spring Boot 側で **data class User(val name: String, val age: Int)** を定義すると、その型情報がそのまま TypeScript の **interface User { name: string; age: number }** に対応します。型ファースト同士なので、**API レスポンスの構造を両側で揃えやすく**、フロント・バック間の認識ズレが減ります。Day 7 では実際に Kotlin の data class と TypeScript の interface を対応させて API 連携します。

本研修では全コードを TypeScript で書きます。`<script setup lang="ts">` 構文を使用。

### Ch.02 プロジェクトセットアップ(Vite)⏱ 45分

Vite で爆速の開発体験

### 2-1. Vite ─ モダンなビルドツール

Vite(ヴィート、フランス語で「速い」)は Evan You(Vue 開発者) が作った**新世代のビルドツール**。Webpack の遅さを解決し、開発体験を劇的に向上させます。

| 特徴                        | Vite                               | Webpack                      |
|-----------------------------|------------------------------------|------------------------------|
| 起動時間                    | 数百ms(プロジェクト規模問わず)     | 数十秒(規模が大きいほど遅い) |
| HMR(Hot Module Replacement) | 瞬時(変更したファイルのみ再構築)   | 数秒                         |
| 仕組み                      | 開発時はブラウザのES Modulesを使う | すべてバンドルしてから提供   |
| ビルドツール                | esbuild + Rollup                   | Webpack                      |

### 2-2. プロジェクト作成 ─ ステップごとに確実に

> **💡 本章で作る day6-app と、研修ZIPの kotlin-training/frontend の関係**
>
> 本章では**Vite プロジェクトの作り方を一度体験する**ため、`day6-app` という新規プロジェクトを別フォルダに作ります。一方、Day 0 で配布された研修ZIP の `kotlin-training/frontend/` も**本章と同じ構成のスケルトン**になっています(plain Vue + Vue Router + Pinia + TypeScript)。
>
> 研修演習で実際にコードを書き足していくのは**`kotlin-training/frontend` の方**です(Day 6 のコンポーネント実装、Day 7 の API 連携など)。`day6-app` は「**npm create vue したらどんなプロジェクトができるか**」を確認するための学習用プロジェクトとして、研修中は残しておいて構いません。

#### 事前確認 ─ Node.js / npm の動作確認

Day 0 の環境構築で Node.js 22 LTS をインストール済みのはず。コマンドプロンプト(または PowerShell) を開き、まず動作確認します。

**事前確認(必ず実行)**

    # Node.js のバージョン確認(v22.x が出ればOK)
    $ node --version
    v22.22.1

    # npm のバージョン確認(v10.x が出ればOK)
    $ npm --version
    10.9.0

> **⚠ バージョンが古い場合の対処**
>
> - 「node が見つからない」「'node' は、内部コマンドまたは外部コマンドとして認識されていません」と出る → Node.js が未インストール、または PATH が通っていない。Day 0 の手順を再確認してください。
> - Node.js 20 以下が表示される → Day 0 の指示通り 22 LTS にアップグレードしてください。`npm create vue@latest` は Node.js 18+ が必須、22 が推奨です。

#### ステップ① 作業ディレクトリへ移動

研修用の作業フォルダ(例として `C:\work`、Mac/Linux なら `~/work`) に移動します。このフォルダがない場合は事前に作成してください。

**作業ディレクトリへ移動(Windowsの例)**

    # Windows のコマンドプロンプトの場合
    $ cd C:\work

    # 現在の場所を確認
    $ cd
    C:\work

    # Mac / Linux の場合
    $ cd ~/work
    $ pwd
    /Users/yourname/training

#### ステップ② Vue プロジェクトを作成

下記コマンドを実行し、対話形式の質問に答えます。**本研修では下表の通り選択**してください。

**プロジェクト作成**

    $ npm create vue@latest day6-app

    # Need to install the following packages:
    #   create-vue@3.x.x
    # Ok to proceed? (y) → y を入力して Enter

    Vue.js - The Progressive JavaScript Framework

    ? Project name: day6-app        # Enter で先頭値を採用
    ? Add TypeScript? Yes           # ←★ Y
    ? Add JSX Support? No           # ←★ N
    ? Add Vue Router for SPA? Yes   # ←★ Y(Day 6 Ch.7 で使う)
    ? Add Pinia for state management? Yes  # ←★ Y(Day 6 Ch.6 で使う)
    ? Add Vitest for unit testing? Yes     # ←★ Y
    ? Add an End-to-End Testing Solution? No  # ←★ N
    ? Add ESLint for code quality? Yes     # ←★ Y
    ? Add Prettier for code formatting? Yes  # ←★ Y

    Scaffolding project in C:\work\day6-app...

    Done. Now run:

      cd day6-app
      npm install
      npm run format
      npm run dev

#### ステップ③ 依存パッケージのインストール

**作成したプロジェクトに移動して、依存解決**

    # プロジェクトディレクトリに移動
    $ cd day6-app

    # 現在地確認(C:\work\day6-app になっているはず)
    $ cd
    C:\work\day6-app

    # 依存パッケージをダウンロード(初回 2〜3 分かかる)
    $ npm install
    added 200 packages, and audited 201 packages in 2m

> **💡 npm install が遅い / エラーが出たら**
>
> - 社内プロキシ環境の場合: Day 0 手順書の通り npm のプロキシ設定が必要。`npm config set proxy http://proxy.example.com:8080` など
> - 2分以上経っても動いている場合は正常。慌てず待つ
> - 「EACCES: permission denied」: 作業ディレクトリの権限を確認

#### ステップ④ 開発サーバー起動

**開発サーバー起動**

    $ npm run dev

      VITE v5.x.x  ready in 800 ms

      ➜  Local:   http://localhost:5173/
      ➜  Network: use --host to expose
      ➜  press h to show help

ブラウザで **<http://localhost:5173/>** にアクセスし、Vue のデフォルト画面が表示されれば成功です。

停止する時はターミナルで `Ctrl + C`(Mac は `control + C`)を押します。

### 2-3. ディレクトリ構成

**プロジェクトディレクトリ**

    day6-app/
    ├── index.html              # ← SPAのエントリ HTML
    ├── vite.config.ts          # ← Vite 設定
    ├── tsconfig.json
    ├── package.json
    ├── public/                 # ← 静的アセット(変換不要)
    ├── src/
    │   ├── main.ts            # ← アプリのエントリポイント
    │   ├── App.vue            # ← ルートコンポーネント
    │   ├── components/        # ← 再利用可能コンポーネント
    │   ├── views/             # ← ルーティング先のページ
    │   ├── stores/            # ← Pinia stores
    │   ├── router/            # ← Vue Router 設定
    │   ├── composables/       # ← 再利用可能なロジック(後述)
    │   ├── api/               # ← Spring Boot API クライアント
    │   ├── types/             # ← TypeScript 型定義
    │   └── assets/            # ← CSS、画像
    └── tests/

### 2-4. main.ts ─ アプリの起動

**main.ts**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

### Ch.03 テンプレート構文⏱ 75分

v-if / v-for / v-bind / v-on / v-model

### 3-0. そもそも「テンプレート」とは何か

Vue のテンプレート構文に入る前に、**「テンプレート」**という考え方を整理します。Java サーバーサイド開発を経験していれば、**JSP / Thymeleaf / FreeMarker**などで馴染みがある方も多いかもしれません(初めて聞く場合は、まずこの章で考え方を押さえれば大丈夫です)。

#### テンプレートエンジンの基本発想

**テンプレート**とは、**HTML に変数の埋め込みや、条件分岐・繰り返しを書ける拡張記法**のこと。普通の HTML は静的なテキストですが、テンプレートを使うと:

- 「ここに変数の値を埋め込みたい」 → `{{ name }}` のように書ける
- 「条件によって表示を切り替えたい」 → `v-if` のように書ける
- 「配列を回してリストを表示したい」 → `v-for` のように書ける

これを**テンプレートエンジン**(テンプレートを解釈してHTMLを生成する仕組み)が処理して、最終的にブラウザが理解できる普通のHTMLに変換します。

サーバーサイドのテンプレート(Thymeleaf 等)

**user.html(Thymeleaf)**

```html
<h1>こんにちは、名前さん</h1>

<p th:if="${user.isAdmin}">管理者です</p>

<ul>
  <li th:each="item : ${items}" th:text="${item.name}"></li>
</ul>

<!-- サーバーで HTML が組み立てられてからブラウザに送られる -->
```

Vue のテンプレート(クライアントサイド)

**User.vue**

```vue
<template>
  <h1>こんにちは、{{ user.name }}さん</h1>

  <p v-if="user.isAdmin">管理者です</p>

  <ul>
    <li v-for="item in items" :key="item.id">{{ item.name }}</li>
  </ul>
</template>

<!-- ブラウザで JS が動的に組み立てる -->
```

#### Vue のテンプレートは「HTML の拡張」

Vue のテンプレートは**普通のHTMLとして読める**のが特徴です。属性に `v-if` / `v-for` / `:src` などのディレクティブ(指示語) が混じっているだけで、構造は標準HTMLそのもの。これは:

- HTML エディタの補完が効く
- デザイナーや非エンジニアでも構造を読める
- 既存のHTML/CSS知識がそのまま使える

などの利点があります。

#### React の JSX との違い

もう一つの主流フレームワーク React は、**JSX** という独自記法を使います。JSX は「**HTMLっぽい記法を JavaScript の式として書ける**」もの。Vue のテンプレートとは方向性が逆です。

| 観点         | Vue テンプレート             | React JSX                        |
|--------------|------------------------------|----------------------------------|
| 本体         | HTML(にディレクティブを足す) | JavaScript(にHTMLっぽい式を足す) |
| 変数埋め込み | `{{ name }}`                 | `{name}`                         |
| 条件分岐     | `<p v-if="ok">OK</p>`        | `{ok && <p>OK</p>}`              |
| 繰り返し     | `<li v-for="...">`           | `{items.map(x => <li>...</li>)}` |
| 得意な人     | HTML/CSS が中心の人          | JavaScript中心の人               |

> **💡 ディレクティブとは**
>
> Vue のテンプレートで `v-` で始まる属性を **ディレクティブ**(directive、「指示語」) と呼びます。`v-if` / `v-for` / `v-bind`(短縮 `:`) / `v-on`(短縮 `@`) / `v-model` など。これらが「テンプレートに動的な振る舞いを足す」役目を担います。これからの章で、各ディレクティブを順に学んでいきます。

### 3-1. Mustache 構文 ─ {{ }}

**HelloWorld.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
const name = ref('World')
const count = ref(0)
</script>

<template>
  <h1>Hello, {{ name }}!</h1>
  <p>Count is {{ count }}, doubled is {{ count * 2 }}</p>
</template>
```

### 3-2. v-bind ─ 属性のバインド

**VBind.vue**

```vue
<script setup lang="ts">
const imageUrl = ref('/logo.svg')
const isActive = ref(true)
</script>

<template>
  <!-- 完全形 -->
  <img v-bind:src="imageUrl">

  <!-- 短縮形(コロンだけ) -->
  <img :src="imageUrl">

  <!-- 条件付きクラス -->
  <div :class="{ active: isActive, 'is-disabled': !isActive }">...</div>

  <!-- スタイル -->
  <div :style="{ color: 'red', fontSize: '14px' }">...</div>
</template>
```

### 3-3. v-on ─ イベントハンドリング

**VOn.vue**

```vue
<script setup lang="ts">
const count = ref(0)
const increment = () => count.value++
</script>

<template>
  <!-- 完全形 -->
  <button v-on:click="increment">+</button>

  <!-- 短縮形(@) -->
  <button @click="increment">+</button>

  <!-- インライン -->
  <button @click="count++">+</button>

  <!-- 修飾子 -->
  <form @submit.prevent="onSubmit">...</form>       <!-- preventDefault -->
  <input @keyup.enter="onEnter">                  <!-- Enterキーのみ -->
</template>
```

### 3-4. v-if / v-show / v-for

**Directives.vue**

```vue
<script setup lang="ts">
const isVisible = ref(true)
const status = ref('loading')
const items = ref([
  { id: 1, name: 'りんご', price: 150 },
  { id: 2, name: 'みかん', price: 100 },
])
</script>

<template>
  <!-- v-if: DOMから削除/追加 -->
  <p v-if="status === 'loading'">読み込み中...</p>
  <p v-else-if="status === 'error'">エラー</p>
  <p v-else>完了</p>

  <!-- v-show: display:none で隠す(頻繁にトグルする場合に効率的) -->
  <p v-show="isVisible">表示/非表示</p>

  <!-- v-for: リスト描画 -->
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }} - {{ item.price }}円
    </li>
  </ul>

  <!-- v-for with index -->
  <li v-for="(item, index) in items" :key="item.id">
    {{ index + 1 }}: {{ item.name }}
  </li>
</template>
```

> **⚠ v-for には必ず :key を付ける**
>
> Vue は `:key` で「どの要素がどれか」を識別する。`:key` がないと、リスト更新時に要素を誤って再利用してしまい、入力中のフォーム値が消えるなどのバグの原因に。**:key には DBの ID を使う**のが定番(index は最後の手段)。

### 3-5. v-model ─ 双方向バインディング

「JavaScript の変数 ↔ フォーム要素」の値を自動同期する仕組み。フォーム実装の超頻出。

**VModel.vue**

```vue
<script setup lang="ts">
const name = ref('')
const age = ref(0)
const agreed = ref(false)
const gender = ref('male')
const hobbies = ref<string[]>([])
</script>

<template>
  <!-- テキスト入力 -->
  <input v-model="name">
  <p>こんにちは、{{ name }}さん</p>

  <!-- 数値入力(.number 修飾子) -->
  <input v-model.number="age" type="number">

  <!-- チェックボックス -->
  <input v-model="agreed" type="checkbox">
  <p>同意: {{ agreed }}</p>

  <!-- ラジオボタン -->
  <input v-model="gender" type="radio" value="male">男性
  <input v-model="gender" type="radio" value="female">女性

  <!-- 複数チェックボックス -->
  <input v-model="hobbies" type="checkbox" value="sport">スポーツ
  <input v-model="hobbies" type="checkbox" value="reading">読書

  <!-- セレクト -->
  <select v-model="gender">
    <option value="male">男性</option>
    <option value="female">女性</option>
  </select>
</template>
```

**💡 v-model の中身**

v-model は `:value`(値のバインド) + `@input`(入力イベント) を1行で書ける**シンタックスシュガー**(syntactic sugar、構文糖)です。「シンタックスシュガー」とは、**本質的な機能は変わらないが、書きやすく / 読みやすくするための糖衣のような構文**のこと。下の2つは内部的には等価で、上の書き方の方が短くて読みやすい:

```
<input v-model="name">
<input :value="name" @input="name = $event.target.value">
```

#### v-model から API 送信まで ─ Servlet/JSP と何が違うか

Java EE / Spring MVC の従来型開発(**Servlet → JSP フォワード**) を経験している方は、v-model でフォーム入力された値が**どう Spring Boot 側の DTO に届くのか**イメージしにくいかもしれません。両者の流れを比較します。

［図（テキスト抽出）：従来型: Servlet → JSP フォワード(同期、サーバー主導) / ① ブラウザ: JSPフォーム / \<form action="/users/create" method="post"\>\<input name="name"\>\<input name="age"\>\</form\> / submit ボタンでページ全体が遷移 / ② HTTP POST(form-urlencoded形式でサーバーへ) / Content-Type: application/x-www-form-urlencoded body: name=山田&age=30 / ③ サーバー: Servlet / Controller がパラメータを取得 / String name = request.getParameter("name"); / // または Form Bean(DTO相当)に Spring …］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図3-1: Servlet/JSP 時代と、Vue + Spring Boot のデータの流れ比較

#### 各要素はどう対応するか

| 要素                 | 従来型(Servlet/JSP)                                                     | 現代(Vue + Spring Boot)                                                                        |
|----------------------|-------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| 入力UIの値の保持     | HTML form 自体が保持(submit するまで)                                   | Vue の**リアクティブ変数**(v-model で双方向同期)                                               |
| 送信のトリガー       | `<form>` の submit でページ遷移                                         | JS でボタンクリックハンドラ呼出 ─ 画面遷移しない                                               |
| 送信時のデータ形式   | `application/x-www-form-urlencoded`(`name=山田&age=30`)                 | `application/json`(`{"name":"山田","age":30}`)                                                 |
| サーバー側の受け取り | `request.getParameter("name")` で手動取得 or Form Bean に自動マッピング | `@RequestBody DTOクラス` ─ Jackson が JSON → Kotlin オブジェクトに自動変換                     |
| 処理先 URL の指定    | `<form action="/users/create">`                                         | JS で `axios.post("/api/users", form)` など、コード内で指定                                    |
| 処理ハンドラの紐付け | web.xml の URLマッピング、または `@RequestMapping`                      | Spring 側は同じ `@PostMapping("/api/users")` ─ **URL → メソッド の紐付けの仕組みは変わらない** |
| 処理後の画面         | サーバーが次の JSP に**フォワード**、または HTML を返却                 | サーバーは JSON だけ返す。Vue が結果を見て**画面を部分更新**(画面遷移なし)                     |

#### v-model から DTO までの「名前の対応」 ─ 実例

同じ「名前」というデータが、フロントエンドとバックエンドで**同じ名前で扱われる**のがポイントです。

**UserRegisterForm.vue(Vue 側)**

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import axios from 'axios'

// ① TypeScript で型を定義(Spring Boot 側の DTO と対応)
interface UserForm {
  name: string
  age: number
}

// ② リアクティブな変数として保持
const form = reactive<UserForm>({ name: '', age: 0 })

// ③ 送信処理
const onSubmit = async () => {
  const res = await axios.post('/api/users', form)
  // JSON body は { "name": "山田", "age": 30 } の形で送られる
}
</script>

<template>
  <input v-model="form.name" placeholder="名前">
  <input v-model.number="form.age" type="number" placeholder="年齢">
  <button @click="onSubmit">登録</button>
</template>
```

**UserController.kt(Spring Boot 側)**

```kotlin
// ④ JSON のキー名と一致するフィールドを持つ DTO を用意
data class CreateUserRequest(
    @field:NotBlank @field:Size(max = 50)
    val name: String,        // ← Vue 側の form.name と同じ "name"

    @field:Min(0) @field:Max(150)
    val age: Int,            // ← Vue 側の form.age と同じ "age"
)

// ⑤ URL とハンドラを @PostMapping で紐付け
@RestController
class UserController(private val userService: UserService) {
    @PostMapping("/api/users")
    fun create(@RequestBody @Valid req: CreateUserRequest): UserResponse {
        // ⑥ Jackson が JSON → CreateUserRequest に自動変換してくれる
        //    ↓ Service 層へ渡す(Day 4 で学んだ DTO → Domain → Entity の流れ)
        val user = userService.create(req)
        return user.toResponse()
    }
}
```

> **📌 ポイント整理**
>
> - **名前で繋がる**: `form.name`(Vue) → JSONの`"name"` → DTOの`name`。<u>名前が違うと自動マッピングできない</u>(必要なら Jackson の `@JsonProperty` で別名対応)
> - **URLの処理先は @PostMapping で決まる**: Vue 側の `axios.post('/api/users', ...)` と、Spring 側の `@PostMapping("/api/users")` が一致することで、リクエストがそのメソッドに届く
> - **バインドの実体**: 「v-model でリアクティブ変数に保持」「JSON でシリアライズして送信」「Jackson が DTO に自動デシリアライズ」 ─ <u>従来のように Servlet → JSP フォワードで「サーバーが画面を作って返す」のではなく、APIだけ呼んで結果は Vue が画面更新</u>
> - **DTO はそのまま Service → Domain → Entity へ**: Day 4 Ch.3-1 で学んだデータの旅と接続。Vue 側の form は、最終的に DB の Entity と同じ「論理データ」を表しているが、各層では別の姿(DTO / Domain / Entity) を取る

### Ch.04 リアクティビティ(ref / reactive / computed / watch)⏱ 90分

Vue の心臓部 ─ 状態が変わると自動的にUIが更新される仕組み

### 4-1. リアクティビティとは

Vue の中核は**「リアクティブな状態」**。データを変更すると、それを使っているテンプレートが**自動的に再描画**される仕組み。手で DOM を書き換える必要がない。

**Reactivity.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

// この関数が呼ばれて count.value が変わると、テンプレートが自動再描画される
const increment = () => { count.value++ }
</script>

<template>
  <p>Count: {{ count }}</p>
  <button @click="increment">+</button>
</template>
```

### 4-2. ref ─ プリミティブな値のリアクティブ化

**Ref.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'

// プリミティブ値
const count = ref(0)
const name = ref('Alice')
const isActive = ref(false)

// 配列・オブジェクトも入れられる
const items = ref(['apple', 'banana'])
const user = ref({ name: 'Alice', age: 30 })

// JS では .value でアクセス
count.value++
name.value = 'Bob'
items.value.push('cherry')
user.value.age = 31

// テンプレート内では .value 不要(自動アンラップ)
</script>

<template>
  <p>{{ count }}</p>        <!-- count.value ではなく count -->
  <p>{{ user.name }}</p>
</template>
```

> **⚠ .value の付け忘れに注意**
>
> JS コード内では `count.value`、テンプレート内では `count`。これが混乱の原因になりやすいので、最初は意識的に書き分けること。

### 4-3. reactive ─ オブジェクトのリアクティブ化

**Reactive.vue**

```vue
<script setup lang="ts">
import { reactive } from 'vue'

// reactive はオブジェクト/配列専用、.value 不要
const state = reactive({
  count: 0,
  user: { name: 'Alice', age: 30 },
})

state.count++           // .value 不要
state.user.age = 31     // ネストもリアクティブ
</script>
```

> **📌 ref vs reactive ─ どっちを使う?**
>
> - **ref を推奨**: 統一感がある、TypeScript の型推論が効きやすい、再代入できる
> - **reactive の弱点**: 「分割代入で reactivity が失われる」「再代入できない(オブジェクト全体の差し替え不可)」
>
> 本研修では **ref で統一**します(オブジェクトでも ref で OK)。

### 4-4. computed ─ 派生した値

他の状態から計算される値は `computed` で。Day 2 で学んだ「純粋関数」的な発想です。

**Computed.vue**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const firstName = ref('太郎')
const lastName = ref('山田')

// 派生した値
const fullName = computed(() => `${lastName.value} ${firstName.value}`)

// 商品一覧の合計金額
const items = ref([
  { name: 'りんご', price: 150, qty: 3 },
  { name: 'みかん', price: 100, qty: 5 },
])
const total = computed(() =>
  items.value.reduce((acc, it) => acc + it.price * it.qty, 0)
)
</script>

<template>
  <p>{{ fullName }} ({{ total }}円)</p>
</template>
```

> **💡 computed は依存に基づくキャッシュ**
>
> computed は「依存する状態が変わらない限り、再計算されない」(キャッシュされる)。同じ値が何回参照されても1回しか計算しない。重い計算でも安心して使える。

### 4-5. watch ─ 副作用を起こす

#### 「副作用」とは何か ─ プログラミング用語の意味

ここで言う**副作用(side effect)**は、日常会話の「薬の副作用(本来の効能と違う望まない作用)」とは違う意味の**プログラミング独自の専門用語**です。

> **📌 プログラミングにおける「副作用」**
>
> 関数や式の評価が、**入力を出力に変換する以外の影響**を外部に与えることを「副作用」と呼びます。具体的には:
>
> - **外部の状態を書き換える**(変数、グローバル変数、データベース更新)
> - **外部とやりとりする**(API呼び出し、ファイル書き出し、画面に表示、ログ出力)
> - **ブラウザのストレージに保存する**(後述)
>
> 例えば:
>
> - `add(a, b)` が `a + b` を返すだけなら**副作用なし**(純粋関数)
> - `add(a, b)` の中で `console.log(a)` したり `counter++` したりすると**副作用あり**
>
> Day 2 の「純粋関数 vs 副作用のある関数」 でも触れた概念です。Vue では、テンプレートの**表示計算には副作用を入れない**(computed を使う)、**副作用が必要な処理は watch に切り出す**、というのが基本パターンです。

#### ローカルストレージ(localStorage) とは

watch の例で出てくる **localStorage**(ローカルストレージ) は、**ブラウザに用意されたキー・バリュー型の永続ストレージ**です。「ローカル」=「そのブラウザ・そのPCの中だけ」という意味。

- **ブラウザを閉じても消えない**(`sessionStorage` は閉じると消えるが、`localStorage` は残る)
- **キーと文字列値のペア**で保存(`localStorage.setItem('key', 'value')`)
- **ドメインごとに分離**(他サイトからは読めない)
- **5〜10MB 程度**の容量制限

使い道の典型例: ログイン状態(JWT) の保存、入力中フォームの一時保存、ダークモード設定、最後に閲覧した画面など。**サーバー側のストレージとは別物**で、各ユーザーのブラウザに置かれているデータです。

#### watch ─ 値の変化をきっかけに副作用を起こす

`computed` は「他の値から派生した**値**を返す」もので、副作用は起こしてはいけません。一方、何かの値が変わったタイミングで**API呼び出し / ローカルストレージへの保存 / ログ出力**のような**副作用**を起こしたい時は `watch` を使います。

**Watch.vue**

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const query = ref('')
const results = ref<Product[]>([])

// query が変わるたびにAPI検索する
watch(query, async (newQuery) => {
  if (newQuery.length < 2) {
    results.value = []
    return
  }
  results.value = await productApi.search(newQuery)
})

// 即実行も可能
watch(query, (newVal, oldVal) => {
  console.log(`${oldVal} → ${newVal}`)
}, { immediate: true })

// 複数のソースを監視
watch([query, page], ([q, p]) => {
  // query または page が変わったら呼ばれる
})
</script>
```

**💡 computed vs watch ─ 使い分け**

|        | computed           | watch                       |
|--------|--------------------|-----------------------------|
| 用途   | 派生した値を返す   | 副作用を起こす              |
| 戻り値 | あり(参照される)   | なし                        |
| 例     | 合計金額、税込価格 | APIコール、localStorage保存 |

### Ch.05 コンポーネント(props / emits / slots)⏱ 90分

UIを再利用可能な部品に分割する

### 5-0. コンポーネントとは ─ そして「親子関係」「カード」とは

Vue(および React / Angular) で UI を作る時の**基本単位**が「コンポーネント」です。Ch.5 では `ProductCard.vue`、`Card.vue` といったコンポーネントが多く登場するので、まずコンポーネントの基本概念と、本章で使う用語を整理します。

#### コンポーネントとは

**コンポーネント**は、**「UIの一部品」を1つにまとめた再利用可能なブロック**です。ボタン、フォーム、商品カード、ヘッダー、サイドバー…これら一つひとつをコンポーネントとして作り、組み合わせて画面を構築します。Vue では1コンポーネント = 1ファイル(`.vue` ファイル) として書きます。

#### 「カード」とは ─ UIデザインパターン

Web UIの世界で**「カード」**(card) とは、**「情報を四角い枠で囲って、一塊として見せるUIパターン」**のことです。Bootstrap、Material Design など主要なUIライブラリで標準化されている表現です。

- 商品一覧の「各商品」(画像+名前+価格+ボタン)
- ユーザープロフィール表示(アバター+名前+所属)
- ダッシュボードの統計カード(KPI 1個ごと)

などが典型例。本章で出てくる `ProductCard.vue` は「商品1件分のカード」、`Card.vue` は「汎用的なカード枠」 という意味です。

**📌 カードと DB レコードの対応関係**

業務システムでは、UI のカードと DB のレコードは**ほぼ 1:1 に対応する**のが基本です。これは偶然ではなく、**「業務的に1つの単位として扱うデータ」を、DB でも UI でも1つの単位として表現する**からです。

| 画面                                  | UIの表示                                                            | DB との対応                                                 |
|---------------------------------------|---------------------------------------------------------------------|-------------------------------------------------------------|
| **1件の参照画面**(例: 商品詳細ページ) | カード 1個 を画面いっぱいに表示(または大きめに表示)                 | カード 1個 ↔ **レコード 1件**(SELECT で id 指定)            |
| **一覧画面**(例: 商品一覧ページ)      | カードを**行(または格子)として並べて表示**。20件あれば 20枚のカード | カード 1枚 ↔ 1レコード。一覧 ↔ **SELECT の結果セット**(N件) |
| **編集フォーム画面**                  | カード形式の入力フォーム 1個                                        | カード ↔ 編集対象の **1レコード**(SELECT → 編集 → UPDATE)   |

図5-1で「ProductCard が3個並んでいる」のはまさにこの構造 ─ **DB の product テーブルから取得した3件のレコードを、それぞれ別のカードコンポーネントとして表示**している姿です。Vue の `v-for` でレコードを回しながら、1レコードずつ ProductCard に渡す ─ これが業務システムでよく使うパターン。

つまり、**「データの粒度」(レコード) と「UIの粒度」(カード) が揃っている**と、設計が直感的になります。Day 7 で API から商品一覧を取得して画面に並べる時、この構造をそのまま実装します。

#### コンポーネントの「親子関係」とは

コンポーネントは**入れ子(ネスト)構造**になります。「商品一覧ページ」というコンポーネントが、その中に「商品カード」コンポーネントを並べて表示する ─ といった構造です。この時、外側を**親コンポーネント**、内側を**子コンポーネント**と呼びます。

［図（テキスト抽出）：App.vue(アプリ全体のルート) / Header.vue(子) / アプリの上部 / Logo.vue / NavBar.vue / ProductListView.vue(子) / 商品一覧画面 / 中で「商品の数だけ」並べる: / ProductCard.vue / (商品1: りんご) / ProductCard.vue / (商品2: みかん) / ProductCard.vue / (商品3: ぶどう) / ↑ 同じ ProductCard を3回使い回している(再利用) / ↑ 各カードへのデータ(名前・価格) は 親 → 子 で渡す = props］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図5-1: コンポーネントの親子関係 ─ 外側のコンポーネントが内側のコンポーネントを「含む」

#### なぜ親子の概念が必要か

- **再利用**: ProductCard を1回作れば、商品が100個あっても同じカードを使い回せる
- **関心の分離**: 「カードのデザイン」は ProductCard.vue だけで完結し、親はデータを渡すだけ
- **大規模アプリの管理**: 1ファイルが何千行にもならず、機能ごとに小さなコンポーネントに分けられる
- **テストの容易さ**: 各コンポーネントを個別にテストできる

#### 親子間のデータの流れ(これからの章の予告)

親子の関係ができると、両者でデータをやりとりする方法が必要になります。Vue では**方向ごとに専用の仕組み**が用意されています:

- **親 → 子へデータを渡す** = **props**(5-2 で扱う)
- **子 → 親へイベント通知** = **emits**(5-3 で扱う)
- **親が子の中に任意のコンテンツを差し込む** = **slots**(5-4 で扱う)

#### 本章で出てくる Vue 用語の早見表 ─ 馴染みのアナロジーで

| Vue 用語           | 意味                                              | 馴染みのある概念で言うと                                                                       |
|--------------------|---------------------------------------------------|------------------------------------------------------------------------------------------------|
| **コンポーネント** | UIの一部品。`.vue` ファイル1つ                    | **関数 / クラス** ─ 「再利用可能な処理のかたまり」                                             |
| **props**          | 親 → 子へ渡す値。子は書き換え不可                 | **関数の引数** ─ 呼び出し元から渡される値、関数内では値を変えない                              |
| **emits**          | 子 → 親へイベント通知                             | **コールバック関数の呼び出し** ─ 「これが起きたよ」と親に伝える                                |
| **slots**          | 親が子の中に任意のコンテンツを差し込む口          | **テンプレートの空欄** ─ 電子レンジの中に何を入れるかは利用者の自由                            |
| **scoped CSS**     | そのコンポーネントだけに効くCSS                   | **関数のローカル変数** ─ 他に漏れない / 他からの影響も受けない                                 |
| **composable**     | ロジックを `use〇〇()` 関数として切り出して再利用 | **ユーティリティ関数**の Vue 版 ─ Kotlin の拡張関数や Day 1 で学んだ「関数切り出し」と同じ発想 |
| **ref / reactive** | 変化を追跡できる値(変えるとUIも更新)              | **監視可能なフィールド** ─ 値の変更を周りが感知できる箱                                        |
| **computed**       | 他のリアクティブな値から自動計算される値          | **Excelの計算式セル** ─ 元のセルが変わると自動再計算                                           |

では、この用語の地図を頭に入れた状態で、5-1 から具体的な書き方を見ていきます。

### 5-1. SFC(Single File Component) の構造

Vue は1つの `.vue` ファイルに、**テンプレート(HTML)**・**ロジック(TypeScript または JavaScript)**・**スタイル(CSS)**の3つを書きます。これが SFC(Single File Component) 構造です。本研修では `<script setup lang="ts">` で TypeScript を使用します。

**ProductCard.vue**

```vue
<script setup lang="ts">
// JS/TS ロジック
interface Props {
  name: string
  price: number
}
const props = defineProps<Props>()
</script>

<template>
  <!-- テンプレート -->
  <div class="card">
    <h3>{{ props.name }}</h3>
    <p>{{ props.price }}円</p>
  </div>
</template>

<style scoped>
/* このコンポーネントだけに効く CSS */
.card { padding: 16px; border: 1px solid #ccc; }
</style>
```

> **📌 scoped CSS**
>
> `<style scoped>` を付けると、CSS が**このコンポーネントのみ**に効く(他のコンポーネントには影響しない)。Vue が自動的にユニークな属性を付与して限定する仕組み。大規模アプリで CSS の衝突に悩まされない。

### 5-2. props ─ 親から子へのデータ伝達

**Parent.vue**

```vue
<script setup lang="ts">
import ProductCard from './ProductCard.vue'
const products = ref([
  { id: 1, name: 'りんご', price: 150 },
  { id: 2, name: 'みかん', price: 100 },
])
</script>

<template>
  <ProductCard
    v-for="p in products"
    :key="p.id"
    :name="p.name"
    :price="p.price"
  />
</template>
```

> **⚠ props は 親から子への一方向**
>
> 子コンポーネントから props を直接書き換えてはいけない(コンソール警告)。値を更新したい時は emits で親に通知する(次節)。これは Day 2 で学んだ「イミュータブル」の発想と同じ ─ 自分が受け取ったものを書き換えない。

### 5-3. emits ─ 子から親へのイベント通知

**ProductCard.vue(子)**

```vue
<script setup lang="ts">
interface Props { id: number; name: string; price: number }
const props = defineProps<Props>()

// 親に通知するイベントを宣言
const emit = defineEmits<{
  (e: 'add-to-cart', productId: number): void
  (e: 'remove', productId: number): void
}>()

const addToCart = () => emit('add-to-cart', props.id)
</script>

<template>
  <div>
    <h3>{{ name }}</h3>
    <button @click="addToCart">カートに追加</button>
  </div>
</template>
```

**Parent.vue(親)**

```vue
<template>
  <ProductCard
    v-for="p in products"
    :key="p.id"
    :id="p.id"
    :name="p.name"
    :price="p.price"
    @add-to-cart="onAddToCart"           <!-- 子のイベントを購読 -->
  />
</template>
```

### 5-4. slots ─ コンポーネント内のスロット

「カードの外枠は共通だけど、中身は呼び出し側で自由に書きたい」という時に使うのが **slot**。

**Card.vue(汎用カード)**

```vue
<template>
  <div class="card">
    <div class="card-header">
      <slot name="header">デフォルトヘッダ</slot>
    </div>
    <div class="card-body">
      <slot></slot>          <!-- デフォルトスロット -->
    </div>
  </div>
</template>
```

**使う側**

    <Card>
      <template #header>
        <h2>ユーザー情報</h2>
      </template>

      <p>名前: 山田太郎</p>
      <p>年齢: 30歳</p>
    </Card>

### 5-5. composable ─ ロジックの再利用

Day 1 で学んだ「関数の切り出し」と同じ発想で、Vue のロジックも**関数として切り出せる**。これを**composable**と呼びます。慣習として `use` で始まる関数名にします。

**composables/useCounter.ts**

```typescript
import { ref, computed } from 'vue'

export function useCounter(initial = 0) {
  const count = ref(initial)
  const doubled = computed(() => count.value * 2)
  const increment = () => { count.value++ }
  const reset = () => { count.value = initial }
  return { count, doubled, increment, reset }
}
```

**使う側**

    <script setup lang="ts">
    import { useCounter } from '@/composables/useCounter'

    const { count, doubled, increment, reset } = useCounter(10)
    </script>

### Ch.06 状態管理 Pinia 入門⏱ 60分

複数コンポーネント間で共有する状態

### 6-1. そもそも状態管理ライブラリとは何か

#### 「状態」とは何か ─ 「データ」との関係

これまで Ch.5 で学んだ `props`(親→子) と `emits`(子→親) で、隣り合うコンポーネント間のデータ共有はできます。しかし業務アプリでは:

- **ログイン中のユーザー情報** ─ ヘッダー、サイドバー、各画面のあちこちで参照したい
- **カート情報** ─ 商品一覧、商品詳細、カート画面、ヘッダー(個数表示) で共有したい
- **選択中のフィルタ条件** ─ 親画面で設定したら、子の表やグラフがそれを参照

のように、**「画面のあちこちから共通して触りたいデータ」**が出てきます。これらを**「状態(state)」**と呼びます。

**📌 「データ」と「状態」は対の概念ではなく、特性に応じた呼び分け**

「データ」と「状態」を別物のように対比したわけではありません。**どちらも『アプリが扱っているデータ』**ですが、特に下記の特性を持つものを「状態(state)」と呼ぶ習慣があります。

|            | 「データ」 と呼ぶことが多いもの | 「状態(state)」と呼ぶことが多いもの                          |
|------------|---------------------------------|--------------------------------------------------------------|
| 変化するか | あまり変わらない、固定的        | **時間で変わる**(ユーザー操作・API応答・タイマーで)          |
| 誰が見るか | 1か所で表示                     | **複数のコンポーネントが見たり書いたりする**                 |
| 例         | 商品マスタの内容、定数、文言    | ログイン状態、カートの中身、現在のページ、フォーム入力中の値 |

つまり、**「複数の場所から触られて、時間とともに変化する」データ ─ これが状態**です。これを各コンポーネントが好き勝手に書き換えると追跡できなくなるので、**1か所に集めて管理する**のが状態管理ライブラリの役目。

> **📌 アナロジー: ホテルのフロントデスク**
>
> 各部屋(コンポーネント) が、お互いに直接やりとりするのは大変。代わりに**フロントデスク(状態管理ストア)**に「現在の予約状況」「お客様情報」「料金プラン」を全部管理させ、各部屋はフロントに問い合わせる ─ こうすると情報の流れがシンプルで、変更も追跡しやすくなります。これが状態管理ライブラリの発想です。

#### props/emits で頑張ると何が困るか

もし状態管理ライブラリを使わずに、props/emits だけでログインユーザー情報を扱おうとすると:

- App.vue で user を取得 → Header.vue へ props で渡す
- App.vue で user を取得 → MainView → ProductList → ProductCard へ props を**4階層**バケツリレー
- ユーザー情報を更新したい時、子から emits を5階層下から上に伝搬…

これを **props drilling(プロップス バケツリレー)** と呼びます。すぐにコードが煩雑になります。

#### Vuex から Pinia へ ─ Vue の状態管理の変遷

**Vuex** は Vue 2 時代(2014年〜)に登場した公式の状態管理ライブラリで、長らくVueエコシステムの標準でした。しかし下記の問題がありました:

- **API が複雑**: state / getters / mutations / actions の4種類を意識する必要があった(**mutations** という同期処理専用の層が冗長)
- **TypeScript との相性が悪い**: 文字列ベースの API で型推論が効きにくかった
- **Composition API との親和性が低い**: Vue 3 の新パラダイムと噛み合わない

これを解決すべく登場した次世代ライブラリが **Pinia**(2021年〜)。**Vuex の作者(Vue コアチーム) が Vuex 5 として企画していたものが、Pinia として独立し、現在は<u>Vue 公式が推奨する状態管理ライブラリ</u>**になっています。

| 観点           | Vuex(Vue 2 時代)                     | Pinia(現代)                                       |
|----------------|--------------------------------------|---------------------------------------------------|
| 概念の数       | 4種(state/getters/mutations/actions) | 3種(state/getters/actions) ─ **mutations を廃止** |
| 状態の変更方法 | 必ず mutations を経由(冗長)          | actions から直接書き換えOK                        |
| TypeScript     | 後付け、補完が弱い                   | **TypeScript ファースト**、型推論が完全           |
| store の分割   | 「モジュール」概念があり複雑         | store ごとに別ファイル = シンプル                 |
| 記述量         | 多い(ボイラープレート多め)           | 少ない(Composition API ライクに書ける)            |
| Vue 3 推奨度   | 非推奨(Vuex 4 で Vue 3 対応はしたが) | **公式推奨**                                      |

#### 他フレームワークの状態管理ライブラリと比較

| フレームワーク | 定番ライブラリ           | 備考                                          |
|----------------|--------------------------|-----------------------------------------------|
| Vue 3          | **Pinia**(公式推奨)      | 本研修で使う                                  |
| Vue 2          | Vuex                     | 前身。新規では使わない                        |
| React          | Redux / Zustand / Recoil | Redux は同世代の元祖だが冗長、Zustandが現代的 |
| Angular        | NgRx                     | Redux 系                                      |

> **💡 状態管理ライブラリが必要になるタイミング**
>
> すべての Vue プロジェクトで必須ではありません。判断基準:
>
> - **必要**: 中規模以上のSPA、認証情報が全画面に必要、カートや通知のような全画面で共有するデータがある
> - **不要**: 小規模なツール、画面が1〜2個、状態がローカルに閉じている
>
> 本研修では「業務システムを作る」想定なので、Pinia を採用します。

### 6-2. Pinia の store を作る

#### store とは ─ 状態と操作をまとめた箱

Pinia の**store(ストア)**は、**「ある1つのテーマに関する、状態(データ) と それを操作するロジックをまとめたもの」**です。コンポーネントとは別の場所に置かれ、複数のコンポーネントから自由に参照・更新できます。

1つのアプリの中に、テーマごとに**複数の store** を作るのが普通です:

- **auth store**: ログインユーザー情報、トークン、ログイン/ログアウト処理
- **cart store**: カートの中身、合計金額、商品追加/削除処理
- **product store**: 商品一覧キャッシュ、検索条件、取得処理
- **notification store**: 通知メッセージ一覧、通知の追加/削除

店舗のレジ・棚卸し・台帳が役割ごとに分かれているのと同じ発想です。テーマが違う情報は別 store にすることで、各 store がシンプルに保てます。

#### store の3つの構成要素 ─ state / getters / actions

Pinia の store は**3つの構成要素**からなります。これは Vuex 時代からの「state / getters / mutations / actions」から**mutations を取り除いた**シンプルな構成です。

| 要素                        | 役割                                        | 例(カート店舗で例えると)                     | Pinia での書き方                    |
|-----------------------------|---------------------------------------------|----------------------------------------------|-------------------------------------|
| **state**(状態)             | 保持するデータそのもの                      | レジに置かれた「カートの中身リスト」         | `const items = ref([])`             |
| **getters**(計算プロパティ) | state から派生した値(キャッシュ付き)        | 「合計金額」「商品の総点数」(レジが自動計算) | `const total = computed(() => ...)` |
| **actions**(操作)           | state を変更するメソッド。API呼び出しもここ | 「商品をカートに入れる」「全部空にする」処理 | 普通の関数                          |

**📌 コンポーネントとの違い ─ なぜ store が必要か**

「state + getters + actions の組み合わせ」は**コンポーネントとよく似ています**(コンポーネントも ref / computed / 関数を持つ)。違いは:

|                      | コンポーネント                           | store                                                |
|----------------------|------------------------------------------|------------------------------------------------------|
| 主な役割             | UI(画面の見た目+ふるまい)                | データと操作の保管庫(UIに紐づかない)                 |
| テンプレートを持つか | 持つ(`<template>`)                       | 持たない                                             |
| 誰が使うか           | 親コンポーネントが使う(props で渡される) | どのコンポーネントからも自由に使える                 |
| インスタンス         | 使うたびに新しいインスタンス             | **1つだけ**(シングルトン) ─ どこから使っても同じ実体 |

つまり store は「**UIを持たない、アプリ全体で1つだけ存在する共有データ置き場**」と考えてください。

#### 実装例 ─ カート store

カートの中身を管理する store を見てみます。`state(``items``) + getters(``totalCount / totalAmount``) + actions(``add / remove / clear``)` の構造です。

**stores/cart.ts**

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// カートに入っている1件のデータの型(=DBレコードと対応する単位)
export interface CartItem {
  productId: number
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', () => {

  // ─────────────────────────────────────────────
  // ① state(状態) ─ 時間とともに変化する「状態」のデータ
  // ─────────────────────────────────────────────
  // カート全体の中身を保持する配列。ユーザー操作で増減 → 「状態(state)」
  // 複数の画面(商品一覧、ヘッダー、カート画面)から見られる共有データ
  const items = ref<CartItem[]>([])

  // ─────────────────────────────────────────────
  // ② getters(派生値) ─ state から計算される値、Excelの計算式セルのイメージ
  // ─────────────────────────────────────────────
  // items が変わると自動再計算される(キャッシュも効く)
  const totalCount = computed(() =>        // 合計点数
    items.value.reduce((s, it) => s + it.quantity, 0)
  )
  const totalAmount = computed(() =>       // 合計金額
    items.value.reduce((s, it) => s + it.price * it.quantity, 0)
  )

  // ─────────────────────────────────────────────
  // ③ actions(操作) ─ state を変更するメソッド
  // ─────────────────────────────────────────────
  // 「カートに入れる」操作: 既存ならquantity加算、なければ新規追加
  const add = (product: CartItem) => {
    const existing = items.value.find(it => it.productId === product.productId)
    if (existing) existing.quantity += product.quantity
    else items.value.push(product)
  }
  // 「カートから外す」操作
  const remove = (productId: number) => {
    items.value = items.value.filter(it => it.productId !== productId)
  }
  // 「全部空にする」操作(注文確定後など)
  const clear = () => { items.value = [] }

  // state / getters / actions を全部公開 ─ コンポーネントから使えるようにする
  return { items, totalCount, totalAmount, add, remove, clear }
})
```

### 6-3. store を使う

**CartView.vue**

```vue
<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
</script>

<template>
  <h2>カート({{ cart.totalCount }}件)</h2>
  <ul>
    <li v-for="item in cart.items" :key="item.productId">
      {{ item.name }} × {{ item.quantity }}
      <button @click="cart.remove(item.productId)">削除</button>
    </li>
  </ul>
  <p>合計: {{ cart.totalAmount }}円</p>
</template>
```

> **✅ Pinia の良いところ**
>
> - **TypeScript ファースト**: 型推論がほぼ完全に効く
> - **シンプルな API**: Vuex より遥かにシンプル(mutations 不要)
> - **devtools 対応**: ブラウザ拡張で状態の変化を時系列で追える
> - **SSR 対応**: サーバーサイドレンダリングでも使える

### Ch.07 Vue Router(ルーティング)⏱ 60分

SPA で複数ページを実現する

### 7-1. そもそも SPA とは ─ そしてなぜルーティングが必要か

#### 従来の Web(MPA) と SPA の違い

本章のテーマである **Vue Router** は**SPA** (Single Page Application) のルーティングを担うライブラリです。「ルーティング」を理解するには、まず**SPA とは何か**を押さえる必要があります。

| 観点           | 従来の Web (MPA)                                       | SPA (Single Page Application)                           |
|----------------|--------------------------------------------------------|---------------------------------------------------------|
| 正式名         | Multi-Page Application(多ページ型)                     | Single Page Application(単一ページ型)                   |
| 画面遷移時     | サーバーが**毎回新しい HTML を生成**してブラウザに返す | **最初に1回 HTML を取得**、以降は JS が画面を切り替える |
| サーバー側     | 各ページ用の HTML を返す処理が必要                     | API(JSON) を返すだけ。HTML 生成は不要                   |
| 初回ロード     | 軽い(1ページ分)                                        | 重い(JS 一式をダウンロード)                             |
| 画面切替の速さ | 毎回ページ全体を再描画(遅い、ちらつく)                 | JS が DOM を差分更新(高速、ちらつかない)                |
| 典型例         | 従来の Spring MVC + Thymeleaf、WordPress、楽天市場     | Gmail、Twitter、Notion、本研修で作る Vue アプリ         |

#### SPA のメリット

- **画面切替が高速**: ページ全体の再ロードがないので、ボタン1クリックでサクッと切り替わる
- **サーバー負荷の軽減**: API だけ返せばよく、HTML 生成のコストがない
- **リッチなUX**: 部分的な再描画、アニメーション、ドラッグ&ドロップなどが滑らかに実現できる
- **フロントとバックを完全分離**: Vue(フロント) と Spring Boot(API) を独立にデプロイ・スケール可能

#### SPA のデメリット

- **初回ロードが重い**: JS 一式(数百KB〜数MB) をまずダウンロードする必要
- **SEO が難しい**: 最初は HTML が空っぽなので、検索エンジンに認識されにくい(SSR / SSG で対策可能)
- **ブラウザ標準の挙動を自前で実装する必要がある** ─ この問題を解決するのが Vue Router!

#### SPA でルーティングが必要な理由

従来の MPA では、サーバーが URL ごとに別の HTML を返してくれていました。ブラウザの**戻る・進むボタン**、**ブックマーク**、**URL のシェア**はすべて URL のやり取りで自然に動いていました。

しかし SPA は HTML が1つしかなく、画面切替は JS が制御します。何もしないと:

- URL が変わらない → ブラウザの**戻るボタンが効かない**
- URL でブックマークしても、リロードすると**常に最初の画面に戻ってしまう**
- URL を友達にシェアしても、相手は別の画面を見ることになる

これは Web として致命的に使いにくい。そこで**ルーティングライブラリ**(Vue Router) の出番です。Vue Router は:

- **URL とコンポーネントを対応付ける**(`/products` → 商品一覧コンポーネント、`/products/123` → 商品詳細コンポーネント)
- **ブラウザの History API を使って URL を書き換える**(リロードせずに URL を変える)
- **戻る・進むボタンが正しく動くようにする**
- **認証ガード**などのページ遷移時のフック処理を提供

つまり Vue Router は、**SPA でも「普通の Web サイトと同じ使い心地」を実現する**ためのライブラリです。

［図（テキスト抽出）：従来型 MPA: 画面遷移ごとにサーバーから新しいHTMLを取得 / ① ブラウザ: 商品一覧画面を表示中 / URL: /products 画面: 商品一覧の HTML(サーバーが生成して返したもの) / 商品リンクをクリック → ブラウザがサーバーへリクエスト / ② サーバー(Spring MVC + JSP): URLに対応する新しいHTMLを生成 / /products → product-list.jsp /products/123 → product-detail.jsp /login → login.jsp / 生成済みHTMLを返却 / ③ ブラウザ: ページ全体を破棄して新しいHTMLで再描画 / URL: /products/123 画面: 商品詳細の HTML(全画面ちらつき、ヘッダーも一旦消える) / ④ 別の画面に遷移するたびに ①〜 …］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図7-1: 従来型 MPA と SPA + Vue Router の画面遷移の違い

> **📌 ご指摘の通り、SPA の「画面遷移」はテンプレート切替の演出**
>
> SPA における画面遷移は、**従来の「サーバー側で新しいHTMLを生成して送る」遷移ではなく、Vue が `<RouterView />` の中身を別のコンポーネントに差し替える**ことで実現しています。同じHTMLの中で部分的にDOMを差し替えているだけ。
>
> - **URL**: 見た目は普通の遷移と同じく変わる(ブラウザの History API で書き換える)
> - **戻る・進むボタン**: Vue Router が History API と連携するので普通に動く
> - **サーバー側**: API(JSON) を返すだけで、HTML を生成し直すことはない
> - **ブラウザの再描画**: 全画面ではなく `<RouterView />` の中身だけ。ヘッダーやサイドバーは保持される
>
> このため、「画面遷移したかのように見えるが、実体は同じ HTML の中でコンポーネントが入れ替わっているだけ」 と理解するのが正確です。

### 7-2. ルート定義

**router/index.ts**

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ProductListView from '@/views/ProductListView.vue'
import ProductDetailView from '@/views/ProductDetailView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/products', name: 'products', component: ProductListView },
    { path: '/products/:id', name: 'product-detail', component: ProductDetailView, props: true },
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/admin',
      component: () => import('@/views/AdminLayout.vue'),     // 遅延ロード
      meta: { requiresAuth: true, roles: ['ADMIN'] },
      children: [
        { path: 'users', component: () => import('@/views/admin/UserList.vue') },
      ],
    },
  ],
})

export default router
```

### 7-3. テンプレートでナビゲーション

**App.vue**

```vue
<template>
  <nav>
    <RouterLink to="/">ホーム</RouterLink>
    <RouterLink to="/products">商品一覧</RouterLink>
    <RouterLink :to="{ name: 'product-detail', params: { id: 1 } }">
      商品1
    </RouterLink>
  </nav>

  <!-- ここに現在のルートに対応するコンポーネントが描画される -->
  <RouterView />
</template>
```

### 7-4. プログラマティックな遷移

**useRouter.vue**

```vue
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 現在のパス/パラメータ
console.log(route.path)        // /products/123
console.log(route.params.id)   // '123'
console.log(route.query)       // ?keyword=apple → { keyword: 'apple' }

// 遷移
const onLoginSuccess = () => {
  router.push({ name: 'home' })
}

const goBack = () => router.back()
</script>
```

### 7-5. ナビゲーションガード ─ 認証チェック

「ログインしてないと商品管理画面に行けない」みたいな制御は**ナビゲーションガード**で。

**router/index.ts**

```typescript
import { useAuthStore } from '@/stores/auth'

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && !requiredRoles.some(r => auth.user?.roles.includes(r))) {
    next({ name: 'forbidden' })
    return
  }

  next()
})
```

Day 5 で書いた Spring Security の `@PreAuthorize` がサーバー側、こちらが画面側の認可。両者で二重に守るのが業務システムの定石です。

### Ch.08 総合演習: TODO アプリ⏱ 75分

本日の機能を全部使う

### 8-1. 演習課題

SPAの典型例である TODO アプリを Vue 3 で実装してください。

#### 機能要件

- TODO の追加(タイトル、期限日)
- TODO の一覧表示(未完了 → 完了の順、期限日付き)
- 完了/未完了の切り替え(チェックボックス)
- TODO の削除
- 「全部 / 未完了 / 完了」のフィルター
- 「未完了件数」をヘッダに表示
- ページ遷移: `/` = 一覧、`/todos/:id` = 詳細編集

#### 技術要件

1.  **Composition API + \<script setup\> + TypeScript** で実装
2.  **Pinia ストア**で TODO リストを管理
3.  **Vue Router** で一覧/詳細を切り分け
4.  TODO 入力フォームは**子コンポーネント**として切り出し、emits で親に通知
5.  未完了件数は **computed** で算出
6.  状態をブラウザの **localStorage** に保存(`watch` で発火)

**📌 ヒント: ファイル構成**

```
src/
├── App.vue
├── main.ts
├── router/index.ts
├── stores/todos.ts          # Pinia store
├── views/
│   ├── TodoListView.vue
│   └── TodoDetailView.vue
└── components/
    ├── TodoInputForm.vue    # 子コンポーネント
    ├── TodoItem.vue
    └── FilterButtons.vue
```

### Ch.09 Git: 本日の成果を commit & push⏱ 15分

Day 6 を終える

### 9-1. Day 6 のまとめ

> **✓ 本日身につけたこと**
>
> - Vue 3 の位置づけ(React / Angular との比較)と Composition API
> - Vite による爆速開発環境
> - テンプレート構文(v-bind / v-on / v-if / v-for / v-model)
> - リアクティビティ(ref / reactive / computed / watch)
> - SFC、scoped CSS、props / emits / slots、composable
> - Pinia による状態管理
> - Vue Router によるルーティングと認証ガード

> **📅 Day 7 に向けて**
>
> 明日(Day 7)は**本日の Vue と Day 4〜5 の Spring Boot を結合**します。axios で API を呼び、JWT 認証、**検索フォーム付き CRUD 画面(Ch.03)**、**業務系一覧3画面 ─ 販売伝票・在庫照会・入出庫履歴(Ch.03.5)**、エラーハンドリング、最後に仕入・在庫・販売管理システムを完成させます。研修の集大成です。

## DAY 7 ─ Vue統合・実践

研修の集大成。Day 6 の Vue 3 と Day 4〜5 の Spring Boot API を結合し、認証付きの業務システムを完成させる。CRUD画面、JWT認証、エラーハンドリング、ビルドと統合、そして仕入・在庫・販売管理システムの完成へ。

合計 9時間 前提: Day 1〜6 修了 到達点: Spring Boot + Vue 3 の業務システムを一通り構築できる

### Ch.00 本日の目標と進め方⏱ 5分

Day 7 を終えた時に、何ができるようになっていれば良いか

### 0-1. 本日のゴール

- **Vue から Spring Boot API** を呼べる(axios、CORS、認証ヘッダ)
- **JWT 認証フロー**(ログイン→トークン保存→自動付与→失効時の処理) を実装できる
- **フォームバリデーション**を Vee-Validate などで実装できる
- **検索フォーム + CRUD 画面**を業務系一覧の定型として作れる(Ch.03)
- **業務系一覧3画面**(販売伝票・在庫照会・入出庫履歴) を作れる(Ch.03.5)
- **エラー・ローディング**のUXを統一的に扱える
- **本番ビルド**と Spring Boot との統合パターンを選べる
- 研修の総合演習として **仕入・在庫・販売管理システム** を完成させる ─ 花形は**販売伝票検索 + 打打ち計算**

**⚠ 本日の作業開始前に ─ 起動チェック(7日間で最も多くの起動が必要)**

**Day 7 は研修最終日。3つすべて(Docker + Spring Boot + Vue) が同時に動いている必要があります。**これまでの集大成として、フロント・バック・DB が全部繋がる構成です。

| 必要なもの                          | 状態     | 確認方法                                                    |
|-------------------------------------|----------|-------------------------------------------------------------|
| IntelliJ / VS Code(任意)/ JDK / Git | 起動済み | ─                                                           |
| **Docker (4コンテナ)**              | 起動済み | `docker compose ps` で 全 Up                                |
| **Spring Boot(:8080)**              | 起動済み | `curl http://localhost:8080/api/health` → `{"status":"UP"}` |
| **Vue dev server(:5173)**           | 起動済み | ブラウザで `http://localhost:5173` → 画面表示               |

**本日の起動チェック(3つすべて)**

    # ターミナル1: Docker
    $ cd C:\work\kotlin-training\infra
    $ docker compose ps
    → 4コンテナ全て Up でなければ docker compose up -d

    # IntelliJ: Spring Boot を Run(TrainingApplication.kt の▶)
    → ログに "Started TrainingApplication in X seconds" が出れば成功
    → ブラウザで http://localhost:8080/api/health → {"status":"UP"}

    # ターミナル2: Vue
    $ cd C:\work\kotlin-training\frontend
    $ npm run dev
    → VITE が起動、http://localhost:5173 で画面表示

    # 統合確認: ブラウザの 5173 画面でログインしてみて、
    # Spring Boot ログにアクセスログが流れることを確認

**本日のシナリオで使う初期データ**(商品/仕入先/顧客/倉庫) は Docker DB に自動投入済み。「**7-3. 完成版の業務シナリオ**」のシナリオ①〜⑩を進めるうちに、DB の状態が変化していきます。

### 0-2. これまでの集大成 ─ 6日間で学んだコンセプトの全体マップ

Day 7 は、これまで学んだコンセプトを**1つの業務システム**に統合します。下の表は「Day 1-6 で学んだことが Day 7 のどこで活きるか」を整理したもの。**新たに覚えることは少なく、組み合わせ方を学ぶ日**です。

<table class="styled-table">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr class="header">
<th>Day</th>
<th>主要テーマ</th>
<th>Day 7 で活きる具体的な場面</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>Day 1</strong><br />
Kotlin概論+言語の核</td>
<td>Null安全 / data class / 拡張関数 / スコープ関数</td>
<td>APIレスポンスの DTO 定義、Null安全で空応答を扱う</td>
</tr>
<tr class="even">
<td><strong>Day 2</strong><br />
関数型・コレクション・DSL</td>
<td>map/filter/fold、sealed class でエラー表現、DSL</td>
<td>取得した一覧のフィルタ・集計、ビジネスエラーの型安全な扱い</td>
</tr>
<tr class="odd">
<td><strong>Day 3</strong><br />
コルーチン・構造化並行性</td>
<td>suspend / async / withTimeout / Flow / supervisorScope</td>
<td><strong>UC06 仕入先APIから見積取得</strong>(3社並列、タイムアウト、一部失敗許容)</td>
</tr>
<tr class="even">
<td><strong>Day 4</strong><br />
Spring Boot × Kotlin 基礎</td>
<td>レイヤー設計(DTO/Domain/Entity)、JPA、Validation、@RestControllerAdvice、Jackson</td>
<td>商品・仕入・販売 API の構築、各層でデータの姿を変える設計、JSON⇔Kotlin変換(Jackson)</td>
</tr>
<tr class="odd">
<td><strong>Day 5</strong><br />
Spring Boot 高度</td>
<td>DDD、JWT/セッショントークン、メソッドレベル認可、複数テーブル更新トランザクション、AOP/プロキシ、テキスト/構造化ログ、ヘルスチェック</td>
<td>4アクターのロール別認可、UC07/UC08 の複数テーブル整合性、運用に耐えるエラー応答と監査ログ</td>
</tr>
<tr class="even">
<td><strong>Day 6</strong><br />
Vue 3 基礎</td>
<td>Composition API、テンプレート、コンポーネントと親子関係、props/emits/slots、ref/reactive/computed/watch、Pinia store(state/getters/actions)、Vue Router、v-model⇔DTO の流れ、副作用、localStorage、SPA vs MPA</td>
<td>4アクター用の画面群、商品カード/一覧、状態管理(認証/カート相当)、画面遷移、フォーム入力</td>
</tr>
</tbody>
</table>

#### 業務定義書の各ユースケースが、どの Day の学習で実装されるか

本研修の題材は**「在庫仕入販売管理システム」**。業務定義書で定義された 11 のユースケースを、これまで学んだ技術でどう実装するかを整理します:

| UC       | ユースケース                       | 主アクター             | 主に活きる Day の学び                                                                                     |
|----------|------------------------------------|------------------------|-----------------------------------------------------------------------------------------------------------|
| UC01     | 商品マスタを管理する               | システム管理者         | Day 4(CRUD)、Day 5(認可)、Day 6(画面)、Day 7(統合)                                                        |
| UC02     | 商品定価の改定を行う(履歴型マスタ) | システム管理者         | Day 4-5(履歴型マスタ、トランザクション)                                                                   |
| UC03-05  | 仕入先・顧客・倉庫マスタ管理       | システム管理者         | Day 4(CRUD)、Day 6(画面)                                                                                  |
| **UC06** | **仕入先APIから見積取得**          | 調達担当               | **Day 3(コルーチン並列)**、Day 7(画面とつなぐ)                                                            |
| **UC07** | **仕入を登録する**                 | 調達担当               | **Day 5(複数テーブル更新トランザクション)**、Day 4(Validation、ErrorResponse)、Day 6/7(フォーム画面)      |
| **UC08** | **販売を登録する**                 | 販売担当               | **Day 5(在庫チェック+減算+履歴のトランザクション)**、Day 4(BusinessError ─ 在庫不足)、Day 6/7(エラー表示) |
| UC09     | 在庫を照会する                     | 在庫管理担当、調達担当 | Day 4(JOIN クエリ)、Day 5(N+1解消)、Day 6/7(一覧画面)                                                     |
| UC10     | 入出庫履歴を確認する               | 在庫管理担当           | Day 4-5(クエリ)、Day 6/7(期間絞込みUI)                                                                    |
| UC11     | ログインする                       | 全アクター             | Day 5(JWT)、Day 7(ログイン画面、認証ストア)                                                               |

> **📌 Day 7 で取り組む4つの主要ユースケース**
>
> 本日は**業務定義書の中核となる 4 つのユースケース**を中心に統合実装します:
>
> - **UC11 ログイン** ─ JWT 認証フロー、4アクターのロール反映(Ch.4)
> - **UC09 在庫照会** + **UC10 入出庫履歴** ─ 業務系一覧の典型(Ch.3.5)、 検索 + JOIN + しきい値強調 + 時系列グルーピング
> - **UC07 仕入登録** + **UC08 販売登録** ─ 複数テーブル更新+在庫チェック+エラー表示(Ch.2、Ch.5)。 **UC08 販売伝票一覧は花形演習(Ch.7 演習①)**
> - **UC06 仕入先API並列見積取得** ─ ダッシュボード相当(Ch.1 でAPI連携の総仕上げ)
>
> 業務定義書(**第3章ユースケース図、第4章ユースケース記述、第6章データ設計**)を傍に置きながら進めると、画面と業務の対応が見えてきます。

### Ch.01 Spring Boot API との連携⏱ 90分

axios / fetch、CORS、JWT 認証ヘッダ

> **ⓘ Vue コード例のスキーマについて**
>
> 本章(`1-1` あたりまで)の `Product` 型などは、 Day 4 で構築した実API(`janCode / name / category(文字列) / safetyStock`)に揃えています。 一方、 後続の **Ch.2 フォーム実装・Ch.3 検索フォーム**では、 UI 実装の手法(`v-model` / `reactive` / 検索パラメータ組立 / ページネーション 等) に集中するため、 簡略化した教科書的スキーマ(`price: number, categoryId: number` 等) でコード例を書いている箇所があります。 そのまま `backend/` の実API に投げると 400 になるので、 演習で実装する際は **Day 4 の実スキーマに読み替えて**ください(例: `price` 欄 → `safetyStock` 欄、 `categoryId: number` → `category: string`)。

### 1-0. リクエストの旅 ─ ブラウザのボタンクリックから DB 更新まで

API 連携を学ぶ前に、まず**1回のボタンクリックがどう旅をするのか**を全体像として押さえておきます。例として、販売担当が「販売登録」ボタンを押した時、ブラウザ → ネットワーク → Spring Boot → DB と**どんなHTTPリクエストが、どのファイルのどのメソッドに届くのか**を追います。Day 1-6 の各層がここで一本につながります。

#### ① ブラウザで起きること ─ Vue が HTTP リクエストを組み立てる

販売担当が画面で「登録」ボタンをクリックすると、Vue の`@click`ハンドラが axios を呼びます:

**frontend/src/views/SaleRegisterView.vue(抜粋)**

```vue
<button @click="onSubmit">登録</button>

<script setup lang="ts">
const form = reactive({
  customerId: 1, warehouseId: 1,
  lines: [{ productId: 5, quantity: 3, unitPrice: 180 }]
})

const onSubmit = async () => {
  // ↓ axios が下の HTTP リクエストを組み立てる
  const res = await apiClient.post('/sales', form)
  // res.data には Spring Boot が返した JSON が入る
}
```

#### ② 実際に流れる HTTP リクエスト

axios が組み立てて送信する HTTP リクエストは、生のテキストにすると以下のような形です。**これがネットワークを通って Spring Boot に届きます**:

**HTTP リクエスト(Chrome DevTools の Network タブで見える内容)**

    POST /api/sales HTTP/1.1
    Host: localhost:8080
    Content-Type: application/json
    Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0Ii...   ← JWT(認証情報)
    Origin: http://localhost:5173                                    ← CORS チェック用
    Accept: application/json
    Content-Length: 89

    {
      "customerId": 1,
      "warehouseId": 1,
      "lines": [
        {"productId": 5, "quantity": 3, "unitPrice": 180}
      ]
    }

| HTTP 要素                | 値                      | 意味                                                                                   |
|--------------------------|-------------------------|----------------------------------------------------------------------------------------|
| **メソッド**             | `POST`                  | 「新規作成」を意味する。GET=取得、PUT=更新、DELETE=削除                                |
| **URL パス**             | `/api/sales`            | 「販売リソース」へのアクセス。Spring 側でこの URL を担当するメソッドにルーティング     |
| **Authorization ヘッダ** | `Bearer eyJ...`         | JWT。<u>これがないと 401 Unauthorized</u>。Day 5 で学習                                |
| **Origin ヘッダ**        | `http://localhost:5173` | 「どこから来たリクエストか」。CORS で許可リストにあるかチェック                        |
| **Content-Type**         | `application/json`      | 「ボディの形式は JSON」と宣言。Jackson(Day 4/付録A-9)が JSON → Kotlin オブジェクト変換 |
| **ボディ**               | JSON                    | 送信したいデータ本体。`customerId / warehouseId / lines` など                          |

#### ③ Spring Boot 側 ─ どのファイルのどのメソッドが動くか

リクエストが Spring Boot(`localhost:8080`)に届くと、**サーバー内部で複数の関門・処理層を順に通って**最終的に DB 更新まで進みます。下の図は<u>1つのリクエストが通る道のり</u>と、<u>各関門でどのファイルのどのメソッドが動くか</u>を表しています。

［図（テキスト抽出）：1 リクエストが通る道のり(POST /api/sales) / ① SecurityFilterChain(Servlet フィルタ群) / ファイル: config/SecurityConfig.kt(Day 5 で実装) / 処理: Origin ヘッダの CORS チェック → JWT 検証 → ユーザー情報を SecurityContext に格納 / 失敗時: CORS違反 → 403 / JWT欠落・期限切れ → 401(JwtAuthEntryPoint が JSON で返却) / ② DispatcherServlet(Spring 提供、自前コードなし) / URL /api/sales + メソッド POST から、 @PostMapping("/sales") のメソッド を探す / → SaleController.create が見つかる / ③ Con …］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図1-1: HTTPリクエストが Spring Boot 内を旅する道のり ─ どのファイルのどのメソッドが順に動くか

#### 各層で動くファイル名・メソッド名のまとめ

<table class="styled-table">
<colgroup>
<col style="width: 25%" />
<col style="width: 25%" />
<col style="width: 25%" />
<col style="width: 25%" />
</colgroup>
<thead>
<tr class="header">
<th>段階</th>
<th>ファイル</th>
<th>メソッド / クラス</th>
<th>主な役割</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>① セキュリティ</td>
<td><code>config/SecurityConfig.kt</code><br />
<code>config/JwtAuthFilter.kt</code></td>
<td><code>filterChain()</code><br />
<code>doFilterInternal()</code></td>
<td>CORS判定、JWTからユーザー復元</td>
</tr>
<tr class="even">
<td>② ルーティング</td>
<td>(Spring 内蔵)</td>
<td><code>DispatcherServlet</code></td>
<td>URL+HTTPメソッド → ハンドラ解決</td>
</tr>
<tr class="odd">
<td>③ Controller</td>
<td><code>controller/SaleController.kt</code></td>
<td><code>create(@RequestBody @Valid req)</code></td>
<td>JSON→DTO、Bean Validation</td>
</tr>
<tr class="even">
<td>④ Service</td>
<td><code>service/SaleService.kt</code></td>
<td><code>@Transactional fun register(cmd)</code></td>
<td>業務ルール、トランザクション境界</td>
</tr>
<tr class="odd">
<td>⑤ Repository</td>
<td><code>repository/SaleRepository.kt</code> 等</td>
<td><code>save() / findById()</code><br />
(JpaRepository 継承)</td>
<td>JPA がSQL生成→PostgreSQL</td>
</tr>
<tr class="even">
<td>⑥ DB</td>
<td><code>infra/initdb/init.sql</code>(定義のみ)</td>
<td>─</td>
<td>テーブル sale, sale_detail, inventory, stock_movement</td>
</tr>
<tr class="odd">
<td>⑦ レスポンス</td>
<td><code>controller/SaleController.kt</code></td>
<td><code>return saleResponse</code></td>
<td>Kotlin→JSON(Jackson)</td>
</tr>
<tr class="even">
<td>⑧ Vue 側</td>
<td><code>views/SaleRegisterView.vue</code></td>
<td><code>onSubmit() の await axios.post</code></td>
<td>Promise が resolve、画面更新</td>
</tr>
</tbody>
</table>

**📌 URL / HTTP メソッドの組み合わせと、呼ばれるメソッドの対応(本研修の主要 API)**

業務システムでは「URLの命名規則」が決まっています(**REST 設計、付録A-4**)。同じ `/api/sales` でも HTTP メソッドが違えば別のハンドラが動きます:

| HTTP | URL                               | 意味                 | 呼ばれるメソッド                    | 関連 UC             |
|------|-----------------------------------|----------------------|-------------------------------------|---------------------|
| GET  | /api/products                     | 商品一覧取得         | ProductController.list()            | UC01 商品マスタ管理 |
| GET  | /api/products/{id}                | 商品1件取得          | ProductController.get(id)           | UC01                |
| POST | /api/products                     | 商品新規作成         | ProductController.create()          | UC01                |
| PUT  | /api/products/{id}                | 商品更新             | ProductController.update(id)        | UC01                |
| POST | /api/products/{id}/price-revision | 定価改定(履歴追加)   | ProductController.revisePrice(id)   | UC02 定価改定       |
| POST | /api/purchases                    | 仕入登録             | PurchaseController.register()       | UC07 仕入登録       |
| POST | /api/sales                        | 販売登録             | SaleController.register()           | UC08 販売登録       |
| POST | /api/suppliers/quotes             | 3社並列見積取得      | SupplierQuoteController.getQuotes() | UC06 並列見積       |
| GET  | /api/inventory                    | 在庫一覧             | InventoryController.list()          | UC09 在庫照会       |
| GET  | /api/stock-movements              | 入出庫履歴(期間絞込) | StockMovementController.list()      | UC10 履歴確認       |
| POST | /api/auth/login                   | ログイン(JWT 取得)   | AuthController.login()              | UC11 ログイン       |

これらの**URL+メソッドの設計が Vue 側と Spring 側で一致している**こと、それが「フロントとバックがつながる」という意味です。

### 1-1. axios のセットアップ

`fetch` でも API は呼べますが、業務システムでは**axios**を使うのが主流。インターセプター(リクエスト・レスポンスの加工)、自動JSON変換、エラーハンドリングが揃っている。

**インストール**

    $ npm install axios

**api/client.ts**

```typescript
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

export const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// リクエストインターセプター: JWT を自動付与
apiClient.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

// レスポンスインターセプター: 401 ならログイン画面へ
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore()
      auth.logout()
      router.push({ name: 'login' })
    }
    return Promise.reject(error)
  }
)
```

> **✅ インターセプターのメリット**
>
> - 各 API 呼び出しで毎回 JWT を付ける必要なし(自動付与)
> - 401 になったら必ずログイン画面に飛ぶ(統一的な処理)
> - 共通エラーハンドリング(タイムアウト、ネットワークエラー等) を1か所に集約

### 1-2. API クライアントの設計

機能ごとに API クライアントを分けると保守しやすくなります。

**api/productApi.ts**

```typescript
import { apiClient } from './client'
import type { Product, CreateProductRequest } from '@/types/product'

export const productApi = {
  async list(): Promise<Product[]> {
    const res = await apiClient.get<Product[]>('/products')
    return res.data
  },

  async get(id: number): Promise<Product> {
    const res = await apiClient.get<Product>(`/products/${id}`)
    return res.data
  },

  async create(req: CreateProductRequest): Promise<Product> {
    const res = await apiClient.post<Product>('/products', req)
    return res.data
  },

  async update(id: number, req: CreateProductRequest): Promise<Product> {
    const res = await apiClient.put<Product>(`/products/${id}`, req)
    return res.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/products/${id}`)
  },
}
```

**types/product.ts**

```typescript
export interface Product {
  id: number
  janCode: string
  name: string
  category: string
  safetyStock: number
  createdAt: string
}

export interface CreateProductRequest {
  janCode: string
  name: string
  category: string
  safetyStock: number
}
```

### 1-3. 認証ストア(Pinia)

**stores/auth.ts**

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/authApi'

interface User {
  id: number
  username: string
  roles: string[]
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => token.value !== null)

  const login = async (username: string, password: string) => {
    const res = await authApi.login(username, password)
    token.value = res.token
    user.value = res.user
    localStorage.setItem('token', res.token)
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return { token, user, isLoggedIn, login, logout }
})
```

> **⚠ localStorage に JWT を置く時の注意**
>
> localStorage は**XSS 攻撃**に対して脆弱(JSから読み取り可能)。本番では以下のいずれかが推奨:
>
> - **httpOnly Cookie**: JS から読み取れない(XSS耐性高)、ただし CSRF 対策が必要
> - **Refresh Token + 短命 Access Token**: 漏洩しても被害を最小化
> - 厳格な CSP(Content Security Policy) でXSS自体を防ぐ
>
> 本研修では学習目的で localStorage を使用しますが、本番運用では上記の対策を取ること。

### 1-4. API 呼び出しを composable に切り出す

API の呼び出し + ローディング + エラー処理は**パターンが固定**なので、composable にまとめると劇的にスッキリします。

**composables/useApi.ts**

```typescript
import { ref } from 'vue'

export function useApi<T>(loader: () => Promise<T>) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const execute = async () => {
    loading.value = true
    error.value = null
    try {
      data.value = await loader()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, execute }
}
```

**使う側 ProductList.vue**

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { productApi } from '@/api/productApi'

const { data: products, loading, error, execute } = useApi(() => productApi.list())

onMounted(execute)
</script>

<template>
  <p v-if="loading">読み込み中...</p>
  <p v-else-if="error">エラー: {{ error.message }}</p>
  <ul v-else-if="products">
    <li v-for="p in products" :key="p.id">{{ p.name }}</li>
  </ul>
</template>
```

### Ch.02 フォーム実装とバリデーション⏱ 75分

v-model + Vee-Validate + サーバーエラーの表示

### 2-1. シンプルなフォーム

Day 6 で学んだ v-model を使った基本形:

**SimpleForm.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { productApi } from '@/api/productApi'

const form = ref({
  name: '',
  price: 0,
  categoryId: 0,
})

const submitting = ref(false)
const errorMessage = ref<string | null>(null)

const submit = async () => {
  submitting.value = true
  errorMessage.value = null
  try {
    await productApi.create(form.value)
    // 成功時の処理(画面遷移等)
  } catch (e: any) {
    errorMessage.value = e.response?.data?.message ?? 'エラーが発生しました'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <label>商品名 <input v-model="form.name"></label>
    <label>価格 <input v-model.number="form.price" type="number"></label>
    <label>カテゴリID <input v-model.number="form.categoryId" type="number"></label>
    <button :disabled="submitting">{{ submitting ? '送信中...' : '登録' }}</button>
    <p v-if="errorMessage" style="color: red">{{ errorMessage }}</p>
  </form>
</template>
```

### 2-2. Vee-Validate でクライアントサイド検証

業務システムでは「必須」「文字数」「数値範囲」などの**事前検証**を画面で行うのが UX 的に望ましい。**Vee-Validate** + Zod スキーマで型安全に書けます。

**インストール**

    $ npm install vee-validate @vee-validate/zod zod

**ProductForm.vue**

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

// スキーマ定義 ─ Day 4 で書いた Bean Validation と対の関係
const schema = toTypedSchema(z.object({
  name: z.string().min(1, '商品名は必須').max(100, '100文字以内'),
  price: z.number().min(0, '価格は0以上'),
  categoryId: z.number().positive('カテゴリを選択してください'),
}))

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: schema,
})

const [name, nameAttrs] = defineField('name')
const [price, priceAttrs] = defineField('price')
const [categoryId, categoryIdAttrs] = defineField('categoryId')

const onSubmit = handleSubmit(async (values) => {
  await productApi.create(values)
})
</script>

<template>
  <form @submit="onSubmit">
    <label>
      商品名
      <input v-model="name" v-bind="nameAttrs">
      {{ errors.name }}
    </label>
    <label>
      価格
      <input v-model.number="price" v-bind="priceAttrs" type="number">
      {{ errors.price }}
    </label>
    <button :disabled="isSubmitting">登録</button>
  </form>
</template>
```

### 2-3. サーバーエラーの表示 ─ Day 4 の ErrorResponse と連携

Day 4 で `@RestControllerAdvice` で返した `ErrorResponse` を、Vue 側で適切に表示します。

**サーバーエラーをフィールド別に表示**

    const serverErrors = ref<Record<string, string>>({})

    const onSubmit = handleSubmit(async (values) => {
      try {
        await productApi.create(values)
      } catch (e: any) {
        const err = e.response?.data
        if (err?.code === 'VALIDATION_FAILED') {
          // Day 4 の ErrorResponse.details は「field: message」形式の文字列配列
          // 例: ["name: 商品名は必須です", "safetyStock: 安全在庫は0以上です"]
          const entries = (err.details ?? []).map((s: string) => {
            const i = s.indexOf(': ')
            return [s.slice(0, i), s.slice(i + 2)] as const
          })
          serverErrors.value = Object.fromEntries(entries)
        } else {
          alert(err?.message ?? 'エラー')
        }
      }
    })

### Ch.03 検索フォーム + CRUD 画面の実装⏱ 90分

業務系一覧の定型 ─ 検索 / 一覧 / 詳細 / 編集 / 削除 の型を覚える

### 3-1. 業務系一覧の定型パターン

業務システムの一覧画面は、ほぼ例外なく **「上部に検索フォーム + 下部に検索結果テーブル + ページャー」** という構成です。商品マスタ・仕入先マスタ・顧客マスタ・倉庫マスタ・仕入伝票・販売伝票・在庫照会・入出庫履歴…どれを取っても、列の意味は違えど「画面の骨格」は同じです。

本章では **商品マスタ**を題材に、この型をしっかり身につけます。次章 Ch.03.5 で同じ型を **販売伝票・在庫照会・入出庫履歴**に適用し、Ch.07 総合演習で **販売伝票検索 + ページネーション + 打打ち計算** を実装します。

> **📌 業務系一覧の型 ─ 全画面共通の骨格**
>
> 1.  **検索フォーム**(一覧の列に対応する条件入力欄)
> 2.  **検索ボタン**(submit) / **クリアボタン**(条件リセット)
> 3.  **新規登録ボタン**(権限がある時のみ表示)
> 4.  **結果テーブル**(列ヘッダ・データ行・操作列)
> 5.  **ページャー**(前へ / ページ番号 / 次へ + 件数表示)
>
> 検索条件は全て **AND** 検索、各条件は **optional(未入力なら絞り込まない)**、を基本ルールにします。この方が業務系で自然(片方だけ入力して絞ることが多い)で、SQL 側の組み立ても素直になります。

### 3-2. ルート設計

| ルート               | 画面              | 用途        |
|----------------------|-------------------|-------------|
| `/products`          | ProductListView   | 検索 + 一覧 |
| `/products/new`      | ProductCreateView | 新規登録    |
| `/products/:id`      | ProductDetailView | 詳細        |
| `/products/:id/edit` | ProductEditView   | 編集        |

新規登録/詳細/編集の3画面は Day 6 で学んだ Vue Router のパスパラメータと同じ要領です。本章のメインは**一覧画面に検索フォームを足すこと**。

### 3-3. 一覧の列と検索条件の対応

「どんな検索条件を画面に置くか」は、 **「一覧テーブルにどの列があるか」** で決まります。<u>列に表示されないものは検索条件にしない</u>のが原則(画面の責務を絞る)。

| 列       | 検索条件タイプ              | UI           | SQL 表現                |
|----------|-----------------------------|--------------|-------------------------|
| ID       | 完全一致(数値)              | 数値入力     | `id = ?`                |
| 商品名   | 部分一致(LIKE)              | テキスト入力 | `name LIKE '%?%'`       |
| カテゴリ | 完全一致(プルダウン)        | \<select\>   | `category_id = ?`       |
| 価格     | 範囲(min/max 両方 optional) | 数値入力 × 2 | `price BETWEEN ? AND ?` |

> **💡 「片方だけ入力」もよくある**
>
> 価格範囲のように min と max を別フィールドにする場合、 **「min だけ入力」「max だけ入力」「両方入力」「両方空」** の4パターンを処理する必要があります。<u>NULL 安全に組み立てる</u>のがバック側の腕の見せどころで、Kotlin の Null 安全とも相性が良いです(後述)。

### 3-4. バックエンド側 ─ Controller

クエリパラメータを `@RequestParam(required = false)` + Nullable型で受けます。Day 4 Ch.02-5「パラメータの受け取りパターン」で出てきた書き方の応用です。

**ProductController.kt ─ 検索 + ページネーション**

```kotlin
@RestController
@RequestMapping("/api/products")
class ProductController(private val productService: ProductService) {

    @GetMapping
    fun search(
        @RequestParam(required = false) id: Long?,
        @RequestParam(required = false) name: String?,
        @RequestParam(required = false) janCode: String?,
        @RequestParam(required = false) category: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): Page<ProductResponse> {
        val condition = ProductSearchCondition(id, name, janCode, category)
        val pageable = PageRequest.of(page, size, Sort.by("id"))
        return productService.search(condition, pageable).map { it.toResponse() }
    }
}

// 検索条件をひとつのオブジェクトにまとめておくと、Service/Repository への引き渡しが楽
// (init.sql の product テーブルの列に対応: jan_code, product_name, category VARCHAR)
data class ProductSearchCondition(
    val id: Long? = null,
    val name: String? = null,
    val janCode: String? = null,
    val category: String? = null,
)
```

### 3-5. バックエンド側 ─ Repository(JPA Specification)

「条件が null でない場合だけ AND する」 を表現するには **JPA Specification** が便利です([`Day 4 Ch.04 JPA Entity`](#d4-ch4) の延長)。条件ごとに小さな関数を書いて、`and` で組み合わせていく方式。

**ProductSpecifications.kt**

```kotlin
import jakarta.persistence.criteria.*
import org.springframework.data.jpa.domain.Specification

object ProductSpecifications {

    fun build(c: ProductSearchCondition): Specification<Product> =
        Specification.where(idEq(c.id))
            .and(nameLike(c.name))
            .and(categoryEq(c.categoryId))
            .and(priceBetween(c.priceMin, c.priceMax))

    // id が null なら条件を足さない(null を返すと Specification.where が無視する)
    private fun idEq(id: Long?): Specification<Product>? =
        id?.let { Specification { root, _, cb -> cb.equal(root.get<Long>("id"), it) } }

    private fun nameLike(name: String?): Specification<Product>? =
        name?.takeIf { it.isNotBlank() }?.let { keyword ->
            Specification { root, _, cb -> cb.like(root.get("name"), "%$keyword%") }
        }

    private fun categoryEq(categoryId: Long?): Specification<Product>? =
        categoryId?.let { Specification { root, _, cb ->
            cb.equal(root.get<Category>("category").get<Long>("id"), it)
        } }

    // 価格範囲は min/max それぞれ optional ─ 4パターン全部に対応
    private fun priceBetween(min: BigDecimal?, max: BigDecimal?): Specification<Product>? = when {
        min != null && max != null -> Specification { r, _, cb -> cb.between(r.get("price"), min, max) }
        min != null                 -> Specification { r, _, cb -> cb.greaterThanOrEqualTo(r.get("price"), min) }
        max != null                 -> Specification { r, _, cb -> cb.lessThanOrEqualTo(r.get("price"), max) }
        else                           -> null      // 両方 null なら条件なし
    }
}

// Repository は JpaSpecificationExecutor を継承するだけで findAll(spec, pageable) が使える
interface ProductRepository :
    JpaRepository<Product, Long>,
    JpaSpecificationExecutor<Product>

// Service 側
@Service
class ProductService(private val repo: ProductRepository) {
    fun search(c: ProductSearchCondition, pageable: Pageable): Page<Product> =
        repo.findAll(ProductSpecifications.build(c), pageable)
}
```

> **💡 Kotlin の Null 安全がそのまま AND 検索の組み立てになる**
>
> `id?.let { ... }` ─ id が null なら `?.let` でブロックがスキップされて全体が null。Specification.where は null を「条件なし」 として扱うので、<u>「null なら AND しない」 が1行で書ける</u>。Java で同じことを書こうとすると `if (id != null) ...` を5回繰り返すことになります。

### 3-6. フロントエンド側 ─ 検索フォーム + 一覧

Vue 側は `reactive()` で検索条件オブジェクトを作って、 submit 時に `params` として API に渡します。

**views/ProductListView.vue ─ 検索フォーム + 一覧**

```vue
<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/api/client'
import { useAuthStore } from '@/stores/auth'

interface Product { id: number; name: string; categoryName: string; price: number }
interface Category { id: number; name: string }
interface PageResponse<T> { content: T[]; totalPages: number; totalElements: number; number: number }

const router = useRouter()
const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.roles.includes('ROLE_ADMIN'))

// 検索条件 ─ reactive で複数フィールドをひとまとめに
const form = reactive({
  id: null as number | null,
  name: '',
  categoryId: null as number | null,
  priceMin: null as number | null,
  priceMax: null as number | null,
})

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const currentPage = ref(0)
const totalPages = ref(0)
const loading = ref(false)

async function loadCategories() {
  const res = await apiClient.get<Category[]>('/api/categories')
  categories.value = res.data
}

async function search(page = 0) {
  loading.value = true
  try {
    // 空文字や null のフィールドは送らない(URLが汚れない + サーバ側の判定がシンプル)
    const params: Record<string, any> = { page, size: 20 }
    if (form.id != null) params.id = form.id
    if (form.name.trim()) params.name = form.name.trim()
    if (form.categoryId != null) params.categoryId = form.categoryId
    if (form.priceMin != null) params.priceMin = form.priceMin
    if (form.priceMax != null) params.priceMax = form.priceMax

    const res = await apiClient.get<PageResponse<Product>>('/api/products', { params })
    products.value = res.data.content
    currentPage.value = res.data.number
    totalPages.value = res.data.totalPages
  } finally {
    loading.value = false
  }
}

function clearForm() {
  form.id = null
  form.name = ''
  form.categoryId = null
  form.priceMin = null
  form.priceMax = null
}

onMounted(async () => {
  await loadCategories()
  await search()
})
</script>

<template>
  <h1>商品マスタ</h1>

  <!-- 検索フォーム -->
  <form @submit.prevent="search(0)" class="search-form">
    <div class="search-row">
      <label>ID <input v-model.number="form.id" type="number" /></label>
      <label>商品名(部分一致) <input v-model="form.name" /></label>
      <label>カテゴリ
        <select v-model="form.categoryId">
          <option :value="null">(すべて)</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>
    </div>
    <div class="search-row">
      <label>価格(円) <input v-model.number="form.priceMin" type="number" placeholder="min" /></label>
      〜
      <label><input v-model.number="form.priceMax" type="number" placeholder="max" /></label>
      <button type="submit">検索</button>
      <button type="button" @click="clearForm">クリア</button>
    </div>
  </form>

  <button v-if="isAdmin" @click="router.push('/products/new')">+ 新規登録</button>

  <!-- 一覧テーブル -->
  <p v-if="loading">検索中...</p>
  <table v-else class="result-table">
    <thead>
      <tr><th>ID</th><th>商品名</th><th>カテゴリ</th><th>価格</th><th>操作</th></tr>
    </thead>
    <tbody>
      <tr v-for="p in products" :key="p.id">
        <td>{{ p.id }}</td>
        <td><RouterLink :to="`/products/${p.id}`">{{ p.name }}</RouterLink></td>
        <td>{{ p.categoryName }}</td>
        <td class="num">{{ p.price.toLocaleString() }}円</td>
        <td>
          <button v-if="isAdmin" @click="router.push(`/products/${p.id}/edit`)">編集</button>
        </td>
      </tr>
      <tr v-if="!loading && products.length === 0">
        <td colspan="5" class="empty">該当する商品はありません</td>
      </tr>
    </tbody>
  </table>

  <!-- ページャー -->
  <nav v-if="totalPages > 1" class="pager">
    <button :disabled="currentPage === 0" @click="search(currentPage - 1)">前へ</button>
    {{ currentPage + 1 }} / {{ totalPages }}
    <button :disabled="currentPage >= totalPages - 1" @click="search(currentPage + 1)">次へ</button>
  </nav>
</template>
```

> **💡 axios の params オプションを使えばクエリ文字列の組み立て不要**
>
> `apiClient.get('/api/products', { params })` と書くと、 axios が自動で `/api/products?id=1&name=...` の形に組み立てます。<u>値が `undefined` のキーは送られない</u>(`null` は送られるので注意)、 URL エンコードも自動。手で文字列連結するより安全です。

### 3-7. 詳細画面 + 編集画面の共通化

「詳細」と「編集」は**表示モードが違うだけ**でデータ取得は同じ。共通化するとメンテが楽になります。

**views/ProductDetailView.vue**

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import apiClient from '@/api/client'

const route = useRoute()
const id = computed(() => Number(route.params.id))
const product = ref<Product | null>(null)

onMounted(async () => {
  const res = await apiClient.get<Product>(`/api/products/${id.value}`)
  product.value = res.data
})
</script>

<template>
  <div v-if="product">
    <h1>{{ product.name }}</h1>
    <dl>
      <dt>ID</dt><dd>{{ product.id }}</dd>
      <dt>価格</dt><dd>{{ product.price.toLocaleString() }}円</dd>
      <dt>カテゴリ</dt><dd>{{ product.categoryName }}</dd>
    </dl>
    <RouterLink :to="`/products/${product.id}/edit`">編集</RouterLink>
  </div>
</template>
```

### 3-8. 章末まとめ

> **📌 業務系一覧の型 ─ ここで覚えるべきこと**
>
> - **画面の骨格**: 検索フォーム / 結果テーブル / ページャーの3点セット
> - **バック側**: `@RequestParam(required = false)` + Nullable型 + JPA Specification で、 条件ごとに「null なら AND しない」を組み立てる
> - **フロント側**: `reactive()` で検索条件をまとめ、 axios の `params` で URL 組み立てを任せる
> - **原則**: 全条件 AND、 各条件 optional、 一覧の列にあるものだけ検索条件にする
> - 次の Ch.03.5 で、 この型を 販売伝票・在庫照会・入出庫履歴 にそのまま適用します

### Ch.03.5 業務系一覧3画面 ─ 販売伝票 / 在庫照会 / 入出庫履歴⏱ 75分

同じ型を別画面に展開 ─ JOIN 検索・しきい値強調・時系列表示

### 3.5-1. この章の位置づけ

Ch.03 で覚えた「検索フォーム + 一覧 + ページャー」の型を、 在庫仕入販売管理システムの**業務の中心となる3画面**に展開します。題材は業務設計資料の以下のユースケース:

| UC   | 画面                   | アクター                  | 本章で押さえるポイント                                       |
|------|------------------------|---------------------------|--------------------------------------------------------------|
| UC08 | **販売伝票一覧**(花形) | 販売担当 / システム管理者 | 明細との JOIN 検索、合計金額計算、ステータス絞り込み、ソート |
| UC09 | 在庫照会               | 在庫管理担当 / 調達担当   | 商品 ⋈ 在庫 ⋈ 倉庫 の JOIN、しきい値以下の行強調             |
| UC10 | 入出庫履歴             | 在庫管理担当              | 期間検索、種別(入庫/出庫)フィルタ、時系列表示                |

> **📌 なぜ販売伝票が「花形」 なのか**
>
> 在庫仕入販売管理システムでは、**販売こそが収益の源泉**です。販売担当は毎日この画面を開き、 「先週の○○商事への売上は」「在庫不足で逃した取引はあるか」「月末締めの伝票一覧」 といった<u>多角的な検索</u>を繰り返します。商品マスタは1日1回開くか開かないかですが、 販売伝票一覧は**1日に何十回も触る画面**。それゆえ、 検索条件の豊富さ・ソート・打打ち計算 など UX への要求が一段高くなります。

### 3.5-2. 販売伝票一覧 ─ 業務系一覧の決定版

#### 列と検索条件

| 列         | 検索条件                   | SQL 表現                                                                         |
|------------|----------------------------|----------------------------------------------------------------------------------|
| 伝票ID     | 完全一致                   | `sale.id = ?`                                                                    |
| 伝票日付   | 期間(from〜to、片方OK)     | `sale.sale_date BETWEEN ? AND ?`                                                 |
| 顧客       | プルダウン(完全一致)       | `sale.customer_id = ?`                                                           |
| 倉庫       | プルダウン(完全一致)       | `sale.warehouse_id = ?`                                                          |
| 商品(明細) | 商品名 LIKE(**JOIN 必要**) | `EXISTS (SELECT 1 FROM sale_line JOIN product ON ... WHERE product.name LIKE ?)` |
| 担当者     | プルダウン                 | `sale.user_id = ?`                                                               |
| 合計金額   | 範囲(min/max)              | `sale.total_amount BETWEEN ? AND ?`                                              |
| ステータス | プルダウン(確定/取消/全て) | `sale.status = ?`                                                                |

#### JOIN 検索の難しさ ─ 商品名検索

「商品名」 で販売伝票を検索する場合、 伝票テーブルだけでは無理で、 `sale_line ⋈ product` の JOIN が必要です。Specification では **サブクエリ(EXISTS)** を使うのが定石。<u>重複伝票が結果に出ない</u>(伝票1つに同じ商品が複数明細でも1行)というメリットがあります。

**SaleSpecifications.kt(抜粋) ─ JOIN 検索**

```kotlin
private fun productNameLike(productName: String?): Specification<Sale>? =
    productName?.takeIf { it.isNotBlank() }?.let { keyword ->
        Specification { root, query, cb ->
            // EXISTS (SELECT 1 FROM sale_line sl JOIN product p ON sl.product_id = p.id
            //        WHERE sl.sale_id = sale.id AND p.name LIKE '%keyword%')
            val subquery = query!!.subquery(Long::class.java)
            val lineRoot = subquery.from(SaleLine::class.java)
            val productJoin = lineRoot.join<SaleLine, Product>("product")
            subquery.select(cb.literal(1L))
                .where(
                    cb.equal(lineRoot.get<Sale>("sale"), root),
                    cb.like(productJoin.get("name"), "%$keyword%"),
                )
            cb.exists(subquery)
        }
    }

private fun customerEq(customerId: Long?): Specification<Sale>? =
    customerId?.let { Specification { root, _, cb ->
        cb.equal(root.get<Customer>("customer").get<Long>("id"), it)
    } }

private fun saleDateBetween(from: LocalDate?, to: LocalDate?): Specification<Sale>? = when {
    from != null && to != null -> Specification { r, _, cb -> cb.between(r.get("saleDate"), from, to) }
    from != null                  -> Specification { r, _, cb -> cb.greaterThanOrEqualTo(r.get("saleDate"), from) }
    to != null                    -> Specification { r, _, cb -> cb.lessThanOrEqualTo(r.get("saleDate"), to) }
    else                            -> null
}
```

#### 打打ち計算 ─ 業務系ならではの UI

**打打ち計算(うちうちけいさん)**とは、伝票一覧の中から **チェックを付けた行だけの合計** をリアルタイムに表示する機能です。月末締めや得意先別の集計など、 経理・販売現場でよく使われる業務操作:

- 「○○商事の今月分だけ合計したい」 → 該当行にチェック → その場で合計が出る
- 「キャンペーン期間の売上合計」 → 期間で検索 → 全件チェック → 合計表示
- 列ヘッダクリックで **ソート**(日付昇順/降順、金額順、顧客順)も標準装備

**views/SaleListView.vue ─ 検索 + 一覧 + 打打ち計算 + ソート**

```vue
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import apiClient from '@/api/client'

interface Sale {
  id: number; saleDate: string;
  customerName: string; warehouseName: string;
  totalAmount: number; status: 'CONFIRMED' | 'CANCELLED';
}
interface Master { id: number; name: string }

const form = reactive({
  saleDateFrom: '', saleDateTo: '',
  customerId: null as number | null,
  warehouseId: null as number | null,
  productName: '',
  totalMin: null as number | null,
  totalMax: null as number | null,
  status: 'ALL' as 'ALL' | 'CONFIRMED' | 'CANCELLED',
})

const sales = ref<Sale[]>([])
const customers = ref<Master[]>([])
const warehouses = ref<Master[]>([])
const sortKey = ref<keyof Sale>('saleDate')
const sortDesc = ref(true)
const checkedIds = ref<Set<number>>(new Set())

// ── ソート(クライアント側): 列ヘッダクリックで切替 ──
function toggleSort(key: keyof Sale) {
  if (sortKey.value === key) sortDesc.value = !sortDesc.value
  else { sortKey.value = key; sortDesc.value = false }
}
const sortedSales = computed(() => {
  const sorted = [...sales.value].sort((a, b) => {
    const av = a[sortKey.value]; const bv = b[sortKey.value]
    return av < bv ? -1 : av > bv ? 1 : 0
  })
  return sortDesc.value ? sorted.reverse() : sorted
})

// ── 打打ち計算: チェック行だけの合計を computed で ──
const checkedTotal = computed(() =>
  sales.value
    .filter(s => checkedIds.value.has(s.id))
    .reduce((sum, s) => sum + s.totalAmount, 0)
)
const checkedCount = computed(() => checkedIds.value.size)

function toggleCheck(id: number) {
  if (checkedIds.value.has(id)) checkedIds.value.delete(id)
  else checkedIds.value.add(id)
}
function checkAll() {
  checkedIds.value = new Set(sales.value.map(s => s.id))
}
function uncheckAll() { checkedIds.value = new Set() }

// ── API呼出 ──
async function search() {
  const params: Record<string, any> = { page: 0, size: 50 }
  if (form.saleDateFrom) params.saleDateFrom = form.saleDateFrom
  if (form.saleDateTo)   params.saleDateTo   = form.saleDateTo
  if (form.customerId != null)  params.customerId  = form.customerId
  if (form.warehouseId != null) params.warehouseId = form.warehouseId
  if (form.productName.trim()) params.productName = form.productName.trim()
  if (form.totalMin != null) params.totalMin = form.totalMin
  if (form.totalMax != null) params.totalMax = form.totalMax
  if (form.status !== 'ALL') params.status = form.status

  const res = await apiClient.get('/api/sales', { params })
  sales.value = res.data.content
  checkedIds.value = new Set()  // 再検索時は選択リセット
}

onMounted(async () => {
  customers.value = (await apiClient.get('/api/customers')).data
  warehouses.value = (await apiClient.get('/api/warehouses')).data
  await search()
})
</script>

<template>
  <h1>販売伝票</h1>

  <form @submit.prevent="search" class="search-form">
    <div class="search-row">
      <label>伝票日付 <input type="date" v-model="form.saleDateFrom" /></label>
      〜
      <label><input type="date" v-model="form.saleDateTo" /></label>

      <label>顧客
        <select v-model="form.customerId">
          <option :value="null">(すべて)</option>
          <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>

      <label>倉庫
        <select v-model="form.warehouseId">
          <option :value="null">(すべて)</option>
          <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
        </select>
      </label>
    </div>
    <div class="search-row">
      <label>商品名(明細) <input v-model="form.productName" placeholder="部分一致" /></label>
      <label>合計金額 <input type="number" v-model.number="form.totalMin" placeholder="min" /></label>
      〜
      <label><input type="number" v-model.number="form.totalMax" placeholder="max" /></label>
      <label>ステータス
        <select v-model="form.status">
          <option value="ALL">すべて</option>
          <option value="CONFIRMED">確定</option>
          <option value="CANCELLED">取消</option>
        </select>
      </label>
      <button type="submit">検索</button>
    </div>
  </form>

  <!-- 打打ち計算バー -->
  <div class="calc-bar">
    <button @click="checkAll">全選択</button>
    <button @click="uncheckAll">全解除</button>
    <strong>選択 {{ checkedCount }} 件 / 合計 {{ checkedTotal.toLocaleString() }} 円</strong>
  </div>

  <table class="result-table">
    <thead>
      <tr>
        <th></th>
        <th @click="toggleSort('id')">伝票ID ▾</th>
        <th @click="toggleSort('saleDate')">日付 ▾</th>
        <th @click="toggleSort('customerName')">顧客 ▾</th>
        <th>倉庫</th>
        <th @click="toggleSort('totalAmount')" class="num">合計金額 ▾</th>
        <th>ステータス</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="s in sortedSales" :key="s.id"
          :class="{ cancelled: s.status === 'CANCELLED' }">
        <td><input type="checkbox" :checked="checkedIds.has(s.id)" @change="toggleCheck(s.id)" /></td>
        <td><RouterLink :to="`/sales/${s.id}`">{{ s.id }}</RouterLink></td>
        <td>{{ s.saleDate }}</td>
        <td>{{ s.customerName }}</td>
        <td>{{ s.warehouseName }}</td>
        <td class="num">{{ s.totalAmount.toLocaleString() }}</td>
        <td>{{ s.status === 'CONFIRMED' ? '確定' : '取消' }}</td>
      </tr>
    </tbody>
  </table>
</template>
```

> **💡 打打ち計算 は computed の真骨頂**
>
> 「チェック行が変わったら合計が自動更新される」 を、 <u>イベントハンドラを1つも書かずに</u> `computed` だけで実現できる ─ これが Vue のリアクティビティの強みです。`checkedIds` を変えると、 それを参照している `checkedTotal` と `checkedCount` が自動的に再計算される。 命令型で `onClick` 内で合計を更新する書き方より、 ロジックが宣言的で読みやすく、 バグも減ります。

> **⚠ ソートはクライアント側 vs サーバー側、どちらでやる?**
>
> 本章の例はクライアント側ソート(`sortedSales` の `computed`)です。 ページ内の50件を並べ替えるだけならこれで十分速い。 しかし、 全データを横断してソートしたい場合は、 **サーバー側で `Sort.by(...)` を `PageRequest` に渡してソートし、 ページ単位で返す**のが正解です。 本研修では基本クライアント側、 Ch.07 演習で「サーバー側ソートに切り替える練習」 も含めます。

### 3.5-3. 在庫照会(UC09) ─ JOIN + しきい値強調

在庫管理担当が毎日見る画面。 「商品 × 倉庫」 のペアごとに現在の在庫数を表示します。**商品(`product`)、 在庫(`inventory`)、 倉庫(`warehouse`) の3テーブル JOIN**。

| 列       | 検索条件                       | 備考                                                       |
|----------|--------------------------------|------------------------------------------------------------|
| 商品名   | 部分一致                       | `product.name LIKE ?`                                      |
| カテゴリ | プルダウン                     | `product.category_id = ?`                                  |
| 倉庫     | プルダウン                     | `inventory.warehouse_id = ?`                               |
| 在庫数   | しきい値以下のみ表示(チェック) | `inventory.quantity <= ?` (しきい値は商品マスタの安全在庫) |

**views/InventoryView.vue ─ 在庫照会(要点抜粋)**

```vue
<script setup lang="ts">
interface InventoryRow {
  productId: number; productName: string; categoryName: string;
  warehouseId: number; warehouseName: string;
  quantity: number; safetyStock: number;  // 安全在庫(しきい値)
}

const form = reactive({
  productName: '',
  categoryId: null as number | null,
  warehouseId: null as number | null,
  lowStockOnly: false,
})

const rows = ref<InventoryRow[]>([])

// しきい値以下を計算する computed (UI 強調用)
function isLowStock(r: InventoryRow): boolean {
  return r.quantity <= r.safetyStock
}

async function search() {
  const params: Record<string, any> = {}
  if (form.productName.trim()) params.productName = form.productName.trim()
  if (form.categoryId != null) params.categoryId = form.categoryId
  if (form.warehouseId != null) params.warehouseId = form.warehouseId
  if (form.lowStockOnly) params.lowStockOnly = true
  const res = await apiClient.get('/api/inventories', { params })
  rows.value = res.data.content
}
</script>

<template>
  <h1>在庫照会</h1>
  <form @submit.prevent="search">
    <input v-model="form.productName" placeholder="商品名" />
    <select v-model="form.warehouseId">...</select>
    <label><input type="checkbox" v-model="form.lowStockOnly" /> しきい値以下のみ表示</label>
    <button>検索</button>
  </form>

  <table class="result-table">
    <thead>
      <tr><th>商品</th><th>カテゴリ</th><th>倉庫</th><th class="num">在庫数</th><th class="num">安全在庫</th></tr>
    </thead>
    <tbody>
      <tr v-for="r in rows" :key="`${r.productId}-${r.warehouseId}`"
          :class="{ 'low-stock': isLowStock(r) }">
        <td>{{ r.productName }}</td>
        <td>{{ r.categoryName }}</td>
        <td>{{ r.warehouseName }}</td>
        <td class="num">{{ r.quantity }}</td>
        <td class="num">{{ r.safetyStock }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style>
.low-stock { background: #ffe6e6; font-weight: bold; }
.low-stock td.num { color: #c0392b; }
</style>
```

> **📌 行強調 = CSS class バインディング**
>
> `:class="{ 'low-stock': isLowStock(r) }"` ─ 条件式が真の時だけ class が当たる Vue の定番表現。 **CSS と JS の責務を分離**(JSは「条件判定」、 CSSは「見た目」)、 これで一覧画面のロジックがすっきりします。 Day 6 Ch.03(テンプレート構文) で学んだ class バインディングが、 業務系画面でこそ威力を発揮するパターン。

### 3.5-4. 入出庫履歴(UC10) ─ 時系列の動き

仕入登録(入庫) ・ 販売登録(出庫) のたびに `stock_movement` テーブルに1行ずつ記録される履歴の検索画面。 **時系列で表示**し、 期間 + 種別(入庫/出庫) でフィルタします。

| 列       | 検索条件           |
|----------|--------------------|
| 発生日時 | 期間(from〜to)     |
| 商品     | 部分一致           |
| 倉庫     | プルダウン         |
| 種別     | 入庫 / 出庫 / 両方 |
| 数量     | (表示のみ)         |

**views/StockMovementHistoryView.vue ─ 入出庫履歴(要点)**

```vue
<script setup lang="ts">
interface Movement {
  id: number; occurredAt: string;
  productName: string; warehouseName: string;
  movementType: 'IN' | 'OUT';
  quantity: number;
  referenceType: 'PURCHASE' | 'SALE';
  referenceId: number;  // 仕入伝票ID or 販売伝票ID
}

const form = reactive({
  occurredFrom: '', occurredTo: '',
  productName: '',
  warehouseId: null as number | null,
  movementType: 'ALL' as 'ALL' | 'IN' | 'OUT',
})

const movements = ref<Movement[]>([])

// 日付ごとにグルーピング(同じ日の動きをまとめて見せる)
const grouped = computed(() => {
  const map = new Map<string, Movement[]>()
  movements.value.forEach(m => {
    const date = m.occurredAt.substring(0, 10)  // YYYY-MM-DD
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(m)
  })
  return [...map.entries()].sort(([a], [b]) => b.localeCompare(a))  // 日付降順
})
</script>

<template>
  <h1>入出庫履歴</h1>
  <form @submit.prevent="search">
    <input type="date" v-model="form.occurredFrom" />
    〜
    <input type="date" v-model="form.occurredTo" />
    <input v-model="form.productName" placeholder="商品名" />
    <select v-model="form.warehouseId">...</select>
    <select v-model="form.movementType">
      <option value="ALL">入庫+出庫</option>
      <option value="IN">入庫のみ</option>
      <option value="OUT">出庫のみ</option>
    </select>
    <button>検索</button>
  </form>

  <!-- 日付ごとにグルーピング表示 -->
  <div v-for="[date, items] in grouped" :key="date" class="date-group">
    <h3>{{ date }} ({{ items.length }} 件)</h3>
    <table class="result-table">
      <thead><tr><th>時刻</th><th>種別</th><th>商品</th><th>倉庫</th><th class="num">数量</th><th>伝票</th></tr></thead>
      <tbody>
        <tr v-for="m in items" :key="m.id">
          <td>{{ m.occurredAt.substring(11, 16) }}</td>
          <td>
            
              {{ m.movementType === 'IN' ? '入庫' : '出庫' }}
            
          </td>
          <td>{{ m.productName }}</td>
          <td>{{ m.warehouseName }}</td>
          <td class="num">{{ m.quantity }}</td>
          <td>
            <RouterLink :to="m.referenceType === 'PURCHASE'
                          ? `/purchases/${m.referenceId}`
                          : `/sales/${m.referenceId}`">
              {{ m.referenceType === 'PURCHASE' ? '仕入' : '販売' }}#{{ m.referenceId }}
            </RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

> **💡 履歴画面の見やすさは「日付グルーピング」 で決まる**
>
> 履歴は本質的に時系列データなので、 **日付ごとに見出しを付ける**と一気に読みやすくなります。 サーバー側で日付ごとに分けて返すこともできますが、 ページネーションとの両立が難しい。 <u>サーバーは時系列降順でフラット返却、 クライアントで `computed` でグルーピング</u>するのが本研修の流儀です。

### 3.5-5. 章末まとめ ─ 3画面で共通すること

| 画面       | JOIN                          | UI 特徴                                  | Specification 難度 |
|------------|-------------------------------|------------------------------------------|--------------------|
| 販売伝票   | 明細との EXISTS               | 打打ち計算、 列ソート、 取消行のグレー化 | ★★★(花形)          |
| 在庫照会   | 商品 ⋈ 在庫 ⋈ 倉庫            | しきい値以下の行強調                     | ★★                 |
| 入出庫履歴 | 商品 ⋈ 倉庫(+ 伝票へのリンク) | 日付グルーピング、 入庫/出庫バッジ       | ★★                 |

> **📌 この3画面で身につけたこと**
>
> - Ch.03 で覚えた「検索 + 一覧」の型は、 **列が違うだけで全画面に共通**
> - JOIN が必要な検索は **Specification + サブクエリ** で組み立てる
> - 業務系ならではの UI(打打ち計算、 しきい値強調、 日付グルーピング)は<u>クライアント側 `computed`</u>で実現できる
> - サーバーは「条件で絞った時系列フラット」を返し、 表示の工夫はフロント側で ─ これが Spring Boot + Vue の標準的な責務分担
>
> 次の Ch.04 では認証ガード、 そして Ch.07 総合演習では**販売伝票検索の TODO 演習**(顧客プルダウン + 合計金額範囲) + 打打ち計算 + サーバー側ソート に取り組みます。

### Ch.04 認証ガードと権限ベース表示⏱ 60分

ログイン状態とロールに応じた画面制御

### 4-1. ログイン画面

**views/LoginView.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = ref({ username: '', password: '' })
const error = ref<string | null>(null)
const submitting = ref(false)

const submit = async () => {
  submitting.value = true
  error.value = null
  try {
    await auth.login(form.value.username, form.value.password)
    const redirect = route.query.redirect as string | undefined
    router.push(redirect ?? '/')
  } catch (e) {
    error.value = 'ログインに失敗しました'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <input v-model="form.username" placeholder="ユーザー名">
    <input v-model="form.password" type="password" placeholder="パスワード">
    <button :disabled="submitting">ログイン</button>
    <p v-if="error">{{ error }}</p>
  </form>
</template>
```

### 4-2. ルーティングガード(Day 6 の復習)

Day 6 Ch.7 で書いた `router.beforeEach` を再掲。ここで認証チェック + 元のページへリダイレクト先を保持します。

**router/index.ts**

```typescript
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    // 元の遷移先を query に持たせる
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  next()
})
```

### 4-3. v-if による権限ベースの表示

「ADMIN ロールの人だけ削除ボタンを表示」のような制御は v-if で。

**権限による条件分岐**

    <script setup lang="ts">
    import { useAuthStore } from '@/stores/auth'
    import { computed } from 'vue'

    const auth = useAuthStore()
    const isAdmin = computed(() => auth.user?.roles.includes('ADMIN'))
    </script>

    <template>
      <button v-if="isAdmin" @click="remove">削除</button>
    </template>

> **⚠ 画面の権限制御だけでは守れない**
>
> 「ボタンを隠した」だけで安心してはいけません。**クライアント側の制御は UI の都合**で、悪意あるユーザーは API を直接叩けます。本当の防御は **Day 5 で書いたサーバー側の @PreAuthorize**。両者をセットで実装するのが基本。

### 4-4. ナビバーでのログイン状態表示

**AppHeader.vue**

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const logout = () => {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header>
    <RouterLink to="/">ホーム</RouterLink>
    <RouterLink to="/products">商品</RouterLink>

    <template v-if="auth.isLoggedIn">
      こんにちは、{{ auth.user?.username }}さん
      <button @click="logout">ログアウト</button>
    </template>
    <template v-else>
      <RouterLink to="/login">ログイン</RouterLink>
    </template>
  </header>
</template>
```

### Ch.05 エラーハンドリング・ローディングUX・楽観排他⏱ 100分

「読み込み中」「エラー」「空」の3状態を統一的に扱う

### 5-1. UI の4状態を意識する

業務システムの非同期処理は**「初期 → 読み込み中 → 完了/失敗」**の状態遷移を持ちます。これを意識して UI を組むのが UX 設計の基本。

| 状態                  | 表示                                                  |
|-----------------------|-------------------------------------------------------|
| 初期                  | 「データを取得しますか?」(明示的に取得開始させる場合) |
| 読み込み中            | スピナー・スケルトン                                  |
| 完了 + データあり     | 本来のコンテンツ                                      |
| 完了 + データなし(空) | 「該当データがありません」+ 新規作成への導線          |
| 失敗                  | エラーメッセージ + リトライボタン                     |

### 5-2. 共通コンポーネント化

**components/LoadingSpinner.vue**

```vue
<template>
  <div class="spinner">
    <div class="spinner-icon"></div>
    <p><slot>読み込み中...</slot></p>
  </div>
</template>

<style scoped>
.spinner { display: flex; align-items: center; gap: 8px; }
.spinner-icon {
  width: 20px; height: 20px;
  border: 3px solid #ddd;
  border-top-color: #2d6a4f;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
```

**components/ErrorAlert.vue**

```vue
<script setup lang="ts">
interface Props {
  message: string
}
defineProps<Props>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="alert">
    <p>⚠ {{ message }}</p>
    <button @click="emit('retry')">再試行</button>
  </div>
</template>

<style scoped>
.alert { padding: 12px; background: #fdecea; border: 1px solid #c0392b; border-radius: 6px; }
</style>
```

### 5-3. グローバルエラーハンドラ ─ 想定外のエラー

**main.ts**

```typescript
const app = createApp(App)

// 想定外の例外をキャッチ
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err, info)
  // Sentry/Datadog などへ送信
}

// 未処理の Promise も拾う
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise:', event.reason)
})
```

### 5-4. トースト通知 ─ 操作成功フィードバック

「保存しました」「削除しました」のような短時間の通知は**トースト**で。ここでは Pinia ベースのシンプルな実装例。

**stores/toast.ts**

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 0

  const show = (message: string, type: Toast['type'] = 'info') => {
    const id = ++nextId
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 3000)
  }

  return { toasts, show }
})
```

**使う側**

    const toast = useToastStore()

    await productApi.create(form.value)
    toast.show('商品を登録しました', 'success')
    router.push('/products')

### 5-5. 楽観排他と悲観ロック ─ 同時更新からデータを守る

業務システムを実運用すると、ほぼ必ず直面する問題があります ─ **2人のユーザーが同時に同じデータを更新する**ことです。 たとえば販売担当のAさんとBさんが、同じ販売伝票の一覧画面を別々のブラウザで開いている状況。 Aさんが「取消」ボタンを押した直後、Bさんがその伝票が取消済みになったことを知らずに別の操作(価格修正など)で保存ボタンを押すと、Bさんの上書きでAさんの取消操作が消えてしまいます。 これが<u>「気付かないうちのロストアップデート」</u>です。

［図（テキスト抽出）：ロストアップデート ─ 何も対策しないと起きること / Aさん(販売担当) / DB(販売伝票#100) / Bさん(別端末) / ①SELECT (status=CONFIRMED) / ②SELECT (status=CONFIRMED) 同じ画面 / ③UPDATE status=CANCELLED / 「取消」ボタン押下 / DB: status=CANCELLED に / ④UPDATE 価格修正(古い情報のまま) / → Aさんの取消が消える!］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図 5-5-1: 何も対策しないと、後勝ちで先のユーザーの変更が消える

**📌 楽観排他 vs 悲観ロック ─ 仕組みと使い分け**

同時更新を防ぐアプローチには2つあります。 名前は似ていますが完全に別物です。

| 観点         | 楽観排他 (optimistic)                                                                                     | 悲観ロック (pessimistic)                                                                         |
|--------------|-----------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| 仕組み       | レコードに `version` 列を持ち、UPDATE 時に「読んだ時と同じ version か」を WHERE 句で確認。 違ったらエラー | SELECT 時に DB に「他のトランザクションは触るな」と明示的にロックをかける(`SELECT … FOR UPDATE`) |
| 性能         | 読み取り中はロックなし → スループット高。 衝突したときだけリトライ                                        | ロック中は他トランザクションが待たされる → スループット低                                        |
| 業務上の場面 | マスタ編集、伝票のステータス変更、通常のCRUD ─ **衝突がレア**な場面                                       | 在庫の引当、残高の減算、採番処理 ─ **同時実行で整合性が崩れる**クリティカルな場面                |
| ユーザー体験 | 「他の人が変更しました」 と画面に表示 → ユーザーは再読込してやり直す                                      | ユーザーには見えない。 数ms 待つだけ                                                             |
| デッドロック | 起こらない(ロック取らないので)                                                                            | 順序を間違えると起こり得る ─ 設計に注意                                                          |

**原則**: <u>業務システムの大半は楽観排他で十分</u>。 衝突が頻発する局所処理(在庫引当・採番)だけ悲観ロックを使う、 が定石です。

#### 5-5-1. JPA 標準の楽観排他 ─ `@Version`

Spring Data JPA は `@Version` アノテーション1つで楽観排他を実現できます。 仕組みはシンプル:

1.  Entity に `version: Long` 列を追加 (`@Version` 付与)
2.  JPA は UPDATE 時に `WHERE id = ? AND version = ?` を自動付与
3.  同時に `SET version = version + 1` もインクリメント
4.  更新行数が0なら `OptimisticLockingFailureException` を投げる

**repository/SaleEntity.kt ─ Entity に @Version を追加**

```kotlin
@Entity
@Table(name = "sale")
class SaleEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sale_id")
    val id: Long? = null,

    @Column(nullable = false)
    var status: SaleStatus,

    @Column(name = "total_amount", nullable = false)
    var totalAmount: BigDecimal,

    // ↓ これだけで楽観排他が有効に!
    @Version
    @Column(nullable = false)
    var version: Long = 0,
)
```

> **💡 命名規則の復習 (Day 4 3-2 参照)**
>
> 本研修では **Domain (純粋なビジネスモデル) と Entity (JPA用) を分離**する設計を採っています。 Domain は `Sale`、 Entity は `SaleEntity` で命名し、 Entity は `repository/` パッケージに置きます。 5-5節以降では Entity 側の更新を扱うため、 `SaleEntity` の例を使います。

**JPA が発行するSQL (自動生成)**

    -- 読み取り時
    SELECT sale_id, status, total_amount, version FROM sale WHERE sale_id = 100;
    -- → version=3 を取得

    -- 更新時 (JPA が自動的に WHERE version=? を付ける)
    UPDATE sale
    SET    status = 'CANCELLED',
           version = 4              -- 自動インクリメント
    WHERE  sale_id = 100
      AND  version = 3;             -- ← 読んだ時と同じ version か検証

    -- 影響行数 0 なら → OptimisticLockingFailureException 発生

DDL 側に version 列を追加するため、`infra/initdb/init.sql` に `version BIGINT NOT NULL DEFAULT 0` を追記しておきます。

#### 5-5-2. Service層 ─ 例外をキャッチして 409 を返す

Controller/Service 層は通常通り書けば良いのですが、JPA が投げる `ObjectOptimisticLockingFailureException` をどこで捕まえるかが重要です。 業務的には「衝突→ユーザーに再読込してもらう」のが正解なので、HTTP 409 Conflict として返します。

**service/SaleService.kt**

```kotlin
@Service
class SaleService(private val repo: SaleRepository) {

    @Transactional
    fun cancel(id: Long, expectedVersion: Long) {
        val sale = repo.findById(id).orElseThrow { SaleNotFoundException(id) }

        // フロントから受け取った version を強制セット
        // → JPA が flush 時に WHERE version=? でチェック
        sale.version = expectedVersion

        require(sale.status == SaleStatus.CONFIRMED) {
            "既に取消済み、または取消できない状態です"
        }
        sale.status = SaleStatus.CANCELLED
        // @Transactional 終了時に flush → ここで例外が出る可能性
    }
}
```

**exception/GlobalExceptionHandler.kt ─ 例外→409 変換**

```kotlin
@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(ObjectOptimisticLockingFailureException::class)
    fun handleOptimisticLock(e: ObjectOptimisticLockingFailureException) =
        ResponseEntity
            .status(HttpStatus.CONFLICT)         // 409
            .body(ErrorResponse(
                code = "OPTIMISTIC_LOCK_CONFLICT",
                message = "他のユーザーが先に更新しました。最新の内容を読み込んでやり直してください。"
            ))
}
```

> **💡 なぜフロントから version を受け取るのか**
>
> もし Service 内で「`findById` して即 UPDATE」 だと、JPA は<u>取得した瞬間の version</u> を使って WHERE するため衝突が検知できません(=ユーザーが画面で見ていた時の version とは別物)。 **フロントが画面に表示した時点の version を保持し、保存時にAPIへ送ることで初めて、ユーザー視点での同時更新が検知できる**のです。

#### 5-5-3. 自作SQL での楽観排他 ─ `@Modifying @Query`

JPAの ORマッパー機能を使わず、直接UPDATE文を書きたいケースもあります(集計処理や、Entityに乗せたくないバッチ更新など)。 この場合は `@Modifying @Query` で WHERE句に version 条件を入れ、 戻り値の**影響行数**を見て衝突判定します。

**repository/SaleRepository.kt**

```kotlin
interface SaleRepository : JpaRepository<SaleEntity, Long> {

    // 自作SQLで楽観排他付きUPDATE
    @Modifying
    @Query("""
        UPDATE SaleEntity s
        SET    s.status = :newStatus,
               s.version = s.version + 1
        WHERE  s.id = :id
          AND  s.version = :expectedVersion
    """)
    fun updateStatusWithVersionCheck(
        @Param("id") id: Long,
        @Param("newStatus") newStatus: SaleStatus,
        @Param("expectedVersion") expectedVersion: Long,
    ): Int   // ← 影響行数を返す
}
```

**service/SaleService.kt ─ 自作SQL版の取消処理**

```kotlin
@Service
class SaleService(private val repo: SaleRepository) {

    @Transactional
    fun cancelBySql(id: Long, expectedVersion: Long) {
        val affected = repo.updateStatusWithVersionCheck(
            id = id,
            newStatus = SaleStatus.CANCELLED,
            expectedVersion = expectedVersion,
        )
        if (affected == 0) {
            // version不一致 or レコード自体が無い → 衝突として扱う
            throw OptimisticLockConflictException(
                "販売伝票 #$id は他のユーザーが更新済み、または存在しません"
            )
        }
    }
}

class OptimisticLockConflictException(message: String) : RuntimeException(message)
```

**GlobalExceptionHandler.kt に追加**

```kotlin
@ExceptionHandler(OptimisticLockConflictException::class)
fun handleConflict(e: OptimisticLockConflictException) =
    ResponseEntity
        .status(HttpStatus.CONFLICT)
        .body(ErrorResponse(
            code = "OPTIMISTIC_LOCK_CONFLICT",
            message = e.message ?: "同時更新を検知しました",
        ))
```

**📊 JPA版 vs 自作SQL版 ─ どちらを選ぶか**

| 観点             | JPA `@Version`                               | 自作SQL `@Modifying`                             |
|------------------|----------------------------------------------|--------------------------------------------------|
| 記述量           | 少ない(アノテ1つ)                            | SQL を毎回書く                                   |
| 更新内容の自由度 | Entity全体(変更されたフィールドのみ)         | SQLで明示した列のみ                              |
| SELECT が必要か  | 必要(エンティティ取得→変更→flush)            | 不要(直接UPDATE可能)                             |
| 性能             | SELECT分のラウンドトリップが発生             | UPDATE 1発で済む                                 |
| 適した場面       | マスタ編集など、変更前後を画面表示するケース | ステータス変更のみなど、特定列だけ更新するケース |

本研修では**両方とも実装します**。 マスタCRUD系の画面は JPA版、 ステータス変更だけのAPIは 自作SQL版 として使い分けるのが実務的です。

#### 5-5-4. 悲観ロック ─ 在庫引当のように衝突が頻発する場面で

楽観排他は「衝突したら例外を投げて、ユーザーに再読込してもらう」 戦略です。 ところが <u>ユーザー操作を介さない裏側の処理</u> ─ たとえば「販売登録時に在庫を引く」 ─ では、 衝突するたびに例外で死なれては困ります。 こうしたケースで悲観ロックを使います。

> **⚠️ 業務想定 ─ 二重引当の事故**
>
> 販売登録は次の流れで在庫を更新します:
>
> 1.  商品Xの在庫レコードを SELECT (現在: 10個)
> 2.  サービス層で「10 − 注文数3 = 7」を計算
> 3.  UPDATE で在庫を 7 にセット
>
> ところが、トランザクションA・B が **ほぼ同時**に処理されると…
>
> - A が SELECT(10) → B が SELECT(10) → A が UPDATE(7) → B が UPDATE(7)
> - 本来 10 − 3 − 3 = 4 になるべきところが、 在庫が 7 のまま**3個分が消失**
> - 結果: 帳簿上の在庫と実在庫が合わなくなり、 棚卸で発覚するまで気づけない
>
> この状況で「楽観排他で例外→再試行を勧める」 は非現実的(ユーザーは「販売登録」したいだけで、衝突など知らない)。 サーバ側で確実にシリアライズすべき場面です。

**repository/StockRepository.kt ─ FOR UPDATE で行ロック**

```kotlin
interface StockRepository : JpaRepository<Stock, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)   // ← SELECT … FOR UPDATE
    @Query("SELECT s FROM Stock s WHERE s.productId = :productId")
    fun findByProductIdForUpdate(@Param("productId") productId: Long): Stock?
}
```

**service/SaleService.kt ─ 販売登録(在庫引き当て)**

```kotlin
@Transactional
fun register(req: SaleRegisterRequest) {
    req.lines.forEach { line ->
        // ★ FOR UPDATE で行ロック取得 → 他トランザクションは待たされる
        val stock = stockRepo.findByProductIdForUpdate(line.productId)
            ?: throw StockNotFoundException(line.productId)

        require(stock.quantity >= line.qty) {
            "在庫が不足しています(残: ${stock.quantity}, 要求: ${line.qty})"
        }
        stock.quantity -= line.qty   // 安全に減算できる
    }
    // 販売伝票本体を保存
    saleRepo.save(SaleEntity.from(req))
    // @Transactional 終了 → COMMIT のタイミングでロック解放
}
```

> **💡 悲観ロックの注意点 3つ**
>
> - **トランザクションを短く**: ロック中は他トランザクションが待たされる。 重い処理(外部API呼び出しなど)はロックの外で済ませる
> - **ロック順序を統一**: 複数行をロックする時は必ず同じ順(例: productId 昇順) で取らないとデッドロックの原因になる
> - **タイムアウト設定**: `@QueryHints` で `javax.persistence.lock.timeout` を指定し、長時間待ちで諦めるようにする

#### 5-5-5. フロント側の対応 ─ version を保持し、409 で再読込を促す

サーバ側で楽観排他を実装しても、フロント側が version を送ってこなければ意味がありません。 また 409 が返ってきた時のユーザー体験(再読込ダイアログ表示)も合わせて作り込みます。

**types/sale.ts ─ APIレスポンスに version を含める**

```typescript
export interface Sale {
  id: number
  customerId: number
  status: 'CONFIRMED' | 'CANCELLED'
  totalAmount: number
  version: number     // ← フロント側でも保持
}
```

**api/saleApi.ts ─ 取消API呼び出し時に version を送る**

```typescript
export const saleApi = {
  async cancel(id: number, version: number): Promise<void> {
    await apiClient.post(`/api/sales/${id}/cancel`, { version })
  }
}
```

**views/SaleListView.vue ─ 409 をキャッチして再読込誘導**

```vue
<script setup lang="ts">
const sales = ref<Sale[]>([])
const toast = useToastStore()

async function onCancel(sale: Sale) {
  if (!confirm(`販売伝票 #${sale.id} を取消しますか?`)) return

  try {
    await saleApi.cancel(sale.id, sale.version)
    toast.show('取消しました', 'success')
    await reload()   // 最新の version を取得し直す
  } catch (e: any) {
    if (e.response?.status === 409) {
      alert(
        '他のユーザーが先に変更しました。' +
        '\n最新の状態を読み込みます。確認のうえやり直してください。'
      )
      await reload()   // 自動で最新を再読込
    } else {
      toast.show('取消に失敗しました', 'error')
    }
  }
}
</script>
```

> **✅ 5-5 まとめ**
>
> - **楽観排他**: `@Version` または 自作 `@Modifying @Query`。 衝突は例外→409→フロントで再読込誘導。 業務システムの大半はこれで足りる
> - **悲観ロック**: `@Lock(PESSIMISTIC_WRITE)`。 在庫引当のような、 ユーザーには見せず確実にシリアライズしたい局所処理だけ使う
> - **version はフロントへ伝搬**: APIレスポンスに含め、 更新時のリクエストで送り返す
> - **409 は「再読込せよ」のサイン**: ユーザーには静かに最新状態を再表示する

> **✏️ 演習 5-5-1 ─ 販売伝票取消に楽観排他を実装**
>
> 販売伝票の取消APIに楽観排他を組み込んでください。 JPA版と自作SQL版の2エンドポイントを用意し、 違いを体感します。
>
> ##### TODO ①: DDLに version 列を追加
>
> - `infra/initdb/init.sql` の `sale` テーブルに `version BIGINT NOT NULL DEFAULT 0` を追加
> - `docker compose down -v && docker compose up -d` で再初期化
>
> ##### TODO ②: Entity に `@Version` を追加
>
> - `repository/SaleEntity.kt` (新規作成。 Day 4 の `ProductEntity.kt` を参考に) に `@Version var version: Long = 0` を追加
> - `SaleEntity` は `JpaRepository<SaleEntity, Long>` の型パラメータとして使う
>
> ##### TODO ③: JPA版 取消API
>
> - エンドポイント: `POST /api/sales/{id}/cancel`
> - リクエストボディ: `{ "version": 3 }`
> - Service層で `sale.version = req.version` をセットしてから `status` を変更
> - `ObjectOptimisticLockingFailureException` をGlobalExceptionHandlerで 409 に変換
>
> ##### TODO ④: 自作SQL版 取消API
>
> - エンドポイント: `POST /api/sales/{id}/cancel-sql`
> - Repository に `@Modifying @Query` で WHERE version=? 付きUPDATEを書く
> - 影響行数=0 なら独自例外 `OptimisticLockConflictException` を投げ、 同じく 409 に変換
>
> ##### TODO ⑤: フロント連携
>
> - `SaleListView.vue` の取消ボタンで sale.version を API に送る
> - 409 を受け取ったら alert で「他のユーザーが…」 を表示し、 一覧を再読込
> - 正常系は toast で「取消しました」 を表示
>
> ##### TODO ⑥: 衝突を実際に再現
>
> 1.  Chrome と Edge(またはシークレットウィンドウ)で `/sales` を開く
> 2.  両方の画面で同じ販売伝票 \#1 を表示(両方 version=0)
> 3.  Chrome側で取消を実行 → 成功 (DB上 version=1)
> 4.  Edge側で取消を実行 → alert 「他のユーザーが先に変更しました」
> 5.  Edge側が自動再読込 → status=CANCELLED が表示される
>
> ##### 発展: 悲観ロックの確認 (任意・15分)
>
> - `StockRepository` に `@Lock(PESSIMISTIC_WRITE)` 付きの `findByProductIdForUpdate` を追加
> - SaleService の販売登録処理で在庫引当に使う
> - 2セッション同時で同じ商品の販売登録を実行し、 片方が待たされることを確認
> - 確認方法: PostgreSQL の `pg_locks` ビューで `SELECT * FROM pg_locks WHERE granted = false;`
>
> > **💡 完成イメージの動作**
> >
> > - 正常時: 取消ボタン → toast 「取消しました」 → 一覧が更新
> > - 衝突時: 取消ボタン → alert 「他のユーザーが…」 → 一覧が自動再読込 → CANCELLED表示
> > - 悲観ロック時: もう1セッションが処理中だと、 自分のリクエストは数百ms 待たされる(タイムアウトなし)

### Ch.06 ビルドと統合⏱ 60分

Vue を本番ビルドして Spring Boot とどう繋ぐか

### 6-1. 統合パターンの選択

Spring Boot と Vue の統合には主に2パターンあります。どちらを選ぶかは運用要件次第。

| パターン                | 構成                                                                            | 長所                                      | 短所                              |
|-------------------------|---------------------------------------------------------------------------------|-------------------------------------------|-----------------------------------|
| **① jar 同梱**          | Vue のビルド成果物を Spring Boot の `resources/static` に入れて1つの jar にする | デプロイが単一 jar で完結 / CORS 問題なし | フロント/バックの独立デプロイ不可 |
| **② 別origin デプロイ** | Vue は CDN/S3、Spring Boot は別ホスト                                           | 独立デプロイ可能 / CDNでフロント高速配信  | CORS設定必要 / インフラ複雑       |

### 6-2. パターン①: jar 同梱

Vue のビルド成果物(`dist/` ディレクトリ)を Spring Boot の static リソースとしてバンドルする方法。

**Vue ビルド + コピー**

```vue
$ # Vue 側
$ npm run build
$ # 出力: dist/ ディレクトリ

$ # Spring Boot 側にコピー
$ cp -r dist/* ../backend/src/main/resources/static/

$ # Spring Boot をビルド
$ ./gradlew bootJar
```

#### Gradle で自動化

**build.gradle.kts**

```groovy
tasks.register<Exec>("buildFrontend") {
    workingDir = file("../frontend")
    commandLine("npm", "run", "build")
}

tasks.register<Copy>("copyFrontend") {
    dependsOn("buildFrontend")
    from("../frontend/dist")
    into("src/main/resources/static")
}

tasks.named("processResources") {
    dependsOn("copyFrontend")
}
```

これで `./gradlew bootJar` 1発で「Vueビルド → コピー → jar作成」が走ります。

#### SPA のルーティングを Spring Boot に教える

SPA の `/products/123` のような URL に直接アクセスすると、Spring Boot は「そんなコントローラ無い」と 404 を返してしまう。これを `index.html` にフォワードする必要があります。

**WebConfig.kt**

```kotlin
@Configuration
class WebConfig : WebMvcConfigurer {
    override fun addViewControllers(registry: ViewControllerRegistry) {
        // /api/** 以外のパスを SPA index にフォワード
        registry.addViewController("/{path:[^.]*}").setViewName("forward:/index.html")
        registry.addViewController("/{path:^(?!api).*$}/**/{path2:[^.]*}")
            .setViewName("forward:/index.html")
    }
}
```

### 6-3. パターン②: 別 origin デプロイ

Vue は静的サイトとして CDN / S3 / Vercel などに、Spring Boot は API サーバーとして別のホストに置く。

**api/client.ts(環境変数を使う)**

```typescript
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,   // 環境変数
  timeout: 10000,
})
```

**.env.production**

    VITE_API_BASE_URL=https://api.example.com

Spring Boot 側では Day 5 で設定した CORS をプロダクション用の origin に変更します。

> **💡 どちらを選ぶか**
>
> - **小〜中規模、社内システム**: パターン① で十分
> - **大規模、SaaS、グローバル**: パターン② で CDN 活用、独立デプロイ可能に

### Ch.07 総合演習: 仕入・在庫・販売管理システム完成⏱ 180分

研修の集大成 ─ Spring Boot + Vue 3 でシステムを完成させる

### 7-1. 演習課題 ─ 業務定義書のユースケース実装

Day 4〜6 で作ってきたコードを統合して、**在庫仕入販売管理システム**を完成させます。業務定義書で定義された 4 アクター × 11 ユースケースのうち、**研修の集大成として実装する 7 機能**を以下に整理します。

> **📌 業務定義書を傍に置いて取り組む**
>
> 本演習は**『Kotlin演習_業務設計資料.docx』** の以下を参照しながら進めます:
>
> - **第2章 業務アクター**(4アクター: システム管理者 / 調達担当 / 在庫管理担当 / 販売担当)
> - **第3章 ユースケース図**(UC01〜UC11)、**第4章 ユースケース記述**(UC06、UC07、UC08、UC02 の詳細シナリオ)
> - **第6章 データ設計**(テーブル一覧、ER図)
> - **第7章 アーキテクチャ**、**第8章 シーケンス図**(UC08販売登録)、**第9章 データの流れ全体図**

#### 機能要件 ─ 業務定義書のユースケース単位で実装

1.  **UC11 ログイン**(全アクター)─ 4 ロール(`ROLE_ADMIN`=システム管理者、`ROLE_PROCUREMENT`=調達担当、`ROLE_INVENTORY`=在庫管理担当、`ROLE_SALES`=販売担当)で JWT 認証
2.  **UC01 商品マスタ管理**(システム管理者)─ CRUD 画面、JANコード独自バリデータ(Day 4 で学習)、認可は**メソッドレベル認可**(Day 5)で制御
3.  **UC02 商品定価改定**(システム管理者、履歴型マスタ題材)─ `product_price_history` テーブルへの履歴追加と既存履歴の `valid_to` 更新を**同一トランザクションで実行**(Day 5 の複数テーブル更新)
4.  **UC07 仕入登録**(調達担当)─ 仕入伝票 INSERT + 明細 INSERT(複数行) + `inventory` 加算 + `stock_movement` 履歴記録を**同一トランザクションで実行**(Day 5 ─ 業務定義書UC07主要シナリオ参照)
5.  **UC08 販売登録**(販売担当)─ 在庫チェック → 不足時 `InventoryShortageException` 投入 → ControllerAdvice が HTTP 400 に変換 → フロントでエラー表示。在庫充足時は伝票 INSERT + 在庫減算 + 履歴記録(Day 5)
6.  **UC09 在庫照会**(在庫管理担当、調達担当)─ 商品 + 倉庫の**JOIN クエリ**、在庫不足のしきい値で行を強調表示。N+1 問題に注意して `JOIN FETCH` で取得(Day 5)
7.  **UC06 仕入先API並列見積取得**(調達担当)─ Spring Boot 側で `async + supervisorScope + withTimeout(3秒)` で 3 社並列呼出(Day 3)、フロント側で Vue から1回の API 呼出で結果一覧を表示

#### 技術要件 ─ Day 1-6 で学んだ要素の組み合わせ

| 領域             | 使う技術                                                                                                      | 関連 Day / Ch            |
|------------------|---------------------------------------------------------------------------------------------------------------|--------------------------|
| レイヤー設計     | Controller → Service → Repository、DTO/Domain/Entity の3層変換                                                | Day 4 Ch.3               |
| Validation       | 標準アノテーション + JANコード独自(単項目) + クラスレベル独自(項目間整合性)                                   | Day 4 Ch.5               |
| 例外ハンドリング | @RestControllerAdvice、InventoryShortageException、AuthenticationException、エラー応答の標準化                | Day 4 Ch.6、Day 5 Ch.2-6 |
| 認証・認可       | JWT(`sub` に user_id、`roles` にロール) + SecurityFilterChain + @PreAuthorize によるメソッドレベル認可        | Day 5 Ch.2               |
| トランザクション | @Transactional で複数テーブル整合、監査ログだけ REQUIRES_NEW で残す、デッドロック対策(更新順序統一)           | Day 5 Ch.3               |
| 並列処理         | UC06 で `supervisorScope + async + withTimeout` で3社並列呼出                                                 | Day 3 Ch.6-8             |
| ログ・監視       | Logback でテキストログ(MDC でリクエストID付与) + /actuator/health                                             | Day 5 Ch.6               |
| Vue 側           | Composition API、Vue Router でアクター別の画面、Pinia の auth store でログイン状態                            | Day 6                    |
| API 連携         | axios + interceptor で JWT 自動付与、401 で自動ログアウト、Vee-Validate でフロントバリデーション              | Day 7 Ch.1-2             |
| エラー表示       | サーバーエラー(StockInsufficient等)を ErrorResponse で受けて画面表示、UI の4状態(loading/empty/error/success) | Day 7 Ch.5               |
| ビルド・統合     | jar 同梱 or 別 origin(CORS設定) の選択                                                                        | Day 7 Ch.6               |

> **💡 設計のヒント ─ Day別の既存コードをそのまま流用**
>
> Day 4〜6 で書いたコードは**そのまま流用**できる部分が多いです。新規に書くのは:
>
> - **UC07/UC08 の Service** ─ 図3-1(Day 5)の「sale/sale_detail/inventory/stock_movement を同一トランザクションで更新」のパターンをそのまま適用
> - **UC06 の並列API集約 Service** ─ Day 3 の `supervisorScope + async` 例をベースに
> - **Vue 側の伝票入力画面** ─ v-model で明細行を動的追加、Day 6 図3-1 の v-model → JSON → DTO 流れ
> - **業務エラー(在庫不足) の Vue 表示** ─ axios で 400 を受けたら ErrorResponse の `code`/`message` を画面表示

#### アクター別の画面マップ

ログインユーザーのロール(JWT の `roles` クレーム)に応じて、表示する画面・ボタンを出し分けます。**Vue Router のナビゲーションガード + v-if による表示制御**と、**Spring Security のメソッドレベル認可**の二重で守ります(画面で隠す+APIで拒否、Day 5 / Day 7 で学習済み)。

| 画面                    | システム管理者 | 調達担当 | 在庫管理担当 | 販売担当 |
|-------------------------|----------------|----------|--------------|----------|
| 商品マスタ(UC01) ─ CRUD | ○              | 閲覧のみ | 閲覧のみ     | 閲覧のみ |
| 商品定価改定(UC02)      | ○              | ×        | ×            | ×        |
| 仕入登録(UC07)          | ○              | ○        | ×            | ×        |
| 販売登録(UC08)          | ○              | ×        | ×            | ○        |
| 仕入先API見積(UC06)     | ○              | ○        | ×            | ×        |
| 在庫照会(UC09)          | ○              | ○        | ○            | ×        |
| 入出庫履歴(UC10)        | ○              | ○        | ○            | ×        |

#### 到達確認 ─ 完成チェックリスト

- [ ] 4 アクター(管理者/調達/在庫/販売) でそれぞれログインでき、画面が出し分けされる
- [ ] システム管理者のみ商品マスタの追加・編集・削除ができる(画面/API 両方)
- [ ] 調達担当が仕入を登録すると、仕入伝票・明細・在庫・履歴の4テーブルが整合して登録される
- [ ] 販売担当が販売を登録すると、在庫が減算され履歴に記録される
- [ ] 在庫不足時に販売を試みると、画面に「在庫が不足しています(商品:○○、要求:N、現在庫:M)」と表示される(伝票は保存されない)
- [ ] 調達担当が見積取得画面で商品を入力すると、3 社の応答が並列で取得され表示される(タイムアウトは「応答なし」表示、エラー社は「エラー」表示)
- [ ] 在庫管理担当が在庫照会画面で在庫一覧を見ると、しきい値以下が強調表示される
- [ ] JWT の有効期限切れ(401)で自動的にログイン画面に飛ぶ
- [ ] ログイン状態がリロードしても維持される(localStorage に JWT 保存)
- [ ] `/actuator/health` が 200 を返す(ロードバランサからの監視想定)
- [ ] サーバーログに リクエストID(MDC) 付きでログが出力されている

### 7-2. 実装演習 ─ CRUD + ページネーション + REST 同期/非同期 + reactive 描画

ここからは **「実際にコードを書く」 演習** です。7-3 で動かす完成版に至るまでの<u>各機能を、自分の手で実装</u>します。Vue の reactivity・Pinia 状態書き換え・axios による API 通信・ページネーションなど、業務システムで必須の要素を網羅した7つの演習に取り組みます。

> **⚠ 演習の進め方**
>
> - **必須演習①** ─ **販売伝票の検索 + 一覧 + 打打ち計算 + ページネーション**(花形演習。 TODO2条件あり)
> - **必須演習②〜⑤** ─ 商品マスタCRUD(詳細/登録/更新/削除)と reactive 描画
> - **必須演習⑥** ─ REST の同期処理(直列 await)と非同期処理(Promise.all による並列)の対比
> - **必須演習⑦** ─ 画面の reactive 書き換え描画(楽観的更新と失敗時ロールバック)
> - 配布の `frontend/` 配下に新規ファイルを作成しながら進めます。完成版は `frontend/src/views/exercises/` 配下に講師が後で公開
> - 「動かなくて当然、止まったら隣の人と相談」 ─ ハンズオンの基本姿勢

#### 📝 演習① 販売伝票の検索 + 一覧 + 打打ち計算 + ページネーション

**狙い**: 業務系一覧の**花形**である販売伝票一覧を、 検索フォーム + 一覧 + 打打ち計算 + ページャー の4点セットで実装する。 Ch.03 で学んだ型を、 在庫仕入販売管理システムの中核業務にあてはめる集大成演習。

> **📋 演習の構成 ─ 部分的に TODO を残してある**
>
> 本演習はサンプルコードを**ほぼ完成版で提供**します。 ただし<u>2つの検索条件だけ TODO</u>として未実装になっています:
>
> - **TODO① 顧客プルダウン検索**(やさしい)─ 単項目の完全一致を AND 条件に足す
> - **TODO② 合計金額範囲検索**(やや難)─ min/max 両方 optional、 片方だけ指定もアリで BETWEEN を組み立てる
>
> サンプルコードを写経しながら全体を理解 → TODO 部分を自分で書く → 動かして検証、 の3ステップで進めます。

#### 仕様

- バック側: `GET /api/sales` ─ 検索条件を `@RequestParam` でいくつも受け、 JPA Specification で AND 検索を組み立て、 `Page<SaleResponse>` を返す
- 検索条件: 期間(伝票日付 from〜to) / **顧客【TODO①】** / 倉庫 / 商品名(明細JOIN) / **合計金額範囲【TODO②】** / ステータス
- フロント側: 検索フォーム + 結果テーブル + **打打ち計算バー**(チェック行の件数と合計) + 列ヘッダクリックでソート + ページャー
- 取消(`status=CANCELLED`) の行はグレー化して表示
- 商品名 LIKE 検索は `sale_line ⋈ product` の JOIN(Specification では EXISTS サブクエリ)で実装(サンプル提供)

**作成・編集するファイル**:

- `backend/.../controller/SaleController.kt`(検索エンドポイント追加)
- `backend/.../repository/SaleSpecifications.kt`(**TODO① と TODO② をここに足す**)
- `frontend/src/views/exercises/SaleListExercise.vue`(**TODO に対応する検索フィールド2つも追加**)

#### ① バックエンド ─ Controller(サンプル提供、 修正不要)

**SaleController.kt**

```kotlin
@RestController
@RequestMapping("/api/sales")
class SaleController(private val saleService: SaleService) {

    @GetMapping
    fun search(
        @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) saleDateFrom: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) saleDateTo: LocalDate?,
        @RequestParam(required = false) customerId: Long?,       // ← TODO① で使う
        @RequestParam(required = false) warehouseId: Long?,
        @RequestParam(required = false) productName: String?,
        @RequestParam(required = false) totalMin: BigDecimal?,    // ← TODO② で使う
        @RequestParam(required = false) totalMax: BigDecimal?,    // ← TODO② で使う
        @RequestParam(required = false) status: SaleStatus?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
        @RequestParam(defaultValue = "saleDate,desc") sort: String,
    ): Page<SaleResponse> {
        val condition = SaleSearchCondition(
            saleDateFrom, saleDateTo, customerId, warehouseId,
            productName, totalMin, totalMax, status
        )
        val pageable = PageRequest.of(page, size, parseSort(sort))
        return saleService.search(condition, pageable).map { it.toResponse() }
    }

    private fun parseSort(s: String): Sort {
        val (prop, dir) = s.split(",").let { (it[0]) to (it.getOrElse(1) { "asc" }) }
        return if (dir == "desc") Sort.by(prop).descending() else Sort.by(prop).ascending()
    }
}

data class SaleSearchCondition(
    val saleDateFrom: LocalDate? = null,
    val saleDateTo: LocalDate? = null,
    val customerId: Long? = null,
    val warehouseId: Long? = null,
    val productName: String? = null,
    val totalMin: BigDecimal? = null,
    val totalMax: BigDecimal? = null,
    val status: SaleStatus? = null,
)
```

#### ② バックエンド ─ Specification(**TODO① と TODO② はここ**)

**SaleSpecifications.kt**

```kotlin
object SaleSpecifications {

    fun build(c: SaleSearchCondition): Specification<Sale> =
        Specification.where(saleDateBetween(c.saleDateFrom, c.saleDateTo))
            .and(customerEq(c.customerId))      // ← TODO① 実装したらここで効く
            .and(warehouseEq(c.warehouseId))
            .and(productNameLike(c.productName))
            .and(totalBetween(c.totalMin, c.totalMax))  // ← TODO② 実装したらここで効く
            .and(statusEq(c.status))

    // ── 既に実装済み(写経して挙動を理解する) ──
    private fun saleDateBetween(from: LocalDate?, to: LocalDate?): Specification<Sale>? = when {
        from != null && to != null -> Specification { r, _, cb -> cb.between(r.get("saleDate"), from, to) }
        from != null                  -> Specification { r, _, cb -> cb.greaterThanOrEqualTo(r.get("saleDate"), from) }
        to != null                    -> Specification { r, _, cb -> cb.lessThanOrEqualTo(r.get("saleDate"), to) }
        else                            -> null
    }

    private fun warehouseEq(warehouseId: Long?): Specification<Sale>? =
        warehouseId?.let { Specification { root, _, cb ->
            cb.equal(root.get<Warehouse>("warehouse").get<Long>("id"), it)
        } }

    private fun statusEq(status: SaleStatus?): Specification<Sale>? =
        status?.let { Specification { root, _, cb -> cb.equal(root.get<SaleStatus>("status"), it) } }

    private fun productNameLike(productName: String?): Specification<Sale>? =
        productName?.takeIf { it.isNotBlank() }?.let { keyword ->
            Specification { root, query, cb ->
                // EXISTS (SELECT 1 FROM sale_line sl JOIN product p ON sl.product_id = p.id
                //        WHERE sl.sale_id = sale.id AND p.name LIKE '%keyword%')
                val subquery = query!!.subquery(Long::class.java)
                val lineRoot = subquery.from(SaleLine::class.java)
                val productJoin = lineRoot.join<SaleLine, Product>("product")
                subquery.select(cb.literal(1L)).where(
                    cb.equal(lineRoot.get<Sale>("sale"), root),
                    cb.like(productJoin.get("name"), "%$keyword%"),
                )
                cb.exists(subquery)
            }
        }

    // ─────────────────────────────────────────────
    // 🔧 TODO① 顧客プルダウン検索 ─ やさしい(単項目の完全一致)
    //   ヒント: warehouseEq() と同じパターン。 customerId を customer.id と比較。
    //   customerId が null なら条件を足さない(null を返す)。
    // ─────────────────────────────────────────────
    private fun customerEq(customerId: Long?): Specification<Sale>? {
        // TODO: ここを実装する
        return null
    }

    // ─────────────────────────────────────────────
    // 🔧 TODO② 合計金額範囲検索 ─ やや難(両方 optional)
    //   仕様:
    //     - min と max の両方が null → 条件なし
    //     - min だけ指定 → total >= min
    //     - max だけ指定 → total <= max
    //     - 両方指定 → min <= total <= max (BETWEEN)
    //   ヒント: saleDateBetween() と同じ when パターンで4分岐。
    //   フィールド名は "totalAmount"。 cb.between / greaterThanOrEqualTo / lessThanOrEqualTo を使う。
    // ─────────────────────────────────────────────
    private fun totalBetween(min: BigDecimal?, max: BigDecimal?): Specification<Sale>? {
        // TODO: ここを実装する
        return null
    }
}
```

#### ③ フロントエンド ─ 検索フォーム + 一覧 + 打打ち計算(**TODO に対応する2フィールドだけ追加**)

**SaleListExercise.vue ─ ほぼ完成版(TODO① と TODO② に対応するフォームフィールドだけ追加)**

```vue
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import apiClient from '@/api/client'

interface Sale {
  id: number; saleDate: string;
  customerId: number; customerName: string;
  warehouseId: number; warehouseName: string;
  totalAmount: number; status: 'CONFIRMED' | 'CANCELLED';
}
interface Master { id: number; name: string }
interface PageResponse<T> { content: T[]; totalPages: number; number: number }

const form = reactive({
  saleDateFrom: '',
  saleDateTo: '',
  customerId: null as number | null,    // TODO① のフォーム値
  warehouseId: null as number | null,
  productName: '',
  totalMin: null as number | null,         // TODO② のフォーム値
  totalMax: null as number | null,         // TODO② のフォーム値
  status: 'ALL' as 'ALL' | 'CONFIRMED' | 'CANCELLED',
})

const sales = ref<Sale[]>([])
const customers = ref<Master[]>([])
const warehouses = ref<Master[]>([])
const currentPage = ref(0)
const totalPages = ref(0)
const sortKey = ref<'id' | 'saleDate' | 'totalAmount'>('saleDate')
const sortDesc = ref(true)
const checkedIds = ref<Set<number>>(new Set())

// ── 打打ち計算 ──
const checkedTotal = computed(() =>
  sales.value.filter(s => checkedIds.value.has(s.id))
    .reduce((sum, s) => sum + s.totalAmount, 0)
)
const checkedCount = computed(() => checkedIds.value.size)
function toggleCheck(id: number) {
  const next = new Set(checkedIds.value)
  if (next.has(id)) next.delete(id); else next.add(id)
  checkedIds.value = next
}

// ── ソート(サーバー側に依頼) ──
function toggleSort(key: 'id' | 'saleDate' | 'totalAmount') {
  if (sortKey.value === key) sortDesc.value = !sortDesc.value
  else { sortKey.value = key; sortDesc.value = false }
  search(0)
}

// ── API呼出 ──
async function search(page = 0) {
  const params: Record<string, any> = {
    page, size: 50,
    sort: `${sortKey.value},${sortDesc.value ? 'desc' : 'asc'}`,
  }
  if (form.saleDateFrom) params.saleDateFrom = form.saleDateFrom
  if (form.saleDateTo)   params.saleDateTo   = form.saleDateTo
  if (form.customerId != null)  params.customerId  = form.customerId
  if (form.warehouseId != null) params.warehouseId = form.warehouseId
  if (form.productName.trim()) params.productName = form.productName.trim()
  if (form.totalMin != null) params.totalMin = form.totalMin
  if (form.totalMax != null) params.totalMax = form.totalMax
  if (form.status !== 'ALL') params.status = form.status

  const res = await apiClient.get<PageResponse<Sale>>('/api/sales', { params })
  sales.value = res.data.content
  currentPage.value = res.data.number
  totalPages.value = res.data.totalPages
  checkedIds.value = new Set()
}

onMounted(async () => {
  customers.value  = (await apiClient.get('/api/customers')).data
  warehouses.value = (await apiClient.get('/api/warehouses')).data
  await search()
})
</script>

<template>
  <h1>販売伝票</h1>

  <form @submit.prevent="search(0)" class="search-form">
    <div class="search-row">
      <label>伝票日付 <input type="date" v-model="form.saleDateFrom" /></label>
      〜
      <label><input type="date" v-model="form.saleDateTo" /></label>

      <!-- 🔧 TODO① 顧客プルダウン: 下の <select> を有効にするだけ。
           Specification.customerEq() が null を返してる間は機能しないので注意。 -->
      <!-- <label>顧客 -->
      <!--   <select v-model="form.customerId"> -->
      <!--     <option :value="null">(すべて)</option> -->
      <!--     <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option> -->
      <!--   </select> -->
      <!-- </label> -->

      <label>倉庫
        <select v-model="form.warehouseId">
          <option :value="null">(すべて)</option>
          <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
        </select>
      </label>
    </div>

    <div class="search-row">
      <label>商品名 <input v-model="form.productName" placeholder="部分一致(明細JOIN)" /></label>

      <!-- 🔧 TODO② 合計金額範囲: 下の2フィールドを有効にする。
           Specification.totalBetween() を実装するまでは機能しない。 -->
      <!-- <label>合計金額 -->
      <!--   <input type="number" v-model.number="form.totalMin" placeholder="min" /> -->
      <!-- </label> -->
      <!-- 〜 -->
      <!-- <label> -->
      <!--   <input type="number" v-model.number="form.totalMax" placeholder="max" /> -->
      <!-- </label> -->

      <label>ステータス
        <select v-model="form.status">
          <option value="ALL">すべて</option>
          <option value="CONFIRMED">確定</option>
          <option value="CANCELLED">取消</option>
        </select>
      </label>
      <button type="submit">検索</button>
    </div>
  </form>

  <!-- 打打ち計算バー -->
  <div class="calc-bar">
    <strong>選択 {{ checkedCount }} 件 / 合計 ¥{{ checkedTotal.toLocaleString() }}</strong>
  </div>

  <table class="result-table">
    <thead>
      <tr>
        <th></th>
        <th @click="toggleSort('id')" class="sortable">伝票ID</th>
        <th @click="toggleSort('saleDate')" class="sortable">日付</th>
        <th>顧客</th>
        <th>倉庫</th>
        <th @click="toggleSort('totalAmount')" class="sortable num">合計金額</th>
        <th>ステータス</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="s in sales" :key="s.id" :class="{ cancelled: s.status === 'CANCELLED' }">
        <td><input type="checkbox" :checked="checkedIds.has(s.id)" @change="toggleCheck(s.id)" /></td>
        <td><RouterLink :to="`/sales/${s.id}`">#{{ s.id }}</RouterLink></td>
        <td>{{ s.saleDate }}</td>
        <td>{{ s.customerName }}</td>
        <td>{{ s.warehouseName }}</td>
        <td class="num">¥{{ s.totalAmount.toLocaleString() }}</td>
        <td>{{ s.status === 'CONFIRMED' ? '確定' : '取消' }}</td>
      </tr>
    </tbody>
  </table>

  <nav v-if="totalPages > 1" class="pager">
    <button :disabled="currentPage === 0" @click="search(currentPage - 1)">前へ</button>
    {{ currentPage + 1 }} / {{ totalPages }}
    <button :disabled="currentPage >= totalPages - 1" @click="search(currentPage + 1)">次へ</button>
  </nav>
</template>

<style scoped>
.cancelled { color: #999; text-decoration: line-through; }
.sortable { cursor: pointer; }
.sortable:hover { background: #f0f0f0; }
.calc-bar { background: #fffae6; padding: 8px 12px; margin: 8px 0; border-radius: 4px; }
</style>
```

#### 動作確認の手順

1.  TODO① と TODO② を未実装のまま起動 → 顧客プルダウンと合計金額範囲を入力しても結果が変わらない(条件が null を返すのでスキップされる)
2.  SaleSpecifications の TODO① を実装 → SaleListExercise.vue の TODO① コメントアウトを解除 → 顧客で絞れることを確認
3.  SaleSpecifications の TODO② を実装 → TODO② コメントアウトを解除 → min のみ / max のみ / 両方 の3パターンで動作確認
4.  列ヘッダ(伝票ID / 日付 / 合計金額) をクリックしてサーバー側ソートが切り替わることを確認
5.  結果行にチェックを付けて打打ち計算が動くことを確認(`computed` なのでチェックを増減するたびに自動更新)

#### 解答例 ─ **必ず自分で書いてから**見ること

**SaleSpecifications.kt ─ TODO① / TODO② の解答例**

```kotlin
// TODO① 解答例
private fun customerEq(customerId: Long?): Specification<Sale>? =
    customerId?.let { Specification { root, _, cb ->
        cb.equal(root.get<Customer>("customer").get<Long>("id"), it)
    } }

// TODO② 解答例
private fun totalBetween(min: BigDecimal?, max: BigDecimal?): Specification<Sale>? = when {
    min != null && max != null -> Specification { r, _, cb -> cb.between(r.get("totalAmount"), min, max) }
    min != null                 -> Specification { r, _, cb -> cb.greaterThanOrEqualTo(r.get("totalAmount"), min) }
    max != null                 -> Specification { r, _, cb -> cb.lessThanOrEqualTo(r.get("totalAmount"), max) }
    else                           -> null
}
```

> **💡 演習①で身につけたこと**
>
> - 業務系一覧の**花形 = 販売伝票**を、 検索 + 一覧 + 打打ち計算 + ページャー で実装した
> - JPA Specification で「null なら AND しない」を表現する2パターン: `?.let`(単項目) と `when`(範囲)
> - 明細との JOIN 検索は **EXISTS サブクエリ**で書く ─ 結果に重複行が出ない
> - 打打ち計算は `computed` ひとつで実装できる ─ Vue の reactivity の真骨頂
> - サーバー側ソートは `Sort.by(prop).descending()` を `PageRequest` に渡すだけ
> - これらは商品マスタ・仕入先マスタ・在庫照会など、 他の業務系一覧画面にすべて転用できる<u>「型」</u> である

#### 📝 演習② 詳細画面 ─ GET /api/products/{id}

**狙い**: **Vue Router のパスパラメータ**を受けて、単件の GET を実行し、詳細画面を表示する。

**仕様**:

- ルート定義: `/products/:id` → `ProductDetailExercise.vue`
- 一覧画面の各行に「詳細」 リンクを置き、クリックすると `/products/123` へ遷移
- 詳細画面で `useRoute().params.id` を取得、`GET /api/products/{id}` を呼ぶ
- 商品が存在しない(404) の場合は「商品が見つかりません」 と表示
- 戻るボタンで一覧画面へ `router.back()`

**ProductDetailExercise.vue(要点抜粋)**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiClient from '@/api/client'

const route = useRoute()
const router = useRouter()

const product = ref<Product | null>(null)
const notFound = ref(false)

onMounted(async () => {
  // TODO: route.params.id を Number に変換して API を呼ぶ。404 を catch して notFound にする
  try {
    const id = Number(route.params.id)
    const res = await apiClient.get<Product>(`/api/products/${id}`)
    product.value = res.data
  } catch (e: any) {
    if (e.response?.status === 404) notFound.value = true
    else throw e
  }
})
</script>

<template>
  <div>
    <button @click="router.back()">← 戻る</button>
    <div v-if="notFound">商品が見つかりません(ID: {{ route.params.id }})</div>
    <div v-else-if="product">
      <h2>{{ product.name }}</h2>
      <dl>
        <dt>ID</dt><dd>{{ product.id }}</dd>
        <dt>価格</dt><dd>¥{{ product.price.toLocaleString() }}</dd>
      </dl>
      <router-link :to="`/products/${product.id}/edit`">編集</router-link>
    </div>
    <p v-else>読み込み中...</p>
  </div>
</template>
```

#### 📝 演習③ 新規登録 ─ POST /api/products + 一覧の reactive 反映

**狙い**: **Pinia store** で状態を集約管理し、登録 API 成功時に store の配列を書き換えると、<u>その store を参照している全画面が自動再描画される</u>仕組みを体感する。

**仕様**:

- `useProductStore` を新規作成 ─ `items: Product[]`、`fetchPage(page)`、`create(input)`、`update(id, input)`、`remove(id)`
- 登録フォーム画面で商品情報を入力 → 送信ボタンで `POST /api/products`
- 登録成功したら store の `items` 配列に新商品を **追加**(`items.value.push(...)`)
- 同じセッションで一覧画面を開くと、追加した商品が**API を再呼出することなく**表示される
- サーバーから返ってきたバリデーションエラー(400)を画面に表示

**stores/productStore.ts**

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/client'

export interface Product { id: number; name: string; categoryId: number; price: number }

export const useProductStore = defineStore('product', () => {
  const items = ref<Product[]>([])
  const totalPages = ref(0)
  const currentPage = ref(0)

  async function fetchPage(page: number, size = 20) {
    const res = await apiClient.get(`/api/products?page=${page}&size=${size}`)
    items.value = res.data.content
    totalPages.value = res.data.totalPages
    currentPage.value = res.data.number
  }

  async function create(input: Omit<Product, 'id'>): Promise<Product> {
    const res = await apiClient.post<Product>('/api/products', input)
    // TODO: items 配列に新商品を追加(reactivity で一覧画面が自動更新される)
    items.value.push(res.data)
    return res.data
  }

  async function update(id: number, input: Partial<Product>): Promise<Product> {
    const res = await apiClient.put<Product>(`/api/products/${id}`, input)
    // TODO: items 配列の該当要素を置換(items.value = items.value.map(...))
    items.value = items.value.map(p => p.id === id ? res.data : p)
    return res.data
  }

  async function remove(id: number): Promise<void> {
    await apiClient.delete(`/api/products/${id}`)
    // TODO: items 配列から該当を削除
    items.value = items.value.filter(p => p.id !== id)
  }

  return { items, totalPages, currentPage, fetchPage, create, update, remove }
})
```

**ProductCreateExercise.vue(登録フォーム)**

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '@/stores/productStore'

const store = useProductStore()
const router = useRouter()

// reactive() で複数フィールドをまとめて扱う
const form = reactive({ name: '', categoryId: 0, price: 0 })
const serverErrors = ref<Record<string, string>>({})

async function onSubmit() {
  serverErrors.value = {}
  try {
    const created = await store.create({ ...form })
    // 登録成功 → 詳細画面へ遷移
    router.push(`/products/${created.id}`)
  } catch (e: any) {
    // TODO: 400 のサーバーバリデーションエラーを fieldErrors としてフォームに表示
    if (e.response?.status === 400) {
      const errs = e.response.data.fieldErrors || []
      errs.forEach((f: any) => serverErrors.value[f.field] = f.message)
    }
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <div>
      <label>商品名 <input v-model="form.name" /></label>
      <p v-if="serverErrors.name" class="err">{{ serverErrors.name }}</p>
    </div>
    <div>
      <label>カテゴリID <input v-model.number="form.categoryId" type="number" /></label>
    </div>
    <div>
      <label>価格 <input v-model.number="form.price" type="number" /></label>
    </div>
    <button type="submit">登録する</button>
  </form>
</template>
```

#### 📝 演習④ 編集更新 ─ PUT /api/products/{id} + 一覧の reactive 反映

**狙い**: 既存データを読み込んでフォームに表示し、編集して PUT で更新する一連の流れ。store の更新により<u>一覧画面の該当行が自動で書き換わる</u>のを確認する。

**仕様**:

- ルート: `/products/:id/edit` → `ProductEditExercise.vue`
- マウント時に `GET /api/products/{id}` で既存データを取得しフォームに pre-fill
- 送信時に `store.update(id, form)` ─ store 内で `PUT /api/products/{id}` + items 配列内の該当要素を置換
- 更新成功で詳細画面に遷移。 別タブで開いた一覧画面の該当行も(同じ store を参照していれば)自動で更新される

**ProductEditExercise.vue(要点)**

```vue
<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '@/stores/productStore'
import apiClient from '@/api/client'

const route = useRoute()
const router = useRouter()
const store = useProductStore()

const form = reactive({ name: '', categoryId: 0, price: 0 })
const loading = ref(true)
const id = Number(route.params.id)

// TODO 1: マウント時に既存データを取得しフォームに pre-fill
onMounted(async () => {
  const res = await apiClient.get<Product>(`/api/products/${id}`)
  form.name = res.data.name
  form.categoryId = res.data.categoryId
  form.price = res.data.price
  loading.value = false
})

// TODO 2: 更新ハンドラ ─ store.update を呼ぶ。reactivity で一覧画面も自動で書き変わる
async function onSubmit() {
  await store.update(id, { ...form })
  router.push(`/products/${id}`)
}
</script>
```

#### 📝 演習⑤ 削除 ─ DELETE /api/products/{id} + 確認ダイアログ + 一覧反映

**狙い**: **破壊的操作**(削除)の安全実装パターン: 確認ダイアログ → API 呼出 → store から削除 → 一覧画面の reactivity による自動更新。

**仕様**:

- 一覧画面の各行に「削除」 ボタン。 クリック時に `confirm()` で確認ダイアログ表示
- OK なら `store.remove(id)` ─ store 内で `DELETE /api/products/{id}` + items 配列から該当を `filter` で削除
- 削除成功で一覧から該当行が消える(<u>API を再呼出しせず</u>、reactivity だけで行が消える)
- 404(既に削除済み) の場合は「他のユーザーが既に削除しました」と表示

**ProductListExercise.vue(削除ボタンと削除ハンドラを追加)**

```vue
// 一覧画面の各行に追加
<tr v-for="p in store.items" :key="p.id">
  <td>{{ p.id }}</td>
  <td>{{ p.name }}</td>
  <td>
    <router-link :to="`/products/${p.id}`">詳細</router-link>
    <router-link :to="`/products/${p.id}/edit`">編集</router-link>
    <button @click="onDelete(p)" class="danger">削除</button>
  </td>
</tr>

// script setup 内
async function onDelete(product: Product) {
  // TODO: confirm で確認、OK なら store.remove(id) を呼ぶ。reactivity で行が消える
  if (!confirm(`「${product.name}」を削除しますか?`)) return
  try {
    await store.remove(product.id)
  } catch (e: any) {
    if (e.response?.status === 404) alert('他のユーザーが既に削除しました')
    else throw e
  }
}
```

#### 📝 演習⑥ REST の同期処理 vs 非同期(並列) ─ 同じ仕事の2つの書き方

**狙い**: 「**3社の仕入先API に同時に問い合わせて見積を取得**」 を題材に、<u>直列(同期: await を順に並べる)と並列(非同期: Promise.all)</u>の体感差を確認する。Day 3 のコルーチン並列処理(バック側)と対になる演習。

**仕様**:

- 画面に「**直列 で取得**」 ボタンと「**並列 で取得**」 ボタンを2つ配置
- 両方とも、3社(`/api/suppliers/A/quote`、`/api/suppliers/B/quote`、`/api/suppliers/C/quote`)の見積を取得
- 各API は約 1 秒のディレイがある(モックサーバが `setTimeout` で遅延)
- 直列 ボタン → 3秒かかる、 並列 ボタン → 1秒で済む を画面で計測して表示
- 取得した3つの結果を表に表示 + 「**最安値**」 を `computed` で計算して強調表示

**QuoteExercise.vue ─ 同期vs並列の対比**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import apiClient from '@/api/client'

interface Quote { supplier: string; price: number; deliveryDays: number }

const quotes = ref<Quote[]>([])
const elapsedMs = ref(0)
const loading = ref(false)
const mode = ref<'sync' | 'async'>('sync')

// 直列実行: await を順に並べる → 3社分が直列に流れる
async function fetchSerial() {
  loading.value = true; mode.value = 'sync'; quotes.value = []
  const start = performance.now()
  try {
    const a = await apiClient.get<Quote>('/api/suppliers/A/quote')
    const b = await apiClient.get<Quote>('/api/suppliers/B/quote')
    const c = await apiClient.get<Quote>('/api/suppliers/C/quote')
    quotes.value = [a.data, b.data, c.data]
  } finally {
    elapsedMs.value = performance.now() - start
    loading.value = false
  }
}

// 並列実行: Promise.all で 3つ同時発火 → 一番遅い1つ分の時間で完了
async function fetchParallel() {
  loading.value = true; mode.value = 'async'; quotes.value = []
  const start = performance.now()
  try {
    const [a, b, c] = await Promise.all([
      apiClient.get<Quote>('/api/suppliers/A/quote'),
      apiClient.get<Quote>('/api/suppliers/B/quote'),
      apiClient.get<Quote>('/api/suppliers/C/quote'),
    ])
    quotes.value = [a.data, b.data, c.data]
  } finally {
    elapsedMs.value = performance.now() - start
    loading.value = false
  }
}

// 最安値を computed で計算(reactive)
const cheapest = computed(() => {
  if (quotes.value.length === 0) return null
  return quotes.value.reduce((a, b) => a.price < b.price ? a : b)
})
</script>

<template>
  <div>
    <button @click="fetchSerial" :disabled="loading">直列 で取得(遅い)</button>
    <button @click="fetchParallel" :disabled="loading">並列 で取得(速い)</button>
    <p v-if="elapsedMs > 0">
      {{ mode === 'sync' ? '直列' : '並列' }} 実行時間: {{ elapsedMs.toFixed(0) }} ms
    </p>
    <table>
      <tr v-for="q in quotes" :key="q.supplier"
          :class="{ cheapest: q === cheapest }">
        <td>{{ q.supplier }}</td><td>¥{{ q.price }}</td><td>{{ q.deliveryDays }}日</td>
      </tr>
    </table>
  </div>
</template>
```

> **📌 演習⑥で確認すること ─ 同期(直列)と非同期(並列)の本質的な違い**
>
> - **直列(await を3回順に並べる)** ─ 1社目の応答を待ってから2社目を発火 → 約3秒かかる
> - **並列(Promise.all)** ─ 3社に同時に発火 → 一番遅い1社分(約1秒)で完了
> - 「await を書いただけ」 では同期実行になり並列にならない ─ **並列にしたいときは Promise.all を使う**
> - これは Day 3 で学んだ Kotlin の `async/await + supervisorScope` によるバック側の並列処理と<u>同じ発想</u> ─ フロントもバックも、独立した非同期処理は並列化できる
> - 業務系では、API呼出が複数ある画面(ダッシュボード、検索結果一覧の各セクションなど)で並列化すると体感速度が劇的に向上する

#### 📝 演習⑦ 楽観的更新 ─ 画面を先に書き換える reactive 描画と失敗時ロールバック

**狙い**: **「サーバー応答を待たずに先に画面を変える」** 楽観的更新パターン。Vue の reactivity を最大限活用しつつ、API 失敗時には<u>画面の状態を巻き戻す</u>難しさも体験する。業務 UI で「いいね」 や「お気に入り」 の即時反映に使われる定番テクニック。

**📌 楽観的更新 vs 悲観的更新 ─ まず概念を押さえる**

ユーザー操作 → API 呼び出し → UI 反映 という流れには、 大きく分けて**2つの順序**があります。

<table class="styled-table">
<colgroup>
<col style="width: 20%" />
<col style="width: 20%" />
<col style="width: 20%" />
<col style="width: 20%" />
<col style="width: 20%" />
</colgroup>
<thead>
<tr class="header">
<th>パターン</th>
<th>順序</th>
<th>体感速度</th>
<th>実装難度</th>
<th>失敗時の挙動</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>悲観的更新</strong><br />
(pessimistic update)</td>
<td>① API 呼出 → ② 応答待ち → ③ 成功なら UI 反映</td>
<td>遅い<br />
(往復ぶん固まる)</td>
<td>低<br />
(順序通り)</td>
<td>UI は元のままなので<br />
何もしなくて良い</td>
</tr>
<tr class="even">
<td><strong>楽観的更新</strong><br />
(optimistic update)</td>
<td>① UI を先に反映 → ② API 呼出 → ③ 失敗時のみ UI を巻き戻す</td>
<td>瞬時<br />
(0ms)</td>
<td>高<br />
(ロールバック要)</td>
<td>UI を元の値に戻す<br />
+ エラー通知</td>
</tr>
</tbody>
</table>

**「楽観的」「悲観的」 の由来**: API がほぼ成功する(=楽観できる) 前提で先に UI を変えるのが楽観的更新。 失敗するかもしれない(=悲観する) 前提で応答を待つのが悲観的更新。

**メリット・デメリットを並べると**:

<table class="styled-table">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr class="header">
<th></th>
<th>楽観的更新</th>
<th>悲観的更新</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td style="background: #e8f5e9"><strong>メリット</strong></td>
<td><ul>
<li>体感速度が圧倒的に速い(0ms で反映)</li>
<li>ユーザーは操作の手応えを即座に得られる ─ UX の質が上がる</li>
<li>ネットワークが遅い環境(地方拠点、 モバイル)でもキビキビ動く</li>
<li>サーバー往復のレイテンシを完全に隠蔽できる</li>
<li>連打されても見た目だけは反応するので「無反応」 と誤解されにくい</li>
</ul></td>
<td><ul>
<li>実装がシンプル(順番に書くだけ)</li>
<li>表示と DB が常に一致 ─ 整合性が高い</li>
<li>失敗時のロールバック処理が不要</li>
<li>サーバー側のバリデーション結果(在庫不足、 重複エラー等)を確実に反映できる</li>
<li>ユーザーは「処理が確定した」 ことを実感できる(慎重な操作向き)</li>
</ul></td>
</tr>
<tr class="even">
<td style="background: #ffebee"><strong>デメリット</strong></td>
<td><ul>
<li>ロールバック実装が必要 ─ 旧値の保持、 失敗時の巻き戻し、 エラー通知</li>
<li>表示と DB が一時的にズレる ─ 別タブや他ユーザーから古い状態に見える</li>
<li>厳密な整合性が必要な処理(決済・在庫減算) には使えない</li>
<li>連打への対策が必要(busyフラグ、disabled制御)</li>
<li>反映 → 失敗ロールバック が短時間に起きると<u>UI がチラつく</u> ─ ユーザーが混乱する</li>
</ul></td>
<td><ul>
<li>体感速度が遅い ─ ネットワーク往復のぶんユーザーが待たされる</li>
<li>応答待ちの間、 画面が「固まったように見える」 ─ ローディング表示が必須</li>
<li>同じ操作を繰り返す業務(タグ付け連打、 お気に入り操作) ではテンポが悪い</li>
<li>サーバーが遅いと UX が露骨に悪化する</li>
</ul></td>
</tr>
</tbody>
</table>

**💡 どちらを使うか ─ 業務での使い分け**

| 操作                                              | 推奨       | 理由                                                                                                                   |
|---------------------------------------------------|------------|------------------------------------------------------------------------------------------------------------------------|
| お気に入り、 いいね、 タグ付け、 表示フィルタ保存 | **楽観的** | 失敗してもユーザーへの影響が軽い。 体感速度の改善メリットが大きい                                                      |
| 商品名・価格の編集など可逆な軽い更新              | **楽観的** | 編集画面は通常 OK 確認後にリストへ戻るので、 戻り先の UI を即時反映できる                                              |
| 仕入登録、 販売登録、 在庫減算、 決済             | **悲観的** | 失敗時の影響が大きい(在庫不足で却下されたのに画面では「成功」 と見えるのは混乱の元)。 トランザクション成立の確認が必須 |
| 削除操作(復元不可)                                | **悲観的** | 確認ダイアログ → API → 反映、 という慎重なフローが基本                                                                 |

本研修の **UC07 仕入登録 / UC08 販売登録** は悲観的更新で実装します(在庫チェックや伝票成立の確認が必要なので)。 一方、 演習⑦の<u>お気に入り</u>は楽観的更新の典型例。

> **⚠ 楽観的更新の3つの落とし穴**
>
> 1.  **表示とサーバーが一時的にズレる**: クリック直後の数百ms、 画面上は「★」 だが DB はまだ更新されていない。 別タブや他ユーザーから見ると古い状態。 <u>厳密な整合性が求められる場面では使えない</u>
> 2.  **ロールバックの設計が必要**: 楽観更新前の値を**必ず保持**しておく(`const previousValue = ...`)。 reactive オブジェクトの一部だけ更新する場合は、 ディープコピーが必要なケースもある
> 3.  **連打への耐性**: 同じボタンを連打されると、 ロールバックの順序がぐちゃぐちゃに。 `busyIds.add()` でリクエスト中フラグを立て、 完了まで disabled にする

> **💡 用語整理 ─ 「楽観排他(@Version)」 とは別概念**
>
> Spring Data JPA の `@Version` による**楽観排他**(optimistic locking、 楽観的ロックとも呼ぶ) は、 サーバー側で<u>同時更新を検知する仕組み</u>です。 同じレコードを2人が同時編集した時、 後勝ちで上書きされるのを防ぐ ─ 詳しくは **5-5節**で解説しています。 一方、 本節の**楽観的更新**(optimistic update) は<u>フロントの UI 描画タイミング</u>の話で、 両者は名前が似ているだけで全く別の話題です。 本研修では「楽観的更新」 はフロント側パターンを指します。

**仕様**:

- 商品一覧で「お気に入り」 ボタン(★)を実装
- クリックすると**即座に画面の星マークを ON にする**(API 応答を待たない = 楽観的更新)
- 同時に `POST /api/products/{id}/favorite` を発火
- API 成功時はそのまま、 失敗時は<u>星マークを元の OFF に戻す</u> + エラートーストを表示
- 連打を防ぐため、リクエスト中はボタンを disabled に

**FavoriteExercise.vue ─ 楽観的更新**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import apiClient from '@/api/client'

interface Product { id: number; name: string; isFavorite: boolean }
const products = ref<Product[]>([])
const busyIds = ref<Set<number>>(new Set())

async function toggleFavorite(product: Product) {
  if (busyIds.value.has(product.id)) return      // 連打防止
  busyIds.value.add(product.id)

  // 1. 楽観的更新: API より先に画面を変える
  const previousValue = product.isFavorite
  product.isFavorite = !product.isFavorite  // ← reactivity で星マークが瞬時に切り替わる

  try {
    // 2. API 発火
    await apiClient.post(`/api/products/${product.id}/favorite`, { isFavorite: product.isFavorite })
    // 成功 → そのまま
  } catch (e) {
    // 3. 失敗時のロールバック: 元の値に戻す
    product.isFavorite = previousValue
    alert('お気に入りの更新に失敗しました')
  } finally {
    busyIds.value.delete(product.id)
  }
}
</script>

<template>
  <li v-for="p in products" :key="p.id">
    {{ p.name }}
    <button @click="toggleFavorite(p)" :disabled="busyIds.has(p.id)">
      {{ p.isFavorite ? '★' : '☆' }}
    </button>
  </li>
</template>
```

> **💡 演習⑦で気づくこと ─ Vue の reactivity が画面更新を駆動する**
>
> - `product.isFavorite = !product.isFavorite` の**たった1行で画面の星マークが瞬時に切り替わる** ─ これが reactivity の威力
> - もしバニラ JS で書いていたら「ボタン要素を取得 → クラス追加 → アイコン要素を取得 → テキスト書き換え」 と手で DOM 操作するところを、Vue は<u>状態を変えるだけ</u>で済む
> - **失敗時のロールバック**も「変数を元に戻す」 だけ ─ DOM の戻し作業は不要
> - 「お気に入り」 や「いいね」 が即座に反応する Web サービスの裏側は、この楽観的更新パターンで作られていることが多い

> **📌 演習①〜⑦の到達確認**
>
> - [ ] 演習① 一覧画面でページネーションが動き、ページ番号クリックで `GET /api/products?page=N` が再発火する
> - [ ] 演習② 詳細画面で `route.params.id` から ID を取得し、 404 を分岐表示できる
> - [ ] 演習③ 登録フォームから `POST` で新規作成、 store の items 配列に新商品が追加される
> - [ ] 演習④ 編集画面で既存データを pre-fill、 `PUT` で更新、 一覧画面の該当行が自動で書き変わる
> - [ ] 演習⑤ 削除ボタンで `DELETE`、 一覧から該当行が消える(API 再呼出なし、reactivity による消失)
> - [ ] 演習⑥ 直列で3秒、 並列で1秒の差を画面で確認、 `Promise.all` の効果を体感した
> - [ ] 演習⑦ 楽観的更新で星マークが瞬時に切り替わり、 失敗時には自動で元に戻ることを確認した

これらの演習で実装した部品(stores、views/exercises 配下) は、 次節 7-3 で動かす完成版業務システムの**土台になります**。 業務画面(仕入登録、販売登録、在庫照会など) は、 本演習で書いた CRUD + ページネーション + 並列処理 + 楽観的更新 の<u>組み合わせと拡張</u>です。

### 7-3. 完成版の業務シナリオ ─ 実際に動かしてみる

完成したシステムを「業務担当者の視点」で動かしてみます。**業務定義書(第4章ユースケース記述)のシナリオに沿った操作手順**で、画面 → API → DB の変化を追います。研修最後の動作確認や、業務理解の総まとめとしてご活用ください。

> **💡 シナリオを進める前に ─ 初期データの確認**
>
> Day 0 で配布された `infra/initdb/init.sql` によって、PostgreSQL には以下の初期データが入っています(A5:SQL Mk-2 で確認可能):
>
> - **商品 20 件**(りんごジュース、緑茶、カップ麺、ティッシュペーパー、モバイルバッテリー等)
> - **仕入先 5 件**(SUP001=アルファ食品/SUP002=ベータ商事/SUP003=ガンマ流通 + API なし2件)
> - **顧客 3 件**(株式会社サンプル商事 / 有限会社テスト商会 / 個人事業主 山田太郎)
> - **倉庫 1 件**(WH001 本店倉庫)
> - **商品定価履歴**(りんごジュース 2024年=150円、2025年〜=180円 等)
> - **在庫**(全商品 0 件からスタート ─ シナリオを進めるとここが変わっていく)
>
> 各シナリオの「DB変化」欄に書かれた SQL を A5:SQL Mk-2 で実行すれば、データの動きを直接確認できます。

#### 📘 シナリオ① ─ UC11 ログイン

4 アクターそれぞれでログインし、画面の出し分けを確認します。最初に行うべき動作確認です。

| \#  | 操作                                                                                  | 期待される動作                                                                                              |
|-----|---------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| 1   | ブラウザで `http://localhost:5173/login` を開く                                       | ログイン画面が表示                                                                                          |
| 2   | ユーザーID `admin` / パスワード `admin123` でログイン                                 | ホーム画面へ遷移。ヘッダに「システム管理者」と表示                                                          |
| 3   | サイドメニューを確認                                                                  | 商品マスタ・定価改定・仕入登録・販売登録・在庫照会・履歴確認の**すべて**が表示                              |
| 4   | ログアウト → ユーザー `procurement` / `proc123` でログイン                            | 調達担当としてログイン成功                                                                                  |
| 5   | サイドメニュー確認                                                                    | 仕入登録・仕入先API見積・在庫照会・履歴確認が表示。**商品マスタ管理は閲覧のみ、定価改定・販売登録は非表示** |
| 6   | 同様に `inventory` / `inv123`(在庫管理担当)、`sales` / `sales123`(販売担当)でログイン | 各々の権限に応じたメニューだけ表示される                                                                    |

**DB変化**: なし(ログインは認証のみ。サーバーは JWT を発行して返却)。ブラウザ側の `localStorage` に JWT が保存される。

#### 📘 シナリオ② ─ UC07 仕入を登録する(調達担当)

業務定義書 UC07 の主要シナリオに沿った操作。仕入伝票を登録すると、**4 つのテーブルが原子的に更新**されることを確認します。

<table class="styled-table">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr class="header">
<th>#</th>
<th>操作</th>
<th>期待される動作</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>1</td>
<td>調達担当(procurement)でログイン</td>
<td>─</td>
</tr>
<tr class="even">
<td>2</td>
<td>サイドメニュー「仕入登録」をクリック</td>
<td>仕入登録画面が表示</td>
</tr>
<tr class="odd">
<td>3</td>
<td>仕入先プルダウンで「SUP001 アルファ食品株式会社」を選択</td>
<td>選択した仕入先が画面上部に表示</td>
</tr>
<tr class="even">
<td>4</td>
<td>倉庫プルダウンで「WH001 本店倉庫」を選択</td>
<td>同上</td>
</tr>
<tr class="odd">
<td>5</td>
<td>明細行に2行追加(「+ 明細追加」ボタン)<br />
1行目: 商品=りんごジュース、数量=100、単価=150<br />
2行目: 商品=緑茶、数量=50、単価=130</td>
<td>明細表に追加表示。小計が自動計算される</td>
</tr>
<tr class="even">
<td>6</td>
<td>「登録」ボタンをクリック</td>
<td>「仕入を登録しました(伝票ID: 1)」と表示</td>
</tr>
</tbody>
</table>

**DB変化**:

**A5:SQL Mk-2 で実行するSQL**

    -- 仕入伝票が1件登録された
    SELECT * FROM purchase WHERE purchase_id = 1;
    -- → supplier_id=1, warehouse_id=1, purchase_date=2026-05-14

    -- 明細が2件登録された
    SELECT * FROM purchase_detail WHERE purchase_id = 1;
    -- → line_no=1: りんごジュース, 100個, 150円
    -- → line_no=2: 緑茶, 50個, 130円

    -- 在庫が増えた(0 → 100、0 → 50)
    SELECT p.product_name, i.current_quantity
    FROM inventory i JOIN product p ON i.product_id = p.product_id
    WHERE p.product_name IN ('りんごジュース 1L', '緑茶 500ml');
    -- → りんごジュース 1L: 100、緑茶 500ml: 50

    -- 入出庫履歴に IN(入庫) が2行記録された
    SELECT * FROM stock_movement
    WHERE reference_type = 'PURCHASE' AND reference_id = 1
    ORDER BY movement_id;
    -- → 2行: movement_type='IN', quantity=100/50, occurred_at=現在時刻

**確認ポイント**: 4 テーブルが同じトランザクションで更新されている。<u>もしどれか1つでも失敗すれば、全部ロールバック</u>(Day 5 で学んだ `@Transactional` の効果)。

#### 📘 シナリオ③ ─ UC08 販売を登録する(販売担当)/ 在庫充足ケース

シナリオ②で在庫を積んだので、販売担当が販売を登録します。**在庫が減ること**を確認します。

| \#  | 操作                                           | 期待される動作                                         |
|-----|------------------------------------------------|--------------------------------------------------------|
| 1   | ログアウト → 販売担当(sales)でログイン         | 販売担当としてログイン成功                             |
| 2   | サイドメニュー確認                             | **仕入登録メニューは表示されない**(調達担当のみの権限) |
| 3   | 「販売登録」をクリック                         | 販売登録画面が表示                                     |
| 4   | 顧客=株式会社サンプル商事、倉庫=本店倉庫を選択 | 選択値が表示                                           |
| 5   | 明細追加: りんごジュース、数量=30、単価=180    | 明細表に追加                                           |
| 6   | 「登録」ボタン                                 | 「販売を登録しました(伝票ID: 1)」と表示                |

**DB変化**:

**A5:SQL Mk-2 で実行するSQL**

    -- 販売伝票が1件登録された
    SELECT * FROM sale WHERE sale_id = 1;
    -- → customer_id=1, warehouse_id=1, sale_date=2026-05-14

    -- 在庫が減った(100 → 70)
    SELECT p.product_name, i.current_quantity
    FROM inventory i JOIN product p ON i.product_id = p.product_id
    WHERE p.product_name = 'りんごジュース 1L';
    -- → 70(=100 - 30)

    -- 入出庫履歴に OUT(出庫) が記録された
    SELECT * FROM stock_movement
    WHERE reference_type = 'SALE' AND reference_id = 1;
    -- → movement_type='OUT', quantity=30, occurred_at=現在時刻

#### 📘 シナリオ④ ─ UC08 販売を登録する / 在庫不足ケース(代替シナリオ)

業務定義書 UC08 の代替シナリオ。在庫を超える数量で販売を試みると、**BusinessError が発生し、トランザクションがロールバックされる**ことを確認します。

| \#  | 操作                                                           | 期待される動作                                                                                             |
|-----|----------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| 1   | (販売担当でログイン状態のまま)「販売登録」画面を再度開く       | 新規の販売登録フォーム表示                                                                                 |
| 2   | 明細追加: りんごジュース、数量=**200**(現在庫70以上)、単価=180 | 入力できる(フロントでは在庫数を知らない)                                                                   |
| 3   | 「登録」ボタンをクリック                                       | **赤色の警告メッセージ**「<u>在庫が不足しています(商品:りんごジュース 1L、要求:200、現在庫:70)</u>」が表示 |
| 4   | 画面はそのまま(伝票は保存されていない)                         | 入力内容は保持され、数量を修正して再登録可能                                                               |

**DB変化**: <u>なし</u>(InventoryShortageException が投げられ、@Transactional がロールバックするので、sale テーブルにも sale_detail にも何も書かれない、inventory も変わらない)。これを確認するには:

**A5:SQL Mk-2 で実行するSQL**

    -- 販売伝票は1件のまま(シナリオ③で作った1件のみ)
    SELECT COUNT(*) FROM sale;  -- → 1(増えていない)

    -- 在庫も変わっていない
    SELECT current_quantity FROM inventory i
    JOIN product p ON i.product_id = p.product_id
    WHERE p.product_name = 'りんごジュース 1L';
    -- → 70(シナリオ③直後と同じ)

    -- 履歴にも記録されていない
    SELECT COUNT(*) FROM stock_movement WHERE reference_type = 'SALE';
    -- → 1(シナリオ③の1行のみ)

#### 📘 シナリオ⑤ ─ UC09 在庫照会(在庫管理担当)

これまでの仕入・販売で在庫がどう動いたかを、在庫管理担当が確認します。

<table class="styled-table">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr class="header">
<th>#</th>
<th>操作</th>
<th>期待される動作</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>1</td>
<td>在庫管理担当(inventory)でログイン</td>
<td>─</td>
</tr>
<tr class="even">
<td>2</td>
<td>「在庫照会」メニュークリック</td>
<td>在庫一覧画面が表示</td>
</tr>
<tr class="odd">
<td>3</td>
<td>一覧の確認</td>
<td>シナリオ②と③の結果として:<br />
・りんごジュース 1L: 70個<br />
・緑茶 500ml: 50個<br />
・その他の商品: 0個</td>
</tr>
<tr class="even">
<td>4</td>
<td>しきい値以下の在庫を確認</td>
<td>0 個の商品行は<strong>赤背景</strong>で強調表示</td>
</tr>
<tr class="odd">
<td>5</td>
<td>「商品名」列でフィルタ「ジュース」と入力</td>
<td>「りんごジュース 1L」「オレンジジュース 1L」のみ表示</td>
</tr>
</tbody>
</table>

#### 📘 シナリオ⑥ ─ UC10 入出庫履歴の確認(在庫管理担当)

業務的に「いつ何が動いたか」を時系列で追えることを確認します。これが「DBで管理することで分析が可能になる」典型例です。

| \#  | 操作                              | 期待される動作                                                        |
|-----|-----------------------------------|-----------------------------------------------------------------------|
| 1   | 「入出庫履歴」メニュー            | 履歴一覧画面が表示。これまでの仕入(IN)と販売(OUT)が時系列で表示される |
| 2   | 期間絞り込み: 今日                | 本日の動きだけが表示(シナリオ②③で発生した3行)                         |
| 3   | 種別フィルタ: 「入庫(IN)」のみ    | シナリオ②の2行のみ表示                                                |
| 4   | 商品で絞り込み: りんごジュース 1L | りんごジュースの IN 1行 + OUT 1行 = 2行表示                           |

#### 📘 シナリオ⑦ ─ UC06 仕入先API並列見積取得(調達担当)

Day 3 のコルーチンが活きるシナリオ。3 社のモック API から並列に価格を取得します。

<table class="styled-table">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr class="header">
<th>#</th>
<th>操作</th>
<th>期待される動作</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>1</td>
<td>調達担当でログインし直す</td>
<td>─</td>
</tr>
<tr class="even">
<td>2</td>
<td>「仕入先見積取得」メニュー</td>
<td>見積取得画面が表示</td>
</tr>
<tr class="odd">
<td>3</td>
<td>商品=「りんごジュース 1L」、希望数量=100 を入力</td>
<td>入力受付</td>
</tr>
<tr class="even">
<td>4</td>
<td>「見積取得」ボタンクリック</td>
<td>「取得中…」と表示後、<strong>約 1.5 秒以内に 3 社の結果が出揃う</strong>(直列なら 2.6秒。並列なので最も遅い1.5秒で全部揃う)</td>
</tr>
<tr class="odd">
<td>5</td>
<td>結果表示の確認</td>
<td>表形式で:<br />
・SUP001 アルファ食品: 150円(標準)、300ms<br />
・SUP002 ベータ商事: 142円(5%安)、800ms<br />
・SUP003 ガンマ流通: 157円(5%高)、1500ms</td>
</tr>
<tr class="even">
<td>6</td>
<td>(モック C の <code>RESPONSE_DELAY_MS</code> を docker-compose.yml で 4000ms に書き換えて再起動 → 再実行)</td>
<td>SUP003 のみ <code>withTimeout(3秒)</code> でタイムアウト →「応答なし」表示。SUP001/SUP002 は正常表示(supervisorScope で他社の結果は守られる)</td>
</tr>
</tbody>
</table>

#### 📘 シナリオ⑧ ─ UC02 商品定価改定(履歴型マスタ)/ システム管理者

業務定義書 UC02 のシナリオ。**履歴型マスタ**がどう動くかを体験します。

| \#  | 操作                                                  | 期待される動作                                     |
|-----|-------------------------------------------------------|----------------------------------------------------|
| 1   | システム管理者(admin)でログイン                       | ─                                                  |
| 2   | 「商品マスタ」→ りんごジュース 1L を選択              | 商品詳細画面。現在の定価=180円(2025-01-01以降有効) |
| 3   | 「定価改定」ボタン                                    | 定価改定フォーム表示                               |
| 4   | 新定価=200円、適用開始日=2026-06-01 を入力 → 「確定」 | 「定価改定を登録しました」と表示                   |

**DB変化**:

**A5:SQL Mk-2 で実行するSQL**

    -- 商品定価履歴を見ると、3行に増えている
    SELECT * FROM product_price_history
    WHERE product_id = (SELECT product_id FROM product WHERE jan_code = '4901001000001')
    ORDER BY valid_from;
    -- 結果:
    -- 2023-01-01 〜 2024-12-31 : 150円(初期データ)
    -- 2025-01-01 〜 2026-05-31 : 180円(初期データの valid_to が前日に更新された)
    -- 2026-06-01 〜 NULL       : 200円(今回追加)

**確認ポイント**: 既存の最新履歴の `valid_to` が「新適用開始日の前日」(2026-05-31)に更新され、新履歴(2026-06-01〜)が追加される。<u>同一トランザクションで2レコードを更新</u>している(Day 5 のパターン)。

#### 📘 シナリオ⑨ ─ 価格改定後の販売(履歴型マスタの効果を実感する)

シナリオ⑧で 2026-06-01 から 200円に改定したので、改定前(180円) と 改定後(200円)で**同じ商品を別々に販売**してみます。これで履歴型マスタの「過去の価格でも振り返れる」という価値が体感できます。

準備: シナリオ②で仕入れたりんごジュースは、シナリオ③で30個販売したので残り70個。さらに販売するために、調達担当でもう100個仕入れておきます(以降の操作のため):

| \#  | 操作                                                     | 期待される動作                              |
|-----|----------------------------------------------------------|---------------------------------------------|
| 1   | 調達担当(procurement)で再ログイン → 仕入登録             | 仕入登録画面                                |
| 2   | SUP001 + WH001 + りんごジュース 100個 / 単価150円 で登録 | 仕入伝票 \#2 が登録され、在庫が 70 → 170 に |

**(A) 改定前の日付(2026-05-15)に販売を登録** ─ 当時の正規定価は 180円:

| \#  | 操作                                                                                | 期待される動作                                          |
|-----|-------------------------------------------------------------------------------------|---------------------------------------------------------|
| 3   | 販売担当(sales)でログイン → 販売登録                                                | 販売登録画面                                            |
| 4   | 顧客=株式会社サンプル商事、倉庫=本店倉庫、**販売日=2026-05-15**(改定前の日付)を選択 | 選択値が表示                                            |
| 5   | 明細: りんごジュース、数量=20、**単価=180**(当時の定価)で登録                       | 「販売を登録しました(伝票ID: 2)」と表示。在庫 170 → 150 |

**(B) 改定後の日付(2026-06-15)に販売を登録** ─ 改定後の正規定価は 200円:

| \#  | 操作                                                                                                       | 期待される動作                                          |
|-----|------------------------------------------------------------------------------------------------------------|---------------------------------------------------------|
| 6   | 続けて販売登録                                                                                             | 新規フォーム表示                                        |
| 7   | 顧客=有限会社テスト商会、倉庫=本店倉庫、**販売日=2026-06-15**(改定後の日付)を選択                          | 選択値が表示                                            |
| 8   | 明細: りんごジュース、数量=15、**単価=200**(改定後の定価)で登録                                            | 「販売を登録しました(伝票ID: 3)」と表示。在庫 150 → 135 |
| 9   | (おまけ)同じ販売日でもう1件 ─ 顧客=個人事業主 山田太郎、りんごジュース 5個、**単価=190**(値引き販売)で登録 | 伝票ID: 4 が登録。在庫 135 → 130                        |

**DB変化と確認**:

**A5:SQL Mk-2 で実行するSQL ─ 各販売がその時点の正規定価で売れたか確認**

    -- 販売明細を販売日 + 当時の正規定価とくっつけて表示
    SELECT
      s.sale_id,
      s.sale_date,
      p.product_name,
      sd.quantity,
      sd.unit_price        AS 実売単価,
      pph.unit_price       AS 当時の正規定価,
      sd.unit_price - pph.unit_price AS 差額
    FROM sale s
    JOIN sale_detail sd ON s.sale_id = sd.sale_id
    JOIN product p       ON sd.product_id = p.product_id
    JOIN product_price_history pph
      ON pph.product_id = p.product_id
     -- ★ ポイント: 販売日が history の有効期間に含まれる行を JOIN
     AND s.sale_date BETWEEN pph.valid_from AND COALESCE(pph.valid_to, DATE '9999-12-31')
    WHERE p.jan_code = '4901001000001'
    ORDER BY s.sale_id;

    -- 期待される結果:
    -- sale_id=1 (シナリオ③, 2026-05-14): 実売180 / 当時定価180 / 差額  0
    -- sale_id=2 (今回(A), 2026-05-15) : 実売180 / 当時定価180 / 差額  0
    -- sale_id=3 (今回(B), 2026-06-15) : 実売200 / 当時定価200 / 差額  0
    -- sale_id=4 (今回値引,2026-06-15) : 実売190 / 当時定価200 / 差額 -10 ← 値引き販売

> **📌 履歴型マスタの威力 ─ なぜ「過去の値も保持」が必要なのか**
>
> もし定価が**スナップショット型**(現在値だけ保持) だったら、2026-08 にこの分析を実行した時、過去の販売も**すべて現在定価(200円) と比較**されてしまいます:
>
> - sale_id=1, 2(2026-05 の販売): 実売 180円 ─ 現在定価 200円と比べて「20円値引きしている」と誤判定
> - 本来は**当時の正規定価 = 180円**なので、値引きではなく定価通りの販売
>
> 履歴型マスタなら、`BETWEEN valid_from AND valid_to` で当時の値が正しく取れるため、**過去の取引を「当時の文脈」で正しく評価できる**。これが業務システムの会計監査・実績分析で履歴型が必須になる理由です。
>
> 本研修で実装した `product_price_history` は、まさにこの構造を最小限の形で体験するための題材でした。

#### 📘 シナリオ⑩ ─ DB を使った分析の例(運用想定)

業務システムは「データを蓄積することで後から分析できる」のが価値の1つ。これまでのシナリオで蓄積されたデータを使って、A5:SQL Mk-2 から分析クエリを実行します。実業務では BI ツールや管理画面の集計機能になる部分です。

**分析クエリ① ─ 商品別の在庫推移(直近の入出庫履歴)**

    SELECT
      p.product_name,
      sm.movement_type,
      sm.quantity,
      sm.occurred_at,
      sm.reference_type
    FROM stock_movement sm
    JOIN product p ON sm.product_id = p.product_id
    WHERE sm.occurred_at >= CURRENT_DATE
    ORDER BY sm.occurred_at DESC;

    -- 業務的な意味: 「今日、何が入って何が出たか」が時系列で見える
    -- → 業務担当の業務日報、原因調査、棚卸し前の確認に使える

**分析クエリ② ─ 仕入先別の取引金額(月次)**

    SELECT
      s.supplier_name,
      DATE_TRUNC('month', p.purchase_date) AS month,
      SUM(pd.quantity * pd.unit_price) AS total_amount,
      COUNT(DISTINCT p.purchase_id) AS num_purchases
    FROM purchase p
    JOIN supplier s ON p.supplier_id = s.supplier_id
    JOIN purchase_detail pd ON p.purchase_id = pd.purchase_id
    GROUP BY s.supplier_name, DATE_TRUNC('month', p.purchase_date)
    ORDER BY month DESC, total_amount DESC;

    -- 業務的な意味: 仕入先ごと月ごとの取引額が出る
    -- → 仕入先の依存度評価、交渉材料、年間契約見直しに使える

**分析クエリ③ ─ 売れ筋商品ランキング(数量ベース)**

    SELECT
      p.product_name,
      p.category,
      SUM(sd.quantity) AS total_sold,
      SUM(sd.quantity * sd.unit_price) AS total_revenue
    FROM sale_detail sd
    JOIN sale s ON sd.sale_id = s.sale_id
    JOIN product p ON sd.product_id = p.product_id
    WHERE s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY p.product_id, p.product_name, p.category
    ORDER BY total_sold DESC
    LIMIT 10;

    -- 業務的な意味: 直近30日の売れ筋ランキング
    -- → 在庫補充の優先度、品揃え見直しに使える

**分析クエリ④ ─ 在庫回転率(粗い計算)**

    SELECT
      p.product_name,
      i.current_quantity AS stock_now,
      COALESCE(SUM(sd.quantity), 0) AS sold_last_30d,
      CASE
        WHEN i.current_quantity = 0 THEN '在庫切れ'
        WHEN COALESCE(SUM(sd.quantity), 0) = 0 THEN '動きなし'
        ELSE ROUND(i.current_quantity::numeric / SUM(sd.quantity) * 30, 1)
           || '日分の在庫'
      END AS coverage
    FROM product p
    LEFT JOIN inventory i ON p.product_id = i.product_id
    LEFT JOIN sale_detail sd ON p.product_id = sd.product_id
    LEFT JOIN sale s ON sd.sale_id = s.sale_id
      AND s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY p.product_id, p.product_name, i.current_quantity
    ORDER BY p.product_name;

    -- 業務的な意味: 現在庫が何日分の販売量に相当するかを計算
    -- → 発注タイミングの目安、過剰在庫の発見に使える

**分析クエリ⑤ ─ 顧客別の値引き状況(履歴型マスタの活用、シナリオ⑨で蓄積した値引き販売を分析)**

    -- シナリオ⑨で「単価=190円」で値引き販売した実績があるはず。
    -- 「顧客ごとに、いくら値引きしたか」を集計して、値引きの偏りを確認する。
    -- ポイント: 履歴型マスタ(product_price_history) を JOIN することで、
    --          「販売日時点の正規定価」と実売単価を正しく比較できる。
    SELECT
      c.customer_name,
      COUNT(DISTINCT s.sale_id)                AS 販売件数,
      SUM(sd.quantity)                         AS 総数量,
      SUM(sd.quantity * sd.unit_price)         AS 実売合計,
      SUM(sd.quantity * pph.unit_price)        AS 定価合計,
      SUM(sd.quantity * (pph.unit_price - sd.unit_price)) AS 値引き総額,
      ROUND(
        100.0 * SUM(sd.quantity * (pph.unit_price - sd.unit_price))
        / NULLIF(SUM(sd.quantity * pph.unit_price), 0),
        1
      ) AS 平均値引き率_pct
    FROM sale s
    JOIN customer c      ON s.customer_id = c.customer_id
    JOIN sale_detail sd  ON s.sale_id = sd.sale_id
    JOIN product_price_history pph
      ON pph.product_id = sd.product_id
     AND s.sale_date BETWEEN pph.valid_from AND COALESCE(pph.valid_to, DATE '9999-12-31')
    GROUP BY c.customer_id, c.customer_name
    ORDER BY 値引き総額 DESC;

    -- 業務的な意味:
    --   ・どの顧客に値引きが集中しているかが分かる
    --   ・特定顧客への過剰な値引きの検知、営業ルール違反の発見に使える
    --   ・健全に運用されていれば、すべて 0円 / 0.0% になるはず
    -- ※ スナップショット型マスタでは、現在定価との比較しかできず、
    --   過去の定価で売られた取引も「値引き」と誤って計上されてしまう。

> **📌 「DBで管理することの意義」**
>
> 上記の分析クエリは、すべて**過去のトランザクションが正しく蓄積されているからこそ**可能です。業務システムが「単なる入力フォーム」ではなく「経営判断の基盤」になる所以です:
>
> - **トランザクションの完全性**(Day 5 で学んだ `@Transactional`):中途半端なデータがない → 分析結果が信頼できる
> - **履歴型マスタ**(UC02 で実装):過去の値で正しく評価できる → 時系列分析が破綻しない
> - **入出庫履歴**(`stock_movement`):在庫の「現在値」だけでなく「動きの履歴」が残る → 監査・原因調査が可能
> - **正規化されたテーブル設計**:JOIN で多角的に切り分けられる → 業務ニーズの変化に追従できる
>
> 研修で作ったこの仕組みは、現場では BI ツール(Tableau / Looker 等) のデータソースになったり、月次レポートの自動生成バッチの基盤になったりします。

### Ch.08 最終 commit + 研修の総括⏱ 30分

7日間の振り返り

### 8-1. Day 7 のまとめ

> **✓ 本日身につけたこと**
>
> - axios + インターセプターによる API 連携、JWT 自動付与
> - JWT 認証フローの実装(ログイン → localStorage 保存 → 自動付与 → 401処理)
> - Vee-Validate + Zod による型安全なフォームバリデーション
> - CRUD 画面の典型的な作り方(一覧 / 詳細 / 編集)
> - UI の4状態(loading / empty / error / success) の統一的扱い
> - ビルドと統合(jar同梱 / 別origin)の選択基準
> - 業務定義書の4アクター × 7ユースケースを Spring Boot + Vue 3 で実装

### 8-2. 7日間の研修総括

7日間で皆さんが身につけたことを、業務システム開発の各観点で振り返ります。

| Day   | テーマ                    | 得たもの                                                                                                                                                               |
|-------|---------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Day 1 | Kotlin概論+言語の核       | Null安全、data class、拡張関数、スコープ関数 ─ Java脳をKotlin脳に切り替える土台                                                                                        |
| Day 2 | 関数型・コレクション・DSL | map/filter/fold、sealed class、DSL ─ 宣言的な書き方の習得                                                                                                              |
| Day 3 | コルーチン・構造化並行性  | suspend / async / withTimeout / Flow / supervisorScope ─ 非同期処理を同期コードのまま書ける力                                                                          |
| Day 4 | Spring Boot × Kotlin 基礎 | レイヤー設計、JPA、Validation(標準+独自3パターン)、@RestControllerAdvice、Jackson による JSON 変換                                                                     |
| Day 5 | Spring Boot 高度          | DDD、JWT vs セッショントークン、メソッドレベル認可、複数テーブル更新トランザクション、AOP/プロキシ、テキスト/構造化ログ、Logback、ヘルスチェック                       |
| Day 6 | Vue 3 基礎                | Composition API、テンプレート構文、コンポーネント親子(props/emits/slots)、リアクティビティ、Pinia(state/getters/actions)、Vue Router、副作用、localStorage、SPA vs MPA |
| Day 7 | Vue統合・実践             | API連携、認証、フォーム、CRUD、エラーUX、ビルド統合 ─ 業務SPAの完成                                                                                                    |

#### 業務システム開発の観点別での到達度

| 観点                 | 到達したこと                                                                                                        |
|----------------------|---------------------------------------------------------------------------------------------------------------------|
| **言語・型システム** | Kotlin/TypeScript の Null安全と型安全な設計を、サーバーとフロントの両方で活用できる                                 |
| **非同期・並列処理** | コルーチンで「同期的に見える非同期コード」を書ける(UC06 仕入先API並列見積を体験)                                    |
| **レイヤー設計**     | DTO / Domain / Entity の役割分担、各層での型変換を理解(Jackson、JPA、TypeScript interface)                          |
| **データ整合性**     | 複数テーブル更新を @Transactional で原子的に実行(UC07 仕入登録、UC08 販売登録)、デッドロック対策と長時間TX回避      |
| **認証・認可**       | JWT による認証、URLレベル+メソッドレベル(@PreAuthorize)の2段認可、4アクターのロール反映                             |
| **バリデーション**   | 標準アノテーション、独自(単項目/クラスレベル/マスタ存在)、フロント vs バックの役割分担                              |
| **例外・エラー応答** | ControllerAdvice による自動ディスパッチ、ビジネスエラーと HTTP ステータスの対応、フロントでの表示                   |
| **運用品質**         | ヘルスチェック(/actuator/health)、テキスト+構造化ログ、MDC によるリクエストID付与、AOP の同一クラス内呼出ハマり回避 |
| **フロント設計**     | SPA としてのルーティング、コンポーネント親子と再利用、Pinia による状態管理、副作用の watch への分離                 |
| **業務知識**         | 業務定義書から要件を読み取り、ユースケースを画面+API+データに落とせる(在庫仕入販売管理システムを完成)               |

### 8-3. これからの学習指針

研修終了後、さらに知識を伸ばしたい方向けの方向性を示します。

#### Kotlin / サーバーサイド

- **R2DBC + Spring WebFlux + コルーチン**: ノンブロッキング DB アクセスとフル非同期スタック
- **Ktor**: Kotlin 専用の軽量フレームワーク。マイクロサービス向き
- **Exposed**: Kotlin らしい SQL DSL(JPAの代替)
- **Arrow**: 関数型プログラミングを強化するライブラリ(Either / Validated 等)
- **kotlinx.serialization**: Jackson の代替、コンパイル時のシリアライズ
- **Kotest**: Kotlin らしいテストフレームワーク

#### Vue / フロントエンド

- **Nuxt 3**: Vue のフレームワーク。SSR / SSG / ファイルベースルーティング
- **VueUse**: 200個以上の composable コレクション
- **TanStack Query (Vue Query)**: サーバー状態管理のベストプラクティス
- **Vuetify / PrimeVue / Naive UI**: UI コンポーネントライブラリ
- **Storybook**: コンポーネントカタログ

#### 共通

- **テスト戦略**: 単体 / 結合 / E2E / コントラクトテストの使い分け
- **OpenAPI / Swagger**: API スキーマからクライアント自動生成
- **Docker / Kubernetes**: コンテナ化とオーケストレーション
- **観測可能性**: OpenTelemetry + Grafana 等での分散トレーシング

### 8-4. 7日間お疲れさまでした

> **🎉 修了**
>
> Kotlin + Spring Boot + Vue 3 で業務システムを構築する一連の流れを、皆さんは習得しました。Java で慣れ親しんだ世界から、より宣言的で型安全な世界へ ─ ここから先は実際の業務で**実装し、運用し、改善する**サイクルを通じてさらに伸ばしてください。
>
> 研修中に作ったコードは、研修後も**振り返りの教材**として残ります。困った時、初心に戻りたい時に、見直してみてください。

### 付録 用語解説必要に応じて

本テキスト中に出てきた、深掘りしなかった用語の補足。読みたい人だけどうぞ。

### A-1. CORS(Cross-Origin Resource Sharing)

ブラウザのセキュリティ機構の1つ。Webブラウザは、**あるオリジン(プロトコル+ホスト+ポートの組合せ)で読み込まれたページが、別のオリジンへAjax/fetch通信することを既定で禁止**します。これを「同一オリジンポリシー(Same-Origin Policy)」と呼びます。

> **📌 オリジンが違う具体例**
>
> - `http://localhost:5173`(Vue開発サーバー) と `http://localhost:8080`(Kotlin + Spring Boot) ─ ポートが違う → 別オリジン
> - `https://myapp.com` と `https://api.myapp.com` ─ ホストが違う → 別オリジン

パターンA(フロントエンド・バックエンド分離)では、ブラウザがVueの開発サーバー(5173番)から Kotlin + Spring Boot(8080番)へAPIを叩こうとすると、ブラウザが「別オリジンへの通信」とみなして**既定でブロック**します。これを許可するためにサーバー側で「このオリジンからの通信は許可する」と明示するヘッダーを返す設定が **CORS設定**です。

パターンC(jar同梱)ではフロントもバックも同じ8080番から配信されるので、別オリジンの問題が発生せずCORS設定は不要になります。

> **⚠️ よくある誤解**
>
> CORSは「サーバー側のセキュリティ」ではなく「**ブラウザが利用者を守るための仕組み**」です。サーバーが許可していないオリジンからのリクエスト自体は届きますが、ブラウザがレスポンスをJSコードから読めないように遮断します。curlやサーバー間通信ではそもそもCORSは効きません。

具体的な設定方法は **Day 4(Spring Boot × Kotlin 基礎)** で扱います。

#### CORS と認証(JWT トークン)の関係 ─ よくある混乱ポイント

「CORS を設定した」 と「認証トークンを付けた」 は**別々の話**で、 <u>両方そろわないとブラウザからのAPI呼出は通りません</u>。 研修中に混乱しやすい箇所なので、 構造を整理しておきます。

| 段階            | 役割                                                                                          | 失敗時のエラー                                                                                 | 担当する設定                                                                                                                                                                                            |
|-----------------|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ① CORS チェック | ブラウザが「このオリジンからの通信をサーバーが許可しているか」 を Origin ヘッダで確認         | **ブラウザがレスポンスを破棄**(コンソールに `CORS error`、 ネットワークタブはステータス未確定) | サーバー側 CORS 設定(`SecurityConfig.cors { }`) + `CorsConfigurationSource` Bean。 許可オリジン、 許可メソッド、 許可ヘッダ(<u>Authorizationヘッダを使うなら明示的に許可</u>)、 Credentials許可フラグ。 |
| ② 認証チェック  | サーバー側で Authorization ヘッダから JWT を取り出し、 署名検証 + 期限チェック + ユーザー復元 | **401 Unauthorized** をサーバーが返す(レスポンス自体は届く)                                    | Spring Security のフィルタチェーン(`JwtAuthFilter.doFilterInternal()`)。 Day 5 で実装。 フロント側は axios の `` config.headers.Authorization = `Bearer ${token}` `` インタープリタで付与。             |
| ③ 認可チェック  | 認証済みユーザーが、 そのエンドポイントへのアクセス権限(ROLE)を持っているか                   | **403 Forbidden**                                                                              | `@PreAuthorize("hasRole('ADMIN')")` や SecurityConfig の `authorizeHttpRequests { }`                                                                                                                    |

> **📌 二重関門のイメージ ─ 「玄関(CORS)」 と「受付(JWT)」**
>
> 商業ビルに例えると、 **CORS は「入口の警備員」 で、 出入りできる訪問者(オリジン)を限定**します。 中に入れたとしても、 **受付(JWT認証) で名札(トークン)を見せないと業務フロアには上がれない**。 さらに業務フロアに上がれても、 **各部屋(エンドポイント) ごとに入室権限(ROLE) のチェック**がある ─ これが認可。
>
> つまり、 ブラウザから API が呼べるためには ①CORS、 ②JWT、 ③ROLE のすべてを通る必要があり、 <u>どれか1つを設定しただけでは動きません</u>。 研修中に「トークン付けてるのに 403 が出る」 と詰まったら、 まず**どの段階で落ちているか**を切り分けます。

**⚠ Authorization ヘッダを使うときの CORS 追加設定**

CORS のデフォルト設定は**標準ヘッダ(Content-Type, Accept など)しか許可しません**。 Authorization は標準外なので、 サーバー側で<u>明示的に許可ヘッダリストに含める</u>必要があります。 これを忘れると「CORS設定はしたのにブラウザが弾く」 という症状になり、 ネットワークタブを見ても 401 すら出ない(プリフライトの OPTIONS リクエストで弾かれているため)。

**SecurityConfig.kt(抜粋) ─ Authorization ヘッダを許可する**

```kotlin
@Bean
fun corsConfigurationSource(): CorsConfigurationSource {
    val config = CorsConfiguration().apply {
        allowedOrigins = listOf("http://localhost:5173")  // Vue 開発サーバー
        allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
        allowedHeaders = listOf("Authorization", "Content-Type")  // ★ Authorization を明示
        allowCredentials = true  // Cookie や Authorization を送るなら必須
    }
    return UrlBasedCorsConfigurationSource().apply {
        registerCorsConfiguration("/**", config)
    }
}
```

**💡 切り分けのコツ ─ ブラウザのネットワークタブの読み方**

| 症状                                                                                              | 原因の可能性                                                                                                                       | 対処                                                                                                                      |
|---------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| コンソールに `blocked by CORS policy` エラー、 ネットワークタブで **(failed)** やステータス未確定 | CORS の段階で弾かれている。 Origin がサーバーの許可リストに無い、 または Authorization ヘッダを送ろうとして OPTIONS が弾かれている | サーバー側 `allowedOrigins` と `allowedHeaders` を確認。 開発時は `http://localhost:5173` を許可                          |
| **401 Unauthorized** がレスポンスとして返る                                                       | CORS は通っている。 JWT が無い、 期限切れ、 署名不正、 ヘッダ形式が `Bearer ` 形式でない、 ユーザーが存在しない                    | axios の interceptor がトークンを付けているか、 トークンが localStorage に残っているか、 期限切れならログイン画面に飛ばす |
| **403 Forbidden** がレスポンスとして返る                                                          | CORS も JWT も通っている。 認証はOKだが、 そのユーザーに該当エンドポイントの ROLE が無い                                           | `@PreAuthorize` や SecurityConfig の権限設定を確認。 デモ用ユーザーが ROLE_ADMIN を持っているか                           |
| **200 OK** なのに axios の `.then` でデータが取れない                                             | CORS は通っているがレスポンスヘッダの読み取りが制限されている(例:Set-Cookie が見えない)                                            | サーバー側 `exposedHeaders` に必要なヘッダを追加                                                                          |

**📌 どこで誰が設定する? ─ 設定の置き場所と担当ライブラリ**

「研修中、 CORS 設定や JWT 検証のコードを<u>どのファイルに書いて、 何のライブラリが処理しているのか</u>」 を整理しておきます。

<table class="styled-table">
<colgroup>
<col style="width: 11%" />
<col style="width: 26%" />
<col style="width: 49%" />
<col style="width: 14%" />
</colgroup>
<thead>
<tr class="header">
<th>段階</th>
<th>担当ライブラリ / フレームワーク</th>
<th>設定する場所</th>
<th>本研修での出現章</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>① CORS チェック<br />
(ブラウザ側)</td>
<td><strong>ブラウザ自身</strong> ─ JavaScript のセキュリティモデル。 ライブラリではなく、 Chrome/Firefox/Edge などのブラウザに組み込まれた標準動作</td>
<td>設定するものではない。 fetch / axios が裏で <code>Origin</code> ヘッダを自動付与し、 OPTIONS プリフライトを必要に応じて投げる</td>
<td>─</td>
</tr>
<tr class="even">
<td>① CORS 許可応答<br />
(サーバー側)</td>
<td><strong>Spring Web の CorsFilter</strong>(<code>spring-web</code> 同梱) + <strong>Spring Security</strong> がフィルタチェーンに組み込み</td>
<td><code>config/CorsConfig.kt</code> の <code>@Bean corsConfigurationSource()</code><br />
+ <code>SecurityConfig.kt</code> の <code>http.cors { }</code> でチェーン有効化</td>
<td>Day 5 Ch.02-5</td>
</tr>
<tr class="odd">
<td>② JWT 検証<br />
(サーバー側)</td>
<td><strong>Spring Security</strong>(<code>spring-security-web</code>) のフィルタチェーン + 自作 <strong><code>JwtAuthFilter</code></strong> + JWT 解析は <strong>jjwt</strong>(<code>io.jsonwebtoken:jjwt-api</code>)</td>
<td><code>config/JwtAuthFilter.kt</code>(<code>OncePerRequestFilter</code> を継承)<br />
+ <code>SecurityConfig.kt</code> で <code>.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter::class.java)</code></td>
<td>Day 5 Ch.02-3 / Ch.02-4</td>
</tr>
<tr class="even">
<td>② JWT トークン付与<br />
(フロント側)</td>
<td><strong>axios</strong> の interceptor 機能(<code>axios.interceptors.request.use</code>)</td>
<td><code>frontend/src/api/client.ts</code> でグローバル interceptor 設定。 ログイン時に取得したトークンを Pinia store(<code>useAuthStore</code>)に保存し、 全リクエストに自動付与</td>
<td>Day 7 Ch.01 / Ch.04</td>
</tr>
<tr class="odd">
<td>③ ROLE 認可<br />
(URLパターン単位)</td>
<td><strong>Spring Security</strong> の AuthorizationFilter</td>
<td><code>SecurityConfig.kt</code> の <code>authorizeHttpRequests { }</code> ブロックで <code>.requestMatchers("/api/admin/**").hasRole("ADMIN")</code> など</td>
<td>Day 5 Ch.02-2</td>
</tr>
<tr class="even">
<td>③ ROLE 認可<br />
(メソッド単位)</td>
<td><strong>Spring Security</strong> の AOP プロキシ(<a href="#glossary-aop">→ A-7</a>)</td>
<td>Controller / Service メソッドに <code>@PreAuthorize("hasRole('ADMIN')")</code> を付与<br />
+ <code>SecurityConfig.kt</code> に <code>@EnableMethodSecurity</code> 必須</td>
<td>Day 5 Ch.02-2</td>
</tr>
</tbody>
</table>

**フィルタの実行順(サーバー側)**: ブラウザから来たリクエストは Spring Security のフィルタチェーンを通る順番が決まっています:

```
リクエスト
   ↓
 [1] CorsFilter            ← @Bean corsConfigurationSource() で設定
   ↓                          (拒否なら CORS error、 OPTIONS は即応答)
 [2] JwtAuthFilter         ← 自作。 Authorization ヘッダから JWT を取り出して検証
   ↓                          (失敗なら 401 を JwtAuthEntryPoint 経由で返却)
 [3] AuthorizationFilter   ← URL パターンによる ROLE チェック
   ↓                          (拒否なら 403)
 [4] Controller            ← @PreAuthorize によるメソッドレベル ROLE チェック
   ↓                          (拒否なら 403)
 ビジネスロジック実行 → レスポンス
```

この順序により、 <u>CORS で弾かれたリクエストは JWT 検証まで到達しない</u>(=「CORSを設定したらトークンも要らない」 と誤解する原因) 一方、 <u>JWT が無いリクエストは ROLE チェックを通る前に 401 で返される</u>。 この順序が、 セキュリティの**多層防御**を実現しています。

> **📌 まとめ ─ Vue から Spring Boot を呼ぶときに必要な3点セット**
>
> 1.  **CORS 設定**(サーバー側): <u>許可オリジン</u> + <u>許可メソッド</u> + <u>許可ヘッダ(Authorization必須)</u> + <u>allowCredentials = true</u>
> 2.  **JWT トークン付与**(フロント側): axios interceptor で `Authorization: Bearer ${token}` を全リクエストに自動付与。 ログイン直後にトークンを保存、 401 が返ったらログイン画面へ
> 3.  **ROLE による認可**(サーバー側): 各エンドポイントに `@PreAuthorize` でアクセス権限を明示。 認証済みユーザーが正しいロールを持っているか確認
>
> 本研修では Day 4 で CORS 設定、 Day 5 で JWT 認証実装、 Day 7 でフロント側の axios interceptor 統合を扱います。 詳細は各章を参照。

### A-2. JVMバイトコード

JVM(Java Virtual Machine)が実行できる、人間が読みづらい中間表現のこと。`.class` ファイルに保存されています。Java も Kotlin も、ソースは違っても最終的にこれを出力するため、互いのクラスを呼び出し合えます。

`javap -c MyClass.class` でバイトコードを覗き見できます。Kotlinコードがどう変換されているか気になる時は、IntelliJ の **Tools → Kotlin → Show Kotlin Bytecode** から確認できます。

### A-3. オリジン / プロトコル / ホスト / ポート

- **プロトコル**: `http://` や `https://` の部分
- **ホスト**: `localhost` や `myapp.com` の部分
- **ポート**: `:8080` の部分(省略時はHTTP=80, HTTPS=443)
- **オリジン**: 上記3つの組合せ。1つでも違えば「別オリジン」

### A-4. REST API / JSON

**REST** は HTTPで「リソース」をURL+動詞(GET/POST/PUT/DELETE)で操作するWeb API設計スタイルのこと。**JSON** は JavaScript Object Notation の略で、`{"name":"田中","age":30}` のようにテキストでデータを表現する形式。両者を組み合わせた「REST API(JSON over HTTP)」が、フロントエンド⇔バックエンド通信の事実上の業界標準です。

### A-5. 一級市民(first-class citizen)

プログラミング言語の文脈での専門用語。ある「値」が以下のすべてを満たせるとき、その値は「一級市民」とみなされます。

- 変数に代入できる
- 関数の引数として渡せる
- 関数の戻り値として返せる
- データ構造(リスト等)に入れられる

Java では数値・文字列・オブジェクトは一級市民ですが、**関数(メソッド)そのもの**は一級市民ではありません(関数を変数に代入したり、引数として渡したりは直接できない)。Kotlin では関数も一級市民として扱えるため、`val f = ::println` のように関数を変数に入れたり、`list.forEach(::println)` のように関数を別の関数の引数にしたりできます。

### A-6. WebSocket / SSE(Server-Sent Events)

どちらも「サーバーがクライアントに対して、後からデータを送りつける(プッシュする)」ための Web 技術。普通の HTTP は「クライアントが要求 → サーバーが応答 → 終わり」の往復1回が基本ですが、リアルタイム性が必要なアプリ(チャット、株価通知、注文の進捗表示、IoTセンサーの値表示など)では、接続を維持しながらサーバー側から逐次データを送りたいニーズがあります。

| 観点             | WebSocket                                                                                     | SSE(Server-Sent Events)                                                            |
|------------------|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------|
| 通信方向         | **双方向**(クライアント ↔ サーバー、両方が任意のタイミングで送信)                             | **一方向**(サーバー → クライアントのみ)                                            |
| プロトコル       | WebSocketプロトコル(`ws://` / `wss://`)。HTTPでハンドシェイクした後、独自プロトコルに切り替え | 普通の HTTP の上で動く。Content-Type: `text/event-stream` でレスポンスを返し続ける |
| データ形式       | テキスト or バイナリ                                                                          | テキストのみ                                                                       |
| 自動再接続       | 自前実装が必要                                                                                | ブラウザが自動で再接続してくれる                                                   |
| 典型用途         | チャット、共同編集、ゲーム ─ クライアント側からも送信が必要                                   | 株価通知、ニュース速報、進捗表示 ─ サーバー側からの一方通知で十分                  |
| サーバー側の負荷 | 各接続でステートフルな TCP コネクションを維持                                                 | 同じく接続を維持するが、HTTP の枠内で動くのでロードバランサ等との相性が良い        |

> **💡 どちらを選ぶか**
>
> 原則は**「クライアントからも送信が必要なら WebSocket、サーバーからの通知だけで良いなら SSE」**。SSE の方が実装が簡単(普通の HTTP の延長) で、再接続もブラウザ任せにできるため、用途が合えば SSE が推奨されることが多い。チャットや共同編集など**双方向**が必要な場合だけ WebSocket を選ぶ、というのが現代的な判断です。

本研修では Day 3 Ch.8 の Flow の活用シーンとして名前が登場します。Spring Boot 側でも `Flow<ServerSentEvent<T>>` を Controller の戻り値にすると、自動的に SSE のレスポンスが組まれる ─ など Kotlin と相性が良い仕組みです(本研修では深掘りはしません)。

### A-7. AOP(アスペクト指向プログラミング)とプロキシ

Day 4・Day 5 で `@Transactional` 、 `@Cacheable` 、 `@PreAuthorize` 、 `kotlin-spring プラグイン(クラスを open にする)` など、Spring の様々な機能の解説で「AOP」「プロキシ」という用語が登場します。これらは Spring の**裏側で動いている仕組み**で、普段は意識せず使えますが、**ハマった時に理解していないと原因が分からない**領域です。

#### そもそも AOP とは何か

**AOP**(**A**spect-**O**riented **P**rogramming、**アスペクト指向プログラミング**) は、**「ビジネスロジックに直接関係しないが、多くの場所で繰り返し必要になる処理」**を、本体のコードから分離して別の場所で記述する仕組みです。

具体的に「分離したい処理」とは:

- **ロギング**: 全メソッドの開始/終了/例外をログに出したい
- **トランザクション管理**: メソッド開始時に begin、終了時に commit、例外時に rollback
- **認可チェック**: メソッドを呼ぶ前に「このユーザーは権限があるか」を確認
- **キャッシュ**: 同じ引数で呼ばれたら、メソッドを実行せずキャッシュから返す
- **性能計測**: メソッドの実行時間を測定して記録

これらは**業務ロジックの本質ではないが、多くのメソッドで必要**な処理。**「横断的関心事(cross-cutting concerns)」**と呼ばれます。AOP はこれらを**「アスペクト」**として本体のコードから分離する仕組みです。

#### AOP がない世界(問題提起)

AOP がないと、トランザクション管理を書く度に同じコードを繰り返し書くハメになります:

**AOPなしの書き方**

    // 1メソッドごとに同じトランザクション管理を書く必要がある
    fun placeOrder(req: PlaceOrderRequest): Order {
        val tx = transactionManager.begin()
        try {
            val result = /* 業務ロジック */
            tx.commit()
            return result
        } catch (e: Exception) {
            tx.rollback()
            throw e
        }
    }
    // 同じパターンを placeOrder / cancelOrder / refund / updateStatus...すべてに書く

#### AOP のある世界(解決)

AOP では、`@Transactional` アノテーションを付けるだけ。Spring がメソッドの周りに自動的にトランザクション管理コードを「織り込んで」くれます:

**AOPありの書き方**

    @Transactional
    fun placeOrder(req: PlaceOrderRequest): Order {
        return /* 業務ロジックだけ書く */
    }
    // → Spring が自動で begin / commit / rollback を周辺に追加する

#### 「プロキシ」が AOP を実現する仕組み

では Spring はどうやって「`@Transactional` が付いたメソッドの周辺にコードを差し込む」のでしょうか?ここで登場するのが**プロキシパターン**です。

**プロキシ**とは「**元のオブジェクトと同じインターフェイスを持つ<u>代理</u>のオブジェクト**」。利用者は「本物」だと思って呼び出しますが、間にプロキシが入って**前処理・後処理を挟む**ことができます。

［図（テキスト抽出）：プロキシ(代理)の仕組み ─ AOP の中身 / ① 呼び出し元(例: Controller、別のService) / orderService.placeOrder(req) ─ 本物の OrderService を呼んでいるつもり / ② プロキシ(Spring が自動生成した「代理クラス」) / クラス名: OrderService\$\$EnhancerByCGLIB\$\$xxx(継承で生成された別物だが、見た目は同じ) / ▼ 前処理 / tx = transactionManager.begin() / 認可チェック(@PreAuthorize) / ログ出力 等 / ▼ 本物のメソッド呼び出し(super.placeOrder(req)) / 開発者が書いた業務ロジック ─ ここがメインの処理 / ▼ 後処理 / 正常時: tx.commit() / 例外時: tx. …］（元HTMLのSVG図。Markdown版では図中テキストのみ掲載）

図A-1: プロキシによる AOP の実現 ─ 本物と同じ顔をした代理クラスが、前後処理を挟む

#### Spring AOP の具体的な仕組み

Spring は**CGLIBプロキシ**(あるいはJDK動的プロキシ)を使い、**実行時に**プロキシクラスを生成します。CGLIBプロキシは**元クラスを継承**して、対象メソッドだけをオーバーライドする方式:

**Springが裏でやっていること(イメージ)**

    // 開発者が書いたコード
    @Service
    open class OrderService {
        @Transactional
        open fun placeOrder(req: Request): Order { /* ロジック */ }
    }

    // Spring が自動生成するプロキシクラス(イメージ)
    class OrderService$$EnhancerByCGLIB$$abc123 : OrderService() {  // ← 元クラスを継承
        override fun placeOrder(req: Request): Order {
            val tx = transactionManager.begin()      // 前処理: トランザクション開始
            try {
                val result = super.placeOrder(req)   // 元メソッド呼び出し
                tx.commit()                              // 後処理: commit
                return result
            } catch (e: Exception) {
                tx.rollback()
                throw e
            }
        }
    }

> **📌 Kotlin で open が必要な理由 ─ kotlin-spring プラグインの正体**
>
> 上のコードで、CGLIBプロキシは**「元クラスを継承する」**ことに注目してください。Kotlin のクラスはデフォルトで `final`(継承不可) なので、**そのままだと CGLIB プロキシが継承できない**=AOP が機能しない、という問題があります。
>
> これを解決するのが Day 4 で出てきた `kotlin("plugin.spring")` プラグイン。`@Service`、`@Component`、`@Configuration` 等が付いたクラスを**自動的に `open` にしてくれる**のです。
>
> 「Kotlin × Spring で `kotlin-spring` プラグインがなぜ必須か?」の答えは**「Spring AOP が CGLIB プロキシで実装されており、クラスを継承する必要があるから」**です。

#### AOPで動いている Spring の機能リスト

あなたが普段使っている以下の Spring 機能は、全て AOP プロキシで動いています:

| 機能                 | アノテーション                     | AOP の役割                                 |
|----------------------|------------------------------------|--------------------------------------------|
| トランザクション管理 | `@Transactional`                   | begin / commit / rollback を前後に差し込む |
| キャッシュ           | `@Cacheable` / `@CacheEvict`       | キャッシュ確認・保存・削除を前後に差し込む |
| 認可チェック         | `@PreAuthorize` / `@PostAuthorize` | メソッド呼び出し前後で権限を判定           |
| 非同期実行           | `@Async`                           | メソッド呼び出しを別スレッドにオフロード   |
| リトライ             | `@Retryable`(Spring Retry)         | 例外時に自動再試行                         |
| スケジューリング     | `@Scheduled`                       | cron式に従って定期実行                     |

#### AOPプロキシの最頻ハマりどころ ─ 「同一クラス内のメソッド呼び出し」

**🚨 自分自身のメソッド呼び出しはプロキシを通らない**

AOPの最大のハマりポイントは「同一クラス内で `this` 経由でメソッドを呼ぶと、プロキシを通らない」こと。

**ハマる例**

    @Service
    class OrderService {
        fun outer() {
            inner()   // ← この呼び出しは「this.inner()」と同じ。プロキシを通らない!
        }

        @Transactional(propagation = Propagation.REQUIRES_NEW)
        fun inner() {
            // REQUIRES_NEW にならない(プロキシを通らないので @Transactional が効かない)
        }
    }

**なぜ起きるか**: プロキシは「呼び出し元」と「本物」の間に挟まる。外部から `orderService.outer()` が呼ばれた時はプロキシを通る。だが、その `outer()` の内側で `this.inner()` を呼ぶと、それは**本物のオブジェクトから本物のオブジェクトへの直接呼び出し**。プロキシを経由しないので、`inner()` に付けた `@Transactional` も効かない。

**対策**:

- `inner()` を別の Bean(別クラス) に切り出して、DIで注入する(推奨)
- または `ApplicationContext` から自分自身を取得して、プロキシ経由で呼ぶ(あまり推奨されない)

これは `@Transactional` だけでなく、`@Cacheable`、`@Async`、`@PreAuthorize`、`@Retryable` など**AOPを使う全アノテーションで同じ問題が起きる**ので、覚えておいてください。

> **💡 まとめ ─ AOP プロキシは「便利」と「ハマる」の両刃の剣**
>
> AOP プロキシは、Spring が提供する**便利な仕組みのほとんど**を支えています。普段は意識せず使えますが、**同一クラス内呼び出しの罠**、**final クラス問題(=Kotlin の open 強制)**、**呼ぶ前/呼ぶ後どちらでアノテーションが評価されるか**などのハマりどころは存在します。「Spring の挙動がおかしい」と感じたら、まず**「これプロキシ通ってるかな?」**と疑うのが第一歩です。

### A-8. Webpack / Vite / バンドラー

Day 6 の Vite 解説や、フロントエンドの記事を読んでいると**Webpack**、**Vite**、**Rollup**、**esbuild** といった用語が頻出します。これらは「バンドラー」と呼ばれる、フロントエンド開発に欠かせないツール群です。

#### そもそもバンドラーとは何か

**バンドラー**(bundler、「束ねるもの」)は、**「フロントエンドの開発時に、複数のソースファイルを一つにまとめてブラウザが効率的に読める形式に変換するツール」**です。なぜそんなものが必要かというと:

- **開発時はファイルを分けたい**: `Button.vue`、`Card.vue`、`main.ts`、`util.ts`... とファイルを分けないと管理できない
- **ブラウザに渡す時は少ない方が速い**: 何百ファイルもブラウザが個別にダウンロードすると遅い。1〜数個のJSファイルにまとめたい
- **変換が必要なファイル形式がある**: TypeScript(`.ts`)、Vue(`.vue`)、Sass(`.scss`) などはブラウザがそのまま読めない。**JS / CSS / HTML** に変換する必要がある
- **本番では最適化したい**: コードの圧縮(minify)、不要コードの削除(tree-shaking)、画像のリサイズなど

これらをまとめてやってくれるのがバンドラーです。

#### 主要なバンドラーの歴史

| 登場時期   | 名前           | 特徴                                                                                             | 現代での位置づけ                                         |
|------------|----------------|--------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| 2011年頃〜 | **Browserify** | Node.js の require をブラウザでも使えるようにする最初の発想                                      | 古い。現役プロジェクトでは使われない                     |
| 2014年頃〜 | **Webpack**    | 「すべてはモジュールである」の思想。CSS や画像までモジュール扱いに。長らくフロント界のデファクト | 既存大規模プロジェクトで現役だが、新規では Vite が主流に |
| 2018年頃〜 | **Rollup**     | ライブラリ作成に最適。tree-shaking が強力                                                        | Vue や Vite が内部で利用。本番ビルド向け                 |
| 2020年頃〜 | **esbuild**    | Go言語製、極めて高速(Webpack の100倍級)                                                          | Vite が開発時に利用。高速性が売り                        |
| 2020年〜   | **Vite**       | 「開発はesbuild、本番はRollup」のハイブリッド。開発速度を劇的に改善                              | **現代の Vue/React プロジェクトのデファクト**            |

#### Webpack と Vite の違い ─ なぜ Vite が速いのか

本研修では Vite を使いますが、Webpack との違いを理解しておくと、「Vite はなぜ速いと言われるのか」が分かります。

| 観点                | Webpack                                                      | Vite                                                                                 |
|---------------------|--------------------------------------------------------------|--------------------------------------------------------------------------------------|
| 開発時のアプローチ  | 起動時に**全ファイルをバンドル**してから dev server を立てる | 起動時はバンドルせず、ブラウザのリクエストに応じて**必要なファイルだけ変換**して返す |
| 起動時間            | プロジェクト規模に比例して遅くなる(数十秒〜数分)             | **プロジェクト規模に関わらず数百ms**                                                 |
| 仕組み              | すべて自前のバンドラーで変換                                 | 開発時は ES Modules(ブラウザ標準) と esbuild、本番ビルドは Rollup                    |
| HMR(ホットリロード) | 変更時に関連バンドル全体を再構築                             | 変更ファイルだけ即座に置き換え                                                       |
| 設定の複雑さ        | かなり複雑(`webpack.config.js` の作り込みが必要)             | シンプル(`vite.config.ts` は最小限)                                                  |

> **💡 Vite が速い秘訣 = ES Modules を使う**
>
> 現代のブラウザは**ES Modules**(`import { foo } from './foo.js'`) を標準でサポートしています。Vite はこれを開発時に活用 ─ ブラウザが必要に応じて個別ファイルをリクエストし、Vite はそれを返すだけ。「全部まとめてから渡す」必要がないので、起動が爆速。本番ビルド時だけ Rollup で従来通りバンドルします。

本研修では Vite を使うので Webpack の設定を書く必要はありません。ただし、業界の文脈で「Webpack」が出てきた時に、上記の歴史と Vite との関係を理解しておくと困りません。

### A-9. Jackson(JSON シリアライズ/デシリアライズ)

Day 4 と Day 6 で `@RequestBody` や `@ResponseBody` の話に出てくる **Jackson**(ジャクソン)は、**Java/Kotlin オブジェクトと JSON テキストを相互変換するためのライブラリ**です。Spring Boot のデフォルトの JSON 処理エンジンとして、何も追加設定をせず自動的に組み込まれています。

#### 何をしてくれるか

- **シリアライズ(serialize)**: Kotlin オブジェクト → JSON 文字列 (送信用)
- **デシリアライズ(deserialize)**: JSON 文字列 → Kotlin オブジェクト (受信用)

例として、Spring Boot Controller が以下のように動いています:

**Jacksonが裏でやっていること(イメージ)**

    // Vue から送られてくる JSON
    {"name": "山田", "age": 30}
            ↓ Jackson が読み取り、フィールド名で対応付け
    data class CreateUserRequest(val name: String, val age: Int)
            ↓ こうしてアプリで使える Kotlin オブジェクトに変換される
            ↓ ── これがデシリアライズ

    // レスポンス時は逆方向
    data class UserResponse(val id: Long, val name: String, val age: Int)
            ↓ Jackson が JSON に変換
    {"id": 123, "name": "山田", "age": 30}
            ↓ ── これがシリアライズ、Vue が受信

#### Spring Boot で Jackson が使われる場面

| 使用箇所                            | 方向                | Jacksonの役割                                                   |
|-------------------------------------|---------------------|-----------------------------------------------------------------|
| `@RequestBody`                      | JSON → オブジェクト | リクエスト body の JSON を DTO に変換                           |
| `@ResponseBody` / `@RestController` | オブジェクト → JSON | 戻り値を JSON 文字列に変換してレスポンス body に書き出し        |
| ObjectMapper を直接利用             | 双方向              | 明示的にコードで変換(キャッシュ保存、ログ出力、外部API連携など) |

#### data class との相性が良い

Jackson は Java 製のライブラリですが、**Kotlin の data class** と組み合わせる時に少し注意が必要です:

- **jackson-module-kotlin**: Kotlin の data class やデフォルト引数を扱うための専用モジュール。Spring Boot は自動的に組み込んでくれる
- **引数なしコンストラクタ不要**: Java 時代は必須だったが、jackson-module-kotlin により data class でも問題なくデシリアライズ可能
- **val(イミュータブル) でOK**: setter なしのプロパティでもコンストラクタ経由で生成してくれる

#### よく使うアノテーション

| アノテーション                               | 用途                                                                                                  |
|----------------------------------------------|-------------------------------------------------------------------------------------------------------|
| `@JsonProperty("xxx")`                       | JSON 上のキー名と Kotlin プロパティ名が違う時に対応付け(例: JSON: `"user_id"` → Kotlin: `val userId`) |
| `@JsonIgnore`                                | そのプロパティを JSON に含めない(出力時にも入力時にも無視)                                            |
| `@JsonFormat(pattern = "yyyy-MM-dd")`        | 日付・時刻のフォーマット指定                                                                          |
| `@JsonInclude(JsonInclude.Include.NON_NULL)` | null のフィールドを JSON 出力から除外                                                                 |

> **💡 Jackson は意識せず使うのが基本**
>
> Spring Boot を普通に使っていれば、Jackson の存在を意識する必要はほぼありません。`data class` と `@RequestBody`/`@RestController` を書くだけで、フィールド名が JSON と一致していれば自動で変換されます。ただし、外部 API が `user_id` のような**スネークケース**でフィールド名を返してくる時など、`@JsonProperty` でアノテーションを足す必要が出てきます。

業界の他の選択肢としては **kotlinx.serialization**(Kotlin 公式の代替) があります。コンパイル時にコード生成するため起動が速い等の利点がありますが、本研修では Spring Boot 標準の Jackson を使います。

### 付録 B HTTPステータスコード早見表

REST API でよく使う/出会うステータスコードの意味と判定方針

### B-1. ステータスコードの大原則

HTTP ステータスコードは **3桁の番号**で表され、 先頭の数字でカテゴリが決まります:

| 先頭    | カテゴリ                   | 意味                                                                                             | クライアントの基本対応                                 |
|---------|----------------------------|--------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| **1xx** | 情報 (Informational)       | 処理継続中 ─ 通常見ない                                                                          | 気にしなくてよい                                       |
| **2xx** | 成功 (Success)             | **正常**。 200/201/204 など、 番号の違いは「どう成功したか」 の違い。 <u>すべて正常扱いで OK</u> | 成功として処理を続ける                                 |
| **3xx** | リダイレクト (Redirection) | 別の URL を見ろ、 など。 通常は HTTP クライアントが自動追従                                      | 大抵自動で処理される                                   |
| **4xx** | クライアントエラー         | **呼び出し側のミス**。 リクエストが間違っている、 認証が無い、 リソースが存在しない、 など       | エラーメッセージを表示してユーザーに修正を促す         |
| **5xx** | サーバーエラー             | **サーバー側のバグ・障害**。 呼び出し方は正しい                                                  | 「サーバー障害です」 と表示、 ログ送信・リトライを検討 |

> **ⓘ 一番大事なルール**
>
> 「**2 で始まる = 正常**」 と覚えれば実務の95%は OK です。 200・201・204 は意味の違いこそあれ、 すべて「成功」 を示すコード。 アプリの判定もまず `if (status >= 200 && status < 300) { 成功処理 }` と書きます。

### B-2. 2xx ─ 成功(よく使うもの)

| コード  | 名前       | 意味                   | どんな時に使う                                                                            |
|---------|------------|------------------------|-------------------------------------------------------------------------------------------|
| **200** | OK         | 成功(ボディあり)       | `GET` の取得成功、 `PUT` の更新成功。 一番無難な成功                                      |
| **201** | Created    | 新規作成成功           | `POST` でリソース作成完了。 200 でも動作するが、 「作った」 ことを明示するため 201 が標準 |
| **202** | Accepted   | 受付完了(処理は非同期) | バッチ処理キュー投入時など、 「受け付けたが処理中」 を示す                                |
| **204** | No Content | 成功・ボディ空         | `DELETE` の削除成功。 削除したので返すデータがない → ボディを空にする                     |

### B-3. 4xx ─ クライアントエラー(呼出側のミス)

| コード  | 名前                   | 意味                    | 具体例                                                                   |
|---------|------------------------|-------------------------|--------------------------------------------------------------------------|
| **400** | Bad Request            | リクエスト形式が不正    | JSON が壊れている、 必須パラメータ欠落、 バリデーションエラー            |
| **401** | Unauthorized           | <u>認証</u>されていない | JWT トークンが無い・期限切れ。 「ログインしてください」 状態             |
| **403** | Forbidden              | <u>認可</u>されていない | ログイン済みだが権限なし。 「管理者専用ページにユーザーがアクセス」 など |
| **404** | Not Found              | リソースが存在しない    | `GET /api/products/999` で id=999 の商品なし。 URL タイポも該当          |
| **405** | Method Not Allowed     | HTTP メソッドが間違い   | `GET /api/users` しか定義してないのに `POST` で呼ばれた                  |
| **409** | Conflict               | 状態の競合              | 楽観排他で他ユーザーが先に更新済み、 重複登録(メールアドレス重複)        |
| **415** | Unsupported Media Type | Content-Type が対応外   | `application/json` 期待なのに `text/plain` で送ってきた                  |
| **422** | Unprocessable Entity   | 業務ロジック上の不正    | JSON は valid だが「在庫数 -1」 など業務ルール違反。 Day 4 §5 で扱う     |
| **429** | Too Many Requests      | レート制限              | 1秒間に大量のリクエスト、 不正アクセス防止                               |

> **📌 401 と 403 の違い ─ よく混乱するポイント**
>
> - **401 Unauthorized** ─ 「<u>あなたは誰?</u>」 トークンが無い・期限切れ。 ログインし直せば解決
> - **403 Forbidden** ─ 「<u>あなたは誰か分かっているが、 ここには入れない</u>」 ログイン済みだが権限なし
>
> 名前が紛らわしい(`Unauthorized` の方が「権限なし」 っぽい) ですが、 実際は **401 が認証、 403 が認可**。 Day 5 のセキュリティ章で詳しく扱います。

### B-4. 5xx ─ サーバーエラー(サーバー側の問題)

| コード  | 名前                  | 意味                          | 具体例                                                  |
|---------|-----------------------|-------------------------------|---------------------------------------------------------|
| **500** | Internal Server Error | サーバー内部エラー(汎用)      | 未捕捉の例外、 NullPointerException、 ロジックバグ      |
| **502** | Bad Gateway           | ゲートウェイ/プロキシ越し失敗 | Spring Boot は動いてるが、 nginx の向こうが応答してない |
| **503** | Service Unavailable   | サービス停止中                | メンテナンス中、 過負荷で一時的に応答不能               |
| **504** | Gateway Timeout       | タイムアウト                  | 応答が一定時間以内に返ってこない(外部 API 遅延など)     |

5xx を返したらサーバー側のバグまたは障害です。 ログを必ず確認し、 修正・障害対応を行います。 クライアント側は<u>再試行(リトライ) や、 メンテナンス画面表示で対応</u>するのが基本です。

### B-5. 本研修で扱うコード一覧

Day 4・Day 5 で実装する商品/販売/認証 API で使うステータスコードをまとめます:

| シーン                               | コード  | 備考                                                       |
|--------------------------------------|---------|------------------------------------------------------------|
| 商品一覧取得 `GET`                   | 200     | 件数0件でも 200(空配列を返す)                              |
| 商品詳細取得 `GET /{id}` 成功        | 200     |                                                            |
| 商品詳細取得 `GET /{id}` 該当なし    | 404     | `NotFoundException` → `GlobalExceptionHandler` で 404      |
| 商品登録 `POST` 成功                 | **201** | `@ResponseStatus(HttpStatus.CREATED)`                      |
| 商品登録 `POST` バリデーションエラー | 400     | Bean Validation で自動 400                                 |
| 商品登録 `POST` 業務ルール違反       | 422     | 「価格が負」 「在庫不足」 など。 `BusinessException` → 422 |
| 商品更新 `PUT` 成功                  | 200     | 更新後のリソースを返す                                     |
| 商品更新 `PUT` 楽観排他失敗          | 409     | Day 7 §5-5 で扱う                                          |
| 商品削除 `DELETE` 成功               | **204** | ボディなし                                                 |
| 未ログインで API 呼出                | 401     | JWT 無し or 期限切れ                                       |
| 権限不足で API 呼出                  | 403     | ADMIN 専用 API に一般ユーザーがアクセス                    |
| 予期せぬバグ                         | 500     | 全例外捕捉ハンドラの最終フォールバック                     |

> **💡 開発時のデバッグ Tips**
>
> ブラウザの DevTools(F12)「Network」 タブで全リクエストのステータスコードが確認できます。 赤字で表示されたら 4xx/5xx です。 落ち着いて番号を見て、 「自分が悪い(4xx) か、 サーバーが悪い(5xx) か」 をまず判断しましょう。
