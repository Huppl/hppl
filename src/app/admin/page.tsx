"use client";

import { useEffect, useState } from "react";
import { ProjectsProvider } from "@/lib/projects-store";
import { Hud } from "@/components/Hud";
import { AdminPanel } from "@/components/AdminPanel";
import { sbIsAuthenticated } from "@/lib/supabase";

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    sbIsAuthenticated().then((authed) => {
      setAuthenticated(authed);
      setChecking(false);
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

  return (
    <ProjectsProvider>
      <Hud />
      <main>
        <AdminPanel autoOpen={authenticated} />
      </main>
    </ProjectsProvider>
  );
}
