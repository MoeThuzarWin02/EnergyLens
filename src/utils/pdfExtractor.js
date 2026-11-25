
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Configure PDF.js worker for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Extract text from a digitally generated PDF.
 *
 * @param {File} file - PDF file selected by the user.
 * @returns {Promise<Object>} Extracted text and page information.
 */
export async function extractPDFText(file) {
  if (!(file instanceof File)) {
    throw new Error("Please provide a valid PDF file.");
  }

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("Only PDF files are supported.");
  }

  if (file.size === 0) {
    throw new Error("The selected PDF is empty.");
  }

  let pdf;

  try {
    const arrayBuffer = await file.arrayBuffer();

    pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    }).promise;

    const pageTexts = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);

      const content = await page.getTextContent();

      const pageText = content.items
        .filter((item) => "str" in item)
        .map((item) => item.str)
        .join(" ");

      pageTexts.push({
        pageNumber,
        text: pageText.trim(),
      });

      page.cleanup();
    }

    const fullText = pageTexts
      .map((page) => page.text)
      .filter(Boolean)
      .join("\n\n");

    return {
      fileName: file.name,
      totalPages: pdf.numPages,
      extractedText: fullText,
      pageTexts,
      hasText: fullText.trim().length > 0,
      extractionMethod: "pdf-text-extraction",
      status: fullText.trim()
        ? "completed"
        : "ocr_required",
    };

    } catch (error) {
        console.error("PDF extraction error:", error);

        throw new Error(
        `Unable to extract PDF text: ${error.message}`,
        { cause: error }
        );
    } finally {

    if (pdf) {
      await pdf.destroy();
    }
  }
}
