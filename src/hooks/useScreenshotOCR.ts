import { useState, useCallback } from "react";

export function useScreenshotOCR() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractText = useCallback(async (file: File): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();
      return text;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "OCR failed";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { extractText, loading, error };
}
