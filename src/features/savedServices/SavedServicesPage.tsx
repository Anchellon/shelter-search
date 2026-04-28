import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import Sidebar from "@/shared/components/Sidebar";
import MSO from "@/shared/components/MSO";
import MobileHeader from "@/shared/components/MobileHeader";
import { ROUTES } from "@/app/router/routes";
import { listSavedServices, unsaveService } from "@/services/api";
import type { SavedService } from "@/services/api";

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default function SavedServicesPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth0();

  const [services, setServices] = useState<SavedService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    listSavedServices()
      .then(setServices)
      .catch(() => setError("Failed to load saved services."))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  async function handleRemove(e: React.MouseEvent, serviceId: number) {
    e.preventDefault();
    e.stopPropagation();
    setRemoving((prev) => new Set(prev).add(serviceId));
    try {
      await unsaveService(serviceId);
      setServices((prev) => prev.filter((s) => s.service_id !== serviceId));
    } catch {
      setError("Failed to remove service.");
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(serviceId);
        return next;
      });
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader />

        <div className="px-10 pt-12 pb-8 flex-shrink-0">
          <div className="max-w-[860px] mx-auto w-full">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-[22px] font-bold text-grey-9 tracking-tight">Saved Services</h1>
              <button
                onClick={() => navigate(ROUTES.HOME)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-grey-9 text-white text-[13px] font-semibold rounded hover:bg-[#1a2224] transition-colors"
              >
                <MSO icon="add" size={16} className="text-white" />
                New Search
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-grey-2 [&::-webkit-scrollbar-thumb]:rounded">
          <div className="max-w-[860px] mx-auto w-full">
            {!isAuthenticated && (
              <div className="text-[13px] text-grey-5 py-8 text-center">
                Sign in to view your saved services.
              </div>
            )}
            {isAuthenticated && loading && (
              <div className="text-[13px] text-grey-5 py-8 text-center">Loading…</div>
            )}
            {isAuthenticated && error && (
              <div className="text-[13px] text-red-500 py-8 text-center">{error}</div>
            )}
            {isAuthenticated && !loading && services.length === 0 && !error && (
              <div className="text-[13px] text-grey-5 py-8 text-center">
                No saved services yet. Bookmark a service from any search result.
              </div>
            )}

            {isAuthenticated && services.length > 0 && (
              <>
                <p className="text-[11px] font-semibold text-grey-5 uppercase tracking-[0.06em] mb-2">
                  {services.length} saved {services.length === 1 ? "service" : "services"}
                </p>
                <div className="border-t border-grey-2">
                  {services.map((service) => {
                    const address = [service.address_1, service.city, service.state_province]
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <div key={service.service_id} className="border-b border-grey-2 group">
                        <a
                          href={`https://sfserviceguide.org/services/${service.service_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-1 py-3 hover:bg-grey-1 rounded transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-semibold text-grey-9 truncate">
                              {service.name}
                            </div>
                            {service.org_name && service.org_name !== service.name && (
                              <div className="text-[12px] text-grey-5 truncate">{service.org_name}</div>
                            )}
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              {address && (
                                <span className="flex items-center gap-1 text-[11px] text-grey-5">
                                  <MSO icon="location_on" size={12} className="text-grey-4 flex-shrink-0" />
                                  {address}
                                </span>
                              )}
                              {service.phone && (
                                <span className="flex items-center gap-1 text-[11px] text-grey-5">
                                  <MSO icon="phone" size={12} className="text-grey-4 flex-shrink-0" />
                                  {service.phone}
                                </span>
                              )}
                              <span className="text-[11px] text-grey-4">
                                Saved {timeAgo(service.saved_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[11px] text-brand font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                              View
                              <MSO icon="open_in_new" size={12} className="text-brand" />
                            </span>
                            <button
                              onClick={(e) => handleRemove(e, service.service_id)}
                              disabled={removing.has(service.service_id)}
                              title="Remove from saved"
                              className="w-[28px] h-[28px] rounded flex items-center justify-center text-grey-4 hover:text-danger-text hover:bg-danger-bg transition-colors disabled:opacity-40"
                            >
                              <MSO icon="delete" size={16} />
                            </button>
                          </div>
                        </a>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
