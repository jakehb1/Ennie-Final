import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "./ErrorBoundary.jsx";
import EnnieApp from "./App.jsx";

// Global unhandled error/rejection handlers
window.addEventListener("error", (e) => {
  console.error("[Ennie] Unhandled error:", e.error);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("[Ennie] Unhandled rejection:", e.reason);
});

// Prevent pull-to-refresh on Android Chrome
document.addEventListener("touchmove", (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

// Prevent double-tap zoom on iOS
let lastTouchEnd = 0;
document.addEventListener("touchend", (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

// Handle Android back button in standalone mode
window.addEventListener("popstate", () => {
  // Let the app handle navigation — prevents closing the PWA
  window.history.pushState(null, "", window.location.href);
});
// Seed history so back button doesn't exit the app
if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
  window.history.pushState(null, "", window.location.href);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <EnnieApp />
    </ErrorBoundary>
  </React.StrictMode>
);
