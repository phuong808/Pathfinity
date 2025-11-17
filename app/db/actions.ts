'use server';

import { db } from './index';
import { chat, message } from './schema';
import { eq, desc } from 'drizzle-orm';
import { generateId, UIMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { generateAndSaveRoadmap } from '@/lib/roadmap-generator';

/**
 * Generate roadmap for a profile (wrapper for roadmap-generator)
 */
export async function generateRoadmapForProfile(profileId: number): Promise<void> {
  try {
    console.log(`Generating roadmap for profile ${profileId}...`);
    await generateAndSaveRoadmap(profileId);
    console.log(`Successfully generated roadmap for profile ${profileId}`);
  } catch (error) {
    console.error(`Failed to generate roadmap for profile ${profileId}:`, error);
    throw error;
  }
}

/**
 * Generate a chat title using AI based on the first user message
 * @param firstMessage - The first user message text
 * @returns A concise title (max 60 chars)
 */
async function generateChatTitle(firstMessage: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai('gpt-4.1-mini'),
      prompt: `Generate a very short, concise title (max 4 words) for a chat conversation that starts with: "${firstMessage.slice(0, 200)}"
      
      Rules:
        - Maximum 4 words
        - No quotes or punctuation at the end
        - Descriptive, clear, and super concise
        - Just the title, nothing else`,
    });
    
    return text.trim().slice(0, 50);
  } catch (error) {
    console.error('Failed to generate title:', error);
    // Fallback to first 50 chars of message
    return firstMessage.slice(0, 50);
  }
}

/**
 * Create a new chat session
 * @param userId - The user ID to associate with the chat
 * @returns The new chat ID
 */
export async function createChat(userId: string): Promise<string> {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('createChat requires a valid userId');
  }

  const id = generateId();

  await db.insert(chat).values({
    id,
    userId: userId.trim(),
    title: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return id;
}

/**
 * Load all messages for a specific chat
 * @param chatId - The chat ID to load messages for
 * @returns Array of UIMessages
 */
export async function loadChat(chatId: string): Promise<UIMessage[]> {
  const messages = await db
    .select()
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(message.createdAt);
  
  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    parts: msg.content as any,
    createdAt: msg.createdAt,
  }));
}

/**
 * Save messages for a chat
 * @param chatId - The chat ID
 * @param messages - Array of UIMessages to save
 */
export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string;
  messages: UIMessage[];
}): Promise<void> {
  // Delete existing messages for this chat
  await db.delete(message).where(eq(message.chatId, chatId));
  
  // Insert all messages
  if (messages.length > 0) {
    await db.insert(message).values(
      messages.map((msg) => ({
        id: msg.id,
        chatId,
        role: msg.role,
        content: msg.parts,
        createdAt: new Date(),
      }))
    );
    
    // Check if chat already has a title
    const existingChat = await db
      .select({ title: chat.title })
      .from(chat)
      .where(eq(chat.id, chatId))
      .limit(1);
    
    // Only generate title if it doesn't exist yet
    if (existingChat.length > 0 && !existingChat[0].title) {
      const firstUserMessage = messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        const textPart = firstUserMessage.parts.find(p => p.type === 'text');
        if (textPart && 'text' in textPart) {
          // Generate AI-powered title
          const title = await generateChatTitle(textPart.text);
          await db
            .update(chat)
            .set({ 
              title,
              updatedAt: new Date(),
            })
            .where(eq(chat.id, chatId));
        }
      }
    } else {
      // Just update the updatedAt timestamp
      await db
        .update(chat)
        .set({ updatedAt: new Date() })
        .where(eq(chat.id, chatId));
    }
  }
}

/**
 * Get all chats for a user
 * @param userId - The user ID (required)
 * @returns Array of chat objects with id, title, and timestamps
 */
export async function getChats(userId: string): Promise<{
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}[]> {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('getChats requires a valid userId');
  }

  const chats = await db
    .select({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    })
    .from(chat)
    .where(eq(chat.userId, userId.trim()))
    .orderBy(desc(chat.updatedAt));
  
  return chats;
}

/**
 * Update a chat title
 * @param chatId - The chat ID to update
 * @param title - The new title
 */
export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  await db
    .update(chat)
    .set({ 
      title: title.trim(),
      updatedAt: new Date(),
    })
    .where(eq(chat.id, chatId));
}

/**
 * Delete a chat and all its messages
 * @param chatId - The chat ID to delete
 */
export async function deleteChat(chatId: string): Promise<void> {
  await db.delete(chat).where(eq(chat.id, chatId));
}

/**
 * Delete a specific message and all subsequent messages
 * @param messageId - The message ID to delete
 * @param chatId - The chat ID
 */
export async function deleteMessage(messageId: string, chatId: string): Promise<void> {
  // Get the message to find its timestamp
  const msgToDelete = await db
    .select()
    .from(message)
    .where(eq(message.id, messageId))
    .limit(1);
  
  if (msgToDelete.length === 0) return;
  
  // Delete this message and all later messages
  await db
    .delete(message)
    .where(eq(message.chatId, chatId));
}
