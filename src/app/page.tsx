import { ProjectsProvider } from "@/lib/projects-store";
import { Hud } from "@/components/Hud";
import { Hero } from "@/components/Hero";
import { Works } from "@/components/Works";
import { Laboratory } from "@/components/Laboratory";
import { Contact } from "@/components/Contact";

export default function Home() {
  return (
    <ProjectsProvider>
      <Hud />
      <main>
        <Hero />
        <Works />
        <Laboratory />
        <Contact />
      </main>
    </ProjectsProvider>
  );
}
