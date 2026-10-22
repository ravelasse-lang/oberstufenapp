import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vault/ und Lernzettel/ werden zur Laufzeit per fs gelesen; dynamische Pfade
  // erkennt die Dateiverfolgung nicht, deshalb ausdrücklich in alle Server-Funktionen.
  outputFileTracingIncludes: {
    "/*": ["./Vault/**/*", "./Lernzettel/**/*"],
  },
};

export default nextConfig;
