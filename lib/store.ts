import { create } from 'zustand'
import type {
  Document,
  QueryResult,
  QueryHistoryItem,
  SourceReference,
  WorkspaceMode,
  Conversation,
  Message,
} from './types'

interface WorkspaceState {
  // Mode
  mode: WorkspaceMode
  setMode: (mode: WorkspaceMode) => void

  // Documents
  documents: Document[]
  selectedDocumentIds: string[]
  setDocuments: (docs: Document[]) => void
  addDocument: (doc: Document) => void
  updateDocument: (id: string, updates: Partial<Document>) => void
  removeDocument: (id: string) => void
  toggleDocumentSelection: (id: string) => void
  selectDocument: (id: string) => void
  clearSelection: () => void

  // Query results (research mode)
  currentResult: QueryResult | null
  setCurrentResult: (result: QueryResult | null) => void
  isQuerying: boolean
  setIsQuerying: (v: boolean) => void

  // Query history (research mode)
  queryHistory: QueryHistoryItem[]
  setQueryHistory: (items: QueryHistoryItem[]) => void
  addQueryToHistory: (item: QueryHistoryItem) => void
  removeQueryFromHistory: (id: string) => void

  // Conversations (study mode)
  conversations: Conversation[]
  setConversations: (convs: Conversation[]) => void
  addConversation: (conv: Conversation) => void
  removeConversation: (id: string) => void
  updateConversationTitle: (id: string, title: string) => void

  activeConversationId: string | null
  setActiveConversationId: (id: string | null) => void

  messages: Message[]
  setMessages: (msgs: Message[]) => void
  addMessage: (msg: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void

  isStreaming: boolean
  setIsStreaming: (v: boolean) => void

  // Evidence focus
  activeSource: SourceReference | null
  setActiveSource: (source: SourceReference | null) => void

  // Mobile panels
  activeMobileTab: 'documents' | 'research' | 'evidence'
  setActiveMobileTab: (tab: 'documents' | 'research' | 'evidence') => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  mode: 'study',
  setMode: (mode) => set({ mode }),

  documents: [],
  selectedDocumentIds: [],
  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) =>
    set((state) => ({ documents: [doc, ...state.documents] })),
  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),
  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      selectedDocumentIds: state.selectedDocumentIds.filter((sid) => sid !== id),
    })),
  toggleDocumentSelection: (id) =>
    set((state) => ({
      // Allow multiple document selection with toggle behavior
      selectedDocumentIds: state.selectedDocumentIds.includes(id)
        ? state.selectedDocumentIds.filter((sid) => sid !== id)
        : [...state.selectedDocumentIds, id],
    })),
  selectDocument: (id) => set({ selectedDocumentIds: [id] }),
  clearSelection: () => set({ selectedDocumentIds: [] }),

  currentResult: null,
  setCurrentResult: (result) => set({ currentResult: result }),
  isQuerying: false,
  setIsQuerying: (v) => set({ isQuerying: v }),

  queryHistory: [],
  setQueryHistory: (items) => set({ queryHistory: items }),
  addQueryToHistory: (item) =>
    set((state) => ({ queryHistory: [item, ...state.queryHistory] })),
  removeQueryFromHistory: (id) =>
    set((state) => ({
      queryHistory: state.queryHistory.filter((q) => q.id !== id),
    })),

  conversations: [],
  setConversations: (convs) => set({ conversations: convs }),
  addConversation: (conv) =>
    set((state) => ({ conversations: [conv, ...state.conversations] })),
  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
      messages: state.activeConversationId === id ? [] : state.messages,
    })),
  updateConversationTitle: (id, title) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    })),

  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),

  messages: [],
  setMessages: (msgs) => set({ messages: msgs }),
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  isStreaming: false,
  setIsStreaming: (v) => set({ isStreaming: v }),

  activeSource: null,
  setActiveSource: (source) => set({ activeSource: source }),

  activeMobileTab: 'research',
  setActiveMobileTab: (tab) => set({ activeMobileTab: tab }),
}))
