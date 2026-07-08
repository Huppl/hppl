"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { sbFetchLaboratory } from "@/lib/supabase";
import { DEFAULT_LABORATORY } from "@/data/site";

export function Laboratory() {
  const { t } = useLang();
  const [content, setContent] = useState<string>(DEFAULT_LABORATORY);

  useEffect(() => {
    sbFetchLaboratory()
      .then((lab) => {
        if (lab.content) setContent(lab.content);
      })
      .catch((e) => console.error("Laboratory load failed:", e));
  }, []);

  return (
    <section id="about" className="simple-section">
      <span className="section-index">{t("lab_04")}</span>
      <h2>{t("laboratory_title")}</h2>
      <p style={{ whiteSpace: "pre-line" }}>{content || t("laboratory_studying")}</p>
    </section>
  );
}
