export default function FileUpload({
  setReferenceWAV,
  setTargetWAV,
  handleSynthesize,
  loading,
}) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Upload WAV Files for Voice Cloning:
      </h3>
      <input
        type="file"
        className="w-full p-3 border border-gray-300 rounded-md mb-4"
        onChange={(e) => setReferenceWAV(e.target.files[0])}
        accept="audio/wav"
      />
      <input
        type="file"
        className="w-full p-3 border border-gray-300 rounded-md mb-4"
        onChange={(e) => setTargetWAV(e.target.files[0])}
        accept="audio/wav"
      />
      <button
        onClick={handleSynthesize}
        className="w-full py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition"
        disabled={loading}
      >
        {loading ? "Cloning..." : "Clone Voice"}
      </button>
    </div>
  );
}
