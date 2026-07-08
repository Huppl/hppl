"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

// Fixed HUD overlay: live clock + timezone, nav, language switcher, bio.
export function Hud() {
  const { lang, setLang, t } = useLang();
  const [time, setTime] = useState("--:--:--");
  const [loc, setLoc] = useState("DETECTING...");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("ru-RU", { hour12: false }));
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setLoc((tz.split("/")[1] ?? tz).replace("_", " ").toUpperCase());
      } catch {
        setLoc("UNKNOWN");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ui-layer">
      <div className="ui-row">
        <div className="ui-block" style={{ textTransform: "uppercase" }}>
          LOC // <span className="ui-dim">{loc}</span>
          <br />
          SYS // <span className="ui-dim">{time}</span>{" "}
          <span className="red-dot">●</span>
        </div>
        <div className="ui-block" style={{ textAlign: "right", position: "relative" }}>
          <button
            className="nav-toggle"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Menu"
          >
            ☰
          </button>
          <ul className={`clean-list nav-links${navOpen ? " is-open" : ""}`}>
            <li>
              <a href="/" onClick={() => setNavOpen(false)}>{t("index")}</a>
            </li>
            <li>
              <a href="/#works" onClick={() => setNavOpen(false)}>{t("works")}</a>
            </li>
            <li>
              <a href="/#about" onClick={() => setNavOpen(false)}>{t("laboratory")}</a>
            </li>
            <li>
              <a href="/#contact" onClick={() => setNavOpen(false)}>{t("contact")}</a>
            </li>
            <li>
              <button
                className={`lang-btn${lang === "ru" ? " lang-active" : ""}`}
                onClick={() => setLang("ru")}
              >
                РУ
              </button>
              <button
                className={`lang-btn${lang === "en" ? " lang-active" : ""}`}
                onClick={() => setLang("en")}
              >
                EN
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="ui-row">
        <div className="ui-block ui-dim">
          <span style={{ color: "var(--text)" }}>{t("current_log")}</span>
          <br />
          {t("efir_app")}
          <br />
          {t("silver_smoke")}
          <br />
          {t("garbage_chic")}
        </div>
        <div className="ui-block ui-dim" style={{ textAlign: "right" }}>
          {t("name")}
          <br />
          {t("age")}
          <br />
          {t("status")}
        </div>
      </div>
    </div>
  );
}
