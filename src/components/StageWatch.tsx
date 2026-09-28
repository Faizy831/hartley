"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

/** Puts a product on stage when a page mounts (home: the hero watch; product page: itself). */
export function StageWatch({ id }: { id: string }) {
  const setActiveWatch = useStore((s) => s.setActiveWatch);
  useEffect(() => {
    setActiveWatch(id);
  }, [id, setActiveWatch]);
  return null;
}
