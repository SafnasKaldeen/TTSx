"use client";

import { useState } from "react";
import TextInput from "./components/TextInput";
import RomanizedText from "./components/RomanizedText";
import AudioPlayer from "./components/AudioPlayer";
import LoadingButton from "./components/LoadingButton";
import LoadingButtonSynthesize from "./components/LoadingButtonSynthesize";
import { preprocessText, synthesizeAudio } from "./components/api";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [romanizedText, setRomanizedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioPath, setAudioPath] = useState("");
  const [speakerID, setSpeakerID] = useState("LJ_BaseModel_Oshadi");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // console.log("Text Preprocessing pipeline Initiated");
    try {
      const data = await preprocessText(inputText);
      if (data.processed_text) {
        setRomanizedText(data.processed_text);
      } else {
        setRomanizedText(data.detail || "An error occurred.");
      }
    } catch (error) {
      console.error("Error:", error);
      setRomanizedText("Failed to process the text.");
    } finally {
      setLoading(false);
    }
  };

  const handleSynthesize = async () => {
    setLoading(true);
    // console.log("Synthesizing audio...");
    try {
      const data = await synthesizeAudio(romanizedText, speakerID);
      if (data.audio_path) {
        setAudioPath(data.audio_path);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 flex flex-col justify-center items-center py-8 px-4 sm:px-8">
      <h1 className="text-5xl font-extrabold text-white text-center mb-8">
        Sinhala Text Preprocessing
      </h1>
      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <form onSubmit={handleSubmit}>
          <TextInput
            inputText={inputText}
            setInputText={setInputText}
            loading={loading}
          />
          <LoadingButton loading={loading} text="Get Romanized Text" />
        </form>

        {romanizedText && <RomanizedText romanizedText={romanizedText} />}

        {romanizedText && (
          <div className="mt-6">
            <LoadingButtonSynthesize
              loading={loading}
              text="Synthesize Audio"
              onClick={handleSynthesize}
            />
          </div>
        )}

        {audioPath && <AudioPlayer audioUrl={audioPath} />}
      </div>
    </div>
  );
}
