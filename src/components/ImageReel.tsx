import React, { forwardRef } from "react";

interface Image {
  url: string;
  aspectRatio?: "square" | "vertical" | "horizontal";
}

interface Post {
  attachments: Image[];
  user: {
    avatar: string;
    name: string;
  };
  content: string;
  timestamp: string;
  reactions: {
    emoji: string;
    count: number;
  }[];
}

interface ImageReelProps {
  posts: Post[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

const ImageReel = forwardRef<HTMLDivElement, ImageReelProps>(
  ({ posts, currentIndex, onSelect }, ref) => {
    return (
      <div
        ref={ref}
        className="absolute bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-md animate-slide-up"
      >
        <div className="flex items-center h-full px-4 space-x-4 overflow-x-auto">
          {posts.map((post, index) => (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className={`relative flex-shrink-0 h-16 w-24 rounded-md overflow-hidden transition-transform hover:scale-105 ${
                currentIndex === index ? "ring-2 ring-white" : ""
              }`}
            >
              <img
                src={post.attachments[0].url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {post.attachments.length > 1 && (
                <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md">
                  +{post.attachments.length - 1}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }
);

export default ImageReel;
