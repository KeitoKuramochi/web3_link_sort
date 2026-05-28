"use client";

import { useState, useEffect } from "react";
import { LinkItem } from "../data/lessons";
import styles from "./LinkCard.module.css";
import { incrementStat, LinkStatData, updateLinkDetail, LinkDetailData } from "../lib/linkStats";

const COOLDOWN_KEY = "web3ai_recommend_cooldown";
const COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3時間

function getCooldowns(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(COOLDOWN_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setCooldown(linkId: string) {
  const cooldowns = getCooldowns();
  cooldowns[linkId] = Date.now();
  localStorage.setItem(COOLDOWN_KEY, JSON.stringify(cooldowns));
}

function getRemainingCooldown(linkId: string): number {
  const cooldowns = getCooldowns();
  const lastPressed = cooldowns[linkId];
  if (!lastPressed) return 0;
  const elapsed = Date.now() - lastPressed;
  return Math.max(0, COOLDOWN_MS - elapsed);
}

function formatCooldown(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}時間${minutes}分後に再度押せます`;
  return `${minutes}分後に再度押せます`;
}

const CLICK_COOLDOWN_KEY = "web3ai_click_cooldown";
const CLICK_COOLDOWN_MS = 3 * 60 * 60 * 1000;

function getClickCooldowns(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(CLICK_COOLDOWN_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setClickCooldown(linkId: string) {
  const cooldowns = getClickCooldowns();
  cooldowns[linkId] = Date.now();
  localStorage.setItem(CLICK_COOLDOWN_KEY, JSON.stringify(cooldowns));
}

function getRemainingClickCooldown(linkId: string): number {
  const cooldowns = getClickCooldowns();
  const last = cooldowns[linkId];
  if (!last) return 0;
  return Math.max(0, CLICK_COOLDOWN_MS - (Date.now() - last));
}

interface LinkCardProps {
  link: LinkItem;
  stats: LinkStatData;
  detailOverride?: LinkDetailData;
  isPopular?: boolean;
  onStatChange?: (id: string, newStats: LinkStatData) => void;
  onDetailChange?: (id: string, newDetail: LinkDetailData) => void;
}

export default function LinkCard({ link, stats, detailOverride, isPopular, onStatChange, onDetailChange }: LinkCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(detailOverride?.title || link.title);
  const [editSummary, setEditSummary] = useState(detailOverride?.summary || link.summary);
  const [isSaving, setIsSaving] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [clickCooldownRemaining, setClickCooldownRemaining] = useState(0);

  const displayTitle = detailOverride?.title || link.title;
  const displaySummary = detailOverride?.summary || link.summary;

  useEffect(() => {
    const update = () => {
      setCooldownRemaining(getRemainingCooldown(link.id));
      setClickCooldownRemaining(getRemainingClickCooldown(link.id));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [link.id]);

  const handleLinkClick = async () => {
    if (clickCooldownRemaining > 0) return;
    setClickCooldown(link.id);
    setClickCooldownRemaining(CLICK_COOLDOWN_MS);
    if (onStatChange) {
      onStatChange(link.id, { ...stats, clicks: stats.clicks + 1 });
    }
    const newStats = await incrementStat(link.id, "click");
    if (onStatChange && newStats) {
      onStatChange(link.id, newStats);
    }
  };

const handleRecommendClick = async () => {
    if (cooldownRemaining > 0) return;
    setCooldown(link.id);
    setCooldownRemaining(COOLDOWN_MS);
    if (onStatChange) {
      onStatChange(link.id, { ...stats, recommends: stats.recommends + 1 });
    }
    const newStats = await incrementStat(link.id, "recommend");
    if (onStatChange && newStats && newStats.recommends > stats.recommends) {
      onStatChange(link.id, newStats);
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    const success = await updateLinkDetail(link.id, editTitle, editSummary);
    if (success && onDetailChange) {
      onDetailChange(link.id, { title: editTitle, summary: editSummary });
    }
    setIsSaving(false);
    setIsEditing(false);
  };

  const isCoolingDown = cooldownRemaining > 0;

  return (
    <div className={`${styles.card} ${link.isCore ? styles.core : ""} ${isPopular ? styles.popular : ""}`}>
      <div className={styles.header}>
        {isEditing ? (
          <input
            className={styles.editInput}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="タイトルを入力"
          />
        ) : (
          <h3 className={styles.title}>{displayTitle}</h3>
        )}
        <div className={styles.sharer}>{link.sharer}</div>
      </div>

      <div className={styles.badges}>
        {isPopular && (
          <span className={`${styles.badge} ${styles.badgePopular}`}>🌟 おすすめ</span>
        )}
        <span className={`${styles.badge} ${styles.badgeCategory}`}>{link.category}</span>
        {link.isDuplicate && (
          <span className={`${styles.badge} ${styles.badgeDuplicate}`}>
            {link.duplicateNote || "重複共有あり"}
          </span>
        )}
      </div>

      {isEditing ? (
        <textarea
          className={styles.editTextarea}
          value={editSummary}
          onChange={(e) => setEditSummary(e.target.value)}
          placeholder="説明文を入力"
          rows={3}
        />
      ) : (
        <p className={styles.summary}>{displaySummary}</p>
      )}

      <div className={styles.context}>
        <strong>授業内での意味：</strong> {link.lessonContext}
      </div>

      {isEditing && (
        <div className={styles.editActions}>
          <button onClick={() => setIsEditing(false)} className={styles.cancelButton} disabled={isSaving}>
            キャンセル
          </button>
          <button onClick={handleSaveEdit} className={styles.saveButton} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存する"}
          </button>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.stats}>
          <span>👀 {stats.clicks}</span>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className={styles.editIconButton} title="タイトルや説明を編集">
              ✏️ 編集
            </button>
          )}
        </div>

        <div className={styles.actions}>
          <div className={styles.recommendWrapper}>
            <button
              onClick={handleRecommendClick}
              className={`${styles.recommendButton} ${isCoolingDown ? styles.recommendCooling : ""}`}
              disabled={isCoolingDown}
              title={isCoolingDown ? formatCooldown(cooldownRemaining) : "おすすめ！"}
            >
              👍 {stats.recommends}
            </button>
            {isCoolingDown && (
              <span className={styles.cooldownLabel}>クールダウン中</span>
            )}
          </div>

          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.button}
            onClick={handleLinkClick}
          >
            開く <span className={styles.buttonIcon}>↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}
