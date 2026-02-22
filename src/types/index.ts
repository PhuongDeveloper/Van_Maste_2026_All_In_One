export interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string | null;
  generatedImage?: string | null;
}

export interface UserData {
  level: string;
  status: string;
  progress: number;
  xp: number;
  streak: number;
  daysLeft: number;
}
