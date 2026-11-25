
import { extractPDFText } from "../utils/pdfExtractor";
import { extractImageText } from "../utils/imageOCR";

/**
 * Process an uploaded PDF or image.
 *
 * @param {File} file
 * @returns {Promise<Object>}
 */
export async function processOCRDocument(file) {
  if (!(file instanceof File)) {
    throw new Error("Please select a valid document.");
  }

  if (file.size === 0) {
    throw new Error("The selected document is empty.");
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  if (
    !allowedTypes.includes(file.type) &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("Unsupported document format.");
  }

  try {
    let result;

    if (file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")) {

      result = await extractPDFText(file);

      // A scanned PDF may have no embedded text.
      if (!result.hasText) {
        throw new Error(
          "This PDF contains no extractable text. Scanned PDF OCR is not yet implemented."
        );
      }

    } else {
      result = await extractImageText(file);
    }

    return {
      ...result,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      processedAt: new Date().toISOString(),
      processingStatus: "completed",
    };

  } catch (error) {
    console.error("OCR document processing failed:", error);

    throw new Error(
      `Document processing failed: ${error.message}`,
      { cause: error }
    );
  }
}
