import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EnrichedTraceMoeResult } from '../types';
import { searchByImage } from '../services/traceMoeService';
import { getMultipleAnimeDetails } from '../services/anilistService';
import LoadingSpinner from './LoadingSpinner';
import { useTitleLanguage } from '../contexts/TitleLanguageContext';
import { PLACEHOLDER_IMAGE_URL } from '../constants';
import VideoPreviewModal from './VideoPreviewModal';

interface ImageSearchPageProps {
  onBack: () => void;
  onSelectAnime: (anime: { anilistId: number }) => void;
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getConfidenceLabel = (similarity: number): { label: string; color: string } => {
    if (similarity > 0.97) return { label: 'High Confidence', color: 'bg-green-500' };
    if (similarity > 0.90) return { label: 'Good Match', color: 'bg-cyan-500' };
    if (similarity > 0.85) return { label: 'Potential Match', color: 'bg-yellow-500' };
    return { label: 'Visually Similar', color: 'bg-gray-500' };
};

const ResultCard: React.FC<{
  result: EnrichedTraceMoeResult;
  onPlay: (videoUrl: string, imageUrl: string) => void;
  onDetails: (anilistId: number) => void;
  onPlayEpisode: (anilistId: number, episode: number) => void;
  isBestMatch: boolean;
}> = ({ result, onPlay, onDetails, onPlayEpisode, isBestMatch }) => {
    const { titleLanguage } = useTitleLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    const title = titleLanguage === 'romaji' ? result.animeDetails.romajiTitle : result.animeDetails.englishTitle;
    const similarityPercent = (result.similarity * 100).toFixed(2);
    const canPlayEpisode = result.episode !== null && result.episode > 0;
    const confidence = getConfidenceLabel(result.similarity);

    const handleMouseEnter = () => {
        setIsHovering(true);
        videoRef.current?.play().catch(() => {}); // Ignore play errors if user hasn't interacted
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        if (videoRef.current) {
            videoRef.current.pause();
        }
    };

    return (
        <div className={`bg-gray-900/50 rounded-lg overflow-hidden flex flex-col md:flex-row gap-4 group transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 relative ${isBestMatch ? 'border-2 border-cyan-500' : ''}`}>
            {isBestMatch && (
                <div className="absolute top-2 right-2 bg-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-20">
                    Best Match
                </div>
            )}
            <div className="md:w-1/3 relative">
                <img 
                    src={result.animeDetails.coverImage} 
                    alt={title}
                    className="w-full h-48 md:h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE_URL; }}
                />
            </div>
            <div className="md:w-2/3 p-4 flex flex-col">
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors pr-24">{title}</h3>
                <div className="text-sm text-gray-400 mt-1 flex flex-wrap items-center gap-x-3">
                    {result.episode && <span>Episode {result.episode}</span>}
                    <span><span className="font-semibold">Time:</span> {formatTime(result.from)} - {formatTime(result.to)}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                    <div title={`Confidence: ${confidence.label}`} className={`px-3 py-1 text-xs font-bold rounded-full text-white ${confidence.color}`}>{confidence.label}</div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${similarityPercent}%` }}></div>
                    </div>
                    <span className="text-cyan-400 font-bold text-sm flex-shrink-0">{similarityPercent}%</span>
                </div>
                <div 
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="flex-grow mt-4 flex items-center justify-center relative rounded-md overflow-hidden cursor-pointer bg-black" 
                    onClick={() => onPlay(result.video, result.image)}
                >
                    <img src={`${result.image}?size=m`} alt="Scene preview" className={`w-full h-auto max-h-40 object-contain transition-opacity duration-200 ${isHovering ? 'opacity-0' : 'opacity-100'}`} />
                    <video ref={videoRef} src={`${result.video}?size=l&mute`} muted loop playsInline className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0'}`} />
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-3">
                    <button 
                        onClick={() => canPlayEpisode && onPlayEpisode(result.animeDetails.anilistId, result.episode!)} 
                        disabled={!canPlayEpisode}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Play Episode {canPlayEpisode ? result.episode : ''}
                    </button>
                    <button onClick={() => onDetails(result.animeDetails.anilistId)} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">View Details</button>
                    <button onClick={() => onPlay(result.video, result.image)} className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">Play Scene</button>
                </div>
            </div>
        </div>
    );
};

// --- Local Storage and History ---
const SEARCH_HISTORY_KEY = 'aniglokTraceHistory';
const MAX_HISTORY_ITEMS = 5;

interface SearchHistoryItem {
    dataUrl: string;
    filename: string;
    type: string;
}

const getSearchHistory = (): SearchHistoryItem[] => {
    try {
        const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

const addSearchToHistory = (item: SearchHistoryItem) => {
    let history = getSearchHistory();
    history.unshift(item);
    history = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
};

const fileToDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    
const dataURLtoFile = (dataUrl: string, filename: string, type: string): File => {
    const arr = dataUrl.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type: type});
};


const ImageSearchPage: React.FC<ImageSearchPageProps> = ({ onBack, onSelectAnime }) => {
    const [searchMode, setSearchMode] = useState<'upload' | 'url'>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<EnrichedTraceMoeResult[] | null>(null);
    const [searchStats, setSearchStats] = useState<{ frameCount: number; searchTime: number } | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [videoPreview, setVideoPreview] = useState<{ videoUrl: string, imageUrl: string } | null>(null);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const mainRef = useRef<HTMLElement>(null);

    const handleFile = useCallback((file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            setImageUrl('');
            setImagePreview(URL.createObjectURL(file));
            setSearchMode('upload');
            resetState();
        } else if (file) {
            setError('Please upload a valid image file (PNG, JPG, WEBP).');
        }
    }, []);

    useEffect(() => {
        setSearchHistory(getSearchHistory());

        const handlePaste = (event: ClipboardEvent) => {
            const items = event.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
                    const file = items[i].getAsFile();
                    if (file) {
                        handleFile(file);
                        event.preventDefault();
                        return;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handleFile]);

    const resetState = () => {
        setResults(null);
        setError(null);
        setSearchStats(null);
    };

    const handleSearchAgain = () => {
        setImageFile(null);
        setImageUrl('');
        setImagePreview(null);
        setIsLoading(false);
        setError(null);
        setResults(null);
        setSearchStats(null);
        if (mainRef.current) {
            mainRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setImageUrl(url);
        setImageFile(null);
        if (url.match(/\.(jpeg|jpg|gif|png|webp)$/)) {
            setImagePreview(url);
        } else {
            setImagePreview(null);
        }
        resetState();
    }

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    }, []);
    
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleDetailsClick = (anilistId: number) => {
        onSelectAnime({ anilistId });
    };

    const handlePlayEpisode = (anilistId: number, episode: number) => {
        window.location.hash = `#/watch/${anilistId}/${episode}`;
    };

    const handleHistoryClick = (item: SearchHistoryItem) => {
        const file = dataURLtoFile(item.dataUrl, item.filename, item.type);
        handleFile(file);
    };

    const handleSearch = async () => {
        if (!imageFile && !imageUrl) return;
        setIsLoading(true);
        resetState();

        if(imageFile) {
            const dataUrl = await fileToDataURL(imageFile);
            const historyItem = { dataUrl, filename: imageFile.name, type: imageFile.type };
            addSearchToHistory(historyItem);
            setSearchHistory(getSearchHistory());
        }

        try {
            const startTime = performance.now();
            const traceResponse = await searchByImage({ file: imageFile || undefined, url: imageUrl || undefined });
            
            const validResults = traceResponse.result;

            if (validResults.length === 0) {
                const endTime = performance.now();
                const searchTime = ((endTime - startTime) / 1000).toFixed(2);
                setSearchStats({
                    frameCount: traceResponse.frameCount,
                    searchTime: parseFloat(searchTime),
                });
                setResults([]); // Set to empty array to trigger "no results" state
                setIsLoading(false);
                return;
            }

            const animeIds = [...new Set(validResults.map(res => res.anilist))];
            const animeDetailsList = await getMultipleAnimeDetails(animeIds);
            
            const endTime = performance.now();
            const searchTime = ((endTime - startTime) / 1000).toFixed(2);

            setSearchStats({
                frameCount: traceResponse.frameCount,
                searchTime: parseFloat(searchTime),
            });

            const animeDetailsMap = new Map(animeDetailsList.map(anime => [anime.anilistId, anime]));

            const enrichedResults = validResults.map(res => ({
                ...res,
                animeDetails: animeDetailsMap.get(res.anilist)!,
            })).filter(res => res.animeDetails && !res.animeDetails.isAdult);

            setResults(enrichedResults);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <>
            <main ref={mainRef} className="container mx-auto max-w-screen-2xl p-4 md:p-8 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onBack} className="group flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors text-sm md:text-base whitespace-nowrap bg-gray-800/50 hover:bg-gray-700/60 px-4 py-2 rounded-lg" aria-label="Go back">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        <span>Back</span>
                    </button>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-white font-display uppercase tracking-wider">Trace Scene</h1>
                    <p className="text-lg text-gray-400 mt-2">Find the exact anime and episode from just a scene.</p>
                </div>
                
                <div className="max-w-3xl mx-auto">
                    <div className="flex justify-center mb-4">
                        <div className="relative flex w-auto items-center rounded-full bg-gray-800 p-1">
                            <div className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-cyan-500 transition-transform duration-300 ease-in-out" style={{ transform: `translateX(${searchMode === 'upload' ? '2px' : 'calc(100% + 2px)'})` }}/>
                            <button onClick={() => setSearchMode('upload')} className="relative z-10 w-32 py-1.5 text-center text-sm font-semibold transition-colors rounded-full text-white">Upload Image</button>
                            <button onClick={() => setSearchMode('url')} className="relative z-10 w-32 py-1.5 text-center text-sm font-semibold transition-colors rounded-full text-white">Image URL</button>
                        </div>
                    </div>
                    
                    {searchMode === 'upload' ? (
                        <form onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()} className="relative">
                            <input ref={inputRef} type="file" id="file-upload" accept="image/*" className="hidden" onChange={handleFileChange} />
                            <label htmlFor="file-upload" className={`w-full h-64 border-4 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer ${dragActive ? 'border-cyan-500 bg-gray-800/50' : 'border-gray-600 hover:border-cyan-500 hover:bg-gray-800/30'}`}>
                                {imagePreview && imageFile ? (
                                    <img src={imagePreview} alt="Preview" className="max-h-full h-auto object-contain rounded-md" />
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4H7z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <p className="font-bold text-lg">Drag & Drop, <span className="text-cyan-400 font-semibold">click to browse</span>, or paste an image</p>
                                    </div>
                                )}
                            </label>
                            {dragActive && <div className="absolute inset-0 w-full h-full" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
                        </form>
                    ) : (
                        <div>
                            <input type="url" value={imageUrl} onChange={handleUrlChange} placeholder="https://example.com/image.jpg" className="w-full bg-gray-900/80 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all border border-gray-700" />
                            {imagePreview && !imageFile && (
                                <div className="mt-4 h-64 flex items-center justify-center bg-gray-800/30 rounded-xl">
                                    <img src={imagePreview} alt="URL Preview" className="max-h-full h-auto object-contain rounded-md" />
                                </div>
                            )}
                        </div>
                    )}
                    
                    {searchHistory.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-bold text-gray-400 mb-2">Recent Searches</h4>
                            <div className="flex flex-wrap gap-2">
                                {searchHistory.map((item, index) => (
                                    <button key={index} onClick={() => handleHistoryClick(item)} className="w-20 h-20 rounded-lg overflow-hidden border-2 border-transparent hover:border-cyan-500 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-950">
                                        <img src={item.dataUrl} alt={`Search history ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}


                    <div className="flex justify-center mt-6">
                        <button onClick={handleSearch} disabled={(!imageFile && !imageUrl) || isLoading} className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg flex items-center gap-2">
                            {isLoading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto mt-12">
                    {isLoading && <LoadingSpinner />}
                    {error && <p className="text-center text-red-500 bg-red-900/50 p-4 rounded-lg">{error}</p>}
                    
                    {searchStats && !isLoading && (
                        <div className="text-center text-gray-400 bg-gray-900/50 p-3 rounded-lg mb-6">
                            Searched {searchStats.frameCount.toLocaleString()} frames in {searchStats.searchTime}s
                        </div>
                    )}

                    {results && (
                        <div>
                            <h2 className="text-2xl font-bold text-white text-center mb-6">Results</h2>
                            <div className="max-h-[70vh] overflow-y-auto space-y-6 pr-4">
                                {results.length > 0 ? (
                                    results.map((res, index) => (
                                        <ResultCard 
                                            key={`${res.anilist}-${index}`} 
                                            result={res} 
                                            onPlay={(videoUrl, imageUrl) => setVideoPreview({ videoUrl, imageUrl })}
                                            onDetails={handleDetailsClick}
                                            onPlayEpisode={handlePlayEpisode}
                                            isBestMatch={index === 0}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 bg-gray-900/50 p-6 rounded-lg">
                                        <h3 className="text-xl font-bold text-white mb-3">No Matches Found</h3>
                                        <p className="mb-4">We couldn't find a match for this scene. Here are a few tips for better results:</p>
                                        <ul className="text-left max-w-md mx-auto list-disc pl-5 space-y-2">
                                            <li>Use a clear, high-quality image.</li>
                                            <li>Try a different frame from the same scene.</li>
                                            <li>Ensure the image isn't too dark or blurry.</li>
                                            <li>Screenshots directly from a video source work best.</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                             <div className="flex justify-center mt-8 pt-8 border-t border-gray-700">
                                <button onClick={handleSearchAgain} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    Search Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {videoPreview && (
                <VideoPreviewModal 
                    videoUrl={videoPreview.videoUrl}
                    imageUrl={videoPreview.imageUrl}
                    onClose={() => setVideoPreview(null)}
                />
            )}
        </>
    );
};

export default ImageSearchPage;