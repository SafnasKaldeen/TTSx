"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Mic, AlertCircle, Check } from "lucide-react";

interface VoiceCloneConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  hasClonedVoice: boolean;
}

export function VoiceCloneConfirmation({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  hasClonedVoice,
}: VoiceCloneConfirmationProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/20 backdrop-blur-xl border-white/20 text-white max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-purple-500/30 p-3 rounded-full mb-4">
            <Mic className="h-6 w-6 text-purple-200" />
          </div>
          <DialogTitle className="text-center text-xl">
            {hasClonedVoice
              ? "Use Your Cloned Voice?"
              : "Create Your Voice Clone?"}
          </DialogTitle>
          <DialogDescription className="text-white/70 text-center">
            {hasClonedVoice
              ? "Would you like to use your cloned voice for this text-to-speech generation?"
              : "You don't have a voice clone yet. Would you like to create one now?"}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-white/10 rounded-xl mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-purple-300 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-white/80">
              {hasClonedVoice
                ? "Your cloned voice will make the generated speech sound like you. You can always switch back to standard voices."
                : "Voice cloning requires a short audio sample of your voice. The process takes just a few minutes."}
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="sm:flex-1 border-white/20 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-colors"
          >
            {hasClonedVoice ? "Use Standard Voice" : "Not Now"}
          </Button>
          <Button
            onClick={onConfirm}
            className="sm:flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Check className="h-4 w-4 mr-2" />
            {hasClonedVoice ? "Use My Voice" : "Create Voice Clone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
