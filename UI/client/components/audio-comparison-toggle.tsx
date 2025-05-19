"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Wand2, Waves } from "lucide-react";

interface AudioComparisonToggleProps {
  onToggle: (isDenoised: boolean) => void;
  initialDenoised?: boolean;
}

export function AudioComparisonToggle({
  onToggle,
  initialDenoised = true,
}: AudioComparisonToggleProps) {
  const [isDenoised, setIsDenoised] = useState<boolean>(initialDenoised);

  const handleToggle = (denoised: boolean) => {
    setIsDenoised(denoised);
    onToggle(denoised);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm text-white/80">Audio Processing</Label>
      <div className="flex p-1 bg-white/10 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggle(true)}
          className={cn(
            "flex-1 rounded-md flex items-center justify-center gap-2 py-3 transition-colors",
            isDenoised
              ? "bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white"
              : "bg-white/5 text-white/80 hover:text-white hover:bg-white/10"
          )}
        >
          <Wand2 className="h-4 w-4" />
          <span>Denoised</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggle(false)}
          className={cn(
            "flex-1 rounded-md flex items-center justify-center gap-2 py-3 transition-colors",
            !isDenoised
              ? "bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white"
              : "bg-white/5 text-white/80 hover:text-white hover:bg-white/10"
          )}
        >
          <Waves className="h-4 w-4" />
          <span>Original</span>
        </Button>
      </div>
    </div>
  );
}
