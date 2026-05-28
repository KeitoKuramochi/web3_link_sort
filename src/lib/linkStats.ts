"use client";

// 将来的にSupabase等のDBに置き換えやすいようにモジュール化しています

const STORAGE_KEY = "web3ai_link_clicks";

export type LinkStats = {
  [linkId: string]: number;
};

/**
 * 全てのリンクのクリック数を取得します。
 */
export const getLinkClicks = (): LinkStats => {
  if (typeof window === "undefined") {
    return {};
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to parse link clicks from localStorage", error);
    return {};
  }
};

/**
 * 特定のリンクのクリック数を取得します。
 */
export const getLinkClickCount = (linkId: string): number => {
  const stats = getLinkClicks();
  return stats[linkId] || 0;
};

/**
 * 特定のリンクのクリック数を加算して保存します。
 */
export const incrementLinkClick = (linkId: string): number => {
  if (typeof window === "undefined") {
    return 0;
  }
  
  const stats = getLinkClicks();
  const currentCount = stats[linkId] || 0;
  const newCount = currentCount + 1;
  
  stats[linkId] = newCount;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error("Failed to save link clicks to localStorage", error);
  }
  
  return newCount;
};
