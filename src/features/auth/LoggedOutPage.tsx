import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/app/router/routes";
import ShelterTechLogo from "@/shared/components/ShelterTechLogo";
import MSO from "@/shared/components/MSO";

export default function LoggedOutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-grey-1 flex flex-col items-center justify-center px-6">
      {/* Branding */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-7 h-7 bg-brand rounded flex items-center justify-center flex-shrink-0">
          <ShelterTechLogo size={16} />
        </div>
        <span className="text-[18px] font-bold text-grey-9 tracking-tight">Navigator</span>
      </div>

      {/* Card */}
      <div className="bg-white border border-grey-2 rounded-md shadow-card px-10 py-10 flex flex-col items-center gap-4 max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-full bg-brand-verylight flex items-center justify-center">
          <MSO icon="check_circle" size={28} className="text-brand" />
        </div>
        <div>
          <h1 className="text-[17px] font-bold text-grey-9 mb-1">You've been logged out</h1>
          <p className="text-[13px] text-grey-5 leading-relaxed">
            Your session has ended and your data has been cleared.
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-[13px] font-semibold rounded transition-colors"
        >
          <MSO icon="home" size={16} className="text-white" />
          Back to home
        </button>
      </div>
    </div>
  );
}
