export default function LoadingButton({ loading, text }) {
  return (
    <button
      type="submit"
      className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition"
      disabled={loading}
    >
      {loading ? "Processing..." : text}
    </button>
  );
}
