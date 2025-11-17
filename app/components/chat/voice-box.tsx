"use client"

import { Mic, X} from "lucide-react"
import { Button } from "@/app/components/ui/button"

type Props = {
  className?: string
  onClose: () => void
  onStartRecording?: () => void
}

export function VoiceBox({ className, onClose, onStartRecording }: Props) {
  return (
    <div className={className}>
      <div className="flex items-center justify-center w-full py-6 gap-5">
        <Button
          variant="default"
          size="icon"
          aria-label="Start voice input"
          className="h-20 w-20 rounded-full bg-black text-white"
          onClick={() => onStartRecording && onStartRecording()}
        >
          <Mic className="scale-150" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          aria-label="Close voice input"
          className="h-20 w-20 rounded-full "
          onClick={onClose}
        >
          <X className="scale-150" />
        </Button>
      </div>
    </div>
  )
}

export default VoiceBox;