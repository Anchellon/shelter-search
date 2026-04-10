import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "@/shared/components/Sidebar";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setCurrentReferralSaved } from "@/app/store/slices/chatSlice";
import { useChat } from "./hooks/useChat";
import ChatPane from "./components/ChatPane";
import ResultsPane from "./components/ResultsPane";
import SaveReferralDialog from "./components/SaveReferralDialog";
import { updateReferral } from "@/services/api";

export default function ChatPage() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { sendMessage } = useChat();
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage; // keep ref fresh without adding to effect deps

  const resultsPanelOpen = useAppSelector((s) => s.ui.resultsPanelOpen);
  const resultsPanelExpanded = useAppSelector((s) => s.ui.resultsPanelExpanded);
  const currentReferralId = useAppSelector((s) => s.chat.currentReferralId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleConfirm(name: string) {
    if (!currentReferralId) return;
    setSaving(true);
    updateReferral(currentReferralId, { title: name, saved: true })
      .then(() => {
        dispatch(setCurrentReferralSaved(true));
        setDialogOpen(false);
      })
      .catch(console.error)
      .finally(() => setSaving(false));
  }

  // Send the initial message passed from the landing page (runs once on mount)
  useEffect(() => {
    const initialMessage = (location.state as { initialMessage?: string } | null)
      ?.initialMessage;
    if (initialMessage) {
      sendMessageRef.current(initialMessage);
      // Clear state so a refresh doesn't re-send
      window.history.replaceState(null, document.title);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally runs once; sendMessage accessed via ref

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />

      {/* Workspace — chat + results */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Chat pane: hidden on mobile when results panel is expanded */}
        <div
          className={[
            "flex flex-col flex-1 overflow-hidden bg-white border-r border-grey-2 transition-all duration-200",
            resultsPanelExpanded ? "hidden" : "flex",
          ].join(" ")}
        >
          <ChatPane />
        </div>

        {/* Results pane */}
        {resultsPanelOpen && <ResultsPane onSaveClick={() => setDialogOpen(true)} />}
      </div>

      <SaveReferralDialog
        open={dialogOpen}
        saving={saving}
        onConfirm={handleConfirm}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}
