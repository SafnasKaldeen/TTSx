"use client";

import { useState } from "react";
import { SinhalaTextToSpeech } from "@/components/sinhala-text-to-speech";
import { DemoAudioSection } from "@/components/demo-audio-section";
import { VoiceCloning } from "@/components/voice-cloning";

export default function Home() {
  const [hasClonedVoice, setHasClonedVoice] = useState(false);
  const [useClonedVoice, setUseClonedVoice] = useState(false);
  const [audioForCloning, setAudioForCloning] = useState<string | null>(null);

  const handleUseForCloning = (audioUrl: string) => {
    setAudioForCloning(audioUrl);
  };

  const handleVoiceCloned = () => {
    setHasClonedVoice(true);
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500 via-pink-400 to-blue-500 -z-10" />

      <div className="container mx-auto px-4 py-12 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
            සිංහල කථන පරිවර්තකය
          </h1>
          <p className="text-xl text-white/90">Sinhala Text-to-Speech System</p>
          <p className="text-white/80 mt-2 max-w-2xl mx-auto">
            Our advanced AI model converts Sinhala text to natural-sounding
            speech with voice cloning
          </p>
        </div>

        {/* Shared width container for demo + grid content */}
        <div className="max-w-6xl mx-auto w-full space-y-8">
          {/* Demo section on top, full width */}
          <DemoAudioSection />

          {/* Two-column layout below */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <SinhalaTextToSpeech
                hasClonedVoice={hasClonedVoice}
                onUseForCloning={handleUseForCloning}
                onToggleClonedVoice={setUseClonedVoice}
              />
            </div>

            <VoiceCloning
              audioForCloning={audioForCloning}
              onVoiceCloned={handleVoiceCloned}
              onClearAudioForCloning={() => setAudioForCloning(null)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
