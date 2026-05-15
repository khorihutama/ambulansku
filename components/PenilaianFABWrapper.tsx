"use client";

import { useState, useEffect } from "react";
import PenilaianFAB from "@/components/PenilaianFAB";

export default function PenilaianFABWrapper() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/penilaian/status")
      .then((r) => r.json())
      .then((d) => setVisible(d.enabled === true))
      .catch(() => setVisible(false));
  }, []);

  if (!visible) return null;

  return <PenilaianFAB />;
}