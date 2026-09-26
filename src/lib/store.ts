import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ChatMessage,
  ChatMode,
  Conversation,
  SavedMap,
  StudioImage,
} from "@/lib/types";
import { titleFromPrompt, uid } from "@/lib/utils";

const MAX_CHATS = 40;
const MAX_MAPS = 16;
const MAX_IMAGES = 12;
const MAX_MESSAGES = 48;

type AppState = {
  conversations: Conversation[];
  activeChatId: string | null;
  maps: SavedMap[];
  activeMapId: string | null;
  images: StudioImage[];
  hydrated: boolean;
  setHydrated: () => void;
  newChat: (mode?: ChatMode) => string;
  setActiveChat: (id: string | null) => void;
  setChatMode: (id: string, mode: ChatMode) => void;
  addUserMessage: (chatId: string, content: string) => string;
  startAssistant: (chatId: string) => string;
  patchAssistant: (
    chatId: string,
    messageId: string,
    patch: Partial<Pick<ChatMessage, "content" | "thinking">>,
  ) => void;
  removeEmptyAssistant: (chatId: string, messageId: string) => void;
  deleteChat: (id: string) => void;
  addMap: (map: SavedMap) => void;
  setActiveMap: (id: string | null) => void;
  deleteMap: (id: string) => void;
  addImage: (image: StudioImage) => void;
  deleteImage: (id: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeChatId: null,
      maps: [],
      activeMapId: null,
      images: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      newChat: (mode = "instant") => {
        const id = uid("chat");
        const next: Conversation = {
          id,
          title: "New chat",
          mode,
          messages: [],
          updatedAt: Date.now(),
        };
        set((s) => ({
          conversations: [next, ...s.conversations].slice(0, MAX_CHATS),
          activeChatId: id,
        }));
        return id;
      },
      setActiveChat: (id) => set({ activeChatId: id }),
      setChatMode: (id, mode) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, mode } : c,
          ),
        })),
      addUserMessage: (chatId, content) => {
        const messageId = uid("msg");
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== chatId) return c;
            const messages = [
              ...c.messages,
              {
                id: messageId,
                role: "user" as const,
                content,
                createdAt: Date.now(),
              },
            ].slice(-MAX_MESSAGES);
            return {
              ...c,
              title:
                c.messages.length === 0 ? titleFromPrompt(content) : c.title,
              messages,
              updatedAt: Date.now(),
            };
          }),
        }));
        return messageId;
      },
      startAssistant: (chatId) => {
        const messageId = uid("msg");
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== chatId) return c;
            return {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: messageId,
                  role: "assistant" as const,
                  content: "",
                  thinking: "",
                  createdAt: Date.now(),
                },
              ].slice(-MAX_MESSAGES),
              updatedAt: Date.now(),
            };
          }),
        }));
        return messageId;
      },
      patchAssistant: (chatId, messageId, patch) =>
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== chatId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, ...patch } : m,
              ),
              updatedAt: Date.now(),
            };
          }),
        })),
      removeEmptyAssistant: (chatId, messageId) =>
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== chatId) return c;
            return {
              ...c,
              messages: c.messages.filter((m) => m.id !== messageId),
            };
          }),
        })),
      deleteChat: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          activeChatId: s.activeChatId === id ? null : s.activeChatId,
        })),
      addMap: (map) =>
        set((s) => ({
          maps: [map, ...s.maps].slice(0, MAX_MAPS),
          activeMapId: map.id,
        })),
      setActiveMap: (id) => set({ activeMapId: id }),
      deleteMap: (id) =>
        set((s) => ({
          maps: s.maps.filter((m) => m.id !== id),
          activeMapId: s.activeMapId === id ? null : s.activeMapId,
        })),
      addImage: (image) =>
        set((s) => ({
          images: [image, ...s.images].slice(0, MAX_IMAGES),
        })),
      deleteImage: (id) =>
        set((s) => ({
          images: s.images.filter((img) => img.id !== id),
        })),
    }),
    {
      name: "lumina-v1",
      skipHydration: true,
      partialize: (s) => ({
        conversations: s.conversations,
        activeChatId: s.activeChatId,
        maps: s.maps,
        activeMapId: s.activeMapId,
        images: s.images,
      }),
    },
  ),
);

export function getConversation(id: string | null) {
  if (!id) return undefined;
  return useAppStore.getState().conversations.find((c) => c.id === id);
}
