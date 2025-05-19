"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
  fileName: string;
  fileInfo: string;
}

export function AudioPlayer({
  audioUrl,
  fileName,
  fileInfo,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);

  // Canvas refs for waveform visualization
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Initialize audio on component mount or when audioUrl changes
  useEffect(() => {
    // Clean up previous audio instance
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      audioContextRef.current.close();
    }

    setIsAudioLoaded(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioData([]);

    // Create new audio context and analyzer
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256; // Power of 2: 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768
    analyserRef.current = analyser;

    // Create buffer for frequency data
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    dataArrayRef.current = dataArray;

    // Create new audio element
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    // Set up event listeners
    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      setIsAudioLoaded(true);
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
      cancelAnimationFrame(animationRef.current!);
    });

    // Set the source after adding event listeners
    audio.src = audioUrl;
    audio.load();

    // Connect audio to analyzer when it can play
    audio.addEventListener("canplaythrough", () => {
      if (audioContextRef.current && !sourceRef.current) {
        const source = audioContextRef.current.createMediaElementSource(audio);
        sourceRef.current = source;
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);

        // Generate initial waveform data
        generateWaveformData(audioUrl).then((data) => {
          setAudioData(data);
          drawWaveform(data, 0); // Initial draw with 0 progress
        });
      }
    });

    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        if (sourceRef.current) {
          sourceRef.current.disconnect();
        }
        audioContextRef.current.close();
      }
    };
  }, [audioUrl]);

  // Generate waveform data from audio file
  const generateWaveformData = async (url: string): Promise<number[]> => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Get the audio data
      const channelData = audioBuffer.getChannelData(0); // Use the first channel

      // Calculate how many data points we need based on container width
      // This ensures the waveform spans the full width
      const containerWidth = waveformContainerRef.current?.offsetWidth || 300;
      const samples = containerWidth; // One data point per pixel for maximum detail

      const blockSize = Math.floor(channelData.length / samples);
      const dataPoints: number[] = [];

      for (let i = 0; i < samples; i++) {
        const blockStart = blockSize * i;
        let sum = 0;

        // Find the max value in this block
        for (let j = 0; j < blockSize; j++) {
          if (blockStart + j < channelData.length) {
            sum += Math.abs(channelData[blockStart + j]);
          }
        }

        // Average the values
        dataPoints.push(sum / blockSize);
      }

      // Normalize the data to 0-1 range
      const maxValue = Math.max(...dataPoints, 0.01); // Avoid division by zero
      return dataPoints.map((point) => point / maxValue);
    } catch (error) {
      console.error("Error generating waveform data:", error);

      // Generate placeholder data with some variation
      const containerWidth = waveformContainerRef.current?.offsetWidth || 300;
      return Array(containerWidth)
        .fill(0)
        .map(() => 0.1 + Math.random() * 0.8);
    }
  };

  // Draw waveform based on audio data and current progress
  const drawWaveform = (data: number[], progressPercentage: number) => {
    const canvas = waveformRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions with proper scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw waveform
    const width = rect.width;
    const height = rect.height;

    // Calculate bar width to fill the entire canvas
    // No gap between bars to ensure full width coverage
    const barWidth = width / data.length;

    // Calculate which bar corresponds to current playback position
    const progressIndex = Math.floor(data.length * progressPercentage);

    // Draw background waveform (full width)
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();

    // Draw the top half of the waveform
    for (let i = 0; i < data.length; i++) {
      const barHeight = Math.max(data[i] * height * 0.4, height * 0.02);
      const x = i * barWidth;
      const y = height / 2 - barHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Continue with the bottom half (in reverse)
    for (let i = data.length - 1; i >= 0; i--) {
      const barHeight = Math.max(data[i] * height * 0.4, height * 0.02);
      const x = i * barWidth;
      const y = height / 2 + barHeight;

      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();

    // Draw progress waveform (colored portion)
    if (progressIndex > 0) {
      // Create gradient for progress
      const gradient = ctx.createLinearGradient(
        0,
        0,
        progressIndex * barWidth,
        height
      );
      gradient.addColorStop(0, "rgba(139, 92, 246, 0.8)"); // Purple
      gradient.addColorStop(1, "rgba(59, 130, 246, 0.8)"); // Blue

      ctx.fillStyle = gradient;
      ctx.beginPath();

      // Draw the top half of the progress waveform
      for (let i = 0; i <= progressIndex; i++) {
        const barHeight = Math.max(data[i] * height * 0.4, height * 0.02);
        const x = i * barWidth;
        const y = height / 2 - barHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      // Continue with the bottom half (in reverse)
      for (let i = progressIndex; i >= 0; i--) {
        const barHeight = Math.max(data[i] * height * 0.4, height * 0.02);
        const x = i * barWidth;
        const y = height / 2 + barHeight;

        ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.fill();
    }

    // Draw a playhead line at the current position
    if (progressIndex > 0) {
      const playheadX = progressIndex * barWidth;

      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  // Animate waveform during playback
  const animateWaveform = () => {
    if (audioData.length > 0) {
      // Calculate current progress percentage
      const progressPercentage = duration > 0 ? currentTime / duration : 0;

      // Draw waveform with current progress
      drawWaveform(audioData, progressPercentage);
    }

    // Continue animation if playing
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animateWaveform);
    }
  };

  // Handle play/pause
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !isAudioLoaded) return;

    if (isPlaying) {
      audio.pause();
      cancelAnimationFrame(animationRef.current!);
    } else {
      // Resume audio context if it was suspended
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }

      audio
        .play()
        .then(() => {
          // Start the waveform animation
          animateWaveform();
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
        });
    }

    setIsPlaying(!isPlaying);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);

    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }

    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  // Handle seeking
  const handleSeek = (value: number[]) => {
    const seekTime = value[0];
    setCurrentTime(seekTime);

    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }

    // Update waveform immediately after seeking
    if (audioData.length > 0) {
      const progressPercentage = duration > 0 ? seekTime / duration : 0;
      drawWaveform(audioData, progressPercentage);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Update waveform when currentTime changes (even when not playing)
  useEffect(() => {
    if (audioData.length > 0) {
      const progressPercentage = duration > 0 ? currentTime / duration : 0;
      drawWaveform(audioData, progressPercentage);
    }
  }, [currentTime, audioData, duration]);

  // Redraw waveform when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (audioData.length > 0) {
        const progressPercentage = duration > 0 ? currentTime / duration : 0;
        drawWaveform(audioData, progressPercentage);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [audioData, currentTime, duration]);

  return (
    <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 mb-6">
      <div className="flex items-center mb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full mr-4 bg-white/10 border-0 hover:bg-white/20"
          onClick={togglePlayPause}
          disabled={!isAudioLoaded}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
        <div className="flex-1">
          <p className="font-medium">{fileName}</p>
          <p className="text-sm text-white/70">{fileInfo}</p>
        </div>
      </div>

      {/* Waveform visualization */}
      <div ref={waveformContainerRef} className="relative w-full h-16 mb-3">
        <canvas ref={waveformRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Playback controls */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-white/70 w-10">
          {formatTime(currentTime)}
        </span>

        {/* Custom styled slider for playback position */}
        <div className="flex-1">
          <style jsx>{`
            /* Custom slider styles for this component only */
            :global(.time-slider [data-orientation="horizontal"]) {
              height: 4px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 9999px;
            }

            :global(.time-slider [role="slider"]) {
              background: white;
              border: none;
              box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
              height: 12px;
              width: 12px;
              border-radius: 9999px;
              transition: transform 0.2s;
              outline: none !important;
            }

            :global(.time-slider:hover [role="slider"]) {
              transform: scale(1.2);
            }

            :global(.time-slider [data-disabled] [role="slider"]) {
              background: rgba(255, 255, 255, 0.5);
            }

            /* Style the track */
            :global(.time-slider [data-orientation="horizontal"] > span) {
              height: 100%;
              background: linear-gradient(
                to right,
                rgba(139, 92, 246, 0.8),
                rgba(59, 130, 246, 0.8)
              );
              border-radius: 9999px;
            }

            /* Remove focus outline */
            :global(.time-slider [role="slider"]:focus-visible) {
              outline: none !important;
              box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5),
                0 0 0 4px rgba(139, 92, 246, 0.5);
            }
          `}</style>
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            disabled={!isAudioLoaded}
            className="time-slider"
          />
        </div>

        <span className="text-xs text-white/70 w-10">
          {formatTime(duration)}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-white/10"
          onClick={toggleMute}
          disabled={!isAudioLoaded}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>

        {/* Custom styled slider for volume */}
        <div className="w-20">
          <style jsx>{`
            /* Custom slider styles for this component only */
            :global(.volume-slider [data-orientation="horizontal"]) {
              height: 4px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 9999px;
            }

            :global(.volume-slider [role="slider"]) {
              background: white;
              border: none;
              box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
              height: 10px;
              width: 10px;
              border-radius: 9999px;
              transition: transform 0.2s;
              outline: none !important;
            }

            :global(.volume-slider:hover [role="slider"]) {
              transform: scale(1.2);
            }

            :global(.volume-slider [data-disabled] [role="slider"]) {
              background: rgba(255, 255, 255, 0.5);
            }

            /* Style the track */
            :global(.volume-slider [data-orientation="horizontal"] > span) {
              height: 100%;
              background: linear-gradient(
                to right,
                rgba(139, 92, 246, 0.8),
                rgba(59, 130, 246, 0.8)
              );
              border-radius: 9999px;
            }

            /* Remove focus outline */
            :global(.volume-slider [role="slider"]:focus-visible) {
              outline: none !important;
              box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5),
                0 0 0 4px rgba(139, 92, 246, 0.5);
            }
          `}</style>
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            disabled={!isAudioLoaded}
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  );
}
