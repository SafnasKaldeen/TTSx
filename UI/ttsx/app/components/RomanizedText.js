export default function RomanizedText({ romanizedText }) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Romanized Text:
      </h3>
      <textarea
        className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-gray-800"
        rows="4"
        readOnly
        value={romanizedText}
      />
    </div>
  );
}
