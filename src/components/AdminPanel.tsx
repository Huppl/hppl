"use client";

import { useEffect, useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLang } from "@/lib/i18n";
import { useProjects } from "@/lib/projects-store";
import { CATEGORIES } from "@/data/site";
import type { CategoryValue, Contact, Project } from "@/lib/types";
import { MediaPreview, isVideoUrl } from "@/components/MediaPreview";
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

type UploadStatus = "pending" | "uploading" | "done" | "error";

interface PendingFile {
  id: string;
  file: File;
  preview: string;
  status: UploadStatus;
  error?: string;
}

function fileToPending(file: File): PendingFile {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    preview: URL.createObjectURL(file),
    status: "pending",
  };
}

function recalcOrder(projects: Project[]): { id: number; order_index: number }[] {
  return projects.map((p, i) => ({ id: p.id, order_index: i }));
}

function SortableProjectRow({
  p,
  t,
  uploadingId,
  onUploadCover,
  onDelete,
  onPatch,
  onRemoveGalleryImage,
  onOpenFilePicker,
}: {
  p: Project;
  t: (k: string) => string;
  uploadingId: number | null;
  onUploadCover: (id: number, file: File) => void;
  onDelete: (id: number) => void;
  onPatch: (id: number, fields: Partial<Project>) => void;
  onRemoveGalleryImage: (id: number, index: number) => void;
  onOpenFilePicker: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: p.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={`admin-row${isDragging ? " dragging" : ""}`}>
      <div className="admin-row-top">
        <button className="admin-drag-handle" title={t("admin_drag")} {...attributes} {...listeners}>
          ☰
        </button>
        <button
          className={`admin-pin-btn${p.is_pinned ? " pinned" : ""}`}
          title={t("admin_pin")}
          onClick={() => onPatch(p.id, { is_pinned: !p.is_pinned })}
        >
          📌
        </button>
        <button className="admin-delete" title={t("admin_delete_title")} onClick={() => onDelete(p.id)}>
          ✕
        </button>
      </div>
      <input
        className="admin-field"
        placeholder={t("admin_field_title")}
        defaultValue={p.title}
        onBlur={(e) => onPatch(p.id, { title: e.target.value })}
      />
      <input
        className="admin-field"
        placeholder={t("admin_field_desc")}
        defaultValue={p.meta}
        onBlur={(e) => onPatch(p.id, { meta: e.target.value })}
      />
      <div className="admin-field admin-tags-select">
        {CATEGORIES.map((c) => {
          const active = (p.tags ?? [p.category]).includes(c.value as CategoryValue);
          return (
            <label
              key={c.value}
              className={`admin-tag-option${active ? " active" : ""}`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => {
                  const current = p.tags ?? [p.category];
                  const next = active
                    ? current.filter((v) => v !== c.value)
                    : [...current, c.value as CategoryValue];
                  onPatch(p.id, { tags: next.length > 0 ? next : [p.category] });
                }}
              />
              {t(c.i18nKey)}
            </label>
          );
        })}
      </div>
      <textarea
        className="admin-textarea"
        placeholder={t("admin_field_description")}
        defaultValue={p.description}
        onBlur={(e) => onPatch(p.id, { description: e.target.value })}
      />
      <input
        className="admin-field"
        placeholder={t("admin_field_image")}
        defaultValue={p.image ?? ""}
        onBlur={(e) => onPatch(p.id, { image: e.target.value || "" })}
      />
      <label className="admin-btn admin-upload-label">
        {uploadingId === p.id ? t("admin_uploading") : t("admin_upload_cover")}
        <input
          type="file"
          accept="image/*,video/mp4,video/webm,image/gif"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUploadCover(p.id, f);
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
                  onClick={() => onRemoveGalleryImage(p.id, i)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <button
        className="admin-btn admin-upload-label"
        onClick={() => onOpenFilePicker(p.id)}
      >
        {t("admin_upload_gallery")}
      </button>
    </div>
  );
}

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

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [pendingProjectId, setPendingProjectId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  async function openPanel() {
    setPanelOpen(true);
    setAuthOpen(false);
    const [lab, list] = await Promise.all([sbFetchLaboratory(), sbFetchContacts()]);
    setLabText(lab.content || "");
    setContacts(list);
  }

  useEffect(() => {
    if (autoOpen && authOpen) {
      sbIsAuthenticated().then((authed) => {
        if (authed) openPanel();
      });
    }
  }, [autoOpen, authOpen]);

  useEffect(() => {
    return () => {
      pendingFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [pendingFiles]);

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
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...fields } : p));
      return sortProjects(next);
    });
    sbUpdateProject(id, fields);
  }

  function sortProjects(list: Project[]): Project[] {
    return [...list].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return (a.order_index ?? 0) - (b.order_index ?? 0);
    });
  }

  async function deleteProject(id: number) {
    const ok = await sbDeleteProject(id);
    if (ok) {
      const remaining = projects.filter((p) => p.id !== id);
      const sorted = sortProjects(remaining);
      setProjects(sorted);
      const orders = recalcOrder(sorted);
      for (const o of orders) {
        sbUpdateProject(o.id, { order_index: o.order_index });
        setProjects((prev) =>
          prev.map((p) => (p.id === o.id ? { ...p, order_index: o.order_index } : p)),
        );
      }
    } else {
      alert(t("admin_error_delete_project"));
    }
  }

  async function uploadCover(id: number, file: File) {
    setUploadingId(id);
    const { url, error } = await sbUploadImage(file, "covers");
    setUploadingId(null);
    if (url) patchProject(id, { image: url });
    else alert(`${t("admin_upload_error")}${error ? `: ${error}` : ""}`);
  }

  // ---- DnD reorder ----
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(projects, oldIndex, newIndex);
    const sorted = sortProjects(reordered);
    setProjects(sorted);

    const orders = recalcOrder(sorted);
    for (const o of orders) {
      sbUpdateProject(o.id, { order_index: o.order_index });
      setProjects((prev) =>
        prev.map((p) => (p.id === o.id ? { ...p, order_index: o.order_index } : p)),
      );
    }
  }

  // ---- Gallery multi-upload ----
  function openFilePicker(projectId: number) {
    setPendingProjectId(projectId);
    setPendingFiles([]);
    fileInputRef.current?.click();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !pendingProjectId) return;
    addPendingFiles(Array.from(files));
    e.target.value = "";
  }

  function addPendingFiles(files: File[]) {
    const newItems = files.map(fileToPending);
    setPendingFiles((prev) => [...prev, ...newItems]);
  }

  function removePendingFile(id: string) {
    setPendingFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && pendingProjectId) {
      addPendingFiles(files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  async function uploadPendingFiles() {
    if (!pendingProjectId || pendingFiles.length === 0) return;

    const project = projects.find((p) => p.id === pendingProjectId);
    const existingGallery = [...(project?.gallery ?? [])];

    setPendingFiles((prev) =>
      prev.map((f) => (f.status === "pending" ? { ...f, status: "uploading" as const } : f)),
    );

    const results = await Promise.allSettled(
      pendingFiles.map(async (pf) => {
        const { url, error } = await sbUploadImage(pf.file, "gallery");
        if (url) {
          setPendingFiles((prev) =>
            prev.map((f) => (f.id === pf.id ? { ...f, status: "done" as const } : f)),
          );
          return url;
        }
        setPendingFiles((prev) =>
          prev.map((f) =>
            f.id === pf.id ? { ...f, status: "error" as const, error } : f,
          ),
        );
        return null;
      }),
    );

    const newUrls = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);

    if (newUrls.length > 0) {
      const gallery = [...existingGallery, ...newUrls];
      patchProject(pendingProjectId, { gallery });
    }

    const errorCount = pendingFiles.length - newUrls.length;
    if (errorCount > 0) {
      alert(`${newUrls.length} uploaded, ${errorCount} failed`);
    }

    setTimeout(() => {
      pendingFiles.forEach((f) => URL.revokeObjectURL(f.preview));
      setPendingFiles([]);
      setPendingProjectId(null);
    }, 1500);
  }

  async function removeGalleryImage(id: number, index: number) {
    const current = projects.find((p) => p.id === id);
    if (!current?.gallery) return;
    const gallery = current.gallery.filter((_, i) => i !== index);
    patchProject(id, { gallery });
  }

  async function addProject() {
    const maxOrder = projects.reduce((max, p) => Math.max(max, p.order_index ?? 0), -1);
    const created = await sbInsertProject({
      title: t("admin_new_project"),
      meta: "// Category // 2026",
      category: "3d",
      tags: ["3d"],
      image: "",
      gallery: [],
      description: "",
      order_index: maxOrder + 1,
      is_pinned: false,
    });
    if (!created) {
      alert(t("admin_error_create_project"));
      return;
    }
    setProjects((prev) => sortProjects([...prev, created]));
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

  const pendingCount = pendingFiles.length;
  const pendingDone = pendingFiles.filter((f) => f.status === "done").length;
  const pendingErrors = pendingFiles.filter((f) => f.status === "error").length;

  return (
    <>
      {/* Hidden file input for multi-select */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,image/gif"
        multiple
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div className="admin-list">
                  {projects.map((p) => (
                    <SortableProjectRow
                      key={p.id}
                      p={p}
                      t={t}
                      uploadingId={uploadingId}
                      onUploadCover={uploadCover}
                      onDelete={deleteProject}
                      onPatch={patchProject}
                      onRemoveGalleryImage={removeGalleryImage}
                      onOpenFilePicker={openFilePicker}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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

      {/* Pending files overlay */}
      {pendingFiles.length > 0 && (
        <div
          className={`admin-pending-overlay${dragOver ? " drag-over" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="admin-pending-header">
            <span>
              {t("admin_pending_files").replace("{n}", String(pendingCount))}
              {pendingDone > 0 && ` — ${pendingDone} ${t("admin_pending_done")}`}
              {pendingErrors > 0 && ` — ${pendingErrors} ${t("admin_pending_error")}`}
            </span>
            <div className="admin-pending-actions">
              <button className="admin-btn" onClick={uploadPendingFiles}>
                {t("admin_pending_upload")}
              </button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={() => {
                  pendingFiles.forEach((f) => URL.revokeObjectURL(f.preview));
                  setPendingFiles([]);
                  setPendingProjectId(null);
                }}
              >
                {t("admin_pending_cancel")}
              </button>
            </div>
          </div>
          <div className="admin-pending-grid">
            {pendingFiles.map((pf) => (
              <div
                key={pf.id}
                className={`admin-pending-item status-${pf.status}`}
              >
                {isVideoUrl(pf.file.name) ? (
                  <video src={pf.preview} muted loop playsInline />
                ) : (
                  <img src={pf.preview} alt={pf.file.name} />
                )}
                <span className="admin-pending-name">{pf.file.name}</span>
                {pf.status === "error" && (
                  <span className="admin-pending-error-msg">{pf.error}</span>
                )}
                {pf.status === "pending" && (
                  <button
                    className="admin-delete"
                    title={t("admin_remove_image")}
                    onClick={() => removePendingFile(pf.id)}
                  >
                    ✕
                  </button>
                )}
                {pf.status === "uploading" && (
                  <span className="admin-pending-spinner" />
                )}
              </div>
            ))}
          </div>
          <div
            className="admin-pending-dropzone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {t("admin_pending_dropzone")}
          </div>
        </div>
      )}
    </>
  );
}
