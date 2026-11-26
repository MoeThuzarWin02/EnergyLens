
import { createWorker } from "tesseract.js";

/**
 * Extract text from JPG, JPEG and PNG images.
 * Processing takes place locally in the browser.
 *
 * @param {File} file
 * @returns {Promise<Object>}
 */
export async function extractImageText(file) {
  if (!(file instanceof File)) {
    throw new Error("Please provide a valid image file.");
  }

  const supportedTypes = [
    "image/jpeg",
    "image/png",
  ];

  if (!supportedTypes.includes(file.type)) {
    throw new Error("Only JPG, JPEG and PNG images are supported.");
  }

  if (file.size === 0) {
    throw new Error("The selected image is empty.");
  }

  let worker;

  try {
    worker = await createWorker("eng");

    const result = await worker.recognize(file);

    const extractedText = result.data.text.trim();

    return {
      fileName: file.name,
      extractedText,
      confidence: result.data.confidence,
      extractionMethod: "tesseract-ocr",
      status: extractedText ? "completed" : "failed",
    };
  } catch (error) {
    console.error("Image OCR error:", error);

    throw new Error(
      `Unable to process image: ${error.message}`,
      { cause: error }
    );
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
