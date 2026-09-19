const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const TOKEN_KEY = "docmind_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    throw new ApiError(0, `Can't reach the DocMind AI backend. Is it running?`);
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* response wasn't JSON */
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- Auth ----

export async function register(email: string, password: string) {
  return request<{ id: number; email: string }>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string) {
  const res = await request<{ access_token: string }>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  setToken(res.access_token);
  return res;
}

export interface UserProfile {
  id: number;
  email: string;
  is_active: boolean;
}

export async function getMe(): Promise<UserProfile> {
  return request<UserProfile>("/api/auth/me");
}

// ---- Documents ----

export interface DocumentRecord {
  id: number;
  title: string;
  file_type: string;
  file_size_bytes: number;
  chunk_count: number;
  status: "processing" | "indexed" | "failed";
  error_message: string | null;
  upload_date: string;
  collection_id: number | null;
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  return request<DocumentRecord[]>("/api/documents");
}

export interface UploadResult {
  document: DocumentRecord;
  is_duplicate: boolean;
  message: string;
}

export async function uploadDocument(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  return request<UploadResult>("/api/documents/upload", {
    method: "POST",
    body: form,
  });
}

export async function deleteDocument(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/documents/${id}`, {
    method: "DELETE",
  });
}

// ---- Analytics ----

export interface AnalyticsOverview {
  total_documents: number;
  indexed_documents: number;
  failed_documents: number;
  total_chunks: number;
  questions_asked: number;
  avg_confidence: number;
  conflict_rate: number;
  storage_bytes: number;
}

export async function getAnalytics(): Promise<AnalyticsOverview> {
  return request<AnalyticsOverview>("/api/analytics/overview");
}

// ---- Health ----

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      method: "GET",
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---- Study Tools ----

export async function generateSummary(documentId: number): Promise<{ summary: string }> {
  return request<{ summary: string }>(`/api/study/${documentId}/summary`, {
    method: "POST",
  });
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

export async function generateQuiz(documentId: number): Promise<{ questions: QuizQuestion[] }> {
  return request<{ questions: QuizQuestion[] }>(`/api/study/${documentId}/quiz`, {
    method: "POST",
  });
}

export interface Flashcard {
  front: string;
  back: string;
}

export async function generateFlashcards(documentId: number): Promise<{ flashcards: Flashcard[] }> {
  return request<{ flashcards: Flashcard[] }>(`/api/study/${documentId}/flashcards`, {
    method: "POST",
  });
}

// ---- Chat Sessions ----

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  document_id?: number | null;
}

export async function listSessions(): Promise<ChatSession[]> {
  return request<ChatSession[]>("/api/chat/sessions");
}

export interface ChatMessageRecord {
  id: number;
  role: "user" | "assistant";
  content: string;
  confidence: number | null;
  conflict_detected: boolean;
  sources: SourceRef[];
  timestamp: string;
}

export async function getSessionMessages(sessionId: number): Promise<ChatMessageRecord[]> {
  return request<ChatMessageRecord[]>(`/api/chat/sessions/${sessionId}/messages`);
}

// ---- Chat (SSE Streaming) ----

export interface SourceRef {
  id?: string;
  document_id?: number;
  source: string;
  text: string;
  similarity: number;
}

export interface ConflictPair {
  source_a: string;
  source_b: string;
  text_a: string;
  text_b: string;
  contradiction_score: number;
}

export interface ChatMeta {
  sources: SourceRef[];
  confidence: number;
  confidence_label: "high" | "medium" | "low";
  conflict_detected: boolean;
  conflicting_pairs: ConflictPair[];
  session_id?: number;
}

export interface ChatStreamHandlers {
  onMeta: (meta: ChatMeta) => void;
  onToken: (content: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export async function streamChat(
  query: string,
  history: { role: string; content: string }[],
  sessionId: number | null,
  handlers: ChatStreamHandlers,
  documentId?: number | null
) {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        query,
        session_id: sessionId,
        history,
        document_id: documentId,
      }),
    });
  } catch (err) {
    handlers.onError(
      "Can't reach the DocMind AI backend. Check that it's running."
    );
    return;
  }

  if (!res.ok || !res.body) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* response wasn't JSON */
    }
    handlers.onError(`Request failed (${res.status}): ${detail}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.replace(/^data:\s*/, "");
        if (!jsonStr) continue;

        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === "meta") {
            handlers.onMeta(parsed as ChatMeta);
          } else if (parsed.type === "token") {
            handlers.onToken(parsed.content);
          } else if (parsed.type === "done") {
            handlers.onDone();
          } else if (parsed.type === "error") {
            handlers.onError(parsed.error || "Stream error");
          }
        } catch {
          // non-JSON frame, ignore
        }
      }
    }
    handlers.onDone();
  } catch (err) {
    handlers.onError(err instanceof Error ? err.message : "Stream read error");
  }
}
