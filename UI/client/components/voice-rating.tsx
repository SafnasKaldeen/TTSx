"use client";

import { useEffect, useState } from "react";
import { Star, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";

interface VoiceRatingProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  showFeedback?: boolean;
  voiceId: string;
}

type RatingsStore = {
  [voiceId: string]: number[];
};

type UserRatings = {
  [voiceId: string]: number;
};

export function VoiceRating({
  label = "Rate this voice",
  size = "md",
  showFeedback = true,
  voiceId,
}: VoiceRatingProps) {
  const [rating, setRating] = useState<number>(4.21);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratingsStore, setRatingsStore] = useState<RatingsStore>({});

  const ratingsCookieKey = "all_voice_ratings";
  const userRatingCookieKey = "user_voice_ratings";
  const cookieOptions = { expires: 30 }; // 30 days

  // Helper to encode voiceId consistently
  const formatVoiceId = (id: string) => encodeURIComponent(id.trim());

  const formattedVoiceId = formatVoiceId(voiceId);

  // Load cookies on mount or when voiceId changes
  useEffect(() => {
    const allRatings = Cookies.get(ratingsCookieKey);
    const userRatings = Cookies.get(userRatingCookieKey);

    if (allRatings) {
      const parsed = JSON.parse(allRatings) as RatingsStore;
      console.log("All Ratings Keys:", Object.keys(parsed));
      setRatingsStore(parsed);
    }

    if (userRatings) {
      const parsed = JSON.parse(userRatings) as UserRatings;
      if (parsed[formattedVoiceId]) {
        console.log("User rating for this voiceId:", parsed[formattedVoiceId]);
        setRating(parsed[formattedVoiceId]);
      } else {
        console.log("No user rating found for", formattedVoiceId);
      }
    }
  }, [formattedVoiceId]);

  const handleRating = (value: number) => {
    setRating(value);

    // Update user rating
    const userRatings = JSON.parse(
      Cookies.get(userRatingCookieKey) || "{}"
    ) as UserRatings;
    userRatings[formattedVoiceId] = value;
    Cookies.set(
      userRatingCookieKey,
      JSON.stringify(userRatings),
      cookieOptions
    );

    // Update overall ratings
    const allRatings = JSON.parse(
      Cookies.get(ratingsCookieKey) || "{}"
    ) as RatingsStore;

    if (!allRatings[formattedVoiceId]) {
      allRatings[formattedVoiceId] = [];
    }
    allRatings[formattedVoiceId].push(value);
    Cookies.set(ratingsCookieKey, JSON.stringify(allRatings), cookieOptions);

    setRatingsStore(allRatings); // Update UI
  };

  const average =
    ratingsStore[formattedVoiceId]?.length > 0
      ? ratingsStore[formattedVoiceId].reduce((sum, r) => sum + r, 0) /
        ratingsStore[formattedVoiceId].length
      : 0;

  const getFeedbackText = () => {
    if (rating <= 1) return "Poor quality";
    if (rating <= 2) return "Needs improvement";
    if (rating <= 3) return "Average quality";
    if (rating <= 4) return "Good quality";
    return "Excellent quality";
  };

  const downloadCSV = () => {
    const rows = ratingsStore[formattedVoiceId] || [];
    const csv = "data:text/csv;charset=utf-8,rating\n" + rows.join("\n");
    const encoded = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `voice_ratings_${voiceId}.csv`);
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
        {showFeedback && rating > 0 && (
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
            className="focus:outline-none transition-transform hover:scale-110"
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
        Average Rating: {average.toFixed(2)} (
        {ratingsStore[formattedVoiceId]?.length || 0} votes)
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
