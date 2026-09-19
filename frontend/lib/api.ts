const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
    // Same root cause as the chat stream: fetch() throws directly (not a
    // rejected HTTP response) when the backend is unreachable. Every caller
    // of request() goes through this one place, so catching it here means
    // no page-level try/catch can be forgotten and leave an unhandled
    // rejection on the table.
    throw new ApiError(0, `Can't reach the DocMind AI backend at ${API_BASE}. Is it running?`);
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
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);
  const data = await request<{ access_token: string }>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  setToken(data.access_token);
  return data;
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

export async function uploadDocument(file: File) {
  const form = new FormData();
  form.append("file", file);
  return request<{ document: DocumentRecord; is_duplicate: boolean; message: string }>(
    "/api/documents/upload",
    { method: "POST", body: form }
  );
}

export async function deleteDocument(id: number) {
  return request<void>(`/api/documents/${id}`, { method: "DELETE" });
}

// ---- Profile ----

export interface UserProfile {
  id: number;
  email: string;
  is_active: boolean;
}

export async function getMe(): Promise<UserProfile> {
  return request<UserProfile>("/api/auth/me");
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

// ---- Study tools ----

export async function generateSummary(documentId: number) {
  return request<{ summary: string }>(`/api/study/${documentId}/summary`, { method: "POST" });
}

export async function generateQuiz(documentId: number) {
  return request<{ questions: { question: string; options: string[]; correct_index: number }[] }>(
    `/api/study/${documentId}/quiz`,
    { method: "POST" }
  );
}

export async function generateFlashcards(documentId: number) {
  return request<{ flashcards: { front: string; back: string }[] }>(
    `/api/study/${documentId}/flashcards`,
    { method: "POST" }
  );
}

// ---- Backend health ----

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/`, { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ---- Chat (SSE streaming) ----

export interface SourceRef {
  text: string;
  source: string;
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
  handlers: ChatStreamHandlers
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
      body: JSON.stringify({ query, session_id: sessionId, history }),
    });
  } catch (err) {
    // fetch() itself throws (not a rejected response) when the backend is
    // unreachable — wrong port, backend not running, CORS blocked, DNS
    // failure, etc. This is the root cause of the previously-unhandled
    // "TypeError: network error" — it must be caught here, not left to
    // propagate as an unhandled promise rejection.
    handlers.onError(
      "Can't reach the DocMind AI backend. Check that it's running at " + API_BASE + "."
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
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const frames = buffer.split("\n\n");
      buffer = frames.pop() || ""; // last (possibly incomplete) frame stays in the buffer

      for (const frame of frames) {
        const line = frame.trim();
        if (!line.startsWith("data:")) continue;
        const event = JSON.parse(line.slice(5).trim());

        if (event.type === "meta") handlers.onMeta(event as ChatMeta);
        else if (event.type === "token") handlers.onToken(event.content);
        else if (event.type === "done") handlers.onDone();
      }
    }
  } catch (err) {
    // The connection can also drop mid-stream (backend crash, network blip).
    handlers.onError(err instanceof Error ? err.message : "Connection lost while streaming the response.");
  }
}
