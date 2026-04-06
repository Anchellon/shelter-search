import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error boundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-grey-1">
          <div className="text-center p-8 max-w-sm">
            <p className="text-grey-9 font-semibold mb-2">Something went wrong</p>
            <p className="text-grey-5 text-sm mb-4">Please refresh the page to continue.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded hover:bg-brand-dark transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
