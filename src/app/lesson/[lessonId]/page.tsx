"use client";

import { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { lessons, LinkItem } from "../../../data/lessons";
import LinkCard from "../../../components/LinkCard";
import styles from "./lesson.module.css";
import { getLinkClicks } from "../../../lib/linkStats";

export default function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const resolvedParams = use(params);
  const lesson = lessons.find((l) => l.lessonId === resolvedParams.lessonId);
  
  const [clicks, setClicks] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [coreOnly, setCoreOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"order" | "popular" | "category">("order");
  
  // マウント時にクリック数を取得
  useEffect(() => {
    const fetchClicks = async () => {
      const stats = await getLinkClicks();
      setClicks(stats);
    };
    fetchClicks();
  }, []);

  if (!lesson) {
    return (
      <div className={styles.container}>
        <div className={styles.noResults}>指定された授業回が見つかりません。</div>
        <Link href="/" className={styles.backLink}>← トップページに戻る</Link>
      </div>
    );
  }

  // 利用可能なカテゴリの抽出
  const categories = Array.from(new Set(lesson.links.map((link) => link.category)));

  // フィルタリングと並び替え
  const filteredAndSortedLinks = useMemo(() => {
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
        const clicksA = clicks[a.id] || 0;
        const clicksB = clicks[b.id] || 0;
        if (clicksA !== clicksB) {
          return clicksB - clicksA; // 降順
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
  }, [lesson.links, searchQuery, categoryFilter, coreOnly, sortBy, clicks]);

  // 人気上位3件を抽出
  const topPopularLinks = useMemo(() => {
    return [...lesson.links]
      .sort((a, b) => {
        const clicksA = clicks[a.id] || 0;
        const clicksB = clicks[b.id] || 0;
        if (clicksA !== clicksB) return clicksB - clicksA;
        
        // クリック数が同じ場合はisCoreを優先し、その後orderでソート
        if (a.isCore && !b.isCore) return -1;
        if (!a.isCore && b.isCore) return 1;
        return a.order - b.order;
      })
      .slice(0, 3);
  }, [lesson.links, clicks]);

  const handleLinkClick = (id: string, newCount: number) => {
    setClicks(prev => ({
      ...prev,
      [id]: newCount
    }));
  };

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        ← トップページに戻る
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>{lesson.title}</h1>
        <p className={styles.description}>{lesson.description}</p>
      </header>

      {/* 人気リンクエリア */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🔥 よく見られているリンク</h2>
        <div className={styles.grid}>
          {topPopularLinks.map((link) => (
            <LinkCard 
              key={`popular-${link.id}`} 
              link={link} 
              clickCount={clicks[link.id] || 0}
              isPopular={true}
              onLinkClick={handleLinkClick}
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
              <option value="order">授業進行順</option>
              <option value="popular">人気順</option>
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
            <span className={styles.filterLabel}>授業進行に関わるリンクのみ</span>
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
                clickCount={clicks[link.id] || 0}
                isPopular={topPopularLinks.some(pop => pop.id === link.id)}
                onLinkClick={handleLinkClick}
              />
            ))}
          </div>
        ) : (
          <div className={styles.noResults}>
            条件に一致するリンクが見つかりませんでした。検索条件を変更してみてください。
          </div>
        )}
      </section>
    </div>
  );
}
