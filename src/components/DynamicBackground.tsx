"use client";

import { useState, useEffect, useRef } from "react";
import { AmbientScene } from "@/lib/types";

const UNSPLASH_ACCESS_KEY = "c_y_xJaw-p05vjKOKC5kdiZGw21trx9DbRYjWx-9AVY";

interface DynamicBackgroundProps {
  scene?: AmbientScene;
}

interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    full: string;
    small: string;
  };
  alt_description: string;
  user: {
    name: string;
    username: string;
  };
}

export function DynamicBackground({ scene }: DynamicBackgroundProps) {
  const [currentImage, setCurrentImage] = useState<UnsplashImage | null>(null);
  const [nextImage, setNextImage] = useState<UnsplashImage | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastQuery = useRef<string | null>(null);

  // Fetch image from Unsplash when scene changes
  useEffect(() => {
    const query = scene?.query || "executive business skyline";

    // Don't refetch if query hasn't changed
    if (query === lastQuery.current) return;
    lastQuery.current = query;

    const fetchImage = async () => {
      try {
        console.log("🖼️ Fetching Unsplash image for:", query);

        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5`,
          {
            headers: {
              Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Unsplash API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
          // Pick a random image from results for variety
          const randomIndex = Math.floor(Math.random() * Math.min(data.results.length, 5));
          const image = data.results[randomIndex];

          console.log("🖼️ Got image:", image.alt_description);

          // Preload the image before transitioning
          const img = new Image();
          img.src = image.urls.regular;
          img.onload = () => {
            setNextImage(image);
            setIsTransitioning(true);

            // After transition, swap images
            setTimeout(() => {
              setCurrentImage(image);
              setNextImage(null);
              setIsTransitioning(false);
            }, 1000);
          };
        }
      } catch (err) {
        console.error("🖼️ Unsplash fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch image");
      }
    };

    fetchImage();
  }, [scene?.query]);

  // Default gradient when no image
  const defaultGradient = "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6B8DD6 100%)";

  return (
    <>
      {/* Base layer - either current image or gradient */}
      <div
        className="fixed inset-0 -z-20 transition-opacity duration-1000"
        style={{
          background: currentImage
            ? `url(${currentImage.urls.regular})`
            : defaultGradient,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: isTransitioning ? 0.5 : 1,
        }}
      />

      {/* Transition layer - next image fading in */}
      {nextImage && (
        <div
          className="fixed inset-0 -z-19 transition-opacity duration-1000"
          style={{
            background: `url(${nextImage.urls.regular})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: isTransitioning ? 1 : 0,
          }}
        />
      )}

      {/* Dark overlay for text readability */}
      <div className="fixed inset-0 -z-10 bg-black/40" />

      {/* Attribution (required by Unsplash) */}
      {currentImage && (
        <div className="fixed bottom-2 right-2 z-10 text-white/40 text-xs">
          Photo by{" "}
          <a
            href={`https://unsplash.com/@${currentImage.user.username}?utm_source=copilotkit_demo&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/60"
          >
            {currentImage.user.name}
          </a>
          {" on "}
          <a
            href="https://unsplash.com/?utm_source=copilotkit_demo&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/60"
          >
            Unsplash
          </a>
        </div>
      )}

      {/* Scene indicator */}
      {scene && (scene.location || scene.role) && (
        <div className="fixed top-4 left-4 z-10 flex gap-2">
          {scene.location && (
            <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur">
              📍 {scene.location}
            </span>
          )}
          {scene.role && (
            <span className="text-xs bg-indigo-500/40 text-white px-3 py-1 rounded-full backdrop-blur">
              👔 {scene.role.toUpperCase()}
            </span>
          )}
        </div>
      )}
    </>
  );
}
