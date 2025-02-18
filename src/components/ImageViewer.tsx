import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ImageReel from "./ImageReel";
import MessageOverlay from "./MessageOverlay";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Message, Attachment } from "../types/discord";

const getAspectRatio = (image: Image) => {
  if (image.width > image.height) {
    return "horizontal";
  } else if (image.width < image.height) {
    return "vertical";
  }
};

const ImageViewer: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const queryClient = useQueryClient();
  const imageReelRef = useRef<HTMLDivElement>(null);

  const {
    data: posts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["discord-posts"],
    queryFn: async () => {
      try {
        const previousData = queryClient.getQueryData(["discord-posts"]) as
          | Message[]
          | undefined;
        const latestTimestamp = previousData?.[0]?.timestamp;
        const latestDate = new Date(latestTimestamp);
        const sinceParam = latestTimestamp
          ? `&since=${latestDate.getTime()}`
          : "";
        const apicall = `/api/discord?channelId=${
          import.meta.env.VITE_DISCORD_CHANNEL_ID
        }&type=image${sinceParam}`;
        console.log(apicall);
        const response = await fetch(apicall, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newPosts = await response.json();
        console.log(newPosts);
        return previousData ? [...newPosts, ...previousData] : newPosts;
      } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
      }
    },
    refetchInterval: import.meta.env.VITE_REFETCH_INTERVAL || 20000,
    staleTime: 60000,
    select: (data) => {
      return data.filter(
        (post: Message) => post.attachments && post.attachments.length > 0
      );
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlaying && posts && posts.length > 0) {
      interval = setInterval(() => {
        setIsTransitioning(true);
        setCurrentIndex((prev) => {
          const nextIndex = prev + 1;
          // If we're at the end, scroll the reel back to the start
          if (nextIndex >= posts.length) {
            imageReelRef.current?.scrollTo({ left: 0, behavior: "smooth" });
            return 0;
          }
          return nextIndex;
        });
        setTimeout(() => setIsTransitioning(false), 300);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, posts]);

  useEffect(() => {
    if (posts) {
      const imagesToPreload = [-1, 0, 1]
        .map((offset) => {
          const index = (currentIndex + offset + posts.length) % posts.length;
          return posts[index]?.attachments || [];
        })
        .flat();

      imagesToPreload.forEach((image) => {
        const img = new Image();
        img.src = image.url;
      });
    }
  }, [currentIndex, posts]);

  const handlePrevious = () => {
    if (!posts || isTransitioning) return;
    setIsAutoPlaying(false);
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleNext = () => {
    if (!posts || isTransitioning) return;
    setIsAutoPlaying(false);
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % posts.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart(touch.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    const diff = touchStart - touch.clientX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
      setTouchStart(null);
    }
  };

  const renderImageMosaic = (images: Attachment[]) => {
    if (images?.length === 1) {
      return (
        <img
          src={images[0].url}
          alt="Post content"
          className={`w-full h-full object-contain ${
            getAspectRatio(images[0]) === "vertical" ? "max-h-screen" : ""
          }`}
        />
      );
    }

    const gridClassName =
      images.length === 2
        ? "grid-cols-2"
        : images.length === 3
        ? "grid-cols-2"
        : "grid-cols-2 grid-rows-2";

    return (
      <div className={`grid ${gridClassName} gap-2 h-full max-h-screen p-4`}>
        {images.map((image, idx) => (
          <img
            key={idx}
            src={image.url}
            alt={`Image ${idx + 1}`}
            className={`w-full h-full object-cover rounded-lg ${
              images.length === 3 && idx === 0 ? "row-span-2" : ""
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        <p className="text-lg">Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex flex-col gap-4 items-center justify-center bg-black text-white p-4">
        <p className="text-lg">Error loading posts:</p>
        <p className="text-sm text-red-400 max-w-md text-center break-words">
          {error instanceof Error ? error.message : "An unknown error occurred"}
        </p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        <p className="text-lg">No posts with images found.</p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{
        height: "100dvh",
        touchAction: "none",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 backdrop-blur-md text-white py-3 px-4 z-10 border-b border-white/10"
        style={{ backgroundColor: `${import.meta.env.VITE_PRIMARY_COLOR}E6` }}
      >
        <p className="text-center text-sm font-medium tracking-wide">
          Record your contributions on discord.commonshub.brussels
        </p>
      </div>

      <div className="absolute inset-0 content-center">
        <div
          className={`transition-all duration-300 ease-in-out ${
            isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
        >
          {renderImageMosaic(posts[currentIndex].attachments)}
        </div>
      </div>

      <button
        onClick={handlePrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
      >
        <ChevronLeft size={32} />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
      >
        <ChevronRight size={32} />
      </button>

      <MessageOverlay
        user={posts[currentIndex].author}
        content={posts[currentIndex].content}
        timestamp={posts[currentIndex].timestamp}
        reactions={posts[currentIndex].reactions}
        mentions={posts[currentIndex].mentions}
      />

      <ImageReel
        ref={imageReelRef}
        posts={posts}
        currentIndex={currentIndex}
        onSelect={(index) => {
          setIsAutoPlaying(false);
          setCurrentIndex(index);
        }}
      />
    </div>
  );
};

export default ImageViewer;
