"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { useProjects } from "@/lib/projects-store";
import { CATEGORIES } from "@/data/site";
import { MediaPreview, type NaturalSize } from "@/components/MediaPreview";

const MIN_CARD_WIDTH = 280;

export function Works() {
  const { t } = useLang();
  const router = useRouter();
  const { projects } = useProjects();
  const [filter, setFilter] = useState<string>("all");
  const [barVisible, setBarVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [naturalSizes, setNaturalSizes] = useState<Record<number, NaturalSize>>({});

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setBarVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const handleNaturalSize = useCallback((id: number, size: NaturalSize) => {
    setNaturalSizes((prev) => {
      if (prev[id]?.width === size.width && prev[id]?.height === size.height) return prev;
      return { ...prev, [id]: size };
    });
  }, []);

  const filters = [{ value: "all", i18nKey: "filter_all" }, ...CATEGORIES];

  return (
    <section id="works" ref={sectionRef}>
      <div className={`filter-bar${barVisible ? " is-visible" : ""}`}>
        {filters.map((f) => (
          <button
            key={f.value}
            className={`filter-button${filter === f.value ? " active" : ""}`}
            onClick={() => setFilter(f.value)}
          >
            {t(f.i18nKey)}
          </button>
        ))}
      </div>

      <div className="work-board">
        {projects
          .filter((p) => filter === "all" || p.category === filter)
          .map((p, i) => {
            const ns = naturalSizes[p.id];
            const isSmall = ns && ns.width < MIN_CARD_WIDTH;
            return (
              <div
                key={p.id}
                className={`work-card${isSmall ? " work-card-natural" : ""}`}
                style={isSmall ? { maxWidth: Math.max(ns.width, 200) } : undefined}
                onClick={() => router.push(`/project/${p.id}`)}
              >
                <div className="work-card-image">
                  {p.image ? (
                    <MediaPreview
                      src={p.image}
                      alt={`${p.title || "Project"} preview`}
                      onNaturalSize={(size) => handleNaturalSize(p.id, size)}
                    />
                  ) : null}
                </div>
                <span className="work-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2>{p.title || "Untitled"}</h2>
                <p>{p.meta || ""}</p>
              </div>
            );
          })}
      </div>
    </section>
  );
}
