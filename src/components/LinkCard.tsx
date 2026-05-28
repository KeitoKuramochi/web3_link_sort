"use client";

import { LinkItem } from "../data/lessons";
import styles from "./LinkCard.module.css";
import { incrementLinkClick } from "../lib/linkStats";

interface LinkCardProps {
  link: LinkItem;
  clickCount: number;
  isPopular?: boolean;
  onLinkClick?: (id: string, newCount: number) => void;
}

export default function LinkCard({ link, clickCount, isPopular, onLinkClick }: LinkCardProps) {
  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // リンクを開く前にクリック数を加算 (楽観的UI更新として先にカウントを上げることも可能ですが、今回はシンプルに処理)
    if (onLinkClick) {
      // 画面上の数値を即座に増やす（楽観的更新）
      onLinkClick(link.id, clickCount + 1);
    }
    // バックグラウンドで非同期に保存
    const newCount = await incrementLinkClick(link.id);
    if (onLinkClick && newCount > clickCount + 1) {
      // もし他人のクリック等で更に増えていたら再更新
      onLinkClick(link.id, newCount);
    }
  };

  return (
    <div className={`${styles.card} ${link.isCore ? styles.core : ""} ${isPopular ? styles.popular : ""}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{link.title}</h3>
        <div className={styles.sharer}>{link.sharer}</div>
      </div>
      
      <div className={styles.badges}>
        {isPopular && (
          <span className={`${styles.badge} ${styles.badgePopular}`}>
            🔥 人気
          </span>
        )}
        <span className={`${styles.badge} ${styles.badgeCategory}`}>
          {link.category}
        </span>
        {link.isDuplicate && (
          <span className={`${styles.badge} ${styles.badgeDuplicate}`}>
            {link.duplicateNote || "重複共有あり"}
          </span>
        )}
      </div>

      <p className={styles.summary}>{link.summary}</p>
      <div className={styles.context}>
        <strong>授業内での意味：</strong> {link.lessonContext}
      </div>

      <div className={styles.footer}>
        <div className={styles.stats}>
          <span>👀 {clickCount} views</span>
        </div>
        <a 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.button}
          onClick={handleClick}
        >
          リンクを開く <span className={styles.buttonIcon}>↗</span>
        </a>
      </div>
    </div>
  );
}
