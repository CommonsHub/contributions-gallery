import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart } from "lucide-react";
import { Mention, Reaction } from "../types/discord";

interface MessageOverlayProps {
  user: {
    avatar: string;
    name: string;
  };
  content: string;
  mentions: Mention[];
  timestamp: string;
  reactions: Reaction[];
}

const MessageOverlay: React.FC<MessageOverlayProps> = ({
  user,
  content,
  timestamp,
  reactions,
  mentions,
  channels,
}) => {
  const replaceTags = (content: string) => {
    if (!mentions?.length && !channels?.length) return content;

    const parts = content.split(/<(?:#|@)([^>]+)>/g);
    console.log("replaceTags> parts", parts);
    return parts.map((part, index) => {
      // Even indices are regular text, odd indices are tags
      if (index % 2 === 0) return part;

      const mention = mentions.find((mention) => mention.username === part);
      if (mention) {
        return (
          <strong key={index} className="font-semibold text-blue-300">
            {mention.name}
          </strong>
        );
      }
      const channel = channels.find((channel) => channel.name === part);
      if (channel) {
        return (
          <strong key={index} className="font-semibold text-blue-300">
            #{channel.name}
          </strong>
        );
      }
      return `<@${part}>`;
    });
  };

  const displayReactions =
    reactions?.length > 0 ? reactions : [{ emoji: "❤️", count: 0 }];

  if (!user) return null;

  return (
    <div className="absolute left-0 right-0 bottom-24 px-6 py-4 animate-fade-in">
      <div className="max-w-2xl mx-auto bg-black/60 backdrop-blur-md rounded-lg p-4 text-white">
        <div className="space-y-3">
          <div className="flex items-center space-x-4">
            {user?.avatar && (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{user.name}</h3>
                <span className="text-sm text-gray-400">
                  {formatDistanceToNow(new Date(timestamp), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-gray-200">{replaceTags(content)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {displayReactions.map((reaction, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-1 bg-white/10 rounded-full px-2 py-1"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-sm">{reaction.count}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 italic">
              React in the #contributions channel on discord.commonshub.brussels
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageOverlay;
