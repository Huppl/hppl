"use client";

import { useState } from "react";
import { ProjectsProvider } from "@/lib/projects-store";
import { Hud } from "@/components/Hud";
import { Hero } from "@/components/Hero";
import { Works } from "@/components/Works";
import { Laboratory } from "@/components/Laboratory";
import { Contact } from "@/components/Contact";
import { AdminPanel } from "@/components/AdminPanel";

export default function Home() {
  const [adminRequest, setAdminRequest] = useState(false);

  return (
    <ProjectsProvider>
      <Hud />
      <main>
        <Hero />
        <Works />
        <Laboratory />
        <Contact />
      </main>
      <button
        className="admin-toggle"
        onClick={() => setAdminRequest((v) => !v)}
      >
        Admin
      </button>
      <AdminPanel requestOpen={adminRequest} />
    </ProjectsProvider>
  );
}
