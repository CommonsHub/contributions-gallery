// Bot login token from Discord Developer Portal
const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN"); // Replace with your bot token

if (!BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is not set");
}

const channels: Record<string, string> = {};

async function fetchChannelName(channelId: string) {
  if (channels[channelId]) {
    return channels[channelId];
  }
  const url = `https://discord.com/api/v10/channels/${channelId}`;

  if (!channelId.match(/^\d+$/)) {
    throw new Error(`Invalid channel id: ${channelId}`);
  }
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`, // Authorization with bot token
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Error fetching channel: ${channelId}:${response.status} ${response.statusText}`
    );
  }

  const channelData = await response.json();
  channels[channelId] = channelData.name;
  return channelData.name;
}

function getAvatarUrl(userId: string, avatarHash: string): string {
  if (!avatarHash) {
    return `https://cdn.discordapp.com/embed/avatars/${
      parseInt(userId) % 5
    }.png`;
  }
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`;
}

interface DiscordMention {
  id: string;
  username: string;
  global_name: string;
  avatar: string;
}

interface ProcessedContent {
  content: string;
  mentions: DiscordMention[];
  channels: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}

async function processContent(
  content: string,
  mentions: DiscordMention[]
): Promise<ProcessedContent> {
  let output = content;

  // Handle Discord channel links
  const regex = /https:\/\/discord.com\/channels\/(\d+)\/(\d+)(\/(\d+))?/g;
  const matches = output.match(regex);

  const channels = [];
  if (matches) {
    for (const match of matches) {
      const channelId = match.split("/")[5];
      const channel = await fetchChannelName(channelId);
      output = output.replace(match, `#${channel}`);
      channels.push({ id: channelId, name: channel, url: match });
    }
  }

  // Handle user mentions
  mentions = mentions.map((mention) => {
    output = output.replace(`<@${mention.id}>`, `<@${mention.username}>`);
    return {
      id: mention.id,
      username: mention.username,
      name: mention.global_name,
      avatar: getAvatarUrl(mention.id, mention.avatar),
    };
  });

  return { content: output, mentions, channels };
}

interface DiscordAttachment {
  id: string;
  url: string;
  content_type: string;
  proxy_url: string;
  filename: string;
  width?: number;
  height?: number;
  size: number;
}

interface DiscordMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    global_name: string;
    avatar: string;
  };
  attachments: DiscordAttachment[];
  mentions: DiscordMention[];
  timestamp: string;
  reactions?: {
    emoji: { name: string };
    count: number;
  }[];
}

export async function getMessagesFromChannel(
  channelId: string,
  type?: string,
  since?: string,
  limit = 100
) {
  const url = `https://discord.com/api/v10/channels/${channelId}/messages`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`, // Authorization with bot token
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Error fetching messages: ${response.status} ${response.statusText}`
    );
  }

  const messages = await response.json();
  const output = await Promise.all(
    messages.slice(0, limit).map(async (message: DiscordMessage) => {
      if (type === "image") {
        if (message.attachments.length === 0) {
          return null;
        }
        message.attachments = message.attachments.filter(
          (attachment: DiscordAttachment) => {
            return attachment.content_type.startsWith("image/");
          }
        );
        if (message.attachments.length === 0) {
          return null;
        }
      }
      if (since) {
        const sinceDate = new Date(parseInt(since));
        const messageDate = new Date(message.timestamp);
        if (messageDate.getTime() <= sinceDate.getTime()) {
          return null;
        }
      }

      // console.log(message);
      const avatarUrl = getAvatarUrl(message.author.id, message.author.avatar);
      const { content, mentions, channels } = await processContent(
        message.content,
        message.mentions
      );

      return {
        id: message.id,
        author: {
          name: message.author.global_name,
          username: message.author.username,
          avatar: avatarUrl,
        },
        content,
        mentions,
        channels,
        attachments: message.attachments.map((attachment) => {
          return {
            id: attachment.id,
            url: attachment.url,
            proxy_url: attachment.proxy_url,
            filename: attachment.filename,
            content_type: attachment.content_type,
            width: attachment.width,
            height: attachment.height,
            size: attachment.size,
          };
        }),
        timestamp: message.timestamp,
        reactions: message.reactions?.map((reaction) => {
          return {
            emoji: reaction.emoji.name,
            count: reaction.count,
          };
        }),
      };
    })
  );

  return output.filter((message) => message !== null);
}
