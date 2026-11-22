"use client";

import { useState, useEffect } from "react";
import FeedbackFAB from "@/components/FeedbackFAB";

export default function FeedbackFABWrapper() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/feedback/status")
      .then((r) => r.json())
      .then((d) => setVisible(d.enabled === true))
      .catch(() => setVisible(false));
  }, []);

  if (!visible) return null;

  return <FeedbackFAB />;
}