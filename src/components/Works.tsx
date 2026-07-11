"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { useProjects } from "@/lib/projects-store";
import { CATEGORIES } from "@/data/site";
import { MediaPreview } from "@/components/MediaPreview";
import type { CategoryValue } from "@/lib/types";

export function Works() {
  const { t } = useLang();
  const router = useRouter();
  const { projects } = useProjects();
  const [filter, setFilter] = useState<string>("all");
  const [barVisible, setBarVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
          .filter((p) => filter === "all" || (p.tags ?? [p.category]).includes(filter as CategoryValue))
          .map((p, i) => (
            <div
              key={p.id}
              className="work-card"
              onClick={() => router.push(`/project/${p.id}`)}
            >
              {p.is_pinned && (
                <span className="work-pin-badge" title={t("pinned")}>
                  📌
                </span>
              )}
              <div className="work-card-image">
                {p.image ? (
                  <MediaPreview
                    src={p.image}
                    alt={`${p.title || "Project"} preview`}
                  />
                ) : null}
              </div>
              <span className="work-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2>{p.title || "Untitled"}</h2>
              <p>{p.meta || ""}</p>
            </div>
          ))}
      </div>
    </section>
  );
}
