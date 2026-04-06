import { useAppDispatch } from "@/app/store/hooks";
import { toggleSidebar } from "@/app/store/slices/uiSlice";
import MSO from "./MSO";
import ShelterTechLogo from "./ShelterTechLogo";

export default function MobileHeader() {
  const dispatch = useAppDispatch();

  return (
    <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-grey-2 bg-white flex-shrink-0">
      <button
        onClick={() => dispatch(toggleSidebar())}
        aria-label="Open navigation menu"
        className="w-8 h-8 rounded flex items-center justify-center text-grey-5 hover:bg-grey-2 transition-colors"
      >
        <MSO icon="menu" />
      </button>
      <div className="w-6 h-6 bg-brand rounded flex items-center justify-center" aria-hidden="true">
        <ShelterTechLogo size={12} />
      </div>
      <span className="text-[15px] font-bold text-grey-9">Navigator</span>
    </div>
  );
}
