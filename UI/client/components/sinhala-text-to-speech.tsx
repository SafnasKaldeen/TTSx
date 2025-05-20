"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Upload,
  RefreshCw,
  Mic,
  AudioWaveformIcon as Waveform,
  Check,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioPlayer } from "@/components/audio-player";
import { VoiceCloneConfirmation } from "@/components/voice-clone-confirmation";
import { VoiceRating } from "@/components/voice-rating";
import { AudioComparisonToggle } from "@/components/audio-comparison-toggle";
import { useTTSProcessor } from "@/hooks/useTTS";
import { time } from "console";

// Processing states
type ProcessingState =
  | "idle"
  | "Preprocessing"
  | "synthesizing"
  | "Enhancing"
  | "complete";

interface SinhalaTextToSpeechProps {
  hasClonedVoice?: boolean;
  onUseForCloning?: (audioUrl: string) => void;
  onToggleClonedVoice?: (useCloned: boolean) => void;
}

export function SinhalaTextToSpeech({
  hasClonedVoice = false,
  onUseForCloning,
  onToggleClonedVoice,
}: SinhalaTextToSpeechProps) {
  const [text, setText] = useState<string>("");
  const [processingState, setProcessingState] =
    useState<ProcessingState>("idle");
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(100);
  const [enhanceSpeech, setEnhanceSpeech] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioRawUrl, setAudioRawUrl] = useState<string>("");
  const [useClonedVoice, setUseClonedVoice] = useState<boolean>(false);
  const [showVoiceConfirmation, setShowVoiceConfirmation] =
    useState<boolean>(false);
  const [isDenoised, setIsDenoised] = useState<boolean>(true);
  const [voiceRating, setVoiceRating] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [preprocessedText, setPreprocessedText] = useState<string>("");

  const { loading, error, result, statusStage, preprocessText, processText } =
    useTTSProcessor();

  const handleGenerate = async () => {
    if (!text.trim()) return;
    const speakerID = useClonedVoice ? "cloned_speaker" : "default";

    setIsGenerated(false);
    setProgress(0);
    setProcessingState("idle");

    try {
      // Process the text using the hook's processText function with progress callback
      await processText(text, speakerID, (progressData) => {
        // Update component state based on progress updates from the hook
        switch (progressData.stage) {
          case "preprocessing":
            setProcessingState("Preprocessing");
            setProgress(10);
            break;

          case "preprocessing_complete":
            if (progressData.preprocessText) {
              setPreprocessedText(progressData.preprocessText);
            }
            setProgress(30);
            break;

          case "synthesizing":
            setProcessingState("synthesizing");
            setProgress(40);
            break;

          case "synthesizing_complete":
            setProgress(70);
            if (progressData.raw_audio_url) {
              setAudioRawUrl(progressData.raw_audio_url.slice(33));
            }
            break;

          case "cleaning":
            setProcessingState("Enhancing");
            setProgress(80);
            break;

          case "complete":
            setProcessingState("complete");
            setProgress(100);
            if (progressData.audio_url) {
              setAudioUrl(progressData.audio_url.slice(33));
            }
            if (progressData.raw_audio_url) {
              setAudioRawUrl(progressData.raw_audio_url.slice(33));
            }
            setIsGenerated(true);
            setVoiceRating(0);
            break;

          case "error":
            setProcessingState("idle");
            // You could also display an error message to the user here
            break;
        }
      });
    } catch (e) {
      console.error("TTS generation failed", e);
      setProcessingState("idle");
    }
  };

  useEffect(() => {
    switch (statusStage) {
      case "preprocessing":
        setProgress(20);
        setProcessingState("Preprocessing");
        break;
      case "synthesizing":
        setProgress(60);
        setProcessingState("synthesizing");
        break;
      case "cleaning":
        setProgress(85);
        setProcessingState("Enhancing");
        break;
      case "complete":
        setProgress(100);
        setProcessingState("complete");
        if (result) {
          setAudioUrl(result.audio_url);
          setAudioRawUrl(result.raw_audio_url || result.audio_url);
          // if (useClonedVoice) {
          //   handleUseForCloning();
          // }
          setVoiceRating(0);
          // alert(
          //   `Audio generated successfully! \n\nAudio URL: ${result.audio_url}`
          // );
        }
        break;
      case "error":
        setProcessingState("idle");
        break;
      default:
        break;
    }
  }, [statusStage, result]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = "E:/UOM/FYP/TTSx/UI/client/public/Audios/cleaned_audio.wav"; // replace with your audio URL
    a.download = "GeneratedAudio.wav"; // change filename if needed
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setText("");
    setIsGenerated(false);
    setProcessingState("idle");
    setProgress(0);
  };

  // Processing message based on state
  const getProcessingMessage = () => {
    switch (processingState) {
      case "Preprocessing":
        return "Preprocessing Sinhala text...";
      case "synthesizing":
        return "Generating natural speech...";
      case "Enhancing":
        return "Applying enhancements...";
      case "complete":
        return "Speech generation complete!";
      default:
        return "";
    }
  };

  // Handle toggle cloned voice with confirmation
  const handleToggleClonedVoice = (checked: boolean) => {
    if (checked) {
      setShowVoiceConfirmation(true);
    } else {
      setUseClonedVoice(false);
      if (onToggleClonedVoice) onToggleClonedVoice(false);
    }
  };

  // Confirm using cloned voice
  const confirmUseClonedVoice = () => {
    setUseClonedVoice(true);
    setShowVoiceConfirmation(false);
    if (onToggleClonedVoice) onToggleClonedVoice(true);
  };

  // Cancel using cloned voice
  const cancelUseClonedVoice = () => {
    setShowVoiceConfirmation(false);
  };

  // Send audio to voice cloning section
  const handleUseForCloning = () => {
    if (onUseForCloning && audioUrl) {
      onUseForCloning(audioUrl);
    }
  };

  // Handle audio comparison toggle
  const handleAudioComparisonToggle = (denoised: boolean) => {
    setIsDenoised(denoised);
  };

  // Handle voice rating change
  const handleRatingChange = (rating: number) => {
    setVoiceRating(rating);
  };

  // Handle speech rate change
  const handleSpeechRateChange = (value: number[]) => {
    setSpeechRate(value[0]);
  };

  return (
    <div className="bg-purple-800/30 backdrop-blur-md rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col h-full w-full">
      <div ref={containerRef} className="flex-1 flex flex-col justify-center">
        <div ref={contentRef} className="flex flex-col">
          {processingState === "idle" && !isGenerated ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">සිංහල පෙළ සිට කථනයට</h2>
                {/* <h2 className="text-2xl font-bold">{processingState}</h2> */}

                <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
                  v2.0
                </div>
              </div>

              <div className="border-2 border-dashed border-white/30 rounded-2xl p-6 mb-6 flex flex-col items-center justify-center">
                <div className="mb-4 bg-white/10 p-3 rounded-full">
                  <Mic className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  සිංහල පෙළ ඇතුළත් කරන්න
                </h3>
                <p className="text-white/70 text-center text-sm mb-4">
                  ඔබේ සිංහල පෙළ පහත ඇතුළත් කරන්න
                </p>

                <style jsx global>{`
                  /* Custom textarea focus styles */
                  .custom-textarea {
                    transition: all 0.2s ease;
                  }

                  .custom-textarea:focus {
                    outline: none !important;
                    border-color: rgba(139, 92, 246, 0.5) !important;
                    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.25) !important;
                    background-color: rgba(255, 255, 255, 0.25) !important;
                  }
                `}</style>

                <Textarea
                  placeholder="ඔබේ සිංහල පෙළ මෙහි ටයිප් කරන්න..."
                  className="w-full bg-white/20 border-white/20 text-white placeholder:text-white/70 resize-none min-h-[120px] custom-textarea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-6">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-white/70">Voice Types</p>
                    <p className="font-medium">4</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-white/70">Max Length</p>
                    <p className="font-medium">500 chars</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-white/70">Audio Format</p>
                    <p className="font-medium">MP3</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-white/70">Daily Limit</p>
                    <p className="font-medium">10 files</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="voice">Voice</Label>
                  </div>
                  <Select defaultValue={useClonedVoice ? "cloned" : "female1"}>
                    <SelectTrigger className="bg-white/20 border-white/20 text-white focus:ring-purple-500/25 focus:ring-offset-0 focus:border-purple-500/50 focus:ring-2">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {useClonedVoice && (
                        <SelectItem value="cloned">
                          <div className="flex items-center">
                            <span className="mr-2">Your Cloned Voice</span>
                            <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full">
                              New
                            </span>
                          </div>
                        </SelectItem>
                      )}
                      <SelectItem value="female1">Female (Standard)</SelectItem>
                      <SelectItem value="female2">Female (Western)</SelectItem>
                      <SelectItem value="male1">Male (Standard)</SelectItem>
                      <SelectItem value="male2">Male (Deep)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="speed">Speed</Label>
                    <span className="text-sm text-white/70">{speechRate}%</span>
                  </div>

                  {/* Custom styled slider for speech rate */}
                  <div>
                    <style jsx>{`
                      /* Custom slider styles for this component only */
                      :global(
                          .speech-rate-slider [data-orientation="horizontal"]
                        ) {
                        height: 4px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 9999px;
                      }

                      :global(.speech-rate-slider [role="slider"]) {
                        background: white;
                        border: none;
                        box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
                        height: 12px;
                        width: 12px;
                        border-radius: 9999px;
                        transition: transform 0.2s;
                        outline: none !important;
                      }

                      :global(.speech-rate-slider:hover [role="slider"]) {
                        transform: scale(1.2);
                      }

                      :global(
                          .speech-rate-slider [data-disabled] [role="slider"]
                        ) {
                        background: rgba(255, 255, 255, 0.5);
                      }

                      /* Style the track */
                      :global(
                          .speech-rate-slider
                            [data-orientation="horizontal"]
                            > span
                        ) {
                        height: 100%;
                        background: linear-gradient(
                          to right,
                          rgba(139, 92, 246, 0.8),
                          rgba(59, 130, 246, 0.8)
                        );
                        border-radius: 9999px;
                      }

                      /* Remove focus outline */
                      :global(
                          .speech-rate-slider [role="slider"]:focus-visible
                        ) {
                        outline: none !important;
                        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5),
                          0 0 0 4px rgba(139, 92, 246, 0.5);
                      }
                    `}</style>
                    <Slider
                      id="speed"
                      min={50}
                      max={200}
                      step={5}
                      value={[speechRate]}
                      onValueChange={handleSpeechRateChange}
                      className="speech-rate-slider"
                    />
                  </div>
                </div>

                {/* <div className="flex items-center justify-between bg-white/10 p-3 rounded-xl"> */}
                {/* <div className="flex items-center space-x-2">
                    <Switch
                      id="enhance"
                      checked={enhanceSpeech}
                      onCheckedChange={setEnhanceSpeech}
                      className="data-[state=checked]:bg-purple-600"
                    />
                    <Label htmlFor="enhance">Enhance Speech</Label>
                  </div> */}
                {/* <span className="text-xs text-white/70">
                    Improves clarity
                  </span>
                </div> */}

                <div className="flex items-center justify-between bg-white/10 p-3 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="use-cloned"
                      checked={useClonedVoice}
                      onCheckedChange={handleToggleClonedVoice}
                      className="data-[state=checked]:bg-purple-600"
                    />
                    <Label htmlFor="use-cloned">
                      <div className="flex items-center">
                        <span>Use Cloned Voice</span>
                        {hasClonedVoice && (
                          <span className="ml-2 bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full">
                            Available
                          </span>
                        )}
                      </div>
                    </Label>
                  </div>
                  <span className="text-xs text-white/70">Your voice</span>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!text.trim()}
                className="mt-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6"
              >
                Generate Speech
              </Button>

              {/* Voice Clone Confirmation Dialog */}
              <VoiceCloneConfirmation
                open={showVoiceConfirmation}
                onOpenChange={setShowVoiceConfirmation}
                onConfirm={confirmUseClonedVoice}
                onCancel={cancelUseClonedVoice}
                hasClonedVoice={hasClonedVoice}
              />
            </>
          ) : processingState !== "idle" && !isGenerated ? (
            // Aesthetic loading screen
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-32 h-32 mb-8">
                {/* Animated circular progress */}
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
                    className="text-purple-500 transition-all duration-300"
                    strokeWidth="8"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (progress / 100) * 264}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                </svg>

                {/* Icon based on state */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {processingState === "Preprocessing" && (
                    <Waveform className="h-10 w-10 text-white animate-pulse" />
                  )}
                  {processingState === "synthesizing" && (
                    <Mic className="h-10 w-10 text-white animate-bounce" />
                  )}
                  {processingState === "Enhancing" && (
                    <RefreshCw className="h-10 w-10 text-white animate-spin" />
                  )}
                  {processingState === "complete" && (
                    <Check className="h-10 w-10 text-green-400" />
                  )}
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-2 text-center">
                {getProcessingMessage()}
              </h3>

              <div className="w-full max-w-md bg-white/10 rounded-full h-2 mb-6">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-white/70 text-center max-w-sm">
                {processingState === "Preprocessing" &&
                  "Analyzing text structure and pronunciation..."}
                {processingState === "synthesizing" &&
                  "Creating natural voice patterns and intonation..."}
                {processingState === "Enhancing" &&
                  (useClonedVoice
                    ? "Applying your voice characteristics..."
                    : "Applying final enhancements and optimizations...")}
                {processingState === "complete" &&
                  "Your speech is ready! Redirecting..."}
              </p>

              {/* Animated waveform visualization */}
              <div className="flex items-end justify-center space-x-1 h-16 mt-8">
                {Array.from({ length: 12 }).map((_, i) => {
                  const height =
                    processingState === "idle"
                      ? 0
                      : Math.random() *
                        100 *
                        (processingState === "complete" ? 0.5 : 1);

                  return (
                    <div
                      key={i}
                      className={cn(
                        "w-2 bg-gradient-to-t from-purple-600 to-blue-400 rounded-full transition-all duration-300",
                        processingState === "complete"
                          ? "animate-none"
                          : "animate-pulse"
                      )}
                      style={{
                        height: `${height}%`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            // Generated speech result
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">ඔබගේ හඬ සූදානම්</h2>
                <div className="bg-green-500/20 text-green-300 rounded-full px-3 py-1 text-xs font-medium flex items-center">
                  <Check className="h-3 w-3 mr-1" />
                  Complete
                </div>
              </div>

              {/* Audio comparison toggle */}
              <div className="mb-4">
                <AudioComparisonToggle
                  onToggle={handleAudioComparisonToggle}
                  initialDenoised={true}
                />
              </div>

              {/* Dynamic Audio Player with Waveform */}
              <h1>{isDenoised ? audioUrl : audioRawUrl}</h1>
              <AudioPlayer
                audioUrl={isDenoised ? audioUrl : audioRawUrl}
                fileName={isDenoised ? "Enhanced Speech" : "Original Speech"}
                fileInfo={
                  useClonedVoice
                    ? `${isDenoised ? "Enhanced" : "Raw"} • Your Voice`
                    : `${isDenoised ? "Enhanced" : "Raw"} • 680KB`
                }
              />
              {/* <h4 className="text-sm text-white/70 mt-2">{audioRawUrl}</h4> */}

              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <p className="text-sm text-white/80 italic">
                  {text.substring(0, 150)}
                  {text.length > 150 ? "..." : ""}
                </p>
              </div>

              {/* Voice rating section */}
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <VoiceRating
                  label={`Rate this ${
                    useClonedVoice ? "cloned" : "generated"
                  } voice`}
                  onRatingChange={handleRatingChange}
                  initialRating={voiceRating}
                />

                {voiceRating > 0 && (
                  <p className="text-xs text-white/60 mt-2">
                    Thank you for your feedback! This helps us improve our voice
                    synthesis.
                  </p>
                )}
              </div>

              <div className="space-y-4 mb-6">
                {/* <div className="flex justify-between">
                  <Label htmlFor="enhance-toggle">Enhance Speech</Label>
                  <span className="text-sm text-white/70">
                    {enhanceSpeech ? "On" : "Off"}
                  </span>
                </div> */}
                {/* <div className="flex items-center space-x-4 bg-white/20 rounded-xl p-4">
                  <Switch
                    id="enhance-toggle"
                    checked={enhanceSpeech}
                    onCheckedChange={setEnhanceSpeech}
                    className="data-[state=checked]:bg-purple-600"
                  />
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${enhanceSpeech ? 90 : 0}%` }}
                    />
                  </div>
                </div> */}

                {/* {useClonedVoice && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                    <div className="flex items-center">
                      <div className="bg-purple-500/20 p-1 rounded-full mr-2">
                        <Mic className="h-4 w-4 text-purple-300" />
                      </div>
                      <p className="text-sm text-purple-200">
                        Using your cloned voice
                      </p>
                    </div>
                  </div>
                )} */}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <a
                  href="/Audios/InitialInference.wav"
                  download="GeneratedAudio.wav"
                  style={{ display: "contents" }} // lets child button behave normally
                >
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </a>

                <Button
                  variant="outline"
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                  onClick={handleReset}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  New Text
                </Button>
              </div>

              {/* Use for cloning button */}
              {onUseForCloning && (
                <Button
                  onClick={handleUseForCloning}
                  variant="ghost"
                  className="mt-4 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Use this audio for voice cloning
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
