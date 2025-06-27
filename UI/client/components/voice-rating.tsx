"use client";

import { useEffect, useState } from "react";
import { Star, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRatingProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  showFeedback?: boolean;
}

export function VoiceRating({
  label = "Rate this voice",
  size = "md",
  showFeedback = true,
}: VoiceRatingProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [ratings, setRatings] = useState<number[]>([]);

  // Load rating data from localStorage on mount
  useEffect(() => {
    const storedRatings = localStorage.getItem("voice_ratings");
    const storedUserRating = localStorage.getItem("user_rating");
    const storedHasRated = localStorage.getItem("has_rated");

    if (storedRatings) {
      setRatings(JSON.parse(storedRatings));
    }

    if (storedUserRating) {
      setRating(Number(storedUserRating));
    }

    if (storedHasRated === "true") {
      setHasRated(true);
    }
  }, []);

  // Save ratings array to localStorage
  useEffect(() => {
    localStorage.setItem("voice_ratings", JSON.stringify(ratings));
  }, [ratings]);

  // Save rating and hasRated state
  useEffect(() => {
    localStorage.setItem("user_rating", rating.toString());
    localStorage.setItem("has_rated", hasRated.toString());
  }, [rating, hasRated]);

  const handleRating = (value: number) => {
    if (hasRated) return;
    setRating(value);
    setHasRated(true);
    const newRatings = [...ratings, value];
    setRatings(newRatings);
  };

  const getFeedbackText = () => {
    if (!hasRated) return "";
    if (rating <= 1) return "Poor quality";
    if (rating <= 2) return "Needs improvement";
    if (rating <= 3) return "Average quality";
    if (rating <= 4) return "Good quality";
    return "Excellent quality";
  };

  const average =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

  const downloadCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,rating\n" + ratings.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "voice_ratings.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const starSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/80">{label}</p>
        {showFeedback && hasRated && (
          <span
            className={cn(
              "text-xs px-2 py-1 rounded-full",
              rating <= 2
                ? "bg-red-500/20 text-red-300"
                : rating <= 3
                ? "bg-yellow-500/20 text-yellow-300"
                : "bg-green-500/20 text-green-300"
            )}
          >
            {getFeedbackText()}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleRating(value)}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={hasRated}
            className={cn(
              "focus:outline-none transition-transform",
              !hasRated && "hover:scale-110",
              hasRated && "cursor-not-allowed"
            )}
          >
            <Star
              className={cn(
                starSizes[size],
                "transition-colors",
                hoverRating > 0
                  ? value <= hoverRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-white/20"
                  : rating > 0
                  ? value <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-white/20"
                  : "text-white/20"
              )}
            />
          </button>
        ))}
      </div>

      <div className="text-xs text-white/60">
        Average Rating: {average.toFixed(2)} ({ratings.length} votes)
      </div>

      <button
        onClick={downloadCSV}
        className="flex items-center gap-2 text-xs text-blue-400 hover:underline"
      >
        <Download className="w-4 h-4" /> Download CSV
      </button>
    </div>
  );
}
