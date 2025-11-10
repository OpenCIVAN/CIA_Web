// src/components/Icon.jsx
import React from "react";

export function Icon({ name, size = 24, color = "currentColor", ...props }) {
  const LucideIcon = getIcon(name);

  if (!LucideIcon) return null;

  return <LucideIcon size={size} color={color} {...props} />;
}
