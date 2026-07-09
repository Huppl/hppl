"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { sbFetchContacts } from "@/lib/supabase";
import { DEFAULT_CONTACTS } from "@/data/site";
import type { Contact as ContactType } from "@/lib/types";

export function Contact() {
  const { t } = useLang();
  const [contacts, setContacts] = useState<ContactType[]>(DEFAULT_CONTACTS);

  useEffect(() => {
    sbFetchContacts()
      .then((list) => {
        if (list.length) setContacts(list);
      })
      .catch((e) => console.error("Contacts load failed:", e));
  }, []);

  return (
    <section id="contact" className="simple-section">
      <span className="section-index">{t("contact_05")}</span>
      <h2>{t("contact_title")}</h2>
      <p>{t("contact_desc")}</p>
      <div>
        {contacts.map((c) => (
          <a
            key={c.id}
            className="contact-link"
            href={c.url || "#"}
            style={{ display: "block", marginTop: 10 }}
          >
            {c.label || t("contact_fallback")}
          </a>
        ))}
      </div>
    </section>
  );
}
