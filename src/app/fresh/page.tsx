"use client";

import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { useProjects, ProjectsProvider } from "@/lib/projects-store";
import { CATEGORIES } from "@/data/site";
import { MediaPreview } from "@/components/MediaPreview";
import { Hud } from "@/components/Hud";
import { CardErrorBoundary } from "@/components/CardErrorBoundary";
import type { CategoryValue } from "@/lib/types";

function tagLabels(project: { category: CategoryValue; tags?: CategoryValue[] | null }, t: (k: string) => string) {
  const values = project.tags ?? [project.category];
  return values.map((v) => {
    const cat = CATEGORIES.find((c) => c.value === v);
    return cat ? t(cat.i18nKey) : v;
  });
}

function FreshCard({ project, t, onClick }: {
  project: { id?: number | null; title?: string | null; meta?: string | null; category: CategoryValue; tags?: CategoryValue[] | null; image?: string | null };
  t: (k: string) => string;
  onClick: () => void;
}) {
  return (
    <div className="fresh-card" onClick={onClick}>
      <div className="fresh-card-image">
        {project.image ? (
          <MediaPreview
            src={project.image}
            alt={`${project.title || "Project"} preview`}
          />
        ) : null}
      </div>
      <div className="fresh-card-text">
        <div className="fresh-card-tags">
          {tagLabels(project, t).map((label) => (
            <span key={label} className="fresh-tag">{label}</span>
          ))}
        </div>
        <h2 className="fresh-card-title">{project.title || "Untitled"}</h2>
        <p className="fresh-card-meta">{project.meta || ""}</p>
      </div>
    </div>
  );
}

function FreshContent() {
  const { t } = useLang();
  const router = useRouter();
  const { projects } = useProjects();

  const sorted = [...projects].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

  return (
    <>
      <Hud />
      <section className="fresh-page">
        <div className="fresh-header">
          <span className="section-index">{t("fresh_index")}</span>
          <h1>{t("fresh")}</h1>
        </div>
        <div className="fresh-feed">
          {sorted.map((p) => (
            <CardErrorBoundary key={p.id} fallback={<div className="fresh-card fresh-card--error" />}>
              <FreshCard
                project={p}
                t={t}
                onClick={() => router.push(`/project/${p.id}`)}
              />
            </CardErrorBoundary>
          ))}
        </div>
      </section>
    </>
  );
}

export default function FreshPage() {
  return (
    <ProjectsProvider>
      <FreshContent />
    </ProjectsProvider>
  );
}
