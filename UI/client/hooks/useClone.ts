import { useState } from "react";
import axios from "axios";

export interface VoiceCloningInput {
  TargetWAV: string;
  ReferenceWAV: string;
}

export interface VoiceCloneResult {
  status: string;
  message?: string;
  raw_audio_url?: string; // The cloned audio url before denoise
  audio_url?: string;     // Might be final url after denoise
  processing_time?: number;
  [key: string]: any;
}

export interface DenoiseResult {
  status: string;
  denoised_audio_url?: string;
  message?: string;
}

export interface CombinedProcessProgress {
  stage:
    | "starting"
    | "cloning"
    | "cloning_complete"
    | "denoising"
    | "denoising_complete"
    | "error";
  message?: string;
}

interface UseCloneWithDenoiseResult {
  loading: boolean;
  error: string | null;
  cloneResult: VoiceCloneResult | null;
  denoiseResult: DenoiseResult | null;
  statusStage: CombinedProcessProgress["stage"] | null;
  cloneAndDenoise: (
    input: VoiceCloningInput,
    onProgress?: (progress: CombinedProcessProgress) => void
  ) => Promise<void>;
}

export const useCloneWithDenoise = (): UseCloneWithDenoiseResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloneResult, setCloneResult] = useState<VoiceCloneResult | null>(null);
  const [denoiseResult, setDenoiseResult] = useState<DenoiseResult | null>(null);
  const [statusStage, setStatusStage] = useState<CombinedProcessProgress["stage"] | null>(null);

  const useClone = async (
    input: VoiceCloningInput,
    onProgress?: (progress: CombinedProcessProgress) => void
  ) => {
    setLoading(true);
    setError(null);
    setCloneResult(null);
    setDenoiseResult(null);
    setStatusStage("starting");
    onProgress?.({ stage: "starting", message: "Starting voice cloning..." });

    try {
      // 1. Clone voice
      setStatusStage("cloning");
      onProgress?.({ stage: "cloning", message: "Cloning voice in progress..." });

      const cloneResponse = await axios.post<VoiceCloneResult>(
        "http://127.0.0.1:8000/Clone-tts",
        input
      );

      if (cloneResponse.data.status === "error") {
        throw new Error(cloneResponse.data.message || "Voice cloning failed");
      }

      setCloneResult(cloneResponse.data);
      setStatusStage("cloning_complete");
      onProgress?.({ stage: "cloning_complete", message: "Voice cloning complete" });

      // 2. Denoise cloned audio
      if (!cloneResponse.data.raw_audio_url) {
        throw new Error("No raw_audio_url in cloning response");
      }

      setStatusStage("denoising");
      onProgress?.({ stage: "denoising", message: "Denoising cloned audio..." });

      const denoiseResponse = await axios.post<DenoiseResult>(
        "http://127.0.0.1:8000/api/denoise",
        { audio_url: cloneResponse.data.raw_audio_url }
      );

      if (denoiseResponse.data.status === "error") {
        throw new Error(denoiseResponse.data.message || "Denoising failed");
      }

      setDenoiseResult(denoiseResponse.data);
      setStatusStage("denoising_complete");
      onProgress?.({ stage: "denoising_complete", message: "Denoising complete" });

    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || "Unknown error";
      setError(message);
      setStatusStage("error");
      onProgress?.({ stage: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    cloneResult,
    denoiseResult,
    statusStage,
    cloneAndDenoise,
  };
};
