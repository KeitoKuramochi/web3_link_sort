import Link from "next/link";
import { lessons } from "../data/lessons";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Web3AI リンクまとめハブ</h1>
        <p className={styles.description}>
          授業内で共有されたデモ・教材・参考リンクを整理し、
          各授業回ごとに見返しやすい「リンクまとめハブ」です。
        </p>
      </header>

      <div className={styles.grid}>
        {lessons.map((lesson) => (
          <Link href={`/lesson/${lesson.lessonId}`} key={lesson.lessonId} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardBadge}>第{lesson.lessonId}回</span>
              <h2 className={styles.cardTitle}>{lesson.title}</h2>
            </div>
            <p className={styles.cardDescription}>{lesson.description}</p>
            <div className={styles.cardButton}>
              第{lesson.lessonId}回まとめを見る →
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
