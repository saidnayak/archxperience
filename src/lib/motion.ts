import type { Variants, Transition } from "framer-motion";

/**
 * Standard subtle, architectural transitions
 */
export const transitions: Record<string, Transition> = {
  instant: { duration: 0 },
  quick: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
  smooth: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  editorial: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  springy: { type: "spring", stiffness: 380, damping: 30 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.smooth,
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.quick,
  },
};

export const slidePanelLeft: Variants = {
  hidden: { x: "-100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: transitions.smooth,
  },
  exit: {
    x: "-100%",
    opacity: 0,
    transition: transitions.quick,
  },
};

export const slidePanelRight: Variants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: transitions.smooth,
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: transitions.quick,
  },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.editorial,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: transitions.quick,
  },
};

/**
 * Slide Transition Variants driven by slide.transitionType
 * Supported: fade, slide-left, slide-right, zoom, none
 */
export const getSlideTransitionVariants = (
  transitionType?: "fade" | "slide-left" | "slide-right" | "zoom" | "none",
  direction: "forward" | "backward" = "forward"
): Variants => {
  const isBack = direction === "backward";

  switch (transitionType) {
    case "slide-left":
      return {
        initial: { x: isBack ? "-100%" : "100%", opacity: 0 },
        animate: { x: 0, opacity: 1, transition: transitions.editorial },
        exit: { x: isBack ? "100%" : "-100%", opacity: 0, transition: transitions.quick },
      };
    case "slide-right":
      return {
        initial: { x: isBack ? "100%" : "-100%", opacity: 0 },
        animate: { x: 0, opacity: 1, transition: transitions.editorial },
        exit: { x: isBack ? "-100%" : "100%", opacity: 0, transition: transitions.quick },
      };
    case "zoom":
      return {
        initial: { scale: 0.94, opacity: 0 },
        animate: { scale: 1, opacity: 1, transition: transitions.editorial },
        exit: { scale: 1.04, opacity: 0, transition: transitions.quick },
      };
    case "none":
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1, transition: transitions.instant },
        exit: { opacity: 0, transition: transitions.instant },
      };
    case "fade":
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: transitions.smooth },
        exit: { opacity: 0, transition: transitions.quick },
      };
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};
