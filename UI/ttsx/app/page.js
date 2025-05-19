"use client";

import { useState, useEffect } from "react";
import TextInput from "./components/TextInput";
import RomanizedText from "./components/RomanizedText";
import AudioPlayer from "./components/AudioPlayer";
import LoadingButton from "./components/LoadingButton";
import LoadingButtonSynthesize from "./components/LoadingButtonSynthesize";
import {
  preprocessText,
  synthesizeAudio,
  cleanAudio,
  cloneAudio,
} from "./components/api";

export default function Home() {
  const [inputText, setInputText] = useState("සිංහල යතුරු ලියනයකට මම කැමතියි");
  const [romanizedText, setRomanizedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [cloningLoading, setCloningLoading] = useState(false);
  const [speakerID, setSpeakerID] = useState("LJ_BaseModel_Oshadi");
  const [referenceAudio, setReferenceAudio] = useState(null);
  const [confirmCloning, setConfirmCloning] = useState(false);

  const [audioFiles, setAudioFiles] = useState({
    original: null,
    cleaned: null,
    cloned: null,
    finalCloned: null,
  });

  const [showUploadArea, setShowUploadArea] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await preprocessText(inputText);
      setRomanizedText(data.processed_text || "Failed to process the text.");
    } catch (error) {
      console.error("Error:", error);
      setRomanizedText("Failed to process the text.");
    } finally {
      setLoading(false);
    }
  };

  const handleSynthesize = async () => {
    if (!romanizedText) return;
    setLoading(true);
    try {
      const data = await synthesizeAudio(romanizedText, speakerID);
      setAudioFiles((prev) => ({
        ...prev,
        original: data.audio_path,
      }));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDenoise = async () => {
    if (!audioFiles.original) return;
    setLoading(true);
    setTimeout(() => {
      setAudioFiles((prev) => ({
        ...prev,
        cleaned: "E:/UOM/FYP/TTSx/UI/ttsx/public/Audios/cleaned_audio.wav",
      }));
      setLoading(false);
      setConfirmCloning(true); // Ask user if they want to proceed
    }, 1000);
  };

  const handleCloneAudio = async () => {
    // console.log(audioFiles.cleaned, referenceAudio);
    if (!audioFiles.cleaned || !referenceAudio) return;
    setCloningLoading(true);
    try {
      const data = await cloneAudio({
        referenceWAV: referenceAudio,
        targetWAV: audioFiles.cleaned,
      });
      console.log("Cloned audio data:", data);
      setAudioFiles((prev) => ({
        ...prev,
        cloned: data.download_path,
      }));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCloningLoading(false);
    }
  };

  const handleDenoiseClonedAudio = async () => {
    if (!audioFiles.cloned) return;
    setCloningLoading(true);
    setTimeout(() => {
      setAudioFiles((prev) => ({
        ...prev,
        finalCloned:
          "E:/UOM/FYP/TTSx/UI/ttsx/public/Audios/FinalInference-enhanced-v2.wav",
      }));
      setCloningLoading(false);
    }, 1000);
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create a URL for the file to ensure it's valid for usage in the app
      const fileURL = "E:/UOM/FYP/TTSx/UI/ttsx/public/Audios/" + file.name;
      setReferenceAudio(fileURL); // Store the temporary URL
      // console.log("Uploaded file:", file);
      setUploadedFileName(file.name);
      setShowUploadArea(false);

      // Set a timeout of 5 seconds to trigger audio cloning
      setTimeout(() => {
        handleCloneAudio();
      }, 15000); // 15 seconds delay
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 flex flex-col justify-center items-center py-8 px-4 sm:px-8">
      <h1 className="text-5xl font-extrabold text-white text-center mb-8">
        Sinhala Text to speech
      </h1>
      <div className="w-full max-w-6xl p-6 bg-white rounded-lg shadow-lg flex flex-col lg:flex-row gap-8">
        {/* Left Side: Text Input */}
        <div className="flex-1">
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
        </div>

        {/* Middle Column: Audio Player */}
        <div className="flex-1">
          {audioFiles.original && (
            <div className="mt-6 text-center">
              <p className="text-xl font-bold text-gray-800 mb-4">
                Synthesized Audio:
              </p>
              <AudioPlayer audioUrl={audioFiles.original} />
              <button
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                onClick={handleDenoise}
              >
                Denoise Audio
              </button>
            </div>
          )}

          {audioFiles.cleaned && (
            <div className="mt-6 text-center">
              <p className="text-xl font-bold text-gray-800 mb-4">
                Denoised Audio:
              </p>
              <AudioPlayer audioUrl={audioFiles.cleaned} />
              {confirmCloning && (
                <div className="mt-4">
                  <p className="text-gray-800">
                    Do you want to proceed with cloning?
                  </p>
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                    onClick={() => setShowUploadArea(true)}
                  >
                    Yes
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded"
                    onClick={() => setConfirmCloning(false)}
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Middle Column: Audio Player */}
        <div className="flex-1">
          {/* Right Side: Upload Reference Audio */}
          {showUploadArea && (
            <div className="flex-1 mt-6">
              <p className="text-lg text-gray-800 mb-4">
                Upload Reference Audio:
              </p>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
              />
            </div>
          )}

          {audioFiles.cloned && (
            <div className="mt-6 text-center">
              <p className="text-xl font-bold text-gray-800 mb-4">
                Cloned Audio:
              </p>
              {/* <p>{audioFiles.cloned}</p> */}
              <AudioPlayer audioUrl={audioFiles.cloned} />
              <button
                className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded"
                onClick={handleDenoiseClonedAudio}
              >
                Denoise Cloned Audio
              </button>
            </div>
          )}

          {audioFiles.finalCloned && (
            <div className="mt-6 text-center">
              <p className="text-xl font-bold text-gray-800 mb-4">
                Final Denoised Cloned Audio:
              </p>
              <AudioPlayer audioUrl={audioFiles.finalCloned} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
