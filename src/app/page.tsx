"use client";

import { useState, useEffect, useMemo } from "react";
import { lessons } from "../data/lessons";
import LinkCard from "../components/LinkCard";
import styles from "./page.module.css";
import { getLinkStats, LinkStats, LinkStatData } from "../lib/linkStats";

export default function Home() {
  // 選択中の授業回 (デフォルトは第6回)
  const [selectedLessonId, setSelectedLessonId] = useState<string>("6");
  
  const [stats, setStats] = useState<LinkStats>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [coreOnly, setCoreOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"order" | "popular" | "category">("popular");
  
  // マウント時・授業回変更時に統計データを取得
  useEffect(() => {
    const fetchStats = async () => {
      const data = await getLinkStats();
      setStats(data);
    };
    fetchStats();
  }, []);

  const lesson = lessons.find((l) => l.lessonId === selectedLessonId);

  // 利用可能なカテゴリの抽出
  const categories = useMemo(() => {
    if (!lesson) return [];
    return Array.from(new Set(lesson.links.map((link) => link.category)));
  }, [lesson]);

  // フィルタリングと並び替え
  const filteredAndSortedLinks = useMemo(() => {
    if (!lesson) return [];
    let result = [...lesson.links];

    // 検索フィルタ
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (link) =>
          link.title.toLowerCase().includes(q) ||
          link.summary.toLowerCase().includes(q) ||
          link.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // カテゴリフィルタ
    if (categoryFilter !== "all") {
      result = result.filter((link) => link.category === categoryFilter);
    }

    // 重要リンクフィルタ
    if (coreOnly) {
      result = result.filter((link) => link.isCore);
    }

    // 並び替え
    result.sort((a, b) => {
      if (sortBy === "popular") {
        const recommendsA = stats[a.id]?.recommends || 0;
        const recommendsB = stats[b.id]?.recommends || 0;
        if (recommendsA !== recommendsB) {
          return recommendsB - recommendsA; // おすすめ数降順
        }
        const clicksA = stats[a.id]?.clicks || 0;
        const clicksB = stats[b.id]?.clicks || 0;
        if (clicksA !== clicksB) {
          return clicksB - clicksA; // クリック数降順
        }
        return a.order - b.order;
      }
      if (sortBy === "category") {
        const catCompare = a.category.localeCompare(b.category);
        if (catCompare !== 0) return catCompare;
        return a.order - b.order;
      }
      // default: order
      return a.order - b.order;
    });

    return result;
  }, [lesson, searchQuery, categoryFilter, coreOnly, sortBy, stats]);

  // 人気上位3件を抽出 (おすすめ数優先、次にクリック数)
  const topPopularLinks = useMemo(() => {
    if (!lesson) return [];
    return [...lesson.links]
      .sort((a, b) => {
        const recommendsA = stats[a.id]?.recommends || 0;
        const recommendsB = stats[b.id]?.recommends || 0;
        if (recommendsA !== recommendsB) return recommendsB - recommendsA;
        
        const clicksA = stats[a.id]?.clicks || 0;
        const clicksB = stats[b.id]?.clicks || 0;
        if (clicksA !== clicksB) return clicksB - clicksA;
        
        // 同じ場合はisCoreを優先
        if (a.isCore && !b.isCore) return -1;
        if (!a.isCore && b.isCore) return 1;
        return a.order - b.order;
      })
      .slice(0, 3);
  }, [lesson, stats]);

  const handleStatChange = (id: string, newStats: LinkStatData) => {
    setStats(prev => ({
      ...prev,
      [id]: newStats
    }));
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Web3AI リンクまとめハブ</h1>
        <p className={styles.description}>
          授業内で共有されたデモ・教材・参考リンクを整理し、
          各授業回ごとに見返しやすい「リンクまとめハブ」です。
        </p>
      </header>

      {/* 授業回選択タブ */}
      <div className={styles.tabs}>
        {lessons.map((l) => (
          <button
            key={l.lessonId}
            className={`${styles.tab} ${selectedLessonId === l.lessonId ? styles.activeTab : ""}`}
            onClick={() => {
              setSelectedLessonId(l.lessonId);
              setSearchQuery("");
              setCategoryFilter("all");
            }}
          >
            第{l.lessonId}回
          </button>
        ))}
      </div>

      {lesson && (
        <div className={styles.lessonContainer}>
          <div className={styles.lessonHeader}>
            <h2>{lesson.title}</h2>
            <p>{lesson.description}</p>
          </div>

          {/* 人気リンクエリア */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🔥 おすすめリンク (Top 3)</h2>
            <div className={styles.grid}>
              {topPopularLinks.map((link) => (
                <LinkCard 
                  key={`popular-${link.id}`} 
                  link={link} 
                  stats={stats[link.id] || { clicks: 0, recommends: 0 }}
                  isPopular={true}
                  onStatChange={handleStatChange}
                />
              ))}
            </div>
          </section>

          {/* コントロールパネル */}
          <div className={styles.controls}>
            <input
              type="text"
              placeholder="キーワードで検索 (タイトル、説明、タグ...)"
              className={styles.searchBox}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className={styles.filters}>
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>カテゴリ:</span>
                <select 
                  className={styles.select}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">すべて</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>並び替え:</span>
                <select 
                  className={styles.select}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="popular">おすすめ順</option>
                  <option value="order">授業進行順</option>
                  <option value="category">カテゴリ順</option>
                </select>
              </div>

              <label className={styles.filterGroup} style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={coreOnly}
                  onChange={(e) => setCoreOnly(e.target.checked)}
                />
                <span className={styles.filterLabel}>授業に関わるリンクのみ</span>
              </label>
            </div>
          </div>

          {/* すべてのリンク一覧 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📚 リンク一覧 ({filteredAndSortedLinks.length}件)</h2>
            
            {filteredAndSortedLinks.length > 0 ? (
              <div className={styles.grid}>
                {filteredAndSortedLinks.map((link) => (
                  <LinkCard 
                    key={link.id} 
                    link={link} 
                    stats={stats[link.id] || { clicks: 0, recommends: 0 }}
                    isPopular={topPopularLinks.some(pop => pop.id === link.id)}
                    onStatChange={handleStatChange}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                条件に一致するリンクが見つかりませんでした。
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
