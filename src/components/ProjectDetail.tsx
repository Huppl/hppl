"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { loadProjects } from "@/lib/projects-store";
import { CATEGORIES } from "@/data/site";
import { Hud } from "@/components/Hud";
import type { CategoryValue, Project } from "@/lib/types";
import { sbIsAuthenticated, sbSignIn, sbUpdateProject, sbUploadImage } from "@/lib/supabase";

function categoryLabel(t: (k: string) => string, value?: string) {
  const c = CATEGORIES.find((x) => x.value === value);
  return c ? t(c.i18nKey) : value || "";
}

// Project detail page + focused single-project admin (mirrors project.html).
export function ProjectDetail({ id }: { id: number }) {
  const { t } = useLang();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false); // upload state

  // admin state
  const [panelOpen, setPanelOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

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
      gallery: project.gallery,
      description: project.description,
    });
    alert(ok ? t("project_saved") : "Ошибка сохранения в Supabase — проверьте, что вы авторизованы.");
  }

  function patch(fields: Partial<Project>) {
    setProject((prev) => (prev ? { ...prev, ...fields } : prev));
  }

  // Gallery admin
  function removeImage(index: number) {
    if (!project || !project.gallery) return;
    const newGallery = [...project.gallery];
    newGallery.splice(index, 1);
    patch({ gallery: newGallery });
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !project) return;
    setIsUploading(true);

    const newGallery = [...(project.gallery || [])];
    for (const file of Array.from(files)) {
        if (newGallery.length >= 30) break;
        const publicUrl = await sbUploadImage(file);
        if (publicUrl) {
            newGallery.push(publicUrl);
        }
    }
    patch({ gallery: newGallery });
    setIsUploading(false);
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
        <div className="project-gallery">
          {(project?.gallery || [project?.image]).map((img, i) => img ? (
             <img key={i} src={img} alt={`${project?.title} ${i}`} />
          ) : null)}
        </div>
      </section>

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
              onChange={(e) => patch({ image: e.target.value || null })}
            />
          </div>
          <div className="admin-row">
            <label>Галерея:</label>
            <div className="admin-gallery-list">
                {project?.gallery?.map((img, i) => (
                    <div key={i}>
                        <img src={img} style={{width: 50, height: 50, objectFit: 'cover'}}/>
                        <button onClick={() => removeImage(i)}>✕</button>
                    </div>
                ))}
            </div>
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
