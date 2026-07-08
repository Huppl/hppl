"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { useProjects } from "@/lib/projects-store";
import { CATEGORIES } from "@/data/site";
import type { CategoryValue, Contact } from "@/lib/types";
import { MediaPreview } from "@/components/MediaPreview";
import {
  sbDeleteContact,
  sbDeleteProject,
  sbFetchContacts,
  sbFetchLaboratory,
  sbInsertContact,
  sbInsertProject,
  sbIsAuthenticated,
  sbSaveLaboratory,
  sbSignIn,
  sbUpdateContact,
  sbUpdateProject,
  sbUploadImage,
} from "@/lib/supabase";

type Tab = "projects" | "laboratory" | "contact";

// General admin panel: sign in with the Supabase admin user, then edit projects,
// the Laboratory line, and contact links. Writes go straight to Supabase; the
// static fallback in src/data/projects.ts is updated via "Export code".
export function AdminPanel({ autoOpen = false }: { autoOpen?: boolean }) {
  const { t } = useLang();
  const { projects, setProjects, reload } = useProjects();

  const [panelOpen, setPanelOpen] = useState(autoOpen);
  const [authOpen, setAuthOpen] = useState(!autoOpen);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("projects");
  const [labText, setLabText] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [exportOutput, setExportOutput] = useState("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [galleryUploadingId, setGalleryUploadingId] = useState<number | null>(null);

  async function openPanel() {
    setPanelOpen(true);
    setAuthOpen(false);
    const [lab, list] = await Promise.all([sbFetchLaboratory(), sbFetchContacts()]);
    setLabText(lab.content || "");
    setContacts(list);
  }

  // If autoOpen, sign-in success opens the panel directly
  useEffect(() => {
    if (autoOpen && authOpen) {
      sbIsAuthenticated().then((authed) => {
        if (authed) openPanel();
      });
    }
  }, [autoOpen, authOpen]);

  async function handleSignIn() {
    setAuthBusy(true);
    const { error } = await sbSignIn(password);
    setAuthBusy(false);
    if (!error) {
      setAuthOpen(false);
      setPassword("");
      setAuthError("");
      openPanel();
    } else {
      setAuthError(t("admin_auth_error"));
    }
  }

  // ---- Projects ----
  function patchProject(id: number, fields: Partial<(typeof projects)[number]>) {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...fields } : p)),
    );
    sbUpdateProject(id, fields);
  }

  async function deleteProject(id: number) {
    const ok = await sbDeleteProject(id);
    if (ok) setProjects((prev) => prev.filter((p) => p.id !== id));
    else alert(t("admin_error_delete_project"));
  }

  async function uploadCover(id: number, file: File) {
    setUploadingId(id);
    const url = await sbUploadImage(file, "covers");
    setUploadingId(null);
    if (url) patchProject(id, { image: url });
    else alert(t("admin_upload_error"));
  }

  async function uploadGalleryImage(id: number, file: File) {
    setGalleryUploadingId(id);
    const url = await sbUploadImage(file, "gallery");
    setGalleryUploadingId(null);
    if (url) {
      const current = projects.find((p) => p.id === id);
      const gallery = [...(current?.gallery ?? []), url];
      patchProject(id, { gallery });
    } else {
      alert(t("admin_upload_error"));
    }
  }

  async function removeGalleryImage(id: number, index: number) {
    const current = projects.find((p) => p.id === id);
    if (!current?.gallery) return;
    const gallery = current.gallery.filter((_, i) => i !== index);
    patchProject(id, { gallery });
  }

  async function addProject() {
    const created = await sbInsertProject({
      title: t("admin_new_project"),
      meta: "// Category // 2026",
      category: "3d",
      image: "",
      gallery: [],
      description: "",
    });
    if (!created) {
      alert(t("admin_error_create_project"));
      return;
    }
    setProjects((prev) => [...prev, created]);
  }

  function exportCode() {
    const code = `export const PROJECTS_DEFAULT = ${JSON.stringify(projects, null, 2)};`;
    setExportOutput(code);
    if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
  }

  async function resetProjects() {
    if (!confirm(t("admin_confirm_reload"))) return;
    await reload();
  }

  // ---- Laboratory ----
  async function saveLab() {
    const ok = await sbSaveLaboratory(labText);
    alert(ok ? t("admin_lab_save") : t("admin_error_save"));
  }

  // ---- Contacts ----
  function patchContact(id: number, fields: Partial<Contact>) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...fields } : c)));
    sbUpdateContact(id, fields);
  }

  async function deleteContact(id: number) {
    const ok = await sbDeleteContact(id);
    if (ok) setContacts((prev) => prev.filter((c) => c.id !== id));
    else alert(t("admin_error_delete_contact"));
  }

  async function addContact() {
    const created = await sbInsertContact({ label: t("admin_new_contact"), url: "" });
    if (!created) {
      alert(t("admin_error_create_contact"));
      return;
    }
    setContacts((prev) => [...prev, created]);
  }

  return (
    <>
      {/* Auth modal */}
      <div className={`admin-auth${authOpen ? " is-open" : ""}`}>
        <div className="admin-auth-modal">
          <h3>{t("admin_auth_title")}</h3>
          <p>{t("admin_auth_prompt")}</p>
          <input
            className="admin-password"
            type="password"
            placeholder={t("admin_auth_prompt")}
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

      {/* Backdrop */}
      <div
        className={`admin-backdrop${panelOpen ? " is-open" : ""}`}
        onClick={() => setPanelOpen(false)}
      />

      {/* Panel */}
      <div className={`admin-panel${panelOpen ? " is-open" : ""}`}>
        <div className="admin-panel-header">
          <span>{t("admin_title")}</span>
          <button className="admin-close" onClick={() => setPanelOpen(false)}>
            ×
          </button>
        </div>

        <div className="admin-tabs">
          {(["projects", "laboratory", "contact"] as Tab[]).map((k) => (
            <button
              key={k}
              className={`admin-tab-btn${tab === k ? " active" : ""}`}
              onClick={() => setTab(k)}
            >
              {t(`admin_${k}`)}
            </button>
          ))}
        </div>

        {/* Projects tab */}
        {tab === "projects" && (
          <div className="admin-tab-content active">
            <p
              className="admin-note"
              dangerouslySetInnerHTML={{ __html: t("admin_note") }}
            />
            <div className="admin-list">
              {projects.map((p) => (
                <div key={p.id} className="admin-row">
                  <button className="admin-delete" title={t("admin_delete_title")} onClick={() => deleteProject(p.id)}>
                    ✕
                  </button>
                  <input
                    className="admin-field"
                    placeholder={t("admin_field_title")}
                    defaultValue={p.title}
                    onBlur={(e) => patchProject(p.id, { title: e.target.value })}
                  />
                  <input
                    className="admin-field"
                    placeholder={t("admin_field_desc")}
                    defaultValue={p.meta}
                    onBlur={(e) => patchProject(p.id, { meta: e.target.value })}
                  />
                  <select
                    className="admin-field"
                    defaultValue={p.category}
                    onChange={(e) =>
                      patchProject(p.id, { category: e.target.value as CategoryValue })
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {t(c.i18nKey)}
                      </option>
                    ))}
                  </select>
                  <input
                    className="admin-field"
                    placeholder={t("admin_field_image")}
                    defaultValue={p.image ?? ""}
                    onBlur={(e) => patchProject(p.id, { image: e.target.value || "" })}
                  />
                  <label className="admin-btn admin-upload-label">
                    {uploadingId === p.id ? t("admin_uploading") : t("admin_upload_cover")}
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadCover(p.id, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {(p.gallery?.length ?? 0) > 0 ? (
                    <div className="admin-gallery-section">
                      <span className="admin-sublabel">{t("gallery_title")}</span>
                      <div className="admin-gallery-grid">
                        {p.gallery?.map((img, i) => (
                          <div key={i} className="admin-gallery-item">
                            <MediaPreview
                              src={img}
                              alt={`${p.title} ${i + 1}`}
                              videoClassName="media-preview-video media-preview-admin"
                            />
                            <button
                              className="admin-delete"
                              title={t("admin_remove_image")}
                              onClick={() => removeGalleryImage(p.id, i)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <label className="admin-btn admin-upload-label">
                    {galleryUploadingId === p.id ? t("admin_uploading") : t("admin_upload_gallery")}
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          Array.from(files).forEach((f) => uploadGalleryImage(p.id, f));
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
            <div className="admin-actions">
              <button className="admin-btn" onClick={addProject}>
                {t("admin_add_project")}
              </button>
              <button className="admin-btn" onClick={exportCode}>
                {t("admin_export")}
              </button>
              <button className="admin-btn admin-btn-danger" onClick={resetProjects}>
                {t("admin_reset")}
              </button>
            </div>
            <textarea
              className="admin-export-output"
              readOnly
              value={exportOutput}
              placeholder={t("admin_export_placeholder")}
            />
          </div>
        )}

        {/* Laboratory tab */}
        {tab === "laboratory" && (
          <div className="admin-tab-content active">
            <p className="admin-note">{t("admin_laboratory_note")}</p>
            <textarea
              className="admin-textarea"
              placeholder={t("admin_lab_placeholder")}
              value={labText}
              onChange={(e) => setLabText(e.target.value)}
            />
            <button className="admin-btn" onClick={saveLab}>
              {t("admin_lab_save")}
            </button>
          </div>
        )}

        {/* Contact tab */}
        {tab === "contact" && (
          <div className="admin-tab-content active">
            <p className="admin-note">{t("admin_contact_note")}</p>
            <div className="admin-list">
              {contacts.map((c) => (
                <div key={c.id} className="admin-row">
                  <button className="admin-delete" onClick={() => deleteContact(c.id)}>
                    ✕
                  </button>
                  <input
                    className="admin-field"
                    placeholder={t("admin_contact_name")}
                    defaultValue={c.label}
                    onBlur={(e) => patchContact(c.id, { label: e.target.value })}
                  />
                  <input
                    className="admin-field"
                    placeholder={t("admin_contact_url")}
                    defaultValue={c.url}
                    onBlur={(e) => patchContact(c.id, { url: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <button className="admin-btn" onClick={addContact}>
              {t("admin_contact_add")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
