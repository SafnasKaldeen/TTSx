import { useState } from "react";
import axios from "axios";
import { time } from "console";

interface TTSResult {
  audio_url: string;
  raw_audio_url?: string;
  processing_time: number;
  cleaned: boolean;
}

interface TTSProgress {
  stage: string;
  message?: string;
  preprocessText?: string;
  raw_audio_url?: string;
  audio_url?: string;
  processing_time?: number;
  error?: string;
}

interface UseTTSProcessorResult {
  loading: boolean;
  error: string | null;
  result: TTSResult | null;
  statusStage: string | null;
  preprocessText: string | null;
  processText: (
    text: string,
    speakerID: string,
    onProgress?: (data: TTSProgress) => void
  ) => Promise<void>;
}

export const useTTSProcessor = (): UseTTSProcessorResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TTSResult | null>(null);
  const [statusStage, setStatusStage] = useState<string | null>(null);
  const [preprocessText, setPreprocessText] = useState<string | null>(null);

  const processText = async (
    text: string,
    speakerID: string,
    onProgress?: (data: TTSProgress) => void
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Step 1: Preprocess
      setStatusStage("preprocessing");
      onProgress?.({ stage: "preprocessing" });
      
      const preprocessResponse = await axios.post("http://127.0.0.1:8000/api/preprocess", { text });
      const preprocessedText = preprocessResponse.data.processed_text;
      setPreprocessText(preprocessedText);
      // alert("Preprocessed text: " + preprocessedText);
      // Update status after preprocessing completes
      onProgress?.({ 
        stage: "preprocessing_complete", 
        preprocessText: preprocessedText 
      });
      
      // Step 2: Infer TTS
      setStatusStage("synthesizing");
      onProgress?.({ stage: "synthesizing" });

      const ttsResponse = await axios.post("http://127.0.0.1:8000/api/infer-tts", {
        preprocessed_text: preprocessedText,
        speakerID: speakerID,
      });

      var rawAudioUrl = ttsResponse.data.audio_path;
      const processingTime = ttsResponse.data.processing_time;
      // alert("Raw audio URL: " + rawAudioUrl);
      // alert("Processing time: " + processingTime);
      // Update status after synthesizing completes
      onProgress?.({
        stage: "synthesizing_complete",
        raw_audio_url: rawAudioUrl,
        processing_time: processingTime,
      });
      
      // Step 3: Clean Audio
      setStatusStage("cleaning");
      onProgress?.({ stage: "cleaning" });
      
      // const cleanResponse = await axios.post("http://localhost:8000/api/clean_audio", {
      //   file_path: rawAudioUrl,
      // });

      // const cleanedAudioUrl = cleanResponse.data.download_path;
      const cleanedAudioUrl = "/Audios/cleaned_audio.wav";
      rawAudioUrl = "/Audios/InitialInference.wav"
      // alert("Cleaned audio URL: " + cleanedAudioUrl);
    
      const finalResult: TTSResult = {
        audio_url: cleanedAudioUrl,
        raw_audio_url: rawAudioUrl,
        processing_time: processingTime,
        cleaned: true,
      };

      setResult(finalResult);
      setStatusStage("complete");
      onProgress?.({
        stage: "complete",
        audio_url: cleanedAudioUrl,
        raw_audio_url: rawAudioUrl,
        processing_time: processingTime,
      });
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Something went wrong.";
      const errorStage = err?.response?.data?.status_stage || "error";
      console.error("TTS processing error:", err);
      setError(errorMsg);
      setStatusStage(errorStage);
      onProgress?.({ stage: errorStage, error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    result,
    statusStage,
    preprocessText,
    processText,
  };
};