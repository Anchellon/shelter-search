import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { closeAuthModal } from "@/app/store/slices/uiSlice";
import ShelterTechLogo from "./ShelterTechLogo";
import MSO from "./MSO";

export default function AuthModal() {
  const dispatch = useAppDispatch();
  const authModalOpen = useAppSelector((s) => s.ui.authModalOpen);
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (isAuthenticated && authModalOpen) {
      dispatch(closeAuthModal());
    }
  }, [isAuthenticated, authModalOpen, dispatch]);

  if (!authModalOpen) return null;

  function signInWith(connection: string) {
    loginWithRedirect({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        connection,
      },
      appState: { returnTo: window.location.pathname },
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => dispatch(closeAuthModal())}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative z-10 w-full max-w-[380px] mx-4 bg-white rounded-lg border border-grey-2 shadow-xl flex flex-col items-center px-8 py-8 gap-5"
      >
        {/* Close */}
        <button
          onClick={() => dispatch(closeAuthModal())}
          aria-label="Close"
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded text-grey-5 hover:bg-grey-2 hover:text-grey-9 transition-colors"
        >
          <MSO icon="close" size={18} />
        </button>

        {/* Logo + heading */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-11 h-11 bg-brand rounded-xl flex items-center justify-center">
            <ShelterTechLogo size={22} />
          </div>
          <h2 id="auth-modal-title" className="text-[17px] font-bold text-grey-9 leading-tight">
            Sign in to continue
          </h2>
          <p className="text-[13px] text-grey-5 leading-relaxed max-w-[280px]">
            Save your searches and access your conversation history.
          </p>
        </div>

        {/* Social buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Google */}
          <button
            onClick={() => signInWith("google-oauth2")}
            className="w-full py-2.5 bg-white hover:bg-grey-1 border border-grey-3 text-grey-9 text-[13px] font-semibold rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Apple */}
          <button
            onClick={() => signInWith("apple")}
            className="w-full py-2.5 bg-black hover:bg-grey-9 text-white text-[13px] font-semibold rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg width="14" height="16" viewBox="0 0 814 1000" aria-hidden="true" fill="white">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.4-148.9-104.1c-50.4-72.9-90.6-185.3-90.6-292.3 0-181.7 117.6-277.5 233.2-277.5 61.6 0 112.9 40.5 151.2 40.5 36.7 0 95.2-43 166.9-43 26.7 0 108.2 2.6 168.6 75.7zm-127.8-190.1c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
            </svg>
            Continue with Apple
          </button>

          {/* Facebook */}
          <button
            onClick={() => signInWith("facebook")}
            className="w-full py-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white text-[13px] font-semibold rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="white">
              <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
            Continue with Facebook
          </button>

        </div>
      </div>
    </div>
  );
}
