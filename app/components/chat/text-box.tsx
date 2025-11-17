"use client"

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputProvider,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/app/components/ai-elements/prompt-input"
import { TTSToggle } from "@/app/components/ai-elements/tts"
import { TTSSettings } from "@/app/components/ai-elements/tts-settings"

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

export function TextBox({
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
    
    <PromptInputProvider>
      <PromptInput onSubmit={onSubmit} className={className} style={{ border: 'none' }}>
        <PromptInputHeader>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
        </PromptInputHeader>

        <PromptInputBody>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Pathfinity..."
          />
        </PromptInputBody>

        <PromptInputFooter>
          <PromptInputTools className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              <PromptInputModelSelect onValueChange={setModel} value={model}>
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((modelOption) => (
                    <PromptInputModelSelectItem
                      key={modelOption.id}
                      value={modelOption.id}
                    >
                      {modelOption.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </div>

            <div className="flex items-center gap-1">
              <TTSToggle className="border rounded-full text-black" />
              <TTSSettings className="border rounded-full text-black" />
              <PromptInputSpeechButton className="border rounded-full text-black" />
            </div>
          </PromptInputTools>
          <PromptInputSubmit status={status} className="ml-2 rounded-full"/>
        </PromptInputFooter>
      </PromptInput>
    </PromptInputProvider>
  )
}

export default TextBox;
