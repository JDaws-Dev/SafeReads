"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ArrowLeft, Bot } from "lucide-react";
import { ChatInput } from "@/components/chat/ChatInput";

export default function ChatPage() {
  const { user: clerkUser } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const conversations = useQuery(
    api.chat.listConversations,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const createConversation = useMutation(api.chat.createConversation);
  const deleteConversation = useMutation(api.chat.deleteConversation);
  const sendMessage = useAction(api.chat.sendMessage);

  const [activeConversationId, setActiveConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleNewConversation = useCallback(async () => {
    if (!convexUser?._id) return;
    const id = await createConversation({
      userId: convexUser._id,
      title: "New conversation",
    });
    setActiveConversationId(id);
    setShowChat(true);
    return id;
  }, [convexUser?._id, createConversation]);

  const handleSelectConversation = useCallback(
    (id: Id<"conversations">) => {
      setActiveConversationId(id);
      setShowChat(true);
    },
    []
  );

  const handleDeleteConversation = useCallback(
    async (id: Id<"conversations">) => {
      await deleteConversation({ conversationId: id });
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setShowChat(false);
      }
    },
    [deleteConversation, activeConversationId]
  );

  const handleSend = useCallback(
    async (content: string) => {
      if (!activeConversationId) return;
      setIsSending(true);
      try {
        await sendMessage({
          conversationId: activeConversationId,
          content,
        });
      } catch (err) {
        console.error("Failed to send message:", err);
      } finally {
        setIsSending(false);
      }
    },
    [activeConversationId, sendMessage]
  );

  // Send from the welcome screen — auto-create conversation first
  const handleWelcomeSend = useCallback(
    async (content: string) => {
      if (!convexUser?._id) return;
      setIsSending(true);
      try {
        const id = await createConversation({
          userId: convexUser._id,
          title: "New conversation",
        });
        setActiveConversationId(id);
        setShowChat(true);
        await sendMessage({ conversationId: id, content });
      } catch (err) {
        console.error("Failed to send message:", err);
      } finally {
        setIsSending(false);
      }
    },
    [convexUser?._id, createConversation, sendMessage]
  );

  if (!convexUser) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-parchment-300 border-t-parchment-700" />
      </div>
    );
  }

  return (
    <div className="mx-auto h-[calc(100vh-8rem)] max-w-5xl px-4 py-4">
      <div className="flex h-full overflow-hidden rounded-xl border border-parchment-200 bg-white">
        {/* Conversation sidebar — hidden on mobile when viewing chat */}
        <div
          className={`w-full shrink-0 border-r border-parchment-200 sm:block sm:w-72 ${
            showChat ? "hidden" : "block"
          }`}
        >
          <ConversationList
            conversations={(conversations ?? []) as Array<{
              _id: Id<"conversations">;
              title: string;
              lastMessageAt: number;
            }>}
            activeId={activeConversationId}
            onSelect={handleSelectConversation}
            onNew={handleNewConversation}
            onDelete={handleDeleteConversation}
          />
        </div>

        {/* Chat window — hidden on mobile when viewing list */}
        <div
          className={`flex flex-1 flex-col sm:flex ${
            showChat ? "flex" : "hidden"
          }`}
        >
          {activeConversationId ? (
            <div className="flex h-full flex-col">
              {/* Mobile back button */}
              <div className="flex items-center gap-2 border-b border-parchment-200 p-3 sm:hidden">
                <button
                  onClick={() => setShowChat(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-parchment-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <span className="truncate text-sm font-medium text-ink-700">
                  {(conversations ?? []).find(
                    (c: { _id: Id<"conversations"> }) =>
                      c._id === activeConversationId
                  )?.title ?? "Chat"}
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatWindow
                  conversationId={activeConversationId}
                  onSend={handleSend}
                  isSending={isSending}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <Bot className="h-16 w-16 text-parchment-200" />
                <div>
                  <p className="font-serif text-xl font-bold text-ink-700">
                    SafeReads Advisor
                  </p>
                  <p className="mt-1 text-sm text-ink-400">
                    Ask about books, get recommendations, or check
                    age-appropriateness
                  </p>
                </div>
              </div>
              <ChatInput onSend={handleWelcomeSend} disabled={isSending} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
