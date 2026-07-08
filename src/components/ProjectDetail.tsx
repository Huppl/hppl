"use client";

import { useEffect, useState, useCallback } from "react";
import { useLang } from "@/lib/i18n";
import { loadProjects } from "@/lib/projects-store";
import { CATEGORIES } from "@/data/site";
import { Hud } from "@/components/Hud";
import type { Project } from "@/lib/types";
import { MediaPreview, isVideoUrl } from "@/components/MediaPreview";

type ViewMode = "grid" | "scroll";

function categoryLabel(t: (k: string) => string, value?: string) {
  const c = CATEGORIES.find((x) => x.value === value);
  return c ? t(c.i18nKey) : value || "";
}

// Project detail page + focused single-project admin (mirrors project.html).
export function ProjectDetail({ id }: { id: number }) {
  const { t } = useLang();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const galleryImages: string[] = [
    ...(project?.image ? [project.image] : []),
    ...(project?.gallery ?? []),
  ];

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const nextImage = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i + 1) % galleryImages.length)),
    [galleryImages.length],
  );
  const prevImage = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i - 1 + galleryImages.length) % galleryImages.length)),
    [galleryImages.length],
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxIndex, closeLightbox, nextImage, prevImage]);

  useEffect(() => {
    loadProjects()
      .then((list) => setProject(list.find((p) => p.id === id) ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  if (!loading && !project) {
    return (
      <>
        <Hud />
        <div className="project-missing">
          <h2>{t("project_not_found")}</h2>
          <p>
            {t("project_not_found_desc")}{" "}
            <a href="/">{t("project_missing_link")}</a>
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Hud />
      <section className="hero-view project-page" id="top">
        <div className="project-page-header">
          <div className="project-back">
            <a href="/">{t("back_to_portfolio")}</a>
          </div>
          <div className="project-summary">
            <span className="section-index">
              {categoryLabel(t, project?.category) || "PROJECT"}
            </span>
            <h1>{project?.title || t("project_title")}</h1>
            <p className="project-meta">{project?.meta || ""}</p>
            <p className="project-description">{project?.description || ""}</p>
          </div>
        </div>
        <div className="project-hero-image">
          {project?.image ? (
            <MediaPreview
              src={project.image}
              alt={`${project.title} preview`}
              videoClassName="media-preview-video media-preview-hero"
            />
          ) : null}
        </div>
      </section>

      {galleryImages.length > 0 ? (
        <section className="project-gallery-section">
          <div className="gallery-mode-toggle">
            <button
              className={`gallery-mode-btn${viewMode === "grid" ? " active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              {t("gallery_grid")}
            </button>
            <button
              className={`gallery-mode-btn${viewMode === "scroll" ? " active" : ""}`}
              onClick={() => setViewMode("scroll")}
            >
              {t("gallery_scroll")}
            </button>
          </div>

          {viewMode === "grid" ? (
            <div className="gallery-grid-color">
              {galleryImages.map((img, i) => (
                <div
                  key={i}
                  className="gallery-thumb-color"
                  onClick={() => setLightboxIndex(i)}
                >
                  <MediaPreview
                    src={img}
                    alt={`${project?.title ?? "Project"} ${i + 1}`}
                    videoClassName="media-preview-video media-preview-thumb"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="gallery-scroll">
              {galleryImages.map((img, i) => (
                <div key={i} className="gallery-scroll-item">
                  <MediaPreview
                    src={img}
                    alt={`${project?.title ?? "Project"} ${i + 1}`}
                    videoClassName="media-preview-video media-preview-scroll"
                    style={{ objectFit: "contain" }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {lightboxIndex !== null && galleryImages[lightboxIndex] ? (
        <div className="lightbox" onClick={closeLightbox}>
          <button
            className="lightbox-arrow lightbox-prev"
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
          >
            ‹
          </button>
          {isVideoUrl(galleryImages[lightboxIndex]) ? (
            <video
              className="lightbox-video"
              src={galleryImages[lightboxIndex]}
              onClick={(e) => e.stopPropagation()}
              controls
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={galleryImages[lightboxIndex]}
              alt={`${project?.title ?? "Project"} ${lightboxIndex + 1}`}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <button
            className="lightbox-arrow lightbox-next"
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
          >
            ›
          </button>
          <span className="lightbox-counter">
            {lightboxIndex + 1} / {galleryImages.length}
          </span>
          <button
            className="lightbox-close"
            onClick={closeLightbox}
          >
            ×
          </button>
        </div>
      ) : null}

      <section className="simple-section project-details-panel">
        <span className="section-index">{t("project_details")}</span>
        <p>{t("project_notice")}</p>
      </section>
    </>
  );
}
