import React, { useEffect } from 'react';

// Define the global config object on window
declare global {
  interface Window {
    theAnimeCommunityConfig: {
        MAL_ID?: string;
        AniList_ID?: string;
        episodeChapterNumber: string;
        mediaType: 'anime' | 'manga';
        colorScheme?: {
            primaryColor?: string;
            backgroundColor?: string;
            dropDownTextColor?: string;
            strongTextColor?: string;
            primaryTextColor?: string;
            secondaryTextColor?: string;
            iconColor?: string;
            accentColor?: string;
        },
        removeBorderStyling?: boolean;
    };
    theAnimeCommunity?: {
      reload: () => void;
    };
  }
}

interface FirebaseCommentsProps {
    animeId: number;
    malId?: number;
    episodeNumber: number;
}

const FirebaseComments: React.FC<FirebaseCommentsProps> = ({ animeId, malId, episodeNumber }) => {

    useEffect(() => {
        // This effect re-runs and fully re-initializes the script
        // whenever the anime or episode changes, ensuring a clean state.
        
        const scriptId = "anime-community-script";
        const container = document.getElementById("anime-community-comment-section");
        
        // 1. Clean up any previous script instance
        document.getElementById(scriptId)?.remove();
        if (container) {
            // Display a loading spinner while the new script is fetched and executed.
            container.innerHTML = `
                <div class="flex justify-center items-center h-48">
                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
                </div>
            `;
        }

        // 2. Set the configuration for the new script instance
        window.theAnimeCommunityConfig = {
            AniList_ID: String(animeId),
            ...(malId && { MAL_ID: String(malId) }),
            episodeChapterNumber: String(episodeNumber),
            mediaType: 'anime',
            colorScheme: {
                primaryColor: "#22d3ee", // cyan-400
                backgroundColor: "transparent",
                dropDownTextColor: "#ffffff",
                strongTextColor: "#ffffff",
                primaryTextColor: "#d1d5db", // gray-300
                secondaryTextColor: "#9ca3af", // gray-400
                iconColor: "#9ca3af", // gray-400
                accentColor: "#374151" // gray-700
            },
            removeBorderStyling: true
        };

        // 3. Create and inject the new script
        const script = document.createElement("script");
        script.src = `https://theanimecommunity.com/embed.js`;
        script.id = scriptId;
        script.defer = true;
        
        script.onerror = () => {
            console.error("The Anime Community comment script failed to load.");
            if (container) {
                container.innerHTML = '<p class="text-center text-gray-400">Could not load comments. Please try refreshing the page.</p>';
            }
        };

        // The script will execute and replace the loading spinner inside the container.
        if (container) {
            container.appendChild(script);
        }

    }, [animeId, malId, episodeNumber]); // This dependency array ensures a full reset on any prop change.

    // This cleanup effect runs ONLY when the component is fully unmounted (e.g., navigating away from the player page).
    useEffect(() => {
        return () => {
            const scriptId = "anime-community-script";
            document.getElementById(scriptId)?.remove();
            
            // Clean up global objects to prevent memory leaks or conflicts on other pages
            try {
              if (window.theAnimeCommunityConfig) delete (window as any).theAnimeCommunityConfig;
              if (window.theAnimeCommunity) delete (window as any).theAnimeCommunity;
            } catch (e) {
                console.warn("Could not clean up comment script globals.", e);
            }
        };
    }, []);

    return (
        <div className="bg-gray-900/80 rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-3">Comments</h3>
            <div id="anime-community-comment-section">
                {/* Initial loading state before the first useEffect run */}
                <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
                </div>
            </div>
        </div>
    );
};

export default FirebaseComments;
