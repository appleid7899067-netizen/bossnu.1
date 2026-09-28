export type ChatMode = "instant" | "think";
export type AiModelId = string;
export type AppView = "chat" | "maps" | "studio" | "builder" | "settings";
export type ChatAttachment = { name: string; size: number; content: string; };
export type ChatActivity =
  | { id: string; kind: "phase"; phase: string; label: string; createdAt: number }
  | { id: string; kind: "command"; runtime: string; command: string; status: string; output?: string; previewUrl?: string | null; exitCode?: number | null; durationMs?: number; sync?: { verified: boolean; complete: boolean; added?: number; modified?: number; deleted?: number; expectedCount?: number; error?: string }; createdAt: number }
  | { id: string; kind: "files"; files: { path: string; action: "added" | "modified" | "deleted" | "renamed"; from?: string }[]; createdAt: number }
  | { id: string; kind: "skill"; path: string; status: "saved" | "failed"; createdAt: number };
export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; thinking?: string; attachments?: ChatAttachment[]; activities?: ChatActivity[]; createdAt: number; };
export type Conversation = { id: string; title: string; mode: ChatMode; messages: ChatMessage[]; updatedAt: number; pinned?: boolean; };
export type MapChild = { id: string; label: string; note: string; };
export type MapBranch = { id: string; label: string; tone: "sage" | "ink" | "clay" | "sky" | "sand"; children: MapChild[]; };
export type MindMapData = { topic: string; summary: string; branches: MapBranch[]; };
export type SavedMap = { id: string; data: MindMapData; createdAt: number; };
export type StudioImage = { id: string; prompt: string; url: string; aspect: string; createdAt: number; };
export type BuilderFile = { path: string; content: string; };
export type BuilderProject = { id: string; title: string; description: string; entry: string; files: BuilderFile[]; updatedAt: number; };
export type PersonalitySettings = { name: string; tone: string; actFirst: boolean; thaiFirst: boolean; warm: boolean; autoSandbox: boolean; darkMode: boolean; };
export type AgentSkill = { id: string; name: string; description: string; enabled: boolean; };
export type AgentProfile = { id: string; name: string; role: string; instructions: string; skills: string[]; createdAt: number; };
export type MemoryItem = { id: string; content: string; createdAt: number; };
export type LearnedSkill = { id: string; name: string; runtime: string; pattern: string; testCommand?: string; result: "passed" | "failed"; evidence: string; createdAt: number; uses: number; lastTestedAt?: number; };
export type CommandHistoryItem = { id: string; command: string; runtime: string; status: "running" | "success" | "error" | "aborted"; createdAt: number; };
