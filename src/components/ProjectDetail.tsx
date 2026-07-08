"use client";

import { useEffect, useState, useCallback } from "react";
import { useLang } from "@/lib/i18n";
import { loadProjects } from "@/lib/projects-store";
import { CATEGORIES } from "@/data/site";
import { Hud } from "@/components/Hud";
import type { CategoryValue, Project } from "@/lib/types";
import { sbIsAuthenticated, sbSignIn, sbUpdateProject, sbUploadImage } from "@/lib/supabase";

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

  // admin state
  const [panelOpen, setPanelOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
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

  async function handleToggle() {
    if (await sbIsAuthenticated()) setPanelOpen(true);
    else setAuthOpen(true);
  }

  async function handleSignIn() {
    setAuthBusy(true);
    const { error } = await sbSignIn(password);
    setAuthBusy(false);
    if (!error) {
      setAuthOpen(false);
      setPassword("");
      setAuthError("");
      setPanelOpen(true);
    } else {
      setAuthError(t("admin_auth_error"));
    }
  }

  async function save() {
    if (!project) return;
    const ok = await sbUpdateProject(project.id, {
      title: project.title,
      meta: project.meta,
      category: project.category,
      image: project.image,
      gallery: project.gallery ?? [],
      description: project.description,
    });
    alert(ok ? t("project_saved") : t("admin_error_save"));
  }

  async function handleCoverUpload(file: File) {
    if (!project) return;
    setCoverUploading(true);
    const url = await sbUploadImage(file, "covers");
    setCoverUploading(false);
    if (url) patch({ image: url });
    else alert(t("admin_upload_error"));
  }

  async function handleGalleryUpload(files: FileList) {
    if (!project) return;
    setGalleryUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await sbUploadImage(file, "gallery");
      if (url) urls.push(url);
    }
    setGalleryUploading(false);
    if (urls.length === 0) {
      alert(t("admin_upload_error"));
      return;
    }
    patch({ gallery: [...(project.gallery ?? []), ...urls] });
  }

  function removeGalleryImage(index: number) {
    if (!project?.gallery) return;
    patch({ gallery: project.gallery.filter((_, i) => i !== index) });
  }

  function patch(fields: Partial<Project>) {
    setProject((prev) => (prev ? { ...prev, ...fields } : prev));
  }

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
            <img src={project.image} alt={`${project.title} preview`} />
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
                  <img src={img} alt={`${project?.title ?? "Project"} ${i + 1}`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="gallery-scroll">
              {galleryImages.map((img, i) => (
                <div key={i} className="gallery-scroll-item">
                  <img src={img} alt={`${project?.title ?? "Project"} ${i + 1}`} />
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
          <img
            src={galleryImages[lightboxIndex]}
            alt={`${project?.title ?? "Project"} ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
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

      {/* Admin */}
      <button className="admin-toggle" onClick={handleToggle}>
        ADMIN
      </button>

      <div className={`admin-auth${authOpen ? " is-open" : ""}`}>
        <div className="admin-auth-modal">
          <h3>{t("admin_auth_title")}</h3>
          <p>{t("admin_auth_prompt")}</p>
          <input
            className="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
          />
          <button className="admin-btn" disabled={authBusy} onClick={handleSignIn}>
            {t("admin_auth_btn")}
          </button>
          {authError ? <p className="admin-error">{authError}</p> : null}
        </div>
      </div>

      <div
        className={`admin-backdrop${panelOpen ? " is-open" : ""}`}
        onClick={() => setPanelOpen(false)}
      />

      <div className={`admin-panel${panelOpen ? " is-open" : ""}`}>
        <div className="admin-panel-header">
          <span>{t("project_edit")}</span>
          <button className="admin-close" onClick={() => setPanelOpen(false)}>
            ×
          </button>
        </div>
        <p className="admin-note">{t("project_change_data")}</p>
        <div className="admin-list">
          <div className="admin-row">
            <input
              className="admin-field"
              placeholder={t("project_title_placeholder")}
              value={project?.title ?? ""}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </div>
          <div className="admin-row">
            <input
              className="admin-field"
              placeholder={t("project_meta_placeholder")}
              value={project?.meta ?? ""}
              onChange={(e) => patch({ meta: e.target.value })}
            />
          </div>
          <div className="admin-row">
            <select
              className="admin-field"
              value={project?.category ?? "3d"}
              onChange={(e) => patch({ category: e.target.value as CategoryValue })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {t(c.i18nKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-row">
            <input
              className="admin-field"
              placeholder={t("project_image_placeholder")}
              value={project?.image ?? ""}
              onChange={(e) => patch({ image: e.target.value || "" })}
            />
            <label className="admin-btn admin-upload-label">
              {coverUploading ? t("admin_uploading") : t("admin_upload_cover")}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCoverUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="admin-row admin-gallery-section">
            <span className="admin-sublabel">{t("gallery_title")}</span>
            {(project?.gallery ?? []).map((img, i) => (
              <div key={i} className="admin-gallery-item">
                <img src={img} alt="" />
                <button
                  className="admin-delete"
                  title={t("admin_delete_title")}
                  onClick={() => removeGalleryImage(i)}
                >
                  ✕
                </button>
              </div>
            ))}
            <label className="admin-btn admin-upload-label">
              {galleryUploading ? t("admin_uploading") : t("admin_upload_gallery")}
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) handleGalleryUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="admin-row">
            <textarea
              className="admin-textarea"
              placeholder={t("project_desc_placeholder")}
              value={project?.description ?? ""}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </div>
        </div>
        <button className="admin-btn" onClick={save}>
          {t("project_save")}
        </button>
      </div>
    </>
  );
}
