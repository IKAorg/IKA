"use client";

import Image from "next/image";
import { UserRound } from "lucide-react";
import { useState } from "react";

type ResilientMediaImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  fallback?: "representative" | "hidden";
};

export function ResilientMediaImage({
  src,
  alt,
  width,
  height,
  className,
  fallback = "hidden",
}: ResilientMediaImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return fallback === "representative" ? (
      <UserRound size={18} aria-hidden="true" />
    ) : null;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
