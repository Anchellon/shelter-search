import { useEffect, type ReactNode } from "react";
import { Provider } from "react-redux";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { store } from "@/app/store";
import { useAppDispatch } from "@/app/store/hooks";
import { setUser } from "@/app/store/slices/userSlice";
import { setTokenGetter } from "@/services/api";
import ErrorBoundary from "@/shared/components/ErrorBoundary";

// Runs inside Auth0Provider — wires token getter and hydrates user slice
function Auth0Bridge() {
  const dispatch = useAppDispatch();
  const { getAccessTokenSilently, user, isAuthenticated } = useAuth0();

  useEffect(() => {
    setTokenGetter(() =>
      getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      })
    );
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(
        setUser({
          id: user.sub ?? "",
          name: user.name ?? user.email ?? "User",
          email: user.email ?? "",
          picture: user.picture ?? null,
        })
      );
    }
  }, [dispatch, isAuthenticated, user]);

  return null;
}

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      }}
      onRedirectCallback={(appState) => {
        // After Auth0 returns, restore the page the user was on
        window.history.replaceState(
          {},
          document.title,
          appState?.returnTo ?? window.location.pathname
        );
      }}
    >
      <Provider store={store}>
        <Auth0Bridge />
        <ErrorBoundary>{children}</ErrorBoundary>
      </Provider>
    </Auth0Provider>
  );
}
