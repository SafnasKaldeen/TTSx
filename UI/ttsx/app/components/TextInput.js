export default function TextInput({ inputText, setInputText, loading }) {
  return (
    <div>
      <label
        htmlFor="text-input"
        className="block text-xl font-semibold text-gray-800 mb-2"
      >
        Enter Text:
      </label>
      <textarea
        id="text-input"
        rows="4"
        className="w-full p-3 border border-gray-300 rounded-md mb-4 bg-gray-100 focus:ring-2 focus:ring-indigo-500 text-gray-800"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Type Sinhala text here"
      />
    </div>
  );
}
