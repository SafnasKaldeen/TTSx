"use client"

import { useState } from "react"
import axios from "axios"

interface CloningResult {
  cloned_audio_url: string
  raw_audio_url?: string
  processing_time: number
  denoised: boolean
}

interface CloningProgress {
  stage: string
  message?: string
  reference_audio?: string
  target_audio?: string
  raw_audio_url?: string
  cloned_audio_url?: string
  processing_time?: number
  error?: string
}

interface UseAudioClonerResult {
  loading: boolean
  error: string | null
  result: CloningResult | null
  statusStage: string | null
  referenceAudio: string | null
  cloneAudio: (
    referenceAudio: string,
    targetAudio: string,
    onProgress?: (data: CloningProgress) => void,
  ) => Promise<void>
}

export const useAudioCloner = (): UseAudioClonerResult => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CloningResult | null>(null)
  const [statusStage, setStatusStage] = useState<string | null>(null)
  const [referenceAudio, setReferenceAudio] = useState<string | null>(null)

  // Update the cloneAudio function to better handle the file paths

  const cloneAudio = async (
    referenceAudio: string,
    targetAudio: string,
    onProgress?: (data: CloningProgress) => void,
  ) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setReferenceAudio(referenceAudio)

    try {
      // Step 1: Clone audio
      setStatusStage("cloning")
      onProgress?.({
        stage: "cloning",
        reference_audio: referenceAudio,
        target_audio: targetAudio,
      })

      console.log("Cloning audio with reference:", referenceAudio, "and target:", targetAudio)

      const cloningResponse = await axios.post("http://127.0.0.1:8000/api/Clone-tts", {
        // ReferenceWAV: referenceAudio,
        // TargetWAV: targetAudio,
        ReferenceWAV: "/Audios/ReferenceAudio.wav",
        TargetWAV: "/Audios/TargetAudio.wav",
      })

      console.log("Cloning response:", cloningResponse)

      // Handle the string response from the API
      const responseData = cloningResponse.data
      const rawAudioUrl = typeof responseData === "string" ? responseData : responseData.cloned_audio_path
      const processingTime = typeof responseData === "string" ? 0 : responseData.processing_time || 0

      onProgress?.({
        stage: "cloning_complete",
        raw_audio_url: rawAudioUrl,
        processing_time: processingTime,
      })

      // Step 2: Denoise audio
      setStatusStage("denoising")
      onProgress?.({ stage: "denoising" })

      const denoiseResponse = await axios.post("http://localhost:8000/api/denoise_audio", {
        file_path: rawAudioUrl,
      })

      if (denoiseResponse.status === 200) {
        // Handle both string and object responses
        const denoisedData = denoiseResponse.data
        const denoisedAudioUrl =
          typeof denoisedData === "string"
            ? denoisedData
            : denoisedData.denoised_audio_path || "/Audios/denoised_audio.wav"

        const rawAudioPath =
          typeof denoisedData === "string" ? rawAudioUrl : denoisedData.raw_audio_path || "/Audios/ClonedAudio.wav"

        const denoisingTime = typeof denoisedData === "string" ? 0 : denoisedData.processing_time || 0
        const totalProcessingTime = processingTime + denoisingTime

        const finalResult: CloningResult = {
          cloned_audio_url: denoisedAudioUrl,
          raw_audio_url: rawAudioPath,
          processing_time: totalProcessingTime,
          denoised: true,
        }

        setResult(finalResult)
        setStatusStage("complete")
        onProgress?.({
          stage: "complete",
          cloned_audio_url: denoisedAudioUrl,
          raw_audio_url: rawAudioPath,
          processing_time: totalProcessingTime,
        })
      } else {
        throw new Error("Denoising failed with non-200 response")
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err.message || "Something went wrong during audio cloning."
      const errorStage = err?.response?.data?.status_stage || "error"
      console.error("Audio cloning error:", err)
      setError(errorMsg)
      setStatusStage(errorStage)
      onProgress?.({ stage: errorStage, error: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    result,
    statusStage,
    referenceAudio,
    cloneAudio,
  }
}
