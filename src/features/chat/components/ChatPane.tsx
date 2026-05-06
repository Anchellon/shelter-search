import { useEffect, useRef } from "react";
import { useAppSelector } from "@/app/store/hooks";
import { useChat } from "../hooks/useChat";
import MobileHeader from "@/shared/components/MobileHeader";
import UserBubble from "./UserBubble";
import AIBubble from "./AIBubble";
import GroupCards from "./GroupCards";
import IntakeCard from "./IntakeCard";
import ChatInput from "./ChatInput";
import ClientContextBanner from "./ClientContextBanner";
import ThinkingIndicator from "./ThinkingIndicator";
import type { Message } from "@/app/store/slices/chatSlice";

function renderMessage(msg: Message) {
  if (msg.type === "referral" && msg.groups) {
    return <GroupCards key={msg.id} groups={msg.groups} referralId={msg.referralId} />;
  }
  if (msg.role === "user") {
    return <UserBubble key={msg.id} content={msg.content} />;
  }
  return <AIBubble key={msg.id} content={msg.content} />;
}

export default function ChatPane() {
  const messages = useAppSelector((s) => s.chat.messages);
  const intakeRequest = useAppSelector((s) => s.chat.intakeRequest);
  const isStreaming = useAppSelector((s) => s.chat.isStreaming);
  const error = useAppSelector((s) => s.chat.error);
  const { sendMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom only when a new message is added (not on every streaming delta)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MobileHeader />
      <ClientContextBanner />

      {/* Messages */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex-1 overflow-y-auto px-4 md:px-6 py-6 flex flex-col gap-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-grey-2 [&::-webkit-scrollbar-thumb]:rounded"
      >
        {messages.filter((m) => m.content !== "" || m.type === "referral").map(renderMessage)}
        {isStreaming && <ThinkingIndicator />}
        {error && (
          <div role="alert" className="text-[13px] text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
            Error: {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-grey-2 px-4 md:px-6 py-3 bg-white flex-shrink-0">
        {intakeRequest ? (
          <IntakeCard />
        ) : (
          <ChatInput onSend={sendMessage} />
        )}
      </div>
    </div>
  );
}
