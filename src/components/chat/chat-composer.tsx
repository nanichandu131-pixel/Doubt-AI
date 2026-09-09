'use client';

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { ArrowUp, ImagePlus, Mic, Square, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ChatAttachment } from '@/types/chat';

const MAX_ATTACHMENTS = 4;
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.85;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as SpeechRecognitionWindow;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Could not process this image.'));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read this image.'));
    };
    image.src = objectUrl;
  });
}

async function fileToAttachment(file: File): Promise<ChatAttachment> {
  const url = await readImageAsDataUrl(file);
  return { id: crypto.randomUUID(), name: file.name, mediaType: file.type || 'image/jpeg', url };
}

export function ChatComposer({
  onSend,
  onStop,
  disabled,
  isStreaming,
}: {
  onSend: (text: string, attachments: ChatAttachment[]) => void;
  onStop: () => void;
  disabled: boolean;
  isStreaming: boolean;
}) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const listeningRef = useRef(false);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  const submit = () => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || disabled) return;
    onSend(trimmed, attachments);
    setValue('');
    setAttachments([]);
    requestAnimationFrame(resize);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const handleAttachmentsChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      toast.error(`You can attach up to ${MAX_ATTACHMENTS} images.`);
      return;
    }

    const added: ChatAttachment[] = [];
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" isn't an image and was skipped.`);
        continue;
      }
      try {
        added.push(await fileToAttachment(file));
      } catch {
        toast.error(`Could not process "${file.name}".`);
      }
    }

    if (added.length > 0) {
      setAttachments((previous) => [...previous, ...added]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((previous) => previous.filter((attachment) => attachment.id !== id));
  };

  const startListening = () => {
    if (!isSpeechRecognitionSupported()) return;
    const w = window as SpeechRecognitionWindow;
    const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        setValue((previous) => {
          const next = `${previous} ${transcript}`.trim();
          requestAnimationFrame(resize);
          return next;
        });
      }
    };

    recognition.onend = () => {
      listeningRef.current = false;
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event) => {
      listeningRef.current = false;
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission was denied.');
      } else if (event.error !== 'aborted') {
        toast.error('Voice input stopped unexpectedly. Please try again.');
      }
    };

    try {
      recognition.start();
    } catch {
      toast.error('Could not start voice input.');
      return;
    }

    recognitionRef.current = recognition;
    listeningRef.current = true;
    setIsListening(true);
    textareaRef.current?.focus();
  };

  const stopListening = () => {
    listeningRef.current = false;
    setIsListening(false);
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  };

  const toggleListening = () => {
    if (!isSpeechRecognitionSupported()) {
      toast.error('Voice input isn\'t supported in this browser. Try Chrome or Edge.');
      return;
    }
    if (listeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  };

  const canSend = Boolean(value.trim() || attachments.length > 0) && !disabled;

  return (
    <div className="border-t bg-background px-4 py-4">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-2 shadow-sm">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="group/attachment relative">
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="h-14 w-14 rounded-lg border object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background opacity-80 shadow transition-opacity hover:opacity-100"
                  aria-label={`Remove ${attachment.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || attachments.length >= MAX_ATTACHMENTS}
            aria-label="Attach an image"
            title="Attach an image"
            className="text-muted-foreground hover:text-foreground"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleAttachmentsChange}
          />

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={toggleListening}
            disabled={disabled}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            title={isListening ? 'Stop listening' : 'Speak your doubt'}
            className={cn(
              'text-muted-foreground hover:text-foreground',
              isListening && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
            )}
          >
            <Mic className={cn('h-4 w-4', isListening && 'animate-pulse')} />
          </Button>

          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              resize();
            }}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : 'Ask your doubt... (Shift+Enter for a new line)'}
            rows={1}
            className="min-h-9 flex-1 resize-none border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
          />

          {isStreaming ? (
            <Button type="button" size="icon" variant="outline" onClick={onStop} aria-label="Stop generating">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" size="icon" onClick={submit} disabled={!canSend} aria-label="Send message">
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
        DoubtAI can make mistakes. Double-check important answers.
      </p>
    </div>
  );
}