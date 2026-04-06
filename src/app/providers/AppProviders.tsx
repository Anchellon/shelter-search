import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import ErrorBoundary from "@/shared/components/ErrorBoundary";

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      {/* Auth provider goes here when implemented */}
      <ErrorBoundary>{children}</ErrorBoundary>
    </Provider>
  );
}
