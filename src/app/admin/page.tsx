"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectsProvider } from "@/lib/projects-store";
import { Hud } from "@/components/Hud";
import { AdminPanel } from "@/components/AdminPanel";
import { sbIsAuthenticated } from "@/lib/supabase";
import { useLang } from "@/lib/i18n";

export default function AdminPage() {
  const { t } = useLang();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    sbIsAuthenticated().then((authed) => {
      if (authed) setChecking(false);
      else {
        setNeedsAuth(true);
        setChecking(false);
      }
    });
  }, []);

  if (checking) {
    return (
      <ProjectsProvider>
        <Hud />
        <div className="project-missing">
          <p>...</p>
        </div>
      </ProjectsProvider>
    );
  }

  if (needsAuth) {
    return (
      <ProjectsProvider>
        <Hud />
        <div className="project-missing">
          <h2>403</h2>
          <p>
            {t("admin_access_denied")}{" "}
            <a href="/admin" onClick={(e) => { e.preventDefault(); window.location.reload(); }}>
              {t("admin_auth_retry")}
            </a>
          </p>
        </div>
      </ProjectsProvider>
    );
  }

  return (
    <ProjectsProvider>
      <Hud />
      <main>
        <AdminPanel autoOpen />
      </main>
    </ProjectsProvider>
  );
}
