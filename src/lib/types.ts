export type ChatMode = "instant" | "think";
export type AppView = "chat" | "maps" | "studio";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  createdAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  mode: ChatMode;
  messages: ChatMessage[];
  updatedAt: number;
};

export type MapChild = {
  id: string;
  label: string;
  note: string;
};

export type MapBranch = {
  id: string;
  label: string;
  tone: "sage" | "ink" | "clay" | "sky" | "sand";
  children: MapChild[];
};

export type MindMapData = {
  topic: string;
  summary: string;
  branches: MapBranch[];
};

export type SavedMap = {
  id: string;
  data: MindMapData;
  createdAt: number;
};

export type StudioImage = {
  id: string;
  prompt: string;
  url: string;
  aspect: string;
  createdAt: number;
};
