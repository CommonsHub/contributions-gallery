export interface Reaction {
  emoji: string;
  count: number;
}

export interface Attachment {
  url: string;
  width: number;
  height: number;
  content_type: string;
}

export interface Mention {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export interface Message {
  attachments: Attachment[];
  author: {
    avatar: string;
    name: string;
    username: string;
  };
  content: string;
  mentions: Mention[];
  timestamp: string;
  reactions: Reaction[];
}
