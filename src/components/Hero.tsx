"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n";

// Hero: looping video background, two parallax geometry circles, centre title.
export function Hero() {
  const { t } = useLang();
  const c1 = useRef<HTMLDivElement>(null);
  const c2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const moveX = (e.clientX - window.innerWidth / 2) / 50;
      const moveY = (e.clientY - window.innerHeight / 2) / 50;
      if (c1.current)
        c1.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
      if (c2.current)
        c2.current.style.transform = `translate(${-moveX * 0.5}px, ${-moveY * 0.5}px)`;
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section className="hero-view" id="top">
      <video
        className="background-gif"
        autoPlay
        muted
        loop
        playsInline
        poster="/images/hero-poster.jpg"
      >
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>

      <div ref={c1} className="geometry-circle circle-1" />
      <div ref={c2} className="geometry-circle circle-2" />
      <div className="geometry-line line-v" />

      <div className="content">
        <h1>{t("portfolio")}</h1>
        <div className="subtitle" />
      </div>
    </section>
  );
}
