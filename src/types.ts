export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image';
  imageUrl?: string;
  sources?: { title: string; uri: string }[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}
