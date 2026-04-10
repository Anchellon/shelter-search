import { useState, useEffect, useRef } from "react";
import type { ReferralSummary, ReferralDetail, ReferralGroup } from "@/services/api";
import { getReferral, fetchServicesBatch } from "@/services/api";
import type { Service } from "@/app/store/slices/chatSlice";
import RationaleCard from "@/shared/components/RationaleCard";
import ServiceCard from "./ServiceCard";
import MSO from "@/shared/components/MSO";

interface Props {
  referral: ReferralSummary | null;
  index: number;
  onClose: () => void;
}

export default function ResultsView({ referral, onClose }: Props) {
  const [detail, setDetail] = useState<ReferralDetail | null>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Fetch full detail when referral changes
  useEffect(() => {
    if (!referral) return;
    setDetail(null);
    setActiveGroupIndex(0);
    setServices([]);
    setLoading(true);
    if (bodyRef.current) bodyRef.current.scrollTop = 0;

    getReferral(referral.id)
      .then((d) => {
        setDetail(d);
        return d;
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [referral?.id]);

  // Fetch services whenever active group changes
  useEffect(() => {
    if (!detail) return;
    const group = detail.groups[activeGroupIndex] as ReferralGroup;
    const ids = group?.service_ids ?? [];
    if (ids.length === 0) { setServices([]); return; }

    setServices([]);
    setLoading(true);
    fetchServicesBatch(ids)
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [detail, activeGroupIndex]);

  const isOpen = !!referral;
  const activeGroup = detail?.groups[activeGroupIndex];

  return (
    <div
      className={[
        "fixed inset-0 z-[400] bg-white flex flex-col",
        "transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        isOpen ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
    >
      {/* Top bar */}
      <div className="flex items-center gap-4 px-8 h-14 border-b border-grey-2 flex-shrink-0 bg-white">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-grey-6 bg-transparent border-none cursor-pointer px-2 py-1.5 rounded hover:bg-grey-2 hover:text-grey-9 transition-colors flex-shrink-0 font-[inherit]"
        >
          <MSO icon="arrow_back" size={18} />
          Back to Referrals
        </button>

        <div className="w-px h-5 bg-grey-2 flex-shrink-0" />

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="text-sm font-bold text-grey-9 truncate">{referral?.title}</div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button className="w-[30px] h-[30px] rounded flex items-center justify-center text-grey-5 hover:bg-grey-2 hover:text-grey-9 transition-colors">
            <MSO icon="print" size={20} />
          </button>
          <button className="w-[30px] h-[30px] rounded flex items-center justify-center text-grey-5 hover:bg-grey-2 hover:text-grey-9 transition-colors">
            <MSO icon="download" size={20} />
          </button>
        </div>
      </div>

      {/* Group tabs */}
      {detail && detail.groups.length > 1 && (
        <div className="flex gap-1 px-8 pt-3 pb-0 border-b border-grey-2 flex-shrink-0 overflow-x-auto">
          {detail.groups.map((g, i) => (
            <button
              key={g.group_id}
              onClick={() => setActiveGroupIndex(i)}
              className={[
                "px-3 py-2 text-[12px] font-semibold rounded-t border-b-2 transition-colors whitespace-nowrap font-[inherit] cursor-pointer bg-transparent",
                i === activeGroupIndex
                  ? "border-brand text-brand"
                  : "border-transparent text-grey-5 hover:text-grey-9",
              ].join(" ")}
            >
              {g.what}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div
        ref={bodyRef}
        className="flex-1 overflow-y-auto px-8 py-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-grey-2 [&::-webkit-scrollbar-thumb]:rounded"
      >
        <div className="max-w-[760px] w-full mx-auto flex flex-col gap-3">
          {/* Summary card */}
          {activeGroup && (
            <div className="border border-grey-2 rounded p-4 bg-grey-1 flex items-start gap-5 flex-wrap">
              <div className="flex flex-col gap-0.5">
                <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-grey-5">Category</div>
                <div className="text-[13px] font-semibold text-grey-9">{activeGroup.what}</div>
              </div>
              {activeGroup.who && (
                <div className="flex flex-col gap-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-grey-5">Eligibility</div>
                  <div className="text-[13px] font-semibold text-grey-9">{activeGroup.who}</div>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-grey-5">Location</div>
                <div className="text-[13px] font-semibold text-grey-9">{activeGroup.where}</div>
              </div>
            </div>
          )}

          {/* AI rationale */}
          {activeGroup?.rationale && (
            <RationaleCard rationale={activeGroup.rationale} />
          )}

          {/* Services */}
          {loading && (
            <p className="text-[13px] text-grey-5 text-center py-8">Loading results…</p>
          )}
          {!loading && services.length === 0 && referral && (
            <p className="text-[13px] text-grey-5 text-center py-8">No services found.</p>
          )}
          {services.map((svc) => (
            <ServiceCard key={svc.service_id} service={svc} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 px-8 py-3 border-t border-grey-2 flex-shrink-0 bg-white">
        <button className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-grey-9 border border-grey-2 rounded text-[12px] font-semibold font-[inherit] cursor-pointer hover:bg-grey-1 transition-colors">
          <MSO icon="print" size={15} />
          Print
        </button>
        <button className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-grey-9 border border-grey-2 rounded text-[12px] font-semibold font-[inherit] cursor-pointer hover:bg-grey-1 transition-colors">
          <MSO icon="download" size={15} />
          Export
        </button>
      </div>
    </div>
  );
}
