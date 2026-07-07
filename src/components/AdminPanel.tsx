"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { useProjects } from "@/lib/projects-store";
import { CATEGORIES } from "@/data/site";
import type { CategoryValue, Contact } from "@/lib/types";
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
} from "@/lib/supabase";

type Tab = "projects" | "laboratory" | "contact";

// General admin panel: sign in with the Supabase admin user, then edit projects,
// the Laboratory line, and contact links. Writes go straight to Supabase; the
// static fallback in src/data/projects.ts is updated via "Export code".
export function AdminPanel() {
  const { t } = useLang();
  const { projects, setProjects, reload } = useProjects();

  const [panelOpen, setPanelOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("projects");
  const [labText, setLabText] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [exportOutput, setExportOutput] = useState("");

  async function openPanel() {
    setPanelOpen(true);
    const [lab, list] = await Promise.all([sbFetchLaboratory(), sbFetchContacts()]);
    setLabText(lab.content || "");
    setContacts(list);
  }

  async function handleToggle() {
    if (await sbIsAuthenticated()) {
      openPanel();
    } else {
      setAuthOpen(true);
    }
  }

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
    else alert("Не удалось удалить проект в Supabase.");
  }

  async function addProject() {
    const created = await sbInsertProject({
      title: t("admin_new_project"),
      meta: "// Category // 2026",
      category: "3d",
      image: null,
    });
    if (!created) {
      alert("Не удалось создать проект в Supabase. Проверьте, что вы авторизованы.");
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
    if (!confirm("Перечитать данные из Supabase? Несохранённые локальные изменения будут потеряны.")) return;
    await reload();
  }

  // ---- Laboratory ----
  async function saveLab() {
    const ok = await sbSaveLaboratory(labText);
    alert(ok ? t("admin_lab_save") : "Ошибка сохранения в Supabase — проверьте, что вы авторизованы.");
  }

  // ---- Contacts ----
  function patchContact(id: number, fields: Partial<Contact>) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...fields } : c)));
    sbUpdateContact(id, fields);
  }

  async function deleteContact(id: number) {
    const ok = await sbDeleteContact(id);
    if (ok) setContacts((prev) => prev.filter((c) => c.id !== id));
    else alert("Не удалось удалить контакт в Supabase.");
  }

  async function addContact() {
    const created = await sbInsertContact({ label: t("admin_new_contact"), url: "" });
    if (!created) {
      alert("Не удалось создать контакт в Supabase. Проверьте, что вы авторизованы.");
      return;
    }
    setContacts((prev) => [...prev, created]);
  }

  return (
    <>
      <button
        className="admin-toggle"
        title="Открыть панель админа"
        onClick={handleToggle}
      >
        ADMIN
      </button>

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
                  <button className="admin-delete" title="Удалить" onClick={() => deleteProject(p.id)}>
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
                    onBlur={(e) => patchProject(p.id, { image: e.target.value || null })}
                  />
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
