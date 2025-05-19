"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceRatingProps {
  onRatingChange?: (rating: number) => void
  initialRating?: number
  label?: string
  size?: "sm" | "md" | "lg"
  showFeedback?: boolean
}

export function VoiceRating({
  onRatingChange,
  initialRating = 0,
  label = "Rate this voice",
  size = "md",
  showFeedback = true,
}: VoiceRatingProps) {
  const [rating, setRating] = useState<number>(initialRating)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [hasRated, setHasRated] = useState<boolean>(initialRating > 0)

  const handleRating = (value: number) => {
    setRating(value)
    setHasRated(true)
    if (onRatingChange) {
      onRatingChange(value)
    }
  }

  const getFeedbackText = () => {
    if (!hasRated) return ""
    if (rating <= 1) return "Poor quality"
    if (rating <= 2) return "Needs improvement"
    if (rating <= 3) return "Average quality"
    if (rating <= 4) return "Good quality"
    return "Excellent quality"
  }

  const starSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  return (
    <div className="space-y-2">
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
                  : "bg-green-500/20 text-green-300",
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
                (hoverRating ? value <= hoverRating : value <= rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-white/30",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
