import type { UIMessage } from 'ai';
import type { MessageRow } from './database.types';

export type AppUIMessage = UIMessage<never, never, never>;

/** A file part persisted in `messages.attachments` (data URL). */
export interface StoredFilePart {
  type: 'file';
  mediaType: string;
  filename?: string;
  url: string;
}

/** An image the user picked in the composer, ready to be sent. */
export interface ChatAttachment {
  id: string;
  name: string;
  mediaType: string;
  url: string;
}

/** Extracts the concatenated plain text from a UI message's text parts. */
export function extractText(message: { parts: Array<{ type: string; text?: string }> }): string {
  return message.parts
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('');
}

/** Converts user-picked attachments into base-64 file parts for `sendMessage`. */
export function attachmentsToFileParts(attachments: ChatAttachment[]): StoredFilePart[] {
  return attachments.map((attachment) => ({
    type: 'file',
    mediaType: attachment.mediaType,
    filename: attachment.name,
    url: attachment.url,
  }));
}

/** Extracts file parts (e.g. uploaded images) from a UI message for rendering. */
export function extractFileParts(message: AppUIMessage): StoredFilePart[] {
  return message.parts
    .filter((part) => part.type === 'file' && typeof (part as { url?: unknown }).url === 'string')
    .map((part) => {
      const file = part as StoredFilePart;
      return {
        type: 'file' as const,
        mediaType: file.mediaType,
        filename: file.filename,
        url: file.url,
      };
    });
}

/** Converts persisted DB message rows into AI-SDK UI messages for `initialMessages`. */
export function rowsToUIMessages(rows: MessageRow[]): AppUIMessage[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    parts: [
      ...(row.content ? [{ type: 'text' as const, text: row.content }] : []),
      ...(Array.isArray(row.attachments)
        ? row.attachments
            .filter(
              (attachment): attachment is { type: 'file'; mediaType: string; filename?: string; url: string } =>
                typeof attachment === 'object' &&
                attachment !== null &&
                'type' in attachment &&
                (attachment as { type?: unknown }).type === 'file' &&
                typeof (attachment as { url?: unknown }).url === 'string',
            )
            .map((attachment) => ({
              type: 'file' as const,
              mediaType: attachment.mediaType,
              filename: attachment.filename,
              url: attachment.url,
            }))
        : []),
    ],
  }));
}