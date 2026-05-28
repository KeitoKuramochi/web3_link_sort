"use client";

import { useState, useEffect, useMemo } from "react";
import { lessons } from "../data/lessons";
import LinkCard from "../components/LinkCard";
import styles from "./page.module.css";
import { getLinkStats, LinkStats, LinkStatData, getLinkDetails, LinkDetails, LinkDetailData } from "../lib/linkStats";

export default function Home() {
  const [selectedLessonId, setSelectedLessonId] = useState<string>("6");

  const [stats, setStats] = useState<LinkStats>({});
  const [details, setDetails] = useState<LinkDetails>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [coreOnly, setCoreOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"order" | "popular" | "clicks">("popular");

  useEffect(() => {
    const fetchData = async () => {
      const [statsData, detailsData] = await Promise.all([
        getLinkStats(),
        getLinkDetails(),
      ]);
      setStats(statsData);
      setDetails(detailsData);
    };
    fetchData();
  }, []);

  const lesson = lessons.find((l) => l.lessonId === selectedLessonId);

  const categories = useMemo(() => {
    if (!lesson) return [];
    return Array.from(new Set(lesson.links.map((l) => l.category)));
  }, [lesson]);

  // 投稿者一覧
  const sharers = useMemo(() => {
    if (!lesson) return [];
    return Array.from(new Set(lesson.links.map((l) => l.sharer)));
  }, [lesson]);

  const filteredAndSortedLinks = useMemo(() => {
    if (!lesson) return [];
    let result = [...lesson.links];

    // キーワード検索（タイトル・説明・タグ・投稿者）
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (link) =>
          link.title.toLowerCase().includes(q) ||
          link.summary.toLowerCase().includes(q) ||
          link.tags.some((t) => t.toLowerCase().includes(q)) ||
          link.sharer.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((link) => link.category === categoryFilter);
    }

    if (coreOnly) {
      result = result.filter((link) => link.isCore);
    }

    result.sort((a, b) => {
      if (sortBy === "popular") {
        const rA = stats[a.id]?.recommends || 0;
        const rB = stats[b.id]?.recommends || 0;
        if (rA !== rB) return rB - rA;
        const cA = stats[a.id]?.clicks || 0;
        const cB = stats[b.id]?.clicks || 0;
        if (cA !== cB) return cB - cA;
        return a.order - b.order;
      }
      if (sortBy === "clicks") {
        const cA = stats[a.id]?.clicks || 0;
        const cB = stats[b.id]?.clicks || 0;
        if (cA !== cB) return cB - cA;
        return a.order - b.order;
      }
      // order
      return a.order - b.order;
    });

    return result;
  }, [lesson, searchQuery, categoryFilter, coreOnly, sortBy, stats]);

  const topPopularLinks = useMemo(() => {
    if (!lesson) return [];
    return [...lesson.links]
      .sort((a, b) => {
        const rA = stats[a.id]?.recommends || 0;
        const rB = stats[b.id]?.recommends || 0;
        if (rA !== rB) return rB - rA;
        const cA = stats[a.id]?.clicks || 0;
        const cB = stats[b.id]?.clicks || 0;
        if (cA !== cB) return cB - cA;
        if (a.isCore && !b.isCore) return -1;
        if (!a.isCore && b.isCore) return 1;
        return a.order - b.order;
      })
      .slice(0, 3);
  }, [lesson, stats]);

  const handleStatChange = (id: string, newStats: LinkStatData) => {
    setStats((prev) => ({ ...prev, [id]: newStats }));
  };

  const handleDetailChange = (id: string, newDetail: LinkDetailData) => {
    setDetails((prev) => ({ ...prev, [id]: newDetail }));
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Web3AI リンクまとめハブ</h1>
        <p className={styles.description}>
          授業内で共有されたデモ・教材・参考リンクを整理した、見返しやすい「リンクまとめハブ」です。
        </p>
      </header>

      {/* 授業回タブ */}
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

          {/* おすすめTop3 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🌟 みんなのおすすめ (Top 3)</h2>
            <div className={styles.grid}>
              {topPopularLinks.map((link) => (
                <LinkCard
                  key={`popular-${link.id}`}
                  link={link}
                  stats={stats[link.id] || { clicks: 0, recommends: 0 }}
                  detailOverride={details[link.id]}
                  isPopular={true}
                  onStatChange={handleStatChange}
                  onDetailChange={handleDetailChange}
                />
              ))}
            </div>
          </section>

          {/* 検索・フィルタ */}
          <div className={styles.controls}>
            <input
              type="text"
              placeholder="キーワード・投稿者名で検索..."
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
                  {categories.map((cat) => (
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
                  <option value="popular">👍 いいね順</option>
                  <option value="clicks">👀 閲覧数順</option>
                  <option value="order">授業進行順</option>
                </select>
              </div>

              <label className={styles.filterGroup} style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={coreOnly}
                  onChange={(e) => setCoreOnly(e.target.checked)}
                />
                <span className={styles.filterLabel}>課題に役立ちそうなリンクのみ</span>
              </label>
            </div>
          </div>

          {/* リンク一覧 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📚 リンク一覧 ({filteredAndSortedLinks.length}件)</h2>

            {filteredAndSortedLinks.length > 0 ? (
              <div className={styles.grid}>
                {filteredAndSortedLinks.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    stats={stats[link.id] || { clicks: 0, recommends: 0 }}
                    detailOverride={details[link.id]}
                    isPopular={topPopularLinks.some((pop) => pop.id === link.id)}
                    onStatChange={handleStatChange}
                    onDetailChange={handleDetailChange}
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
