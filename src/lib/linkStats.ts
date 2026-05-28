import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const isSupabaseConfigured = supabaseUrl !== "" && supabaseKey !== "";

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;
const STORAGE_KEY = "web3ai_link_stats"; // changed key for local storage to avoid conflict

export type LinkStatData = {
  clicks: number;
  recommends: number;
};

export type LinkStats = {
  [linkId: string]: LinkStatData;
};

export type LinkDetailData = {
  title: string;
  summary: string;
};

export type LinkDetails = {
  [linkId: string]: LinkDetailData;
};

/**
 * 全てのリンクの統計を取得します。
 */
export const getLinkStats = async (): Promise<LinkStats> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("link_clicks")
        .select("link_id, click_count, recommend_count");

      if (error) throw error;
      
      const stats: LinkStats = {};
      data?.forEach((row: any) => {
        stats[row.link_id] = {
          clicks: row.click_count || 0,
          recommends: row.recommend_count || 0
        };
      });
      return stats;
    } catch (error) {
      console.error("Supabaseからのデータ取得に失敗しました", error);
    }
  }
  
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }
  return {};
};

/**
 * 全てのリンクのタイトル・説明の変更（オーバーライド）を取得します。
 */
export const getLinkDetails = async (): Promise<LinkDetails> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("link_details")
        .select("link_id, title, summary");

      if (error) throw error;
      
      const details: LinkDetails = {};
      data?.forEach((row: any) => {
        details[row.link_id] = {
          title: row.title,
          summary: row.summary
        };
      });
      return details;
    } catch (error) {
      console.error("Supabaseからの詳細取得に失敗しました", error);
    }
  }
  return {};
};

/**
 * 特定のリンクの統計を加算して保存します。
 */
export const incrementStat = async (linkId: string, type: "click" | "recommend"): Promise<LinkStatData> => {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. まず現在の値を取得
      const { data: currentData, error: selectError } = await supabase
        .from("link_clicks")
        .select("click_count, recommend_count")
        .eq("link_id", linkId)
        .single();
        
      const currentClicks = (currentData?.click_count) || 0;
      const currentRecommends = (currentData?.recommend_count) || 0;
      
      const newClicks = type === "click" ? currentClicks + 1 : currentClicks;
      const newRecommends = type === "recommend" ? currentRecommends + 1 : currentRecommends;
      
      // 2. 新しい値をUpsert
      const { error: upsertError } = await supabase
        .from("link_clicks")
        .upsert({ 
          link_id: linkId, 
          click_count: newClicks,
          recommend_count: newRecommends
        }, { onConflict: "link_id" });
        
      if (upsertError) throw upsertError;
      
      return { clicks: newClicks, recommends: newRecommends };
    } catch (error) {
      console.error("Supabaseへのデータ保存に失敗しました", error);
    }
  }

  // フォールバック
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const stats: LinkStats = data ? JSON.parse(data) : {};
      
      const current = stats[linkId] || { clicks: 0, recommends: 0 };
      const newStat = {
        clicks: type === "click" ? current.clicks + 1 : current.clicks,
        recommends: type === "recommend" ? current.recommends + 1 : current.recommends,
      };
      
      stats[linkId] = newStat;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
      
      return newStat;
    } catch (error) {
      console.error("Failed to save to localStorage", error);
    }
  }
  
  return { clicks: 0, recommends: 0 };
};

/**
 * リンクのタイトルと説明を更新します。
 */
export const updateLinkDetail = async (linkId: string, title: string, summary: string): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from("link_details")
        .upsert({ 
          link_id: linkId, 
          title,
          summary
        }, { onConflict: "link_id" });
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Supabaseへの詳細保存に失敗しました", error);
      return false;
    }
  }
  return false;
};
