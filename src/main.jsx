import React from "react";
import ReactDOM from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard } from "@capacitor/keyboard";
import { ErrorBoundary } from "./ErrorBoundary.jsx";
import EnnieApp from "./App.jsx";

// ── Detect platform ──
const isNative = Capacitor.isNativePlatform();
const isIOS = Capacitor.getPlatform() === "ios";
const isAndroid = Capacitor.getPlatform() === "android";

// ── Global error handlers ──
window.addEventListener("error", (e) => {
  console.error("[Ennie] Unhandled error:", e.error);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("[Ennie] Unhandled rejection:", e.reason);
});

// ── Native platform setup ──
if (isNative) {
  // Status bar: white bg with dark text
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  if (isAndroid) {
    StatusBar.setBackgroundColor({ color: "#FFFFFF" }).catch(() => {});
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
  }
  if (isIOS) {
    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
  }

  // Keyboard: adjust viewport when keyboard opens
  Keyboard.setAccessoryBarVisible({ isVisible: true }).catch(() => {});
  Keyboard.setScroll({ isDisabled: false }).catch(() => {});

  // Hide splash once app is rendered
  SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});

  // Android back button: let app handle navigation
  if (isAndroid) {
    document.addEventListener("backbutton", (e) => {
      e.preventDefault();
      // Could dispatch a custom event for the app to handle
      window.dispatchEvent(new CustomEvent("ennie:back"));
    });
  }
}

// ── Web-only PWA hardening ──
if (!isNative) {
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

  // Handle Android back button in standalone PWA mode
  window.addEventListener("popstate", () => {
    window.history.pushState(null, "", window.location.href);
  });
  if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
    window.history.pushState(null, "", window.location.href);
  }
}

// ── Render ──
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <EnnieApp />
    </ErrorBoundary>
  </React.StrictMode>
);
