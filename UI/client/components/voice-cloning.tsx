"use client";

import type React from "react";

import axios from "axios";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AudioSamplesSection from "@/components/AudioSamplesSection"; // adjust path as needed
import { AudioPlayer } from "@/components/audio-player";
import {
  Mic,
  Upload,
  RefreshCw,
  Check,
  X,
  ChevronDown,
  FileAudio,
  ChevronUp,
  Plus,
  Trash2,
  Wand2,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  Download,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useAudioCloner } from "@/hooks/useAudioCloner";

type RecordingState = "idle" | "recording" | "paused" | "processing" | "ready";

interface AudioSample {
  id: string;
  url: string;
  name: string;
  size?: string;
  duration?: string;
  filePath?: string; // Server path after upload
}

interface VoiceCloningProps {
  audioForCloning?: string | null;
  onVoiceCloned?: () => void;
  onClearAudioForCloning?: () => void;
}

export function VoiceCloning({
  audioForCloning,
  onVoiceCloned,
  onClearAudioForCloning,
}: VoiceCloningProps) {
  // Recording states for two audio inputs
  const [recordingState1, setRecordingState1] =
    useState<RecordingState>("idle");
  const [recordingState2, setRecordingState2] =
    useState<RecordingState>("idle");
  const [recordingTime1, setRecordingTime1] = useState(0);
  const [recordingTime2, setRecordingTime2] = useState(0);

  const [voiceCloned, setVoiceCloned] = useState(false);
  const [similarity, setSimilarity] = useState(85);
  const [cloningStep, setCloningStep] = useState(0); // 0: not started, 1-4: steps
  const [isCloning, setIsCloning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Files for audio inputs
  const [uploadedFile1, setUploadedFile1] = useState<File | null>(null);
  const [audioUrl1, setAudioUrl1] = useState<string | null>(null);

  // Multiple audio samples for second input
  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([]);
  const [expandedSampleId, setExpandedSampleId] = useState<string | null>(null);
  const [isSecondSectionExpanded, setIsSecondSectionExpanded] = useState(true);

  const [clonedAudioUrl, setClonedAudioUrl] = useState(""); // Demo audio for now
  const [clonedAudioRawUrl, setClonedAudioRawUrl] = useState(""); // Demo raw audio
  const [isDenoised, setIsDenoised] = useState<boolean>(true);
  const [voiceRating, setVoiceRating] = useState<number>(0);

  // Store server file paths
  const [referenceAudioPath, setReferenceAudioPath] = useState<string>("");
  const [targetAudioPaths, setTargetAudioPaths] = useState<string[]>([]);

  // Refs for file inputs and timers
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const timerRef1 = useRef<NodeJS.Timeout | null>(null);
  const timerRef2 = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Media recorder states
  const [mediaRecorder1, setMediaRecorder1] = useState<MediaRecorder | null>(
    null
  );
  const [mediaRecorder2, setMediaRecorder2] = useState<MediaRecorder | null>(
    null
  );
  const audioChunks1Ref = useRef<Blob[]>([]);
  const audioChunks2Ref = useRef<Blob[]>([]);

  // Use the audio cloner hook
  const { loading, error, result, statusStage, referenceAudio, cloneAudio } =
    useAudioCloner();

  // Add a download function for cloned audio
  const handleDownloadClonedVoice = () => {
    // Create an anchor element
    const a = document.createElement("a");
    a.href = clonedAudioUrl;
    a.download = "cloned-voice.mp3";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Clean up all files in the uploads directory except for the ones to keep
  const cleanupUploadedFiles = async (filesToKeep: string[] = []) => {
    try {
      // Clean up all uploaded files except those specified in filesToKeep
      const response = await axios.post("/api/cleanup-uploads", {
        filesToKeep: filesToKeep,
      });
      console.log("Cleanup response:", response.data);
    } catch (error) {
      console.error("Error cleaning up files:", error);
    }
  };

  // Clean up previous reference audio files when a new one is uploaded
  const cleanupPreviousReferenceAudio = async (newReferencePath: string) => {
    try {
      // Keep all target audio files and the new reference audio
      const filesToKeep = [...targetAudioPaths, newReferencePath];
      await cleanupUploadedFiles(filesToKeep);
      console.log("Previous reference audio files cleaned up");
    } catch (error) {
      console.error("Error cleaning up previous reference audio:", error);
    }
  };

  // Handle incoming audio from TTS
  useEffect(() => {
    if (audioForCloning) {
      // If already cloned, reset the cloning state
      if (voiceCloned) {
        setVoiceCloned(false);
        setCloningStep(0);
      }

      // Automatically populate the first audio input with the generated audio
      setAudioUrl1(audioForCloning);
      setRecordingState1("processing"); // Show processing state while handling the TTS audio

      // Upload the TTS audio to the server
      const uploadTTSAudio = async () => {
        try {
          // Fetch the audio file from the URL
          const response = await fetch(audioForCloning);
          const blob = await response.blob();

          // Create a File object from the blob
          const fileName = `tts-audio.wav`;
          const file = new File([blob], fileName, { type: "audio/wav" });

          // Upload the file to the server as reference audio
          const filePath = await uploadAudioFile(file, true);
          if (filePath) {
            // Clean up previous reference audio files
            await cleanupPreviousReferenceAudio(filePath);

            setReferenceAudioPath(filePath);
            setRecordingState1("ready");
            console.log(
              "TTS audio uploaded successfully as reference audio:",
              filePath
            );
          } else {
            // Handle upload failure
            setRecordingState1("idle");
            alert("Failed to upload TTS audio as reference. Please try again.");
          }
        } catch (error) {
          console.error("Error uploading TTS audio:", error);
          setRecordingState1("idle");
          setUploadError("Failed to process TTS audio. Please try again.");
        }
      };

      uploadTTSAudio();

      // Clear the audio for cloning since we've used it
      if (onClearAudioForCloning) {
        onClearAudioForCloning();
      }
    }
  }, [audioForCloning, onClearAudioForCloning, voiceCloned, targetAudioPaths]);

  // Upload a file to the server with proper metadata
  const uploadAudioFile = async (
    file: File,
    isReference = false,
    targetIndex?: number
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("isReference", isReference ? "true" : "false");
    if (targetIndex !== undefined) {
      formData.append("targetIndex", targetIndex.toString());
    }

    try {
      console.log(
        `Uploading ${isReference ? "reference" : "target"} file:`,
        file
      );
      setUploadError(null);
      setUploadProgress(0);

      const response = await axios.post("/api/upload-audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
            console.log(`Upload progress: ${progress}%`);
          }
        },
      });

      setUploadProgress(100);
      return response.data.file_path;
    } catch (err) {
      console.error("File upload failed:", err);
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      return null;
    }
  };

  // Handle file upload for first audio input (reference audio)
  const handleFileUpload1 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset cloning state if already cloned
      if (voiceCloned) {
        setVoiceCloned(false);
        setCloningStep(0);
      }

      setUploadedFile1(file);
      const url = URL.createObjectURL(file);
      setAudioUrl1(url);
      setRecordingState1("processing"); // Show processing state while uploading

      // Upload the file to the server as reference audio
      const filePath = await uploadAudioFile(file, true);
      if (filePath) {
        // Clean up previous reference audio files
        await cleanupPreviousReferenceAudio(filePath);

        setReferenceAudioPath(filePath);
        setRecordingState1("ready");
      } else {
        // Handle upload failure
        setRecordingState1("idle");
        alert("Failed to upload reference audio. Please try again.");
      }
    }
  };

  // Handle multiple file upload for second audio input (target audio)
  const handleFileUpload2 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setRecordingState2("processing"); // Show processing state while uploading

      const newSamples: AudioSample[] = [];
      const newPaths: string[] = [];

      // Process each file sequentially to avoid overwhelming the server
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = URL.createObjectURL(file);

        // Calculate the target index for this file
        const targetIndex = targetAudioPaths.length + i + 1;

        // Create sample object
        const newSample: AudioSample = {
          id: `upload-${Date.now()}-${i}`,
          url: url,
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          duration: "00:00", // This would be determined after loading the audio
        };

        // Upload the file to the server as target audio
        const filePath = await uploadAudioFile(file, false, targetIndex);
        if (filePath) {
          newSample.filePath = filePath;
          newPaths.push(filePath);
        }

        newSamples.push(newSample);
      }

      // Update state with new samples and paths
      setAudioSamples((prev) => [...prev, ...newSamples]);
      setTargetAudioPaths((prev) => [...prev, ...newPaths]);
      setRecordingState2("ready");

      // Auto-expand the first new sample if none are expanded
      if (expandedSampleId === null && newSamples.length > 0) {
        setExpandedSampleId(newSamples[0].id);
      }
    }
  };

  // Request microphone access and set up MediaRecorder for reference audio
  const setupAudioRecording1 = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      audioChunks1Ref.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks1Ref.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks1Ref.current, {
          type: "audio/wav",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl1(audioUrl);

        // Create file from blob
        const fileName = `reference-audio-${Date.now()}.wav`;
        const audioFile = new File([audioBlob], fileName, {
          type: "audio/wav",
        });
        setUploadedFile1(audioFile);

        // Upload file
        setRecordingState1("processing");
        const filePath = await uploadAudioFile(audioFile, true);

        if (filePath) {
          // Clean up previous reference audio files
          await cleanupPreviousReferenceAudio(filePath);

          setReferenceAudioPath(filePath);
          setRecordingState1("ready");
        } else {
          setRecordingState1("idle");
          alert("Failed to upload reference audio. Please try again.");
        }
      };

      setMediaRecorder1(recorder);
      return recorder;
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
      return null;
    }
  };

  // Request microphone access and set up MediaRecorder for target audio
  const setupAudioRecording2 = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      audioChunks2Ref.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks2Ref.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks2Ref.current, {
          type: "audio/wav",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Create target audio file
        const targetIndex = targetAudioPaths.length + 1;
        const fileName = `target-audio-${Date.now()}.wav`;
        const audioFile = new File([audioBlob], fileName, {
          type: "audio/wav",
        });

        // Create sample object
        const newSample: AudioSample = {
          id: `recording-${Date.now()}`,
          url: audioUrl,
          name: `Voice Recording ${targetIndex}`,
          duration: formatTime(recordingTime2),
          size: `${Math.round(audioBlob.size / 1024)} KB`,
        };

        // Upload the file
        setRecordingState2("processing");
        const filePath = await uploadAudioFile(audioFile, false, targetIndex);

        if (filePath) {
          newSample.filePath = filePath;
          setAudioSamples((prev) => [...prev, newSample]);
          setTargetAudioPaths((prev) => [...prev, filePath]);
          setExpandedSampleId(newSample.id);
          setRecordingState2("ready");
        } else {
          setRecordingState2("idle");
          alert("Failed to upload target audio. Please try again.");
        }
      };

      setMediaRecorder2(recorder);
      return recorder;
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
      return null;
    }
  };

  // Start recording for first audio input
  const startRecording1 = async () => {
    // Reset cloning state if already cloned
    if (voiceCloned) {
      setVoiceCloned(false);
      setCloningStep(0);
    }

    let recorder = mediaRecorder1;
    if (!recorder) {
      recorder = await setupAudioRecording1();
      if (!recorder) return;
    }

    setRecordingState1("recording");
    setRecordingTime1(0);

    // Start recording with 1-second chunks
    audioChunks1Ref.current = [];
    recorder.start(1000);

    // Simulate recording timer
    timerRef1.current = setInterval(() => {
      setRecordingTime1((prev) => {
        if (prev >= 60) {
          stopRecording1();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Start recording for second audio input
  const startRecording2 = async () => {
    let recorder = mediaRecorder2;
    if (!recorder) {
      recorder = await setupAudioRecording2();
      if (!recorder) return;
    }

    setRecordingState2("recording");
    setRecordingTime2(0);

    // Start recording with 1-second chunks
    audioChunks2Ref.current = [];
    recorder.start(1000);

    // Simulate recording timer
    timerRef2.current = setInterval(() => {
      setRecordingTime2((prev) => {
        if (prev >= 60) {
          stopRecording2();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Pause recording for first audio input
  const pauseRecording1 = () => {
    if (mediaRecorder1 && mediaRecorder1.state === "recording") {
      mediaRecorder1.pause();
    }

    setRecordingState1("paused");
    if (timerRef1.current) {
      clearInterval(timerRef1.current);
      timerRef1.current = null;
    }
  };

  // Pause recording for second audio input
  const pauseRecording2 = () => {
    if (mediaRecorder2 && mediaRecorder2.state === "recording") {
      mediaRecorder2.pause();
    }

    setRecordingState2("paused");
    if (timerRef2.current) {
      clearInterval(timerRef2.current);
      timerRef2.current = null;
    }
  };

  // Resume recording for first audio input
  const resumeRecording1 = () => {
    if (mediaRecorder1 && mediaRecorder1.state === "paused") {
      mediaRecorder1.resume();
    }

    setRecordingState1("recording");
    timerRef1.current = setInterval(() => {
      setRecordingTime1((prev) => {
        if (prev >= 60) {
          stopRecording1();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Resume recording for second audio input
  const resumeRecording2 = () => {
    if (mediaRecorder2 && mediaRecorder2.state === "paused") {
      mediaRecorder2.resume();
    }

    setRecordingState2("recording");
    timerRef2.current = setInterval(() => {
      setRecordingTime2((prev) => {
        if (prev >= 60) {
          stopRecording2();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Stop recording for first audio input
  const stopRecording1 = () => {
    if (timerRef1.current) {
      clearInterval(timerRef1.current);
      timerRef1.current = null;
    }

    if (mediaRecorder1 && mediaRecorder1.state !== "inactive") {
      mediaRecorder1.stop();
    }

    if (recordingTime1 < 5) {
      // Too short
      setRecordingState1("idle");
      alert("Recording too short. Please record at least 5 seconds.");
      return;
    }

    // The actual upload happens in the onstop event handler of the mediaRecorder
  };

  // Stop recording for second audio input
  const stopRecording2 = () => {
    if (timerRef2.current) {
      clearInterval(timerRef2.current);
      timerRef2.current = null;
    }

    if (mediaRecorder2 && mediaRecorder2.state !== "inactive") {
      mediaRecorder2.stop();
    }

    if (recordingTime2 < 5) {
      // Too short
      setRecordingState2("idle");
      alert("Recording too short. Please record at least 5 seconds.");
      return;
    }

    // The actual upload happens in the onstop event handler of the mediaRecorder
  };

  // Reset first audio input
  const resetAudio1 = () => {
    setRecordingState1("idle");
    setAudioUrl1(null);
    setUploadedFile1(null);
    setReferenceAudioPath("");

    // Clean up the reference audio file
    cleanupUploadedFiles(targetAudioPaths);
  };

  // Remove a specific audio sample
  const removeSample = (id: string) => {
    // Find the index of the sample to remove
    const sampleIndex = audioSamples.findIndex((sample) => sample.id === id);
    if (sampleIndex !== -1) {
      // Get the path of the sample to remove
      const pathToRemove = audioSamples[sampleIndex].filePath;

      // Remove the corresponding path from targetAudioPaths
      const newTargetPaths = [...targetAudioPaths];
      newTargetPaths.splice(sampleIndex, 1);
      setTargetAudioPaths(newTargetPaths);

      // Clean up the removed file
      if (pathToRemove) {
        const filesToKeep = [referenceAudioPath, ...newTargetPaths];
        cleanupUploadedFiles(filesToKeep);
      }
    }

    // Remove the sample from audioSamples
    setAudioSamples((prev) => prev.filter((sample) => sample.id !== id));

    // If the removed sample was expanded, collapse all
    if (expandedSampleId === id) {
      setExpandedSampleId(null);
    }

    // If no samples left, reset recording state
    if (audioSamples.length <= 1) {
      setRecordingState2("idle");
    }
  };

  // Toggle expanded state of a sample
  const toggleSample = (id: string) => {
    setExpandedSampleId(expandedSampleId === id ? null : id);
  };

  const triggerFileUpload1 = () => {
    if (fileInputRef1.current) {
      fileInputRef1.current.click();
    }
  };

  const triggerFileUpload2 = () => {
    if (fileInputRef2.current) {
      fileInputRef2.current.click();
    }
  };

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const cloneVoice = async () => {
    setIsCloning(true);
    setUploadError(null);

    try {
      console.log("Starting voice cloning process...");

      if (!referenceAudioPath) {
        throw new Error(
          "No reference audio path available. Please upload reference audio first."
        );
      }

      if (targetAudioPaths.length === 0) {
        throw new Error(
          "No target audio paths available. Please upload at least one target audio file."
        );
      }

      const primaryTargetPath = targetAudioPaths[0];

      // 🔁 Start API call immediately
      const clonePromise = cloneAudio(
        referenceAudioPath,
        primaryTargetPath,
        async (progressData) => {
          console.log("Cloning progress:", progressData);

          if (progressData.stage === "cloning_complete") {
            if (progressData.raw_audio_url) {
              setClonedAudioRawUrl(progressData.raw_audio_url);
              console.log("Raw audio URL set:", progressData.raw_audio_url);
            }
          }

          if (progressData.stage === "complete") {
            // ✅ Step 4
            setCloningStep(4);
            await delay(2000); // Hold step 4 for 1s

            if (progressData.cloned_audio_url) {
              setClonedAudioUrl(progressData.cloned_audio_url);
              console.log(
                "Cloned audio URL set:",
                progressData.cloned_audio_url
              );
            }

            if (progressData.raw_audio_url) {
              setClonedAudioRawUrl(progressData.raw_audio_url);
            }

            setIsCloning(false);
            setVoiceCloned(true);
            setVoiceRating(0);

            if (onVoiceCloned) onVoiceCloned();
          }
        }
      );

      // 👣 Sequential visual steps before API response
      setCloningStep(1);
      await delay(2000);
      setCloningStep(2);
      await delay(2000);
      setCloningStep(3);

      // ⏳ Wait for API cloning process to finish (via callback)
      await clonePromise;
    } catch (error) {
      console.error("Error during voice cloning:", error);
      setIsCloning(false);
      setUploadError(
        error instanceof Error ? error.message : "Unknown error during cloning"
      );
      alert(
        `Cloning failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Handle similarity slider change
  const handleSimilarityChange = (value: number[]) => {
    setSimilarity(value[0]);
  };

  // Check if we can clone (need at least one audio input)
  const canClone =
    recordingState1 === "ready" &&
    audioSamples.length > 0 &&
    recordingState2 === "ready";

  // Get cloning step information
  const getStepInfo = () => {
    switch (cloningStep) {
      case 1:
        return {
          title: "Analyzing Audio Samples",
          description:
            "Extracting acoustic features from your voice samples...",
          icon: <Layers className="h-10 w-10 text-purple-300" />,
        };
      case 2:
        return {
          title: "Extracting Voice Characteristics",
          description: "Identifying unique patterns in your voice...",
          icon: <Wand2 className="h-10 w-10 text-blue-300" />,
        };
      case 3:
        return {
          title: "Embedding Voice Features",
          description:
            "Mapping your voice to a neural network, then inference...",
          icon: <Sparkles className="h-10 w-10 text-pink-300" />,
        };
      case 4:
        return {
          title: "Finalizing Voice Clone",
          description: "Optimizing and preparing your voice for synthesis...",
          icon: <Zap className="h-10 w-10 text-yellow-300" />,
        };
      default:
        return {
          title: "",
          description: "",
          icon: null,
        };
    }
  };

  const stepInfo = getStepInfo();

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleRatingChange = (value: number) => {
    setVoiceRating(value);
  };

  return (
    <div className="bg-purple-800/30 backdrop-blur-md rounded-3xl p-6 md:p-8 text-white shadow-xl h-full flex flex-col w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">ඔබේ හඬ ක්ලෝන කරන්න</h2>
        <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-medium flex items-center">
          <span className="mr-1">Voice Cloning</span>
          <ChevronDown className="h-3 w-3" />
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-300 mb-1">Upload Error</h3>
              <p className="text-white/80 text-sm">{uploadError}</p>
            </div>
          </div>
        </div>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Uploading audio...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 flex flex-col overflow-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      >
        <div
          ref={contentRef}
          className={cn(
            "flex flex-col",
            isCloning
              ? "justify-center items-center min-h-full"
              : "justify-start"
          )}
        >
          {isCloning ? (
            // Cloning in progress view
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="relative w-32 h-32 mb-6">
                {/* Circular progress */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    className="text-white/10"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-purple-500 transition-all duration-1000"
                    strokeWidth="8"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (cloningStep / 4) * 264}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                </svg>

                {/* Step icon */}
                <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                  {stepInfo.icon}
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-2">{stepInfo.title}</h3>
              <p className="text-white/70 mb-8 max-w-md">
                {stepInfo.description}
              </p>

              {/* Step indicators */}
              <div className="flex items-center justify-center space-x-2 mb-6">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex items-center ${
                      step < cloningStep
                        ? "text-green-400"
                        : step === cloningStep
                        ? "text-purple-400"
                        : "text-white/40"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step < cloningStep
                          ? "bg-green-500/20"
                          : step === cloningStep
                          ? "bg-purple-500/30 ring-4 ring-purple-500/20"
                          : "bg-white/10"
                      }`}
                    >
                      {step < cloningStep ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span>{step}</span>
                      )}
                    </div>

                    {step < 4 && (
                      <ArrowRight
                        className={`h-4 w-4 mx-1 ${
                          step < cloningStep
                            ? "text-green-400"
                            : "text-white/40"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="w-full max-w-md bg-white/10 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(cloningStep / 4) * 100}%` }}
                />
              </div>

              <p className="text-sm text-white/60">
                Step {cloningStep} of 4 • Please wait while we create your voice
                clone
              </p>
            </div>
          ) : !voiceCloned ? (
            <div className="space-y-6">
              {/* First Audio Input */}
              <div className="border-2 border-dashed border-white/30 rounded-2xl p-6">
                <h3 className="font-medium mb-4 flex items-center">
                  <span className="bg-purple-600 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">
                    1
                  </span>
                  First Audio Sample
                </h3>

                <p className="text-white/80 text-sm mb-4">
                  Provide the first audio sample for voice cloning. This could
                  be your voice or a generated audio.
                </p>

                {recordingState1 === "idle" && !audioUrl1 && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <Button
                      onClick={triggerFileUpload1}
                      variant="outline"
                      className="border-white/20 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-colors py-6"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Audio
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef1}
                      onChange={handleFileUpload1}
                      accept="audio/*"
                      className="hidden"
                    />

                    <Button
                      onClick={startRecording1}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-6"
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Record Voice
                    </Button>
                  </div>
                )}

                {recordingState1 === "recording" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl">
                      <div className="flex items-center">
                        <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                        <span>Recording...</span>
                      </div>
                      <span className="font-mono">
                        {formatTime(recordingTime1)}
                      </span>
                    </div>

                    <div className="flex items-end space-x-1 h-16">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-red-400/70 rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 100}%`,
                            animationDelay: `${i * 0.05}s`,
                          }}
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Button
                        onClick={pauseRecording1}
                        variant="outline"
                        className="border-white/20 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                      >
                        Pause
                      </Button>
                      <Button
                        onClick={stopRecording1}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        Stop Recording
                      </Button>
                    </div>
                  </div>
                )}

                {recordingState1 === "paused" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl">
                      <div className="flex items-center">
                        <div className="h-3 w-3 bg-yellow-500 rounded-full mr-3"></div>
                        <span>Paused</span>
                      </div>
                      <span className="font-mono">
                        {formatTime(recordingTime1)}
                      </span>
                    </div>

                    <div className="flex items-end space-x-1 h-16">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-white/30 rounded-full"
                          style={{
                            height: `${Math.sin(i * 0.2) * 50 + 20}%`,
                          }}
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Button
                        onClick={resumeRecording1}
                        variant="outline"
                        className="border-white/20 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                      >
                        Resume
                      </Button>
                      <Button
                        onClick={stopRecording1}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        Stop Recording
                      </Button>
                    </div>
                  </div>
                )}

                {recordingState1 === "processing" && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <RefreshCw className="h-12 w-12 text-purple-300 animate-spin mb-4" />
                    <h4 className="text-lg font-medium mb-2">
                      Processing Audio
                    </h4>
                    <p className="text-white/70 text-sm text-center">
                      Analyzing and uploading audio...
                    </p>
                  </div>
                )}

                {recordingState1 === "ready" && audioUrl1 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl">
                      <div className="flex items-center">
                        <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                        <span>Audio Ready</span>
                      </div>
                      <span className="text-sm">Reference Audio</span>
                    </div>

                    <AudioPlayer
                      audioUrl={audioUrl1}
                      fileName="Reference Audio"
                      fileInfo={
                        uploadedFile1
                          ? `${Math.round(uploadedFile1.size / 1024)} KB`
                          : "Voice Sample"
                      }
                    />

                    <div className="flex justify-end">
                      <Button
                        onClick={resetAudio1}
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-1 ml-2"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Second Audio Input - Multiple Samples */}
              <div className="border-2 border-dashed border-white/30 rounded-2xl p-6">
                <div
                  className="flex justify-between items-center mb-4 cursor-pointer"
                  onClick={() =>
                    setIsSecondSectionExpanded(!isSecondSectionExpanded)
                  }
                >
                  <h3 className="font-medium flex items-center">
                    <span className="bg-purple-600 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">
                      2
                    </span>
                    Additional Audio Samples ({audioSamples.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-8 w-8 rounded-full"
                  >
                    {isSecondSectionExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {isSecondSectionExpanded && (
                  <>
                    <p className="text-white/80 text-sm mb-4">
                      Add multiple audio samples for better voice cloning
                      results. More samples improve accuracy.
                    </p>

                    {recordingState2 === "idle" &&
                      audioSamples.length === 0 && (
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          <Button
                            onClick={triggerFileUpload2}
                            variant="outline"
                            className="border-white/20 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-colors py-6"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Audio Files
                          </Button>
                          <input
                            type="file"
                            ref={fileInputRef2}
                            onChange={handleFileUpload2}
                            accept="audio/*"
                            multiple
                            className="hidden"
                          />

                          <Button
                            onClick={startRecording2}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-6"
                          >
                            <Mic className="mr-2 h-4 w-4" />
                            Record Voice
                          </Button>
                        </div>
                      )}

                    {recordingState2 === "recording" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl">
                          <div className="flex items-center">
                            <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                            <span>Recording...</span>
                          </div>
                          <span className="font-mono">
                            {formatTime(recordingTime2)}
                          </span>
                        </div>

                        <div className="flex items-end space-x-1 h-16">
                          {Array.from({ length: 30 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-red-400/70 rounded-full animate-pulse"
                              style={{
                                height: `${Math.random() * 100}%`,
                                animationDelay: `${i * 0.05}s`,
                              }}
                            />
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <Button
                            onClick={pauseRecording2}
                            variant="outline"
                            className="border-white/20 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                          >
                            Pause
                          </Button>
                          <Button
                            onClick={stopRecording2}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          >
                            Stop Recording
                          </Button>
                        </div>
                      </div>
                    )}

                    {recordingState2 === "paused" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl">
                          <div className="flex items-center">
                            <div className="h-3 w-3 bg-yellow-500 rounded-full mr-3"></div>
                            <span>Paused</span>
                          </div>
                          <span className="font-mono">
                            {formatTime(recordingTime2)}
                          </span>
                        </div>

                        <div className="flex items-end space-x-1 h-16">
                          {Array.from({ length: 30 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-white/30 rounded-full"
                              style={{
                                height: `${Math.sin(i * 0.2) * 50 + 20}%`,
                              }}
                            />
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <Button
                            onClick={resumeRecording2}
                            variant="outline"
                            className="border-white/20 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                          >
                            Resume
                          </Button>
                          <Button
                            onClick={stopRecording2}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          >
                            Stop Recording
                          </Button>
                        </div>
                      </div>
                    )}

                    {recordingState2 === "processing" && (
                      <div className="flex flex-col items-center justify-center py-8">
                        <RefreshCw className="h-12 w-12 text-purple-300 animate-spin mb-4" />
                        <h4 className="text-lg font-medium mb-2">
                          Processing Audio
                        </h4>
                        <p className="text-white/70 text-sm text-center">
                          Analyzing and uploading audio samples...
                        </p>
                      </div>
                    )}

                    {recordingState2 === "ready" && audioSamples.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl">
                          <div className="flex items-center">
                            <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                            <span>Audio Samples Ready</span>
                          </div>
                          <span className="text-sm">
                            {audioSamples.length} samples
                          </span>
                        </div>

                        {/* List of audio samples with toggle */}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                          {audioSamples.map((sample, index) => (
                            <div
                              key={sample.id}
                              className="bg-white/10 rounded-lg overflow-hidden"
                            >
                              <div
                                className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
                                onClick={() => toggleSample(sample.id)}
                              >
                                <div className="flex items-center">
                                  <div className="h-8 w-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-3">
                                    <FileAudio className="h-4 w-4 text-purple-300" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium truncate max-w-[150px]">
                                      {sample.name}
                                    </p>
                                    <p className="text-xs text-white/60">
                                      {sample.duration || "00:00"} •{" "}
                                      {sample.size || "Sample"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full hover:bg-white/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeSample(sample.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-white/70" />
                                  </Button>
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform duration-200 ${
                                      expandedSampleId === sample.id
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Expanded audio player */}
                              {expandedSampleId === sample.id && (
                                <div className="p-3 pt-0 animate-fadeIn">
                                  <AudioPlayer
                                    audioUrl={sample.url}
                                    fileName={sample.name}
                                    fileInfo={sample.size || "Voice Sample"}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add more samples button */}
                        <div className="flex justify-center mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                            onClick={triggerFileUpload2}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add More Samples
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              // Clean up all target audio files
                              if (referenceAudioPath) {
                                cleanupUploadedFiles([referenceAudioPath]);
                              } else {
                                cleanupUploadedFiles([]);
                              }

                              setAudioSamples([]);
                              setExpandedSampleId(null);
                              setRecordingState2("idle");
                              setTargetAudioPaths([]);
                            }}
                            className="flex items-center gap-1 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Clear All Samples
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {!canClone && !isCloning && !voiceCloned && (
                <p className="text-center text-white/60 text-sm mt-2">
                  Please provide at least 3 seconds long, one audio sample to
                  clone a voice.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <div className="bg-green-500/20 p-2 rounded-full mr-3">
                    <Check className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-300 mb-1">
                      Voice Cloning Successful!
                    </h3>
                    <p className="text-white/80 text-sm">
                      Your voice has been successfully cloned. You can now
                      generate Sinhala speech that sounds like you.
                    </p>
                  </div>
                </div>
              </div>

              {/* Audio Samples Used Section */}
              <div className="space-y-4 mb-6">
                <h3 className="font-medium flex items-center">
                  <span className="bg-purple-600 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">
                    1
                  </span>
                  Audio Samples Used
                </h3>

                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <FileAudio className="h-5 w-5 text-purple-300 mr-2" />
                    <p className="text-sm font-medium">
                      Voice samples processed:{" "}
                      {audioSamples.length + (audioUrl1 ? 1 : 0)}
                    </p>
                  </div>

                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {/* Primary sample visualization */}
                    {audioUrl1 && (
                      <div className="bg-white/5 rounded-lg p-3 flex items-center">
                        <div
                          className="h-8 w-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 cursor-pointer"
                          onClick={() => {
                            const audio = document.getElementById(
                              "primary-audio"
                            ) as HTMLAudioElement;
                            audio?.play();
                          }}
                        >
                          <Mic className="h-4 w-4 text-purple-300" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-white/70 mb-1">
                            Primary Audio Sample
                          </p>
                          <div className="flex items-end space-x-0.5 h-4">
                            {Array.from({ length: 30 }).map((_, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-purple-400/50 rounded-full"
                                style={{
                                  height: `${Math.sin(i * 0.3) * 100}%`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        {/* Audio tag */}
                        <audio
                          id="primary-audio"
                          src={audioUrl1}
                          preload="auto"
                        />
                      </div>
                    )}

                    {/* Additional samples visualization */}
                    {audioSamples.map((sample, index) => (
                      <div
                        key={sample.id}
                        className="bg-white/5 rounded-lg p-3 flex items-center"
                      >
                        <div
                          className="h-8 w-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3 cursor-pointer"
                          onClick={() => {
                            const audio = document.getElementById(
                              `sample-audio-${index}`
                            ) as HTMLAudioElement;
                            audio?.play();
                          }}
                        >
                          <FileAudio className="h-4 w-4 text-blue-300" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-white/70 mb-1">
                            {sample.name.length > 20
                              ? `${sample.name.substring(0, 20)}...`
                              : sample.name}
                          </p>
                          <div className="flex items-end space-x-0.5 h-4">
                            {Array.from({ length: 30 }).map((_, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-blue-400/50 rounded-full"
                                style={{
                                  height: `${Math.cos(i * 0.3 + index) * 100}%`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        {/* Audio tag */}
                        <audio
                          id={`sample-audio-${index}`}
                          src={sample.url}
                          preload="auto"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/60 mt-3">
                    These audio samples were analyzed to create your voice
                    profile. The more samples you provide, the more accurate
                    your cloned voice will be.
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="font-medium flex items-center">
                  <span className="bg-purple-600 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">
                    2
                  </span>
                  Your Cloned Voice Preview
                </h3>

                <AudioPlayer
                  audioUrl={clonedAudioUrl}
                  fileName="Cloned Voice Preview"
                  fileInfo="00:12 • Enhanced • Your Voice"
                />

                <p className="text-sm text-white/70 mt-2">
                  This is a preview of your cloned voice. You can use it to
                  generate speech from any Sinhala text.
                </p>
              </div>

              {/* Voice rating section */}
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <div className="flex items-center mb-2">
                  <div className="bg-purple-500/20 p-1 rounded-full mr-2">
                    <Sparkles className="h-4 w-4 text-purple-300" />
                  </div>
                  <h4 className="font-medium">
                    Rate your cloned voice quality
                  </h4>
                </div>

                <div className="flex items-center space-x-1 mt-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleRatingChange(value)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={value <= voiceRating ? "currentColor" : "none"}
                        stroke="currentColor"
                        className={`w-8 h-8 transition-colors ${
                          value <= voiceRating
                            ? "text-yellow-400"
                            : "text-white/30"
                        }`}
                        strokeWidth="2"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  ))}
                </div>

                {voiceRating > 0 && (
                  <p className="text-xs text-white/60 mt-2">
                    Thank you for your feedback! This helps us improve our voice
                    cloning technology.
                  </p>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="font-medium mb-2">Voice Settings</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs text-white/70">Samples</p>
                    <p className="font-medium">{audioSamples.length + 1}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs text-white/70">Quality</p>
                    <p className="font-medium">High</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom buttons */}
      <div className="mt-6">
        {!voiceCloned && !isCloning ? (
          <Button
            onClick={cloneVoice}
            disabled={!canClone}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6"
          >
            Clone Voice
          </Button>
        ) : voiceCloned ? (
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => {
                setVoiceCloned(false);
                // Reset the cloning state
                setCloningStep(0);
                // Clean up all files
                cleanupUploadedFiles([]);
                // Reset audio states
                setAudioUrl1(null);
                setUploadedFile1(null);
                setAudioSamples([]);
                setExpandedSampleId(null);
                setRecordingState1("idle");
                setRecordingState2("idle");
                setReferenceAudioPath("");
                setTargetAudioPaths([]);
              }}
              variant="outline"
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-colors"
            >
              Clone Another Voice
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={handleDownloadClonedVoice}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Cloned Audio
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
