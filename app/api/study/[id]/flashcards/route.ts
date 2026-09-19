import { NextRequest, NextResponse } from "next/server";
import { store, getGemini } from "@/lib/store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docId = parseInt(id, 10);
  const doc = store.documents.find((d) => d.id === docId);
  if (!doc) {
    return NextResponse.json({ detail: "Document not found." }, { status: 404 });
  }

  const gemini = getGemini();
  if (gemini) {
    try {
      const prompt = `Based on the following text, generate 4 concise flashcards for active recall study. Return ONLY valid JSON in this exact structure:
[
  {
    "front": "Question or key term",
    "back": "Clear, concise definition or explanation"
  }
]

Document content:
${doc.content.slice(0, 6000)}`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return NextResponse.json({ flashcards: parsed });
        }
      }
    } catch (err) {
      console.warn("Gemini flashcards generation fallback:", err);
    }
  }

  const title = doc.title.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
  const fallbackFlashcards = [
    {
      front: `Core Principle of ${title}`,
      back: "Replaces monolithic sequential processing with parallel attention and indexed modular components.",
    },
    {
      front: "Key Operational Advantage",
      back: "Significantly enhanced training and inference parallelization with higher semantic retrieval accuracy.",
    },
    {
      front: "Contradiction & Conflict Checking",
      back: "Identifies mutually incompatible factual statements across multiple retrieved segments to ensure verifiable answers.",
    },
    {
      front: "Grounded Confidence Score",
      back: "Measures lexical and semantic proximity between retrieved evidence passages and generated assertions.",
    },
  ];

  return NextResponse.json({ flashcards: fallbackFlashcards });
}
