"use client";

import { useState, useEffect, useRef } from "react";
import { AmbientScene } from "@/lib/types";

const UNSPLASH_ACCESS_KEY = "c_y_xJaw-p05vjKOKC5kdiZGw21trx9DbRYjWx-9AVY";

// Wine region to search query mapping for best results
const REGION_QUERIES: Record<string, string> = {
  // France
  burgundy: "burgundy vineyard france",
  bordeaux: "bordeaux chateau vineyard",
  champagne: "champagne vineyard france",
  rhone: "rhone valley vineyard",
  loire: "loire valley castle vineyard",
  alsace: "alsace vineyard village",
  provence: "provence lavender vineyard",

  // Italy
  tuscany: "tuscany vineyard cypress",
  piedmont: "piedmont barolo vineyard",
  veneto: "veneto prosecco hills",
  sicily: "sicily vineyard etna",

  // Spain
  rioja: "rioja spain vineyard",
  ribera: "ribera duero vineyard",
  priorat: "priorat spain vineyard",

  // USA
  napa: "napa valley vineyard california",
  sonoma: "sonoma vineyard california",
  oregon: "oregon pinot noir vineyard",

  // Other
  argentina: "mendoza argentina vineyard andes",
  chile: "chile vineyard andes",
  australia: "barossa valley vineyard australia",
  newzealand: "marlborough vineyard new zealand",
  southafrica: "stellenbosch vineyard south africa",
  germany: "mosel vineyard germany",
  portugal: "douro valley vineyard portugal",
};

// Wine type to search query for generic searches
const TYPE_QUERIES: Record<string, string> = {
  red: "red wine cellar barrel",
  white: "white wine vineyard sunny",
  rose: "rose wine provence sunset",
  sparkling: "champagne celebration bubbles",
  dessert: "wine cellar aged bottles",
};

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

  // Determine search query based on scene
  const getSearchQuery = (scene?: AmbientScene): string => {
    if (scene?.query) return scene.query;

    // Check for region match
    if (scene?.region) {
      const regionKey = scene.region.toLowerCase().replace(/[^a-z]/g, '');
      if (REGION_QUERIES[regionKey]) {
        return REGION_QUERIES[regionKey];
      }
      // Fallback: search for the region name + vineyard
      return `${scene.region} vineyard wine`;
    }

    // Check for wine type
    if (scene?.wine_type) {
      const typeKey = scene.wine_type.toLowerCase();
      if (TYPE_QUERIES[typeKey]) {
        return TYPE_QUERIES[typeKey];
      }
    }

    // Default wine-themed query
    return "wine cellar vineyard sunset";
  };

  // Fetch image from Unsplash when scene changes
  useEffect(() => {
    const query = getSearchQuery(scene);

    // Don't refetch if query hasn't changed
    if (query === lastQuery.current) return;
    lastQuery.current = query;

    const fetchImage = async () => {
      try {
        console.log("🍷 Fetching wine background for:", query);

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

          console.log("🍷 Got image:", image.alt_description);

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
        console.error("🍷 Unsplash fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch image");
      }
    };

    fetchImage();
  }, [scene?.query, scene?.region, scene?.wine_type]);

  // Wine-themed gradient when no image (deep burgundy to purple)
  const defaultGradient = "linear-gradient(135deg, #722F37 0%, #4A1C40 50%, #2D1B30 100%)";

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
            href={`https://unsplash.com/@${currentImage.user.username}?utm_source=aionysus&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/60"
          >
            {currentImage.user.name}
          </a>
          {" on "}
          <a
            href="https://unsplash.com/?utm_source=aionysus&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/60"
          >
            Unsplash
          </a>
        </div>
      )}

      {/* Scene indicator - Wine region and type */}
      {scene && (scene.region || scene.wine_type) && (
        <div className="fixed top-4 left-4 z-10 flex gap-2">
          {scene.region && (
            <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur font-medium">
              🍇 {scene.region.charAt(0).toUpperCase() + scene.region.slice(1)}
            </span>
          )}
          {scene.wine_type && (
            <span className="text-xs bg-burgundy-500/40 text-white px-3 py-1 rounded-full backdrop-blur font-medium"
              style={{ backgroundColor: 'rgba(114, 47, 55, 0.4)' }}>
              🍷 {scene.wine_type.charAt(0).toUpperCase() + scene.wine_type.slice(1)}
            </span>
          )}
        </div>
      )}
    </>
  );
}
