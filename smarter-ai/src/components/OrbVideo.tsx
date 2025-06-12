"use client";

import React from "react";

interface OrbVideoProps {
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export const OrbVideo: React.FC<OrbVideoProps> = ({
  width = 180,
  height = 180,
  style = {},
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: "50%",
        overflow: "hidden",
        boxShadow: "0 4px 32px 0 rgba(129,140,248,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        ...style,
      }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "50%",
        }}
      >
        <source src="/orb.webm" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};
