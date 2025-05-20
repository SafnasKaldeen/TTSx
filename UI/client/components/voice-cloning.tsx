"use client";

import type React from "react";

import axios from "axios";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

  const [referenceAudio, setReferenceAudio] = useState("");
  const [targetAudio, setTargetAudio] = useState("");

  // Refs for file inputs and timers
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const timerRef1 = useRef<NodeJS.Timeout | null>(null);
  const timerRef2 = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { loading, error, result, statusStage, ReferenceAudio, cloneAudio } =
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
      setRecordingState1("ready");

      // Clear the audio for cloning since we've used it
      if (onClearAudioForCloning) {
        onClearAudioForCloning();
      }
    }
  }, [audioForCloning, onClearAudioForCloning, voiceCloned]);

  // FRONTEND
  const uploadAudioFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("audio", file);

    try {
      console.log("Uploading file:", file);
      const response = await axios.post(
        "http://localhost:8000/api/upload-audio",
        formData
      );
      return response.data.file_path; // e.g. "/Audios/uploaded_audio.wav"
    } catch (err) {
      console.error("File upload failed:", err);
      return null;
    }
  };

  // Handle file upload for first audio input
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
      setRecordingState1("ready");
    }
  };

  // Handle multiple file upload for second audio input
  const handleFileUpload2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newSamples: AudioSample[] = [];

      Array.from(files).forEach((file, index) => {
        const url = URL.createObjectURL(file);
        newSamples.push({
          id: `upload-${Date.now()}-${index}`,
          url: url,
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          duration: "00:00", // This would be determined after loading the audio
        });
      });

      setAudioSamples((prev) => [...prev, ...newSamples]);
      setRecordingState2("ready");

      // Auto-expand the first new sample if none are expanded
      if (expandedSampleId === null && newSamples.length > 0) {
        setExpandedSampleId(newSamples[0].id);
      }
    }
  };

  const uploadBase64Audio = async (audioUrl: string, filename: string) => {
    const response = await fetch(audioUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
  };

  // Start recording for first audio input
  const startRecording1 = () => {
    // Reset cloning state if already cloned
    if (voiceCloned) {
      setVoiceCloned(false);
      setCloningStep(0);
    }

    setRecordingState1("recording");
    setRecordingTime1(0);

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
  const startRecording2 = () => {
    setRecordingState2("recording");
    setRecordingTime2(0);

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
    setRecordingState1("paused");
    if (timerRef1.current) {
      clearInterval(timerRef1.current);
      timerRef1.current = null;
    }
  };

  // Pause recording for second audio input
  const pauseRecording2 = () => {
    setRecordingState2("paused");
    if (timerRef2.current) {
      clearInterval(timerRef2.current);
      timerRef2.current = null;
    }
  };

  // Resume recording for first audio input
  const resumeRecording1 = () => {
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

    if (recordingTime1 < 5) {
      // Too short
      setRecordingState1("idle");
      return;
    }

    setRecordingState1("processing");

    // Simulate processing
    setTimeout(() => {
      setRecordingState1("ready");
      const demoUrl = "/demo-audio-female.mp3";
      setAudioUrl1(demoUrl);
    }, 2000);
  };

  // Stop recording for second audio input
  const stopRecording2 = () => {
    if (timerRef2.current) {
      clearInterval(timerRef2.current);
      timerRef2.current = null;
    }

    if (recordingTime2 < 5) {
      // Too short
      setRecordingState2("idle");
      return;
    }

    setRecordingState2("processing");

    // Simulate processing
    setTimeout(() => {
      setRecordingState2("ready");
      const demoUrl = "/sample-audio.mp3";
      const newSample: AudioSample = {
        id: `recording-${Date.now()}`,
        url: demoUrl,
        name: `Voice Recording ${audioSamples.length + 1}`,
        duration: formatTime(recordingTime2),
      };

      setAudioSamples((prev) => [...prev, newSample]);
      setExpandedSampleId(newSample.id);
    }, 2000);
  };

  // Reset first audio input
  const resetAudio1 = () => {
    setRecordingState1("idle");
    setAudioUrl1(null);
    setUploadedFile1(null);
  };

  // Remove a specific audio sample
  const removeSample = (id: string) => {
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

  // Replace the cloneVoice function with this updated version that handles blob URLs
  const cloneVoice = async () => {
    setIsCloning(true);
    setCloningStep(1);

    try {
      console.log("Starting voice cloning process...");

      // Step 1: Handle reference audio (from first widget)
      setCloningStep(1);
      console.log("Step 1: Processing reference audio");
      console.log("Current audioUrl1:", audioUrl1);

      if (!audioUrl1) {
        throw new Error("No reference audio provided");
      }

      // Convert blob URL to File object
      console.log("Fetching blob data from URL:", audioUrl1);
      const referenceResponse = await fetch(audioUrl1);
      const referenceBlob = await referenceResponse.blob();
      const referenceFile = new File([referenceBlob], "reference-audio.wav", {
        type: "audio/wav",
      });
      console.log("Created file object:", referenceFile);

      // Upload the file to server
      console.log("Uploading reference audio to server...");
      const referenceFormData = new FormData();
      referenceFormData.append("audio", referenceFile);

      const referenceUploadResponse = await axios.post(
        "/api/upload-audio",
        referenceFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const referenceAudioPath = referenceUploadResponse.data.file_path;
      console.log(
        "Reference audio uploaded successfully. Server path:",
        referenceAudioPath
      );

      if (!referenceAudioPath) {
        throw new Error("Failed to upload reference audio - no path returned");
      }

      // Step 2: Handle target audio (from second widget)
      let targetAudioPath = null;

      if (audioSamples.length > 0) {
        setCloningStep(2);
        console.log("Step 2: Processing target audio");

        // Use the first audio sample as target
        const targetSample = audioSamples[0];
        console.log("Using target sample:", targetSample);

        console.log("Fetching blob data from URL:", targetSample.url);
        const targetResponse = await fetch(targetSample.url);
        const targetBlob = await targetResponse.blob();
        const targetFile = new File([targetBlob], "target-audio.wav", {
          type: "audio/wav",
        });
        // console.log("Created file object:", targetFile);

        // Upload the file to server
        console.log("Uploading target audio to server...");
        const targetFormData = new FormData();
        targetFormData.append("audio", targetFile);

        const targetUploadResponse = await axios.post(
          "/api/upload-audio",
          targetFormData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        targetAudioPath = targetUploadResponse.data.file_path;
        console.log(
          "Target audio uploaded successfully. Server path:",
          targetAudioPath
        );

        if (!targetAudioPath) {
          throw new Error("Failed to upload target audio - no path returned");
        }
      } else {
        // If no target audio, use the reference audio as target too
        console.log(
          "No target audio samples found, using reference audio as target"
        );
        targetAudioPath = referenceAudioPath;
      }

      // Step 3: Clone the voice using the uploaded files
      setCloningStep(3);
      console.log("Step 3: Starting voice cloning with paths:", {
        referenceAudioPath,
        targetAudioPath,
      });

      await cloneAudio(referenceAudioPath, targetAudioPath, (progressData) => {
        console.log("Cloning progress:", progressData);

        if (progressData.stage === "cloning_complete") {
          setCloningStep(3);
          if (progressData.raw_audio_url) {
            setClonedAudioRawUrl(progressData.raw_audio_url);
            console.log("Raw audio URL set:", progressData.raw_audio_url);
          }
        }

        if (progressData.stage === "complete") {
          setCloningStep(4);
          console.log("Cloning complete!");

          if (progressData.cloned_audio_url) {
            setClonedAudioUrl(progressData.cloned_audio_url);
            console.log("Cloned audio URL set:", progressData.cloned_audio_url);
          }

          if (progressData.raw_audio_url) {
            setClonedAudioRawUrl(progressData.raw_audio_url);
            console.log("Raw audio URL set:", progressData.raw_audio_url);
          }

          setIsCloning(false);
          setVoiceCloned(true);
          setVoiceRating(0);

          if (onVoiceCloned) {
            onVoiceCloned();
          }
        }
      });
    } catch (error) {
      console.error("Error during voice cloning:", error);
      setIsCloning(false);
      // Handle error display
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
    recordingState1 === "ready" ||
    (audioSamples.length > 0 && recordingState2 === "ready");

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
          title: "Training Voice Model",
          description: "Building a neural model of your voice...",
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

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Construct a path or URL (for browser usage this would typically be a blob URL)
      const fileURL = "E:/UOM/FYP/TTSx/UI/client/public/Audios/" + file.name;
      setReferenceAudio(fileURL); // Store the path or URL

      // Delay triggering audio cloning
      setTimeout(() => {
        // handleCloneAudio();
      }, 15000); // 15 seconds delay
    }
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
                      Analyzing audio patterns...
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
                      <span className="text-sm">Sample 1</span>
                    </div>

                    <AudioPlayer
                      audioUrl={audioUrl1}
                      fileName="Audio Sample 1"
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
                          Analyzing audio patterns...
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
                          {audioSamples.map((sample) => (
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
                              setAudioSamples([]);
                              setExpandedSampleId(null);
                              setRecordingState2("idle");
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

              <div className="space-y-2 mb-6">
                <p className="text-xs text-white/60">
                  Higher similarity preserves more of your voice characteristics
                  but may reduce quality.
                </p>
              </div>
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
                        <div className="h-8 w-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-3">
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
                      </div>
                    )}

                    {/* Additional samples visualization */}
                    {audioSamples.map((sample, index) => (
                      <div
                        key={sample.id}
                        className="bg-white/5 rounded-lg p-3 flex items-center"
                      >
                        <div className="h-8 w-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
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
                    <p className="font-medium">
                      {audioSamples.length + (audioUrl1 ? 1 : 0)}
                    </p>
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

        {!canClone && !isCloning && !voiceCloned && (
          <p className="text-center text-white/60 text-sm mt-2">
            Please provide at least one audio sample to clone a voice.
          </p>
        )}
      </div>
    </div>
  );
}
