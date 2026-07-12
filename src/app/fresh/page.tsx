"use client";

import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { useProjects, ProjectsProvider } from "@/lib/projects-store";
import { MediaPreview } from "@/components/MediaPreview";
import { Hud } from "@/components/Hud";
import { CardErrorBoundary } from "@/components/CardErrorBoundary";
import type { Project, GalleryItem } from "@/lib/types";

interface FeedItem {
  url: string;
  uploadedAt: string;
  projectId: number;
  projectTitle: string;
}

function flattenGallery(projects: Project[]): FeedItem[] {
  const items: FeedItem[] = [];
  for (const p of projects) {
    if (!p.gallery?.length) continue;
    for (const g of p.gallery) {
      if (!g.url || !g.url.startsWith("http")) continue;
      items.push({
        url: g.url,
        uploadedAt: g.uploadedAt,
        projectId: p.id,
        projectTitle: p.title,
      });
    }
  }
  return items.sort(
    (a, b) =>
      new Date(b.uploadedAt || "0").getTime() -
      new Date(a.uploadedAt || "0").getTime(),
  );
}

function formatDate(iso: string, t: (k: string) => string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function FreshCard({
  item,
  t,
  onClick,
}: {
  item: FeedItem;
  t: (k: string) => string;
  onClick: () => void;
}) {
  return (
    <div className="fresh-card" onClick={onClick}>
      <div className="fresh-card-image">
        <MediaPreview
          src={item.url}
          alt={`${item.projectTitle} preview`}
          loading="eager"
        />
      </div>
      <div className="fresh-card-text">
        <h2 className="fresh-card-title">{item.projectTitle}</h2>
        {item.uploadedAt && (
          <p className="fresh-card-meta">{formatDate(item.uploadedAt, t)}</p>
        )}
      </div>
    </div>
  );
}

function FreshContent() {
  const { t } = useLang();
  const router = useRouter();
  const { projects, loaded } = useProjects();

  const feed = flattenGallery(projects);

  return (
    <>
      <Hud />
      <section className="fresh-page">
        <div className="fresh-header">
          <span className="section-index">{t("fresh_index")}</span>
          <h1>{t("fresh")}</h1>
        </div>
        <div className="fresh-feed">
          {feed.map((item, i) => (
            <CardErrorBoundary
              key={`${item.projectId}-${i}`}
              fallback={<div className="fresh-card fresh-card--error" />}
            >
              <FreshCard
                item={item}
                t={t}
                onClick={() => router.push(`/project/${item.projectId}`)}
              />
            </CardErrorBoundary>
          ))}
          {loaded && feed.length === 0 && (
            <p className="fresh-empty">{t("fresh_empty")}</p>
          )}
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
