"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { sbFetchLaboratory } from "@/lib/supabase";
import { DEFAULT_LABORATORY } from "@/data/site";

function renderParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((para, i) => <p key={i}>{para}</p>);
}

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
      <div className="text-paragraphs">
        {content ? renderParagraphs(content) : <p>{t("laboratory_studying")}</p>}
      </div>
    </section>
  );
}
