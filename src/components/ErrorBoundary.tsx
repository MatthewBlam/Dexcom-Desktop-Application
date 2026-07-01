import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            fontFamily: "Inter, system-ui, sans-serif",
            color: "#e5e5e5",
            backgroundColor: "#1c1c1e",
            gap: "16px",
          }}>
          <div style={{ fontSize: "18px", fontWeight: 600 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: "14px", color: "#999" }}>
            The app encountered an unexpected error
          </div>
          <button
            onClick={() => window.api.restart()}
            style={{
              marginTop: "8px",
              padding: "8px 20px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#fff",
              backgroundColor: "#34c759",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}>
            Restart
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
