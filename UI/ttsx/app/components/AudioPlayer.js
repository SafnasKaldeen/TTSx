export default function AudioPlayer({ audioUrl }) {
  // Extract the filename from the full path
  audioUrl = audioUrl.replace("E:/UOM/FYP/TTSx/UI/ttsx/public", "");
  //   console.log(audioUrl);
  const finalAudioUrl = `http://localhost:3000/${audioUrl}`;

  console.log("Final Audio URL: ", finalAudioUrl);

  return (
    <div className="mt-6">
      {/* <p>{finalAudioUrl}</p> */}
      <audio controls>
        <source src={finalAudioUrl} type="audio/wav" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
