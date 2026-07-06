import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import styles from "./page.module.css";

// 仮の進捗データ（本来は「進捗管理」機能から受け取る。今は画面確認用のサンプル）
const SAMPLE_PROGRESS = { done: 3, total: 10 };

// 達成数に応じた「植林（森）の様子」の一言（本来は「植林」機能と連動）
function forestMessage(done) {
  if (done <= 0) return "まだ何も植わっていません。最初のタスクを完了してみましょう。";
  if (done < 5) return "苗木がすくすく育っています。🌱";
  if (done < 10) return "若木が並び、緑がにぎやかになってきました。🌿";
  return "森が生い茂りました！みんなの頑張りの成果です。🌳";
}

// トップ画面（ログイン後のハブ）。各機能への入口と、今日のようすを見せる。
export default function Home() {
  // ★接続ポイント：今は仮のログイン済みユーザーが返る。
  //   本物のログインと繋ぐと、実際の登録名などが入る（src/lib/auth.js を差し替えるだけ）。
  const user = getCurrentUser();

  // 安全策：万一ログインしていなければ、ログインへ促す（本物の認証接続後に効く）
  if (!user) {
    return (
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.title}>ログインが必要です</h1>
          <Link href="/login" className={styles.primaryButton}>
            ログインする
          </Link>
        </section>
      </main>
    );
  }

  // 各機能への入口カード（飛び先は仮のパス。中身は各担当があとで作る）
  const features = [
    { href: "/tasks", emoji: "✅", title: "進捗管理", desc: "タスクや作業状況を管理します。" },
    { href: "/assistant", emoji: "🤖", title: "AI内田さん", desc: "困ったときに相談できるAIです。" },
    { href: "/forest", emoji: "🌱", title: "植林", desc: "進捗が進むほど緑が育ちます。" },
  ];

  const { done, total } = SAMPLE_PROGRESS;
  const percent = Math.round((done / total) * 100);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.logo}>manage-task</span>
        <div className={styles.userArea}>
          <span>{user.name} さん</span>
          <LogoutButton className={styles.logoutButton} />
        </div>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.title}>ようこそ、{user.name} さん</h1>
        <p className={styles.lead}>
          今日も各機能を使ってみましょう。進捗が進むほど、みんなの森が育っていきます。
        </p>
      </section>

      {/* 各機能への入口（導線）。カードごと押せるリンクにする */}
      <section className={styles.features}>
        {features.map((f) => (
          <Link key={f.href} href={f.href} className={styles.card}>
            <span className={styles.cardEmoji}>{f.emoji}</span>
            <h2 className={styles.cardTitle}>{f.title}</h2>
            <p className={styles.cardText}>{f.desc}</p>
          </Link>
        ))}
      </section>

      {/* 画面下部：現在の進捗と植林の様子（今は仮。あとで各機能と連動） */}
      <section className={styles.status}>
        <h2 className={styles.statusTitle}>今日のようす</h2>
        <div className={styles.statusGrid}>
          <div className={styles.statusCard}>
            <p className={styles.statusLabel}>現在の進捗</p>
            <p className={styles.statusValue}>
              {done} / {total} タスク完了（{percent}%）
            </p>
            <div className={styles.bar}>
              <div className={styles.barFill} style={{ width: `${percent}%` }} />
            </div>
          </div>
          <div className={styles.statusCard}>
            <p className={styles.statusLabel}>🌱 植林の様子</p>
            <p className={styles.statusValue}>{forestMessage(done)}</p>
          </div>
        </div>
        <p className={styles.statusNote}>
          ※ 今は仮の数値です。進捗管理・植林の機能ができると、ここに実際の状況が反映されます。
        </p>
      </section>
    </main>
  );
}
