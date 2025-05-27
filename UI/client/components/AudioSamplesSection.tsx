import { useState } from "react";
import { FileAudio, Mic, ChevronDown, ChevronRight } from "lucide-react";

type Props = {
  audioUrl1: string;
  audioSamples: string[];
};

const AudioSamplesSection = ({ audioUrl1, audioSamples }: Props) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-4 mb-6">
      {/* Header with toggle */}
      <h3
        className="font-medium flex items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="bg-purple-600 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 text-sm text-white">
          1
        </span>
        Audio Samples Used
        {isOpen ? (
          <ChevronDown className="ml-2 w-4 h-4" />
        ) : (
          <ChevronRight className="ml-2 w-4 h-4" />
        )}
      </h3>

      {isOpen && (
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center mb-3">
            <FileAudio className="h-5 w-5 text-purple-300 mr-2" />
            <p className="text-sm font-medium text-white">
              Voice samples processed:{" "}
              {audioSamples.length + (audioUrl1 ? 1 : 0)}
            </p>
          </div>

          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {/* Primary sample */}
            {audioUrl1 && (
              <div className="bg-white/5 rounded-lg p-3 flex items-center space-x-3">
                <div className="h-8 w-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Mic className="h-4 w-4 text-purple-300" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/70 mb-1">
                    Primary Audio Sample
                  </p>
                  <audio
                    controls
                    src={audioUrl1}
                    className="w-full h-10 text-purple-500 bg-purple-500/10 rounded-md overflow-hidden accent-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Other samples */}
            {audioSamples.map((url, idx) => (
              <div
                key={idx}
                className="bg-white/5 rounded-lg p-3 flex items-center space-x-3"
              >
                <div className="h-8 w-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Mic className="h-4 w-4 text-purple-300" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/70 mb-1">Sample {idx + 1}</p>
                  <audio controls src={url} className="w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioSamplesSection;
