export const ChatEvent = {
  JOIN: 'conversation:join',
  LEAVE: 'conversation:leave',
  MESSAGE_NEW: 'message:new',
  CONVERSATION_UPDATED: 'conversation:updated',
} as const;

// Socket.IO room holding everyone currently viewing one conversation.
export const conversationRoom = (conversationId: string): string =>
  `conversation:${conversationId}`;

// For user login on multiple devices
export const userRoom = (userId: string): string => `user:${userId}`;
