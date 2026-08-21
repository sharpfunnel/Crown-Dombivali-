"use client";

import { LazyMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * The animated sections below use `m` (not `motion`) so Motion's component
 * factory stays out of the main bundle — `domMax` (the feature set covering
 * every animation used on this page: exit, gestures, and the layoutId/layout
 * shared transitions in Gallery/FloorPlans) is fetched as its own chunk after
 * hydration instead of shipping upfront. See https://motion.dev/docs/react-reduce-bundle-size
 */
const loadFeatures = () =>
  import("motion/react").then((mod) => mod.domMax);

export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={loadFeatures}>{children}</LazyMotion>;
}
