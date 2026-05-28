import { createClient } from "@supabase/supabase-js";

// Supabaseクライアントの初期化
// 環境変数が設定されていない場合は、フォールバックとして localStorage を使用するための判定を入れます
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const isSupabaseConfigured = supabaseUrl !== "" && supabaseKey !== "";

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;
const STORAGE_KEY = "web3ai_link_clicks";

export type LinkStats = {
  [linkId: string]: number;
};

/**
 * 全てのリンクのクリック数を取得します。
 */
export const getLinkClicks = async (): Promise<LinkStats> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("link_clicks")
        .select("link_id, click_count");

      if (error) throw error;
      
      const stats: LinkStats = {};
      data?.forEach((row: any) => {
        stats[row.link_id] = row.click_count;
      });
      return stats;
    } catch (error) {
      console.error("Supabaseからのデータ取得に失敗しました", error);
      // エラー時はローカルストレージの処理にフォールバックさせることも可能
    }
  }
  
  // Supabase未設定 または エラー時のフォールバック (localStorage)
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Failed to parse link clicks from localStorage", error);
    }
  }
  return {};
};

/**
 * 特定のリンクのクリック数を加算して保存します。
 */
export const incrementLinkClick = async (linkId: string): Promise<number> => {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. まず現在の値を取得
      const { data: currentData, error: selectError } = await supabase
        .from("link_clicks")
        .select("click_count")
        .eq("link_id", linkId)
        .single();
        
      const currentCount = (currentData?.click_count) || 0;
      const newCount = currentCount + 1;
      
      // 2. 新しい値をUpsert (無ければ作成、あれば更新)
      const { error: upsertError } = await supabase
        .from("link_clicks")
        .upsert({ link_id: linkId, click_count: newCount }, { onConflict: "link_id" });
        
      if (upsertError) throw upsertError;
      
      return newCount;
    } catch (error) {
      console.error("Supabaseへのデータ保存に失敗しました", error);
    }
  }

  // Supabase未設定 または エラー時のフォールバック (localStorage)
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const stats = data ? JSON.parse(data) : {};
      
      const currentCount = stats[linkId] || 0;
      const newCount = currentCount + 1;
      
      stats[linkId] = newCount;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
      
      return newCount;
    } catch (error) {
      console.error("Failed to save link clicks to localStorage", error);
    }
  }
  
  return 0;
};
