"use client";

import { useParams } from "next/navigation";
import { ProjectDetail } from "@/components/ProjectDetail";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  return <ProjectDetail id={Number(id)} />;
}
