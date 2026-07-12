"use client";

import { type ReactNode } from "react";

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi)$/i;
const GIF_EXTENSION = /\.gif$/i;

export function isVideoUrl(url: string): boolean {
  return VIDEO_EXTENSIONS.test(url.split("?")[0]);
}

export function isGifUrl(url: string): boolean {
  return GIF_EXTENSION.test(url.split("?")[0]);
}

export function isMediaUrl(url: string): boolean {
  return isVideoUrl(url) || isGifUrl(url);
}

export interface NaturalSize {
  width: number;
  height: number;
}

interface MediaPreviewProps {
  src: string | null;
  alt: string;
  className?: string;
  videoClassName?: string;
  style?: React.CSSProperties;
  loop?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  playsInline?: boolean;
  preload?: "auto" | "metadata" | "none";
  loading?: "lazy" | "eager";
  onNaturalSize?: (size: NaturalSize) => void;
}

export function MediaPreview({
  src,
  alt,
  className,
  videoClassName,
  style,
  loop = true,
  muted = true,
  autoPlay = true,
  playsInline = true,
  preload = "metadata",
  loading = "lazy",
  onNaturalSize,
}: MediaPreviewProps): ReactNode {
  if (!src) return null;

  if (isVideoUrl(src)) {
    return (
      <video
        className={videoClassName ?? className}
        style={style}
        src={src}
        loop={loop}
        muted={muted}
        autoPlay={autoPlay}
        playsInline={playsInline}
        preload={preload}
        controls={false}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          onNaturalSize?.({ width: v.videoWidth, height: v.videoHeight });
        }}
      />
    );
  }

  return (
    <img
      className={className}
      style={style}
      src={src}
      alt={alt}
      loading={loading}
      onLoad={(e) => {
        const img = e.currentTarget;
        onNaturalSize?.({ width: img.naturalWidth, height: img.naturalHeight });
      }}
    />
  );
}
