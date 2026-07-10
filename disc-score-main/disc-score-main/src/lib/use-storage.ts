import { useEffect, useState } from "react";
import { getCourses, getDiscs, getRounds } from "./storage";
import type { Course, Disc, Round } from "./types";

function useSubscribed<T>(read: () => T): T {
  const [state, setState] = useState<T>(() => read());
  useEffect(() => {
    setState(read());
    const on = () => setState(read());
    window.addEventListener("dgl:change", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("dgl:change", on);
      window.removeEventListener("storage", on);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

export const useCourses = (): Course[] => useSubscribed(getCourses);
export const useDiscs = (): Disc[] => useSubscribed(getDiscs);
export const useRounds = (): Round[] => useSubscribed(getRounds);
