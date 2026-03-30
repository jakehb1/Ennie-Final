import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In production, send to error reporting service
    console.error("[Ennie] Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          fontFamily: "'DM Sans', -apple-system, sans-serif",
          textAlign: "center",
          background: "#FFFFFF",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💜</div>
          <h1 style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#0A0A0A",
            marginBottom: 8,
            fontFamily: "'Syne', sans-serif",
          }}>
            Something went wrong
          </h1>
          <p style={{
            fontSize: 14,
            color: "#6B6B6B",
            lineHeight: 1.6,
            marginBottom: 24,
            maxWidth: 300,
          }}>
            Ennie ran into an unexpected issue. Please restart the app to continue.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: "14px 32px",
              borderRadius: 100,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              background: "linear-gradient(135deg, #0A0A0A, #2A2A2A)",
              color: "#FFFFFF",
              fontFamily: "inherit",
            }}
          >
            Restart Ennie
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
