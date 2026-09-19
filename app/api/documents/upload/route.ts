import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ detail: "No file provided." }, { status: 400 });
    }

    const filename = file.name;
    const ext = filename.includes(".") ? "." + filename.split(".").pop()?.toLowerCase() : "";
    if (![".pdf", ".docx", ".txt"].includes(ext)) {
      return NextResponse.json(
        { detail: "Only PDF, DOCX, and TXT files are supported." },
        { status: 400 }
      );
    }

    // Check duplicate
    const existing = store.documents.find((d) => d.title.toLowerCase() === filename.toLowerCase());
    if (existing) {
      return NextResponse.json({
        document: {
          id: existing.id,
          title: existing.title,
          file_type: existing.file_type,
          file_size_bytes: existing.file_size_bytes,
          chunk_count: existing.chunk_count,
          status: existing.status,
          error_message: existing.error_message,
          upload_date: existing.upload_date,
          collection_id: existing.collection_id,
        },
        is_duplicate: true,
        message: "This document was already uploaded and indexed — skipped re-processing.",
      });
    }

    // Read text from file using proper parsers
    let text = "";
    try {
      const buffer = await file.arrayBuffer();
      const nodeBuffer = Buffer.from(buffer);

      if (ext === ".pdf") {
        try {
          const { extractText } = await import("unpdf");
          const uint8 = new Uint8Array(buffer);
          const { text: extractedPages } = await extractText(uint8);
          const mergedText = Array.isArray(extractedPages)
            ? extractedPages.join("\n\n")
            : (extractedPages || "");

          const cleaned = mergedText
            .replace(/\r\n/g, "\n")
            .replace(/[^\S\r\n]+/g, " ")
            .trim();

          if (cleaned.length >= 20) {
            text = cleaned;
          } else {
            text = `[Document: ${filename}]\nNote: This PDF document contains primarily scanned images, diagrams, or non-selectable visual pages without an embedded digital text layer. No readable text characters could be extracted. Please ensure the PDF has an OCR text layer enabled to query its detailed contents.`;
          }
        } catch (pdfErr: any) {
          console.error("PDF parsing error:", pdfErr);
          text = `[Document: ${filename}]\nUnable to extract text layer from PDF: ${pdfErr?.message || "format error"}.`;
        }
      } else if (ext === ".docx") {
        try {
          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ buffer: nodeBuffer });
          text = result.value.trim();
          if (!text) {
            text = `[Document: ${filename}]\nNote: This Word document appears to be empty or contains only non-text media.`;
          }
        } catch (docxErr: any) {
          console.error("DOCX parsing error:", docxErr);
          text = `[Document: ${filename}]\nUnable to extract text from DOCX file.`;
        }
      } else if (ext === ".txt") {
        const dec = new TextDecoder("utf-8", { fatal: false });
        text = dec.decode(buffer).trim();
      }

      // Safety check: ensure no raw PDF binary stream artifacts leak into RAG
      if (text.includes("%PDF-") || text.includes("/Type /Page") || text.includes("/Font <<") || text.includes("/MediaBox")) {
        text = text
          .replace(/%PDF-[\s\S]*?endobj/g, "")
          .replace(/<<[\s\S]*?>>/g, "")
          .replace(/stream[\s\S]*?endstream/g, "")
          .trim();
        if (!text || text.length < 20) {
          text = `[Document: ${filename}]\nThis PDF is a binary/scanned document without an accessible text layer.`;
        }
      }
    } catch (err: any) {
      console.error("Document read error:", err);
      text = `[Document: ${filename}]\nError reading document content.`;
    }

    if (!text || text.trim().length === 0) {
      text = `[Document: ${filename}]\nNo readable text could be extracted from this file.`;
    }

    const newDoc = store.addDocument(filename, ext, text);

    return NextResponse.json({
      document: {
        id: newDoc.id,
        title: newDoc.title,
        file_type: newDoc.file_type,
        file_size_bytes: newDoc.file_size_bytes,
        chunk_count: newDoc.chunk_count,
        status: newDoc.status,
        error_message: newDoc.error_message,
        upload_date: newDoc.upload_date,
        collection_id: newDoc.collection_id,
      },
      is_duplicate: false,
      message: `Indexed ${newDoc.chunk_count} chunks.`,
    });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
