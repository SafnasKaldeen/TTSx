"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "@/components/audio-player";
import { ChevronDown, ChevronUp } from "lucide-react";

// Sample audio URLs for demo
const DEMO_AUDIOS = [
  {
    id: "demo1",
    name: "Female Voice (Standard)",
    url: "/demo-audio-female.wav",
    info: "00:08 • 128KB",
    text: "සුබ උදෑසනක් වේවා! ඔබට සුබ දවසක් වේවා.",
  },
  {
    id: "demo2",
    name: "Male Voice (Deep)",
    url: "/demo-audio-male.wav",
    info: "00:07 • 112KB",
    text: "මම සිංහල භාෂාවෙන් කතා කරන්නෙමි.",
  },
];

export function DemoAudioSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-purple-800/30 backdrop-blur-md rounded-3xl p-6 text-white shadow-xl mb-6">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <div className="bg-purple-600/30 p-2 rounded-full mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-300"
            >
              <path d="M12 8.5c0-1.7 1.5-3 3.3-3 1.7 0 3.2 1.3 3.2 3 0 1.7-1.5 3-3.3 3-1.7 0-3.2-1.3-3.2-3Z" />
              <path d="M5.5 8.5c0-1.7 1.5-3 3.3-3 1.7 0 3.2 1.3 3.2 3 0 1.7-1.5 3-3.3 3-1.7 0-3.2-1.3-3.2-3Z" />
              <path d="M3 19v-3a8 8 0 0 1 16 0v3" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium">Try Demo Audio</h3>
            <p className="text-xs text-white/70">
              Listen to sample Sinhala TTS
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-white/10"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-6">
          <p className="text-sm text-white/80">
            Listen to these sample audio clips to experience our Sinhala
            text-to-speech system:
          </p>

          {DEMO_AUDIOS.map((audio) => (
            <div key={audio.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-sm">{audio.name}</h4>
              </div>
              <div className="bg-white/10 rounded-xl p-3 mb-2">
                <p className="text-sm text-white/80 italic">{audio.text}</p>
              </div>
              <AudioPlayer
                audioUrl={audio.url}
                fileName={audio.name}
                fileInfo={audio.info}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
