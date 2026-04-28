import { useState } from "react";
import type { Service } from "@/app/store/slices/chatSlice";
import MSO from "@/shared/components/MSO";
import { saveService, unsaveService } from "@/services/api";

interface Props {
  service: Service;
}

export default function ServiceCard({ service }: Props) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hovering, setHovering] = useState(false);

  const address = [service.address_1, service.city, service.state_province]
    .filter(Boolean)
    .join(", ");

  async function handleBookmark() {
    setSaving(true);
    try {
      if (saved) {
        await unsaveService(service.service_id);
        setSaved(false);
      } else {
        await saveService(service.service_id);
        setSaved(true);
      }
    } catch {
      // no-op
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-grey-2 rounded p-4 bg-white transition-[box-shadow,border-color] duration-150 hover:border-brand-light hover:shadow-card">
      <div className="mb-2.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-sm bg-success-bg text-success-text">
          Matched
        </span>
      </div>

      <div className="text-sm font-bold text-grey-9 mb-1">{service.name}</div>
      {service.org_name && service.org_name !== service.name && (
        <div className="text-[11px] text-grey-5 mb-1.5">{service.org_name}</div>
      )}
      {service.long_description && (
        <p className="text-[12px] text-grey-5 leading-relaxed mb-3 line-clamp-3">
          {service.long_description}
        </p>
      )}

      <div className="flex flex-col gap-0.5 mb-3">
        {address && (
          <div className="flex items-center gap-1.5 text-[11px] text-grey-5">
            <MSO icon="location_on" size={14} className="text-grey-4" />
            {address}
          </div>
        )}
        {service.phone && (
          <div className="flex items-center gap-1.5 text-[11px] text-grey-5">
            <MSO icon="phone" size={14} className="text-grey-4" />
            {service.phone}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <a
          href={`https://sfserviceguide.org/services/${service.service_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 bg-brand text-white text-[12px] font-semibold rounded text-center hover:bg-brand-dark transition-colors"
        >
          View Details
        </a>
        <button
          onClick={handleBookmark}
          disabled={saving}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          aria-label={saved ? `Unsave ${service.name}` : `Save ${service.name}`}
          className={[
            "w-[34px] h-[34px] rounded flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-50",
            saved
              ? hovering
                ? "bg-danger-bg text-danger-text"
                : "bg-yellow-400 text-white"
              : "border border-grey-2 text-grey-5 hover:text-yellow-500 hover:bg-yellow-50",
          ].join(" ")}
        >
          <MSO icon={saved ? (hovering ? "bookmark_remove" : "bookmark") : "bookmark_add"} size={16} />
        </button>
      </div>
    </div>
  );
}
