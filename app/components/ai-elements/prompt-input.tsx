"use client";

import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/app/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/app/components/ui/hover-card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/app/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/lib/utils";
import type { ChatStatus, FileUIPart } from "ai";
import {
  ImageIcon,
  Loader2Icon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
  SendIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { nanoid } from "nanoid";
import {
  type ChangeEvent,
  type ChangeEventHandler,
  Children,
  type ClipboardEventHandler,
  type ComponentProps,
  createContext,
  type FormEvent,
  type FormEventHandler,
  Fragment,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type PropsWithChildren,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
// ============================================================================
// Provider Context & Types
// ============================================================================

export type AttachmentsContext = {
  files: (FileUIPart & { id: string })[];
  add: (files: File[] | FileList) => void;
  remove: (id: string) => void;
  clear: () => void;
  openFileDialog: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
};

export type TextInputContext = {
  value: string;
  setInput: (v: string) => void;
  clear: () => void;
};

export type PromptInputControllerProps = {
  textInput: TextInputContext;
  attachments: AttachmentsContext;
  /** INTERNAL: Allows PromptInput to register its file textInput + "open" callback */
  __registerFileInput: (
    ref: RefObject<HTMLInputElement | null>,
    open: () => void
  ) => void;
};

const PromptInputController = createContext<PromptInputControllerProps | null>(
  null
);
const ProviderAttachmentsContext = createContext<AttachmentsContext | null>(
  null
);

export const usePromptInputController = () => {
  const ctx = useContext(PromptInputController);
  if (!ctx) {
    throw new Error(
      "Wrap your component inside <PromptInputProvider> to use usePromptInputController()."
    );
  }
  return ctx;
};

// Optional variants (do NOT throw). Useful for dual-mode components.
const useOptionalPromptInputController = () =>
  useContext(PromptInputController);

export const useProviderAttachments = () => {
  const ctx = useContext(ProviderAttachmentsContext);
  if (!ctx) {
    throw new Error(
      "Wrap your component inside <PromptInputProvider> to use useProviderAttachments()."
    );
  }
  return ctx;
};

const useOptionalProviderAttachments = () =>
  useContext(ProviderAttachmentsContext);

export type PromptInputProviderProps = PropsWithChildren<{
  initialInput?: string;
}>;

/**
 * Optional global provider that lifts PromptInput state outside of PromptInput.
 * If you don't use it, PromptInput stays fully self-managed.
 */
export function PromptInputProvider({
  initialInput: initialTextInput = "",
  children,
}: PromptInputProviderProps) {
  // ----- textInput state
  const [textInput, setTextInput] = useState(initialTextInput);
  const clearInput = useCallback(() => setTextInput(""), []);

  // ----- attachments state (global when wrapped)
  const [attachements, setAttachements] = useState<
    (FileUIPart & { id: string })[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const openRef = useRef<() => void>(() => {});

  const add = useCallback((files: File[] | FileList) => {
    const incoming = Array.from(files);
    if (incoming.length === 0) return;

    setAttachements((prev) =>
      prev.concat(
        incoming.map((file) => ({
          id: nanoid(),
          type: "file" as const,
          url: URL.createObjectURL(file),
          mediaType: file.type,
          filename: file.name,
        }))
      )
    );
  }, []);

  const remove = useCallback((id: string) => {
    setAttachements((prev) => {
      const found = prev.find((f) => f.id === id);
      if (found?.url) URL.revokeObjectURL(found.url);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setAttachements((prev) => {
      for (const f of prev) if (f.url) URL.revokeObjectURL(f.url);
      return [];
    });
  }, []);

  const openFileDialog = useCallback(() => {
    openRef.current?.();
  }, []);

  const attachments = useMemo<AttachmentsContext>(
    () => ({
      files: attachements,
      add,
      remove,
      clear,
      openFileDialog,
      fileInputRef,
    }),
    [attachements, add, remove, clear, openFileDialog]
  );

  const __registerFileInput = useCallback(
    (ref: RefObject<HTMLInputElement | null>, open: () => void) => {
      fileInputRef.current = ref.current;
      openRef.current = open;
    },
    []
  );

  const controller = useMemo<PromptInputControllerProps>(
    () => ({
      textInput: {
        value: textInput,
        setInput: setTextInput,
        clear: clearInput,
      },
      attachments,
      __registerFileInput,
    }),
    [textInput, clearInput, attachments, __registerFileInput]
  );

  return (
    <PromptInputController.Provider value={controller}>
      <ProviderAttachmentsContext.Provider value={attachments}>
        {children}
      </ProviderAttachmentsContext.Provider>
    </PromptInputController.Provider>
  );
}

// ============================================================================
// Component Context & Hooks
// ============================================================================

const LocalAttachmentsContext = createContext<AttachmentsContext | null>(null);

// Recording context: provides live recording state for other prompt input parts
export type RecordingContextType = {
  isRecording: boolean;
  level: number;
  levels: number[];
  spectrum: number[];
  elapsedMs: number;
  isProcessing: boolean;
  _setIsProcessing: (v: boolean) => void;
  // internal setters exposed to update state
  _setIsRecording: (v: boolean) => void;
  _pushLevel: (v: number) => void;
  _setElapsedMs: (ms: number) => void;
  _setSpectrum: (s: number[]) => void;
};

const RecordingContext = createContext<RecordingContextType | null>(null);

export const usePromptInputAttachments = () => {
  // Dual-mode: prefer provider if present, otherwise use local
  const provider = useOptionalProviderAttachments();
  const local = useContext(LocalAttachmentsContext);
  const context = provider ?? local;
  if (!context) {
    throw new Error(
      "usePromptInputAttachments must be used within a PromptInput or PromptInputProvider"
    );
  }
  return context;
};

export type PromptInputAttachmentProps = HTMLAttributes<HTMLDivElement> & {
  data: FileUIPart & { id: string };
  className?: string;
};

export function PromptInputAttachment({
  data,
  className,
  ...props
}: PromptInputAttachmentProps) {
  const attachments = usePromptInputAttachments();

  const filename = data.filename || "";

  const mediaType =
    data.mediaType?.startsWith("image/") && data.url ? "image" : "file";
  const isImage = mediaType === "image";

  const attachmentLabel = filename || (isImage ? "Image" : "Attachment");

  return (
    <PromptInputHoverCard>
      <HoverCardTrigger asChild>
        <div
          className={cn(
            "group relative flex h-8 cursor-default select-none items-center gap-1.5 rounded-md border border-border px-1.5 font-medium text-sm transition-all hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
            className
          )}
          key={data.id}
          {...props}
        >
          <div className="relative size-5 shrink-0">
            <div className="absolute inset-0 flex size-5 items-center justify-center overflow-hidden rounded bg-background transition-opacity group-hover:opacity-0">
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={filename || "attachment"}
                  className="size-5 object-cover"
                  height={20}
                  src={data.url}
                  width={20}
                />
              ) : (
                <div className="flex size-5 items-center justify-center text-muted-foreground">
                  <PaperclipIcon className="size-3" />
                </div>
              )}
            </div>
            <Button
              aria-label="Remove attachment"
              className="absolute inset-0 size-5 cursor-pointer rounded p-0 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 [&>svg]:size-2.5"
              onClick={(e) => {
                e.stopPropagation();
                attachments.remove(data.id);
              }}
              type="button"
              variant="ghost"
            >
              <XIcon />
              <span className="sr-only">Remove</span>
            </Button>
          </div>

          <span className="flex-1 truncate">{attachmentLabel}</span>
        </div>
      </HoverCardTrigger>
      <PromptInputHoverCardContent className="w-auto p-2">
        <div className="w-auto space-y-3">
          {isImage && (
            <div className="flex max-h-96 w-96 items-center justify-center overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={filename || "attachment preview"}
                className="max-h-full max-w-full object-contain"
                height={384}
                src={data.url}
                width={448}
              />
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <div className="min-w-0 flex-1 space-y-1 px-0.5">
              <h4 className="truncate font-semibold text-sm leading-none">
                {filename || (isImage ? "Image" : "Attachment")}
              </h4>
              {data.mediaType && (
                <p className="truncate font-mono text-muted-foreground text-xs">
                  {data.mediaType}
                </p>
              )}
            </div>
          </div>
        </div>
      </PromptInputHoverCardContent>
    </PromptInputHoverCard>
  );
}

export type PromptInputAttachmentsProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children: (attachment: FileUIPart & { id: string }) => ReactNode;
};

export function PromptInputAttachments({
  children,
}: PromptInputAttachmentsProps) {
  const attachments = usePromptInputAttachments();

  if (!attachments.files.length) {
    return null;
  }

  return attachments.files.map((file) => (
    <Fragment key={file.id}>{children(file)}</Fragment>
  ));
}

export type PromptInputActionAddAttachmentsProps = ComponentProps<
  typeof DropdownMenuItem
> & {
  label?: string;
};

export const PromptInputActionAddAttachments = ({
  label = "Add photos or files",
  ...props
}: PromptInputActionAddAttachmentsProps) => {
  const attachments = usePromptInputAttachments();

  return (
    <DropdownMenuItem
      {...props}
      onSelect={(e) => {
        e.preventDefault();
        attachments.openFileDialog();
      }}
    >
      <ImageIcon className="mr-2 size-4" /> {label}
    </DropdownMenuItem>
  );
};

export type PromptInputMessage = {
  text?: string;
  files?: FileUIPart[];
};

export type PromptInputProps = Omit<
  HTMLAttributes<HTMLFormElement>,
  "onSubmit" | "onError"
> & {
  accept?: string; // e.g., "image/*" or leave undefined for any
  multiple?: boolean;
  // When true, accepts drops anywhere on document. Default false (opt-in).
  globalDrop?: boolean;
  // Render a hidden input with given name and keep it in sync for native form posts. Default false.
  syncHiddenInput?: boolean;
  // Minimal constraints
  maxFiles?: number;
  maxFileSize?: number; // bytes
  onError?: (err: {
    code: "max_files" | "max_file_size" | "accept";
    message: string;
  }) => void;
  onSubmit: (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>
  ) => void | Promise<void>;
};

export const PromptInput = ({
  className,
  accept,
  multiple,
  globalDrop,
  syncHiddenInput,
  maxFiles,
  maxFileSize,
  onError,
  onSubmit,
  children,
  ...props
}: PromptInputProps) => {
  // Try to use a provider controller if present
  const controller = useOptionalPromptInputController();
  const usingProvider = !!controller;

  // Refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Find nearest form to scope drag & drop
  useEffect(() => {
    const root = anchorRef.current?.closest("form");
    if (root instanceof HTMLFormElement) {
      formRef.current = root;
    }
  }, []);

  // ----- Local attachments (only used when no provider)
  const [items, setItems] = useState<(FileUIPart & { id: string })[]>([]);
  const files = usingProvider ? controller.attachments.files : items;

  const openFileDialogLocal = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const matchesAccept = useCallback(
    (f: File) => {
      if (!accept || accept.trim() === "") {
        return true;
      }
      if (accept.includes("image/*")) {
        return f.type.startsWith("image/");
      }
      // NOTE: keep simple; expand as needed
      return true;
    },
    [accept]
  );

  const addLocal = useCallback(
    (fileList: File[] | FileList) => {
      const incoming = Array.from(fileList);
      const accepted = incoming.filter((f) => matchesAccept(f));
      if (incoming.length && accepted.length === 0) {
        onError?.({
          code: "accept",
          message: "No files match the accepted types.",
        });
        return;
      }
      const withinSize = (f: File) =>
        maxFileSize ? f.size <= maxFileSize : true;
      const sized = accepted.filter(withinSize);
      if (accepted.length > 0 && sized.length === 0) {
        onError?.({
          code: "max_file_size",
          message: "All files exceed the maximum size.",
        });
        return;
      }

      setItems((prev) => {
        const capacity =
          typeof maxFiles === "number"
            ? Math.max(0, maxFiles - prev.length)
            : undefined;
        const capped =
          typeof capacity === "number" ? sized.slice(0, capacity) : sized;
        if (typeof capacity === "number" && sized.length > capacity) {
          onError?.({
            code: "max_files",
            message: "Too many files. Some were not added.",
          });
        }
        const next: (FileUIPart & { id: string })[] = [];
        for (const file of capped) {
          next.push({
            id: nanoid(),
            type: "file",
            url: URL.createObjectURL(file),
            mediaType: file.type,
            filename: file.name,
          });
        }
        return prev.concat(next);
      });
    },
    [matchesAccept, maxFiles, maxFileSize, onError]
  );

  const add = useMemo<((files: File[] | FileList) => void)>(
    () => (usingProvider
      ? (files: File[] | FileList) => controller.attachments.add(files)
      : addLocal
    ),
    [usingProvider, controller, addLocal]
  );

  const remove = useMemo<((id: string) => void)>(
    () => (usingProvider
      ? (id: string) => controller.attachments.remove(id)
      : (id: string) =>
          setItems((prev) => {
            const found = prev.find((file) => file.id === id);
            if (found?.url) {
              URL.revokeObjectURL(found.url);
            }
            return prev.filter((file) => file.id !== id);
          })
    ),
    [usingProvider, controller]
  );

  const clear = useMemo<(() => void)>(
    () => (usingProvider
      ? () => controller.attachments.clear()
      : () =>
          setItems((prev) => {
            for (const file of prev) {
              if (file.url) {
                URL.revokeObjectURL(file.url);
              }
            }
            return [];
          })
    ),
    [usingProvider, controller]
  );

  const openFileDialog = useMemo<(() => void)>(
    () => (usingProvider
      ? () => controller.attachments.openFileDialog()
      : openFileDialogLocal
    ),
    [usingProvider, controller, openFileDialogLocal]
  );

  // Let provider know about our hidden file input so external menus can call openFileDialog()
  useEffect(() => {
    if (!usingProvider) return;
    controller.__registerFileInput(inputRef, () => inputRef.current?.click());
  }, [usingProvider, controller]);

  // Note: File input cannot be programmatically set for security reasons
  // The syncHiddenInput prop is no longer functional
  useEffect(() => {
    if (syncHiddenInput && inputRef.current && files.length === 0) {
      inputRef.current.value = "";
    }
  }, [files, syncHiddenInput]);

  // Attach drop handlers on nearest form and document (opt-in)
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
    };
    const onDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        add(e.dataTransfer.files);
      }
    };
    form.addEventListener("dragover", onDragOver);
    form.addEventListener("drop", onDrop);
    return () => {
      form.removeEventListener("dragover", onDragOver);
      form.removeEventListener("drop", onDrop);
    };
  }, [add]);

  useEffect(() => {
    if (!globalDrop) return;

    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
    };
    const onDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        add(e.dataTransfer.files);
      }
    };
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, [add, globalDrop]);

  useEffect(
    () => () => {
      if (!usingProvider) {
        for (const f of files) {
          if (f.url) URL.revokeObjectURL(f.url);
        }
      }
    },
    [usingProvider, files]
  );

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.currentTarget.files) {
      add(event.currentTarget.files);
    }
  };

  const convertBlobUrlToDataUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const ctx = useMemo<AttachmentsContext>(
    () => ({
      files: files.map((item) => ({ ...item, id: item.id })),
      add,
      remove,
      clear,
      openFileDialog,
      fileInputRef: inputRef,
    }),
    [files, add, remove, clear, openFileDialog]
  );

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const text = usingProvider
      ? controller.textInput.value
      : (() => {
          const formData = new FormData(form);
          return (formData.get("message") as string) || "";
        })();

    // Reset form immediately after capturing text to avoid race condition
    // where user input during async blob conversion would be lost
    if (!usingProvider) {
      form.reset();
    }

    // Convert blob URLs to data URLs asynchronously
    Promise.all(
      files.map(async (item) => {
        if (item.url && item.url.startsWith("blob:")) {
          return {
            ...item,
            url: await convertBlobUrlToDataUrl(item.url),
          };
        }
        return item;
      })
    ).then((convertedFiles: FileUIPart[]) => {
      try {
        const result = onSubmit({ text, files: convertedFiles }, event);

        // Handle both sync and async onSubmit
        if (result instanceof Promise) {
          result
            .then(() => {
              clear();
              if (usingProvider) {
                controller.textInput.clear();
              }
            })
            .catch(() => {
              // Don't clear on error - user may want to retry
            });
        } else {
          // Sync function completed without throwing, clear attachments
          clear();
          if (usingProvider) {
            controller.textInput.clear();
          }
        }
      } catch {
        // Don't clear on error - user may want to retry
      }
    });
  };

  // Render with or without local provider
  const inner = (
    <>
      <span aria-hidden="true" className="hidden" ref={anchorRef} />
      <input
        accept={accept}
        aria-label="Upload files"
        className="hidden"
        multiple={multiple}
        onChange={handleChange}
        ref={inputRef}
        title="Upload files"
        type="file"
      />
      <form
        className={cn("w-full", className)}
        onSubmit={handleSubmit}
        {...props}
      >
        <InputGroup>{children}</InputGroup>
      </form>
    </>
  );

  // Recording context provider: lift recording state so textarea can render waveform
  const [recIsRecording, _setRecIsRecording] = useState<boolean>(false);
  const [recLevel] = useState<number>(0);
  const [recLevels, _setRecLevels] = useState<number[]>([]);
  const [recElapsedMs, _setRecElapsedMs] = useState<number>(0);
  const [recSpectrum, _setRecSpectrum] = useState<number[]>([]);
  const [recIsProcessing, _setRecIsProcessing] = useState<boolean>(false);

  const _pushRecLevel = useCallback((v: number) => {
    _setRecLevels((prev) => {
      // apply light exponential smoothing to incoming level
      const last = prev.length ? prev[prev.length - 1] : 0;
      const smooth = last * 0.75 + v * 0.25;
      const next = prev.concat(smooth).slice(-128);
      return next;
    });
  }, []);

  const recordingCtxVal: RecordingContextType = useMemo(
    () => ({
      isRecording: recIsRecording,
      level: recLevel,
      levels: recLevels,
      spectrum: recSpectrum,
      elapsedMs: recElapsedMs,
      isProcessing: recIsProcessing,
      _setIsProcessing: _setRecIsProcessing,
      _setIsRecording: _setRecIsRecording,
      _pushLevel: _pushRecLevel,
      _setElapsedMs: _setRecElapsedMs,
      _setSpectrum: _setRecSpectrum,
    }),
    [recIsRecording, recLevel, recLevels, recElapsedMs, _pushRecLevel, recSpectrum, recIsProcessing]
  );

  const wrapped = (
    <RecordingContext.Provider value={recordingCtxVal}>
      {usingProvider ? (
        inner
      ) : (
        <LocalAttachmentsContext.Provider value={ctx}>{inner}</LocalAttachmentsContext.Provider>
      )}
    </RecordingContext.Provider>
  );

  return wrapped;
};

export type PromptInputBodyProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputBody = ({
  className,
  ...props
}: PromptInputBodyProps) => (
  <div className={cn("contents", className)} {...props} />
);

export type PromptInputTextareaProps = ComponentProps<
  typeof InputGroupTextarea
>;

export const PromptInputTextarea = ({
  onChange,
  className,
  placeholder = "What would you like to know?",
  ...props
}: PromptInputTextareaProps) => {
  const controller = useOptionalPromptInputController();
  const attachments = usePromptInputAttachments();
  const [isComposing, setIsComposing] = useState(false);
  const recordingCtx = useContext(RecordingContext);
  // levels are still available, but we now render spectrum; keep memo to avoid re-alloc
  // const levels = useMemo(() => recordingCtx?.levels ?? [], [recordingCtx?.levels]);
  const spectrum = useMemo(() => recordingCtx?.spectrum ?? [], [recordingCtx?.spectrum]);
  const recElapsed = recordingCtx?.elapsedMs ?? 0;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // previous displayed heights for smoothing: pairs and optional center
  const prevPairHeightsRef = useRef<number[]>([]);
  const prevCenterHeightRef = useRef<number>(0);

    useEffect(() => {
      const canvas = canvasRef.current;
      const wrapper = wrapperRef.current;
      if (!canvas || !wrapper) return; 

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const width = Math.max(100, wrapper.clientWidth);
  // reduce waveform height by ~50% from previous value: keep within sensible bounds
  const original = Math.min(140, Math.max(28, wrapper.clientHeight - 8 + 80));
  const visHeight = Math.max(20, Math.round(original * 0.5));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(visHeight * dpr);
      canvas.style.width = `${width}px`; 
      canvas.style.height = `${visHeight}px`; 
      // visually widen the waveform (scale X) without changing layout
      // this makes the bars appear ~1.5x wider
      try {
        canvas.style.transform = "scaleX(1.5)";
        canvas.style.transformOrigin = "center";
      } catch {}

      const ctx2 = canvas.getContext("2d");
      if (!ctx2) return;
      ctx2.scale(dpr, dpr);
      ctx2.clearRect(0, 0, width, visHeight);

      const centerY = visHeight / 2;
      // background (transparent)
      ctx2.fillStyle = "transparent";
      ctx2.fillRect(0, 0, width, visHeight);

      const spec = spectrum;
      if (!spec || spec.length === 0) {
        // faint center line
        ctx2.strokeStyle = "rgba(148,163,184,0.12)";
        ctx2.lineWidth = 1;
        ctx2.beginPath();
        ctx2.moveTo(0, centerY);
        ctx2.lineTo(width, centerY);
        ctx2.stroke();
        return;
      }

      // colorful radial backdrop so the inner area blends and looks vibrant
      try {
        const centerX = width / 2;
        const grad = ctx2.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, visHeight));
        grad.addColorStop(0, "rgba(99,102,241,0.12)"); // indigo
        grad.addColorStop(0.5, "rgba(139,92,246,0.08)"); // purple
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx2.fillStyle = grad;
        ctx2.fillRect(0, 0, width, visHeight);
      } catch {}

  // draw mirrored vertical frequency bars centered on the canvas with gradient fill and rounded caps
  const bars = Math.min(64, spec.length);
      const barGap = 1;
      const barW = Math.max(1, Math.floor((width - (bars - 1) * barGap) / bars));
      const centerX = Math.floor(width / 2);

      // horizontal gradient for bars (left-to-right colorful)
  const barGrad = ctx2.createLinearGradient(0, 0, width, 0);
      barGrad.addColorStop(0, '#60a5fa'); // sky-400
      barGrad.addColorStop(0.45, '#7c3aed'); // purple-600
      barGrad.addColorStop(1, '#fb7185'); // rose-400

      // glow settings
      const glowColor = 'rgba(124,58,237,0.28)';
      // slightly reduced sensitivity from previous value
      const sensitivity = 2.2;
      const half = Math.floor(bars / 2);

      // helper: draw rounded rect
      const drawRoundedRect = (x: number, y: number, w: number, h: number, r = Math.min(4, w / 2)) => {
        ctx2.beginPath();
        const radius = Math.max(0, Math.min(r, h / 2));
        ctx2.moveTo(x + radius, y);
        ctx2.arcTo(x + w, y, x + w, y + h, radius);
        ctx2.arcTo(x + w, y + h, x, y + h, radius);
        ctx2.arcTo(x, y + h, x, y, radius);
        ctx2.arcTo(x, y, x + w, y, radius);
        ctx2.closePath();
        ctx2.fill();
      };

    // attack/release smoothing: fast attack (spike up), faster release for erratic spikes
    const alphaAttack = 0.9; // when target > prev (rise quickly)
    // increased release alpha to make the bars decay faster (more erratic look)
    const alphaRelease = 0.85; // when target < prev (decay)

      // draw center bar if odd number of bars (with smoothing)
      if (bars % 2 === 1) {
        const midIdx = half;
        let v = spec[midIdx] ?? 0;
        v = Math.min(1, v * sensitivity);
        const targetH = Math.max(2, Math.round(v * (visHeight - 6)));
  const prev = prevCenterHeightRef.current ?? 0;
  const useAlpha = targetH > prev ? alphaAttack : alphaRelease;
  const displayedH = Math.round(prev * (1 - useAlpha) + targetH * useAlpha);
        const x = centerX - Math.floor(barW / 2);
        const y = centerY - displayedH / 2;
        ctx2.save();
        ctx2.shadowBlur = 10;
        ctx2.shadowColor = glowColor;
        ctx2.fillStyle = barGrad;
        drawRoundedRect(x, y, barW, displayedH, Math.max(2, Math.floor(barW / 2)));
        ctx2.restore();
        prevCenterHeightRef.current = displayedH;
      }

      // draw mirrored pairs with smoothing
      for (let i = 0; i < half; i++) {
        const leftIdx = i;
        const rightIdx = bars - 1 - i;
        const raw = ((spec[leftIdx] ?? 0) + (spec[rightIdx] ?? 0)) / 2;
        const v = Math.min(1, raw * sensitivity);
        const targetH = Math.max(2, Math.round(v * (visHeight - 6)));

  const prev = prevPairHeightsRef.current[i] ?? 0;
  const useAlpha = targetH > prev ? alphaAttack : alphaRelease;
  const displayedH = Math.round(prev * (1 - useAlpha) + targetH * useAlpha);

        const offset = i + (bars % 2 === 1 ? 1 : 0);
        const xLeft = centerX - offset * (barW + barGap) - barW;
        const xRight = centerX + (offset - (bars % 2 === 1 ? 0 : 1)) * (barW + barGap);

        const y = centerY - displayedH / 2;
        ctx2.save();
        ctx2.shadowBlur = 8;
        ctx2.shadowColor = glowColor;
        ctx2.fillStyle = barGrad;
        drawRoundedRect(xLeft, y, barW, displayedH, Math.max(2, Math.floor(barW / 2)));
        drawRoundedRect(xRight, y, barW, displayedH, Math.max(2, Math.floor(barW / 2)));
        ctx2.restore();

        prevPairHeightsRef.current[i] = displayedH;
      }
    }, [spectrum, recElapsed]);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter") {
      if (isComposing || e.nativeEvent.isComposing) {
        return;
      }
      if (e.shiftKey) {
        return;
      }
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }

    // Remove last attachment when Backspace is pressed and textarea is empty
    if (
      e.key === "Backspace" &&
      e.currentTarget.value === "" &&
      attachments.files.length > 0
    ) {
      e.preventDefault();
      const lastAttachment = attachments.files.at(-1);
      if (lastAttachment) {
        attachments.remove(lastAttachment.id);
      }
    }
  };

  const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = (event) => {
    const items = event.clipboardData?.items;

    if (!items) {
      return;
    }

    const files: File[] = [];

    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      event.preventDefault();
      attachments.add(files);
    }
  };

  const controlledProps = controller
    ? {
        value: controller.textInput.value,
        onChange: (e: ChangeEvent<HTMLTextAreaElement>) => {
          controller.textInput.setInput(e.currentTarget.value);
          onChange?.(e);
        },
      }
    : {
        onChange,
      };

  // When recording, render a smooth canvas waveform in-place of the textarea
  if (recordingCtx?.isRecording) {
    return (
      <div
        ref={wrapperRef}
        className={cn(
          // revert container back to default sizing but with white background
          "field-sizing-content max-h-48 min-h-16 rounded-md bg-white px-0 py-0",
          className
        )}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>
    );
  }

  return (
    <>
      <InputGroupTextarea
        className={cn("field-sizing-content max-h-48 min-h-16", className)}
        name="message"
        onCompositionEnd={() => setIsComposing(false)}
        onCompositionStart={() => setIsComposing(true)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        {...props}
        {...controlledProps}
      />

      {recordingCtx?.isProcessing && (
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          <span>Processing transcription…</span>
        </div>
      )}
    </>
  );
};

export type PromptInputHeaderProps = Omit<
  ComponentProps<typeof InputGroupAddon>,
  "align"
>;

export const PromptInputHeader = ({
  className,
  ...props
}: PromptInputHeaderProps) => (
  <InputGroupAddon
    align="block-end"
    className={cn("order-first flex-wrap gap-1", className)}
    {...props}
  />
);

export type PromptInputFooterProps = Omit<
  ComponentProps<typeof InputGroupAddon>,
  "align"
>;

export const PromptInputFooter = ({
  className,
  ...props
}: PromptInputFooterProps) => (
  <InputGroupAddon
    align="block-end"
    className={cn("justify-between gap-1", className)}
    {...props}
  />
);

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({
  className,
  ...props
}: PromptInputToolsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props} />
);

export type PromptInputButtonProps = ComponentProps<typeof InputGroupButton>;

export const PromptInputButton = ({
  variant = "ghost",
  className,
  size,
  ...props
}: PromptInputButtonProps) => {
  const newSize =
    size ?? (Children.count(props.children) > 1 ? "sm" : "icon-sm");

  return (
    <InputGroupButton
      className={cn(className)}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  );
};

export type PromptInputActionMenuProps = ComponentProps<typeof DropdownMenu>;
export const PromptInputActionMenu = (props: PromptInputActionMenuProps) => (
  <DropdownMenu {...props} />
);

export type PromptInputActionMenuTriggerProps = PromptInputButtonProps;

export const PromptInputActionMenuTrigger = ({
  className,
  children,
  ...props
}: PromptInputActionMenuTriggerProps) => (
  <DropdownMenuTrigger asChild>
    <PromptInputButton className={className} {...props}>
      {children ?? <PlusIcon className="size-4" />}
    </PromptInputButton>
  </DropdownMenuTrigger>
);

export type PromptInputActionMenuContentProps = ComponentProps<
  typeof DropdownMenuContent
>;
export const PromptInputActionMenuContent = ({
  className,
  ...props
}: PromptInputActionMenuContentProps) => (
  <DropdownMenuContent align="start" className={cn(className)} {...props} />
);

export type PromptInputActionMenuItemProps = ComponentProps<
  typeof DropdownMenuItem
>;
export const PromptInputActionMenuItem = ({
  className,
  ...props
}: PromptInputActionMenuItemProps) => (
  <DropdownMenuItem className={cn(className)} {...props} />
);

// Note: Actions that perform side-effects (like opening a file dialog)
// are provided in opt-in modules (e.g., prompt-input-attachments).

export type PromptInputSubmitProps = ComponentProps<typeof InputGroupButton> & {
  status?: ChatStatus;
};

export const PromptInputSubmit = ({
  className,
  variant = "default",
  size = "icon-sm",
  status,
  children,
  ...props
}: PromptInputSubmitProps) => {
  let Icon = <SendIcon className="size-4" />;

  if (status === "submitted") {
    Icon = <Loader2Icon className="size-4 animate-spin" />;
  } else if (status === "streaming") {
    Icon = <SquareIcon className="size-4" />;
  } else if (status === "error") {
    Icon = <XIcon className="size-4" />;
  }

  return (
    <InputGroupButton
      aria-label="Submit"
      className={cn(className)}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </InputGroupButton>
  );
};

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

type SpeechRecognitionResultList = {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionResult = {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
};

type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export type PromptInputSpeechButtonProps = ComponentProps<
  typeof PromptInputButton
> & {
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  onTranscriptionChange?: (text: string) => void;
};
export const PromptInputSpeechButton = ({
  className,
  textareaRef,
  onTranscriptionChange,
  ...props
}: PromptInputSpeechButtonProps) => {
  const controller = useOptionalPromptInputController();
  const recordingCtx = useContext(RecordingContext);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  // visual/audio indicators
  // Keep internal level/elapsed for backwards compatibility; not used by UI directly
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [level, setLevel] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [elapsedMs, setElapsedMs] = useState<number>(0); // kept for internal timing
  const startTimeRef = useRef<number | null>(null);

  const stopRecording = useCallback(async () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;

    try {
      if (mr.state === "recording") mr.stop();
    } catch (err) {
      console.warn("error stopping recorder", err);
    }

    setIsRecording(false);

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    // ensure rAF loop stopped if still running
    if (silenceTimerRef.current) {
      try {
        window.cancelAnimationFrame(silenceTimerRef.current as number);
      } catch {}
      silenceTimerRef.current = null;
    }
    // reset visual indicators
    try {
      setLevel(0);
      setElapsedMs(0);
      startTimeRef.current = null;
      recordingCtx?._setIsRecording(false);
      recordingCtx?._setElapsedMs(0);
      recordingCtx?._pushLevel(0);
    } catch {}

    // assemble blob and upload
    const chunks = chunksRef.current.splice(0);
    if (chunks.length === 0) return;
    const blob = new Blob(chunks, { type: "audio/webm" });

    // show processing indicator while we upload and wait for transcription
    try {
      recordingCtx?._setIsProcessing(true);
    } catch {}
    try {
      const fd = new FormData();
      fd.append("file", blob, "audio.webm");

      const res = await fetch("/api/speech-to-text", { method: "POST", body: fd });
      if (!res.ok) {
        console.error("Transcription request failed", await res.text());
        return;
      }
      const json = await res.json();
      const text = json.text ?? json.transcript ?? "";
      if (text) {
        // Update provider-controlled textarea when possible
        if (controller) {
          const current = controller.textInput.value || "";
          controller.textInput.setInput((current ? current + " " : "") + text);
        } else if (textareaRef?.current) {
          const ta = textareaRef.current;
          const current = ta.value || "";
          const newValue = current + (current ? " " : "") + text;
          ta.value = newValue;
          ta.dispatchEvent(new Event("input", { bubbles: true }));
        }
        onTranscriptionChange?.(text);
      }
    } catch (err) {
      console.error("Speech upload/transcribe error", err);
    } finally {
      try {
        recordingCtx?._setIsProcessing(false);
      } catch {}
    }
  }, [controller, textareaRef, onTranscriptionChange, recordingCtx]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const options: MediaRecorderOptions = {};
      try {
        // prefer webm when available
        options.mimeType = "audio/webm";
      } catch {}

      const mr = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        // ensure tracks stopped
        stream.getTracks().forEach((t) => t.stop());
      };

      // setup audio context analyser for silence detection
  type WinAudio = { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const win = window as unknown as WinAudio;
  const AudioCtor = win.AudioContext ?? win.webkitAudioContext;
  const audioCtx = new (AudioCtor as typeof AudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      silenceStartRef.current = null;

      // rAF-driven analyser/render loop for smooth 60fps updates
      const rafLoop = () => {
        if (!analyserRef.current) return;
        const bufLen = analyserRef.current.frequencyBinCount;
        const data = new Uint8Array(bufLen);
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < bufLen; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / bufLen);
        // update visual level (clamp and scale)
        const clamped = Math.max(0, Math.min(1, rms * 3));
        try {
          setLevel(clamped);
          recordingCtx?._pushLevel(clamped);
          const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
          setElapsedMs(elapsed);
          recordingCtx?._setElapsedMs(elapsed);
        } catch {}

        // compute frequency-domain spectrum and push to recording context
        try {
          const freqCount = analyserRef.current!.frequencyBinCount;
          const freqData = new Uint8Array(freqCount);
          analyserRef.current!.getByteFrequencyData(freqData);
          // downsample / normalize into 64 bins (0..1)
          const bins = 64;
          const step = Math.max(1, Math.floor(freqCount / bins));
          const spectrum: number[] = [];
          for (let b = 0; b < bins; b++) {
            let ssum = 0;
            let count = 0;
            for (let k = b * step; k < (b + 1) * step && k < freqCount; k++) {
              ssum += freqData[k];
              count++;
            }
            const avg = count ? ssum / count : 0;
            spectrum.push(Math.max(0, Math.min(1, avg / 255)));
          }
          recordingCtx?._setSpectrum(spectrum);
        } catch {
          // ignore
        }

        const SILENCE_THRESHOLD = 0.01; // tweakable
        const SILENCE_TIMEOUT = 2000; // ms of silence to auto-stop
        if (rms < SILENCE_THRESHOLD) {
          if (silenceStartRef.current == null) silenceStartRef.current = Date.now();
          else if (Date.now() - silenceStartRef.current > SILENCE_TIMEOUT) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              mediaRecorderRef.current.stop();
            }
          }
        } else {
          silenceStartRef.current = null;
        }

        silenceTimerRef.current = window.requestAnimationFrame(rafLoop);
      };

      silenceTimerRef.current = window.requestAnimationFrame(rafLoop);

      const MAX_MS = 60_000; // 60s limit
      const maxTimer = window.setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, MAX_MS);

      mr.onstop = async () => {
        if (silenceTimerRef.current) {
          try {
            window.cancelAnimationFrame(silenceTimerRef.current as number);
          } catch {}
          silenceTimerRef.current = null;
        }
        clearTimeout(maxTimer);
        // stop audio context
        try {
          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
        } catch {}
        setIsRecording(false);
        await stopRecording();
      };

      mr.start();
  startTimeRef.current = Date.now();
  setElapsedMs(0);
  setLevel(0);
  setIsRecording(true);
  recordingCtx?._setIsRecording(true);
  recordingCtx?._setElapsedMs(0);
    } catch (err) {
      console.error("start recording failed", err);
      setIsRecording(false);
    }
  }, [isRecording, stopRecording, recordingCtx]);

  const toggle = useCallback(() => {
    if (isRecording) {
      const mr = mediaRecorderRef.current;
      if (mr && mr.state === "recording") {
        mr.stop();
      }
    } else {
      startRecording();
    }
  }, [isRecording, startRecording]);

  // Format elapsed into seconds (kept for internal use)
  // elapsedSeconds intentionally not used in button UI; kept for debugging

  return (
    <PromptInputButton
      className={cn(
        "relative transition-all duration-200",
        isRecording && "bg-red-600 text-white",
        className
      )}
      onClick={() => toggle()}
      aria-pressed={isRecording}
      {...props}
    >
      <MicIcon className="size-4" />
    </PromptInputButton>
  );
};

export type PromptInputModelSelectProps = ComponentProps<typeof Select>;

export const PromptInputModelSelect = (props: PromptInputModelSelectProps) => (
  <Select {...props} />
);

export type PromptInputModelSelectTriggerProps = ComponentProps<
  typeof SelectTrigger
>;

export const PromptInputModelSelectTrigger = ({
  className,
  ...props
}: PromptInputModelSelectTriggerProps) => (
  <SelectTrigger
    className={cn(
      "border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors",
      'hover:bg-accent hover:text-foreground [&[aria-expanded="true"]]:bg-accent [&[aria-expanded="true"]]:text-foreground',
      className
    )}
    {...props}
  />
);

export type PromptInputModelSelectContentProps = ComponentProps<
  typeof SelectContent
>;

export const PromptInputModelSelectContent = ({
  className,
  ...props
}: PromptInputModelSelectContentProps) => (
  <SelectContent className={cn(className)} {...props} />
);

export type PromptInputModelSelectItemProps = ComponentProps<typeof SelectItem>;

export const PromptInputModelSelectItem = ({
  className,
  ...props
}: PromptInputModelSelectItemProps) => (
  <SelectItem className={cn(className)} {...props} />
);

export type PromptInputModelSelectValueProps = ComponentProps<
  typeof SelectValue
>;

export const PromptInputModelSelectValue = ({
  className,
  ...props
}: PromptInputModelSelectValueProps) => (
  <SelectValue className={cn(className)} {...props} />
);

export type PromptInputHoverCardProps = ComponentProps<typeof HoverCard>;

export const PromptInputHoverCard = ({
  openDelay = 0,
  closeDelay = 0,
  ...props
}: PromptInputHoverCardProps) => (
  <HoverCard closeDelay={closeDelay} openDelay={openDelay} {...props} />
);

export type PromptInputHoverCardTriggerProps = ComponentProps<
  typeof HoverCardTrigger
>;

export const PromptInputHoverCardTrigger = (
  props: PromptInputHoverCardTriggerProps
) => <HoverCardTrigger {...props} />;

export type PromptInputHoverCardContentProps = ComponentProps<
  typeof HoverCardContent
>;

export const PromptInputHoverCardContent = ({
  align = "start",
  ...props
}: PromptInputHoverCardContentProps) => (
  <HoverCardContent align={align} {...props} />
);

export type PromptInputTabsListProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTabsList = ({
  className,
  ...props
}: PromptInputTabsListProps) => <div className={cn(className)} {...props} />;

export type PromptInputTabProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTab = ({
  className,
  ...props
}: PromptInputTabProps) => <div className={cn(className)} {...props} />;

export type PromptInputTabLabelProps = HTMLAttributes<HTMLHeadingElement>;

export const PromptInputTabLabel = ({
  className,
  ...props
}: PromptInputTabLabelProps) => (
  <h3
    className={cn(
      "mb-2 px-3 font-medium text-muted-foreground text-xs",
      className
    )}
    {...props}
  />
);

export type PromptInputTabBodyProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTabBody = ({
  className,
  ...props
}: PromptInputTabBodyProps) => (
  <div className={cn("space-y-1", className)} {...props} />
);

export type PromptInputTabItemProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTabItem = ({
  className,
  ...props
}: PromptInputTabItemProps) => (
  <div
    className={cn(
      "flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent",
      className
    )}
    {...props}
  />
);

export type PromptInputCommandProps = ComponentProps<typeof Command>;

export const PromptInputCommand = ({
  className,
  ...props
}: PromptInputCommandProps) => <Command className={cn(className)} {...props} />;

export type PromptInputCommandInputProps = ComponentProps<typeof CommandInput>;

export const PromptInputCommandInput = ({
  className,
  ...props
}: PromptInputCommandInputProps) => (
  <CommandInput className={cn(className)} {...props} />
);

export type PromptInputCommandListProps = ComponentProps<typeof CommandList>;

export const PromptInputCommandList = ({
  className,
  ...props
}: PromptInputCommandListProps) => (
  <CommandList className={cn(className)} {...props} />
);

export type PromptInputCommandEmptyProps = ComponentProps<typeof CommandEmpty>;

export const PromptInputCommandEmpty = ({
  className,
  ...props
}: PromptInputCommandEmptyProps) => (
  <CommandEmpty className={cn(className)} {...props} />
);

export type PromptInputCommandGroupProps = ComponentProps<typeof CommandGroup>;

export const PromptInputCommandGroup = ({
  className,
  ...props
}: PromptInputCommandGroupProps) => (
  <CommandGroup className={cn(className)} {...props} />
);

export type PromptInputCommandItemProps = ComponentProps<typeof CommandItem>;

export const PromptInputCommandItem = ({
  className,
  ...props
}: PromptInputCommandItemProps) => (
  <CommandItem className={cn(className)} {...props} />
);

export type PromptInputCommandSeparatorProps = ComponentProps<
  typeof CommandSeparator
>;

export const PromptInputCommandSeparator = ({
  className,
  ...props
}: PromptInputCommandSeparatorProps) => (
  <CommandSeparator className={cn(className)} {...props} />
);
