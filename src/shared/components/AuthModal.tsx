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

  // Close if user somehow became authenticated while modal was open
  useEffect(() => {
    if (isAuthenticated && authModalOpen) {
      dispatch(closeAuthModal());
    }
  }, [isAuthenticated, authModalOpen, dispatch]);

  if (!authModalOpen) return null;

  function handleSignIn() {
    loginWithRedirect({
      authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      appState: { returnTo: window.location.pathname },
    });
  }

  function handleSignUp() {
    loginWithRedirect({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        screen_hint: "signup",
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

        {/* Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={handleSignIn}
            className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white text-[13px] font-semibold rounded transition-colors flex items-center justify-center gap-2"
          >
            <MSO icon="login" size={16} />
            Sign In
          </button>

          <button
            onClick={handleSignUp}
            className="w-full py-2.5 bg-white hover:bg-grey-1 border border-grey-3 text-grey-9 text-[13px] font-semibold rounded transition-colors flex items-center justify-center gap-2"
          >
            <MSO icon="person_add" size={16} />
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
