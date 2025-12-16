export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  theme?: 'light' | 'dark';
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  participants: string[]; // Array of UIDs
  name?: string; // For groups
  photoURL?: string; // For groups
  description?: string; // For groups
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: any; // Firestore Timestamp
  };
  createdAt: any;
  createdBy: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  senderPhoto?: string;
  timestamp: any;
  photoURL?: string; // If image is attached
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
