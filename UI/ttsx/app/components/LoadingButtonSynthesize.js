export default function LoadingButton({ loading, text, onClick }) {
  return (
    <button
      type="button" // Change from "submit" to "button"
      className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition"
      disabled={loading}
      onClick={onClick}
    >
      {loading ? "Processing..." : text}
    </button>
  );
}
