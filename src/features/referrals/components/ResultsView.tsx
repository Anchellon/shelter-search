import { useState, useEffect, useRef } from "react";
import type { ReferralSummary, ReferralDetail } from "@/services/api";
import { getReferral, fetchServicesBatch } from "@/services/api";
import type { Service } from "@/app/store/slices/chatSlice";
import RationaleCard from "@/shared/components/RationaleCard";
import ServiceCard from "./ServiceCard";
import MSO from "@/shared/components/MSO";
import { GROUP_TAGS } from "./GroupCard";

interface Props {
  referral: ReferralSummary | null;
  activeGroupIndex: number;
  onGroupChange: (i: number) => void;
  onClose: () => void;
}

export default function ResultsView({ referral, activeGroupIndex, onGroupChange, onClose }: Props) {
  const [detail, setDetail] = useState<ReferralDetail | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!referral) return;
    setDetail(null);
    setServices([]);
    setLoading(true);
    if (bodyRef.current) bodyRef.current.scrollTop = 0;

    getReferral(referral.id)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [referral?.id]);

  useEffect(() => {
    if (!detail) return;
    const ids = detail.groups[activeGroupIndex]?.service_ids ?? [];
    if (ids.length === 0) { setServices([]); return; }

    setServices([]);
    setLoading(true);
    fetchServicesBatch(ids)
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [detail, activeGroupIndex]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [activeGroupIndex]);

  const isOpen = !!referral;
  // Use summary group data immediately while detail loads
  const activeGroup = (detail ?? referral)?.groups[activeGroupIndex];
  const activeTag = GROUP_TAGS[activeGroupIndex % 4];

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
          Back to Collections
        </button>

        <div className="w-px h-5 bg-grey-2 flex-shrink-0" />

        <div className="flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden">
          {activeGroup && (
            <span
              className={`inline-block text-[10px] font-bold uppercase tracking-[0.06em] px-2.5 py-0.5 rounded-full leading-[1.5] flex-shrink-0 ${activeTag.bg} ${activeTag.text}`}
            >
              Group {activeTag.label}
            </span>
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold text-grey-9 truncate">{activeGroup?.what}</div>
            <div className="text-[12px] text-grey-5 truncate">{referral?.title}</div>
          </div>
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

      {/* Group pills bar */}
      {referral && referral.groups.length > 1 && (
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-grey-2 flex-shrink-0 flex-wrap bg-white">
          {referral.groups.map((g, i) => {
            const t = GROUP_TAGS[i % 4];
            return (
              <button
                key={g.group_id}
                onClick={() => onGroupChange(i)}
                className={[
                  "inline-flex items-center text-[11px] font-semibold font-[inherit] px-2.5 py-1 rounded-full border cursor-pointer whitespace-nowrap transition-[background,border-color,color] duration-150",
                  i === activeGroupIndex
                    ? "bg-brand border-brand text-white"
                    : "bg-white border-grey-4 text-grey-6 hover:bg-brand-verylight hover:border-brand hover:text-brand",
                ].join(" ")}
              >
                Group {t.label} · {g.what}
              </button>
            );
          })}
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
                <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-grey-5">Group</div>
                <div className="text-[13px] font-semibold text-grey-9">Group {activeTag.label} · {activeGroup.what}</div>
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
