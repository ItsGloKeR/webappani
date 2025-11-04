import { TraceMoeResponse } from '../types';

const TRACE_MOE_API_URL = 'https://api.trace.moe/search';

export const searchByImage = async (source: { file?: File, url?: string }): Promise<TraceMoeResponse> => {
    let response: Response;
    const searchParams = new URLSearchParams({ cutBorders: '' });

    try {
        if (source.file) {
            if (source.file.size > 25 * 1024 * 1024) { // 25MB limit from docs
                throw new Error('Image file is too large. Please upload a file smaller than 25MB.');
            }
            response = await fetch(`${TRACE_MOE_API_URL}?${searchParams.toString()}`, {
                method: 'POST',
                body: source.file,
                headers: { 'Content-Type': source.file.type },
            });
        } else if (source.url) {
            searchParams.append('url', source.url);
            response = await fetch(`${TRACE_MOE_API_URL}?${searchParams.toString()}`);
        } else {
            throw new Error('No image file or URL provided for search.');
        }

        const data: any = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        if (data.error) {
            throw new Error(data.error);
        }

        return data as TraceMoeResponse;
    } catch (error) {
        console.error('Error searching image with trace.moe:', error);
        throw error; // Re-throw to be handled by the component
    }
};
