"use client"

import TextBox from './text-box'
import type { PromptInputMessage } from "@/app/components/ai-elements/prompt-input"

type ModelOption = { id: string; name: string }

type Props = {
  input: string
  setInput: (v: string) => void
  onSubmit: (message: PromptInputMessage) => void
  models: ModelOption[]
  model: string
  setModel: (v: string) => void
  status: any
  className?: string
}

export function PromptBox({
  input,
  setInput,
  onSubmit,
  models,
  model,
  setModel,
  status,
  className,
}: Props) {
  return (
    <TextBox
      input={input}
      setInput={setInput}
      onSubmit={onSubmit}
      models={models}
      model={model}
      setModel={setModel}
      status={status}
      className={className}
      // speech handled inline by the mic button; no extra modal
    />
  )
}

export default PromptBox;
