"use client";

import { LinkItem } from "../data/lessons";
import styles from "./LinkCard.module.css";
import { incrementStat, LinkStatData } from "../lib/linkStats";

interface LinkCardProps {
  link: LinkItem;
  stats: LinkStatData;
  isPopular?: boolean;
  onStatChange?: (id: string, newStats: LinkStatData) => void;
}

export default function LinkCard({ link, stats, isPopular, onStatChange }: LinkCardProps) {
  const handleLinkClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // クリック数増加
    if (onStatChange) {
      onStatChange(link.id, { ...stats, clicks: stats.clicks + 1 });
    }
    const newStats = await incrementStat(link.id, "click");
    if (onStatChange) {
      onStatChange(link.id, newStats);
    }
  };

  const handleRecommendClick = async () => {
    // おすすめ数増加
    if (onStatChange) {
      onStatChange(link.id, { ...stats, recommends: stats.recommends + 1 });
    }
    const newStats = await incrementStat(link.id, "recommend");
    if (onStatChange) {
      onStatChange(link.id, newStats);
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
            🌟 超おすすめ
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
          <span>👀 {stats.clicks} views</span>
        </div>
        
        <div className={styles.actions}>
          <button 
            onClick={handleRecommendClick}
            className={styles.recommendButton}
          >
            👍 おすすめ <span className={styles.recommendCount}>{stats.recommends}</span>
          </button>
          
          <a 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.button}
            onClick={handleLinkClick}
          >
            リンクを開く <span className={styles.buttonIcon}>↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}
