import { GoogleGenAI } from "@google/genai";

export interface StoredUser {
  id: number;
  email: string;
  passwordHash: string;
  isActive: boolean;
}

export interface StoredChunk {
  id: string;
  documentId: number;
  documentTitle: string;
  text: string;
}

export interface StoredDocument {
  id: number;
  title: string;
  file_type: string;
  file_size_bytes: number;
  chunk_count: number;
  status: "processing" | "indexed" | "failed";
  error_message: string | null;
  upload_date: string;
  collection_id: number | null;
  content: string;
  chunks: StoredChunk[];
}

export interface StoredChatMessage {
  id: number;
  sessionId: number;
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  conflictDetected?: boolean;
  sources?: { text: string; source: string; similarity: number }[];
  timestamp: string;
}

export interface StoredSession {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
}

// In-memory persistent state across requests
class MemoryStore {
  users: StoredUser[] = [];
  documents: StoredDocument[] = [];
  sessions: StoredSession[] = [];
  messages: StoredChatMessage[] = [];
  nextUserId = 1;
  nextDocId = 1;
  nextSessionId = 1;
  nextMsgId = 1;

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    // Demo user
    this.users.push({
      id: this.nextUserId++,
      email: "demo@docmind.ai",
      passwordHash: "demo1234",
      isActive: true,
    });

    // Sample documents for instant utility
    const doc1Content = `Attention Is All You Need. The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Self-attention, sometimes called intra-attention is an attention mechanism relating different positions of a single sequence in order to compute a representation of the sequence. Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.`;

    const doc2Content = `Deep Learning Best Practices for Document Retrieval and RAG. Retrieval-Augmented Generation (RAG) optimizes the output of large language models by referencing an authoritative knowledge base outside of training data sources. Key steps include document ingestion, chunking with sliding window overlap, dense vector embedding generation, top-k vector similarity retrieval using cosine distance, and conflict arbitration. Contradiction detection assesses whether retrieved evidence passages make mutually incompatible factual statements, using natural language inference (NLI) cross-encoders to score premise-hypothesis pairs before final generation.`;

    const doc3Content = `Distributed Systems Consistency Models and Latency Trade-offs. In modern cloud-native architectures, the CAP theorem dictates that distributed data stores can provide at most two out of three guarantees: Consistency, Availability, and Partition Tolerance. Eventual consistency guarantees that if no new updates are made to a given data item, all accesses to that item will eventually return the last updated value. Strong consistency ensures that any read operation always returns the most recent write, at the expense of higher tail latencies and reduced write availability during network splits. Vector clocks and consensus algorithms like Raft and Paxos provide reliable coordination across replicated state machines.`;

    this.addDocument("Transformer_Architecture_Whitepaper.pdf", ".pdf", doc1Content);
    this.addDocument("Modern_RAG_and_Conflict_Detection_Guide.txt", ".txt", doc2Content);
    this.addDocument("Distributed_Systems_Consistency_Analysis.docx", ".docx", doc3Content);

    // Initial chat session
    const sessId = this.nextSessionId++;
    this.sessions.push({
      id: sessId,
      userId: 1,
      title: "Transformer architecture questions",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    });

    this.messages.push({
      id: this.nextMsgId++,
      sessionId: sessId,
      role: "user",
      content: "How does multi-head attention improve representation compared to single attention?",
      timestamp: new Date(Date.now() - 3500000).toISOString(),
    });

    this.messages.push({
      id: this.nextMsgId++,
      sessionId: sessId,
      role: "assistant",
      content: "Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. With a single attention head, averaging inhibits this capacity, whereas multiple linear projections expand the model's ability to focus on diverse contextual relationships simultaneously.",
      confidence: 0.96,
      conflictDetected: false,
      sources: [
        {
          source: "Transformer_Architecture_Whitepaper.pdf",
          text: "Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.",
          similarity: 0.94,
        },
      ],
      timestamp: new Date(Date.now() - 3400000).toISOString(),
    });
  }

  addDocument(title: string, file_type: string, content: string): StoredDocument {
    const id = this.nextDocId++;
    const paragraphs = content
      .split(/\n\n|\.\s+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    const chunks: StoredChunk[] = paragraphs.map((text, idx) => ({
      id: `${id}_chunk_${idx}`,
      documentId: id,
      documentTitle: title,
      text,
    }));

    const doc: StoredDocument = {
      id,
      title,
      file_type,
      file_size_bytes: Buffer.byteLength(content, "utf8"),
      chunk_count: chunks.length,
      status: "indexed",
      error_message: null,
      upload_date: new Date().toISOString(),
      collection_id: null,
      content,
      chunks,
    };

    this.documents.push(doc);
    return doc;
  }

  deleteDocument(id: number): boolean {
    const idx = this.documents.findIndex((d) => d.id === id);
    if (idx !== -1) {
      this.documents.splice(idx, 1);
      return true;
    }
    return false;
  }

  findChunks(query: string, limit = 4): { text: string; source: string; similarity: number }[] {
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const scored: { text: string; source: string; similarity: number }[] = [];

    for (const doc of this.documents) {
      for (const chunk of doc.chunks) {
        const textLower = chunk.text.toLowerCase();
        let matchCount = 0;
        for (const term of queryTerms) {
          if (textLower.includes(term)) matchCount++;
        }
        const similarity = queryTerms.length > 0 ? Math.min(0.98, Math.max(0.65, (matchCount / queryTerms.length) * 0.4 + 0.58)) : 0.7;
        scored.push({
          text: chunk.text,
          source: doc.title,
          similarity: Math.round(similarity * 100) / 100,
        });
      }
    }

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, limit);
  }

  getAnalytics() {
    const total_documents = this.documents.length;
    const indexed_documents = this.documents.filter((d) => d.status === "indexed").length;
    const failed_documents = this.documents.filter((d) => d.status === "failed").length;
    const total_chunks = this.documents.reduce((acc, d) => acc + d.chunk_count, 0);
    const storage_bytes = this.documents.reduce((acc, d) => acc + d.file_size_bytes, 0);

    const assistantMessages = this.messages.filter((m) => m.role === "assistant");
    const questions_asked = assistantMessages.length;
    const confidences = assistantMessages.map((m) => m.confidence).filter((c): c is number => c !== undefined);
    const avg_confidence = confidences.length ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100) / 100 : 0.94;
    const conflicts = assistantMessages.filter((m) => m.conflictDetected).length;
    const conflict_rate = questions_asked > 0 ? Math.round((conflicts / questions_asked) * 100) / 100 : 0.0;

    return {
      total_documents,
      indexed_documents,
      failed_documents,
      total_chunks,
      questions_asked,
      avg_confidence,
      conflict_rate,
      storage_bytes,
    };
  }
}

// Global store instance preserved across module evaluations
const globalForStore = globalThis as unknown as { __docmindStore?: MemoryStore };
export const store = globalForStore.__docmindStore ?? new MemoryStore();
if (process.env.NODE_ENV !== "production") globalForStore.__docmindStore = store;

let geminiClient: GoogleGenAI | null = null;
export function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}
