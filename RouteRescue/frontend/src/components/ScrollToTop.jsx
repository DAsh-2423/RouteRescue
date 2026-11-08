import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// Stop the browser from restoring the old scroll position on Back/Forward
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    // Keep links like /#journeys and /#destinations working
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  // Run once more after paint/animation so late layout changes can't push the page down
  useEffect(() => {
    if (hash) return;
    const id = requestAnimationFrame(() =>
      window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    );
    return () => cancelAnimationFrame(id);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;