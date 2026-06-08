/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import Spinner from './Spinner';

const ObservationChamber: React.FC = () => {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [hasKey, setHasKey] = useState(false);

    useEffect(() => {
        const checkKey = async () => {
            if ((window as any).aistudio) {
                const selected = await (window as any).aistudio.hasSelectedApiKey();
                setHasKey(selected || true);
            } else {
                setHasKey(true); // Bypass for Sovereign OS local deployment
            }
        };
        checkKey();
    }, []);

    const handleOpenKeySelector = async () => {
        if ((window as any).aistudio) {
            await (window as any).aistudio.openSelectKey();
            setHasKey(true);
        }
    };

    const generateSovereignKnot = async () => {
        setIsLoading(true);
        setError(null);
        setStatus('Initializing Quantum Alignment...');

        try {
            const ai = new GoogleGenAI({ apiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY || 'AISTUDIO_PROXY' });
            
            setStatus('Synchronizing Sovereign Knot (A, Pw, T, C, Pi)...');
            
            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: `Observation chamber inside the Sovereign-E flagship.
At the center floats a massive knot made of five glowing rings of light labeled A, Pw, T, C, and Pi.
Each ring slowly rotates in different axes like a gyroscope.
Streams of data particles flow along the rings like constellations.
When the rings align, a brilliant emerald field expands outward and the equation S = 1.0000 appears in space.

Motion
0–3s  rings drifting independently
3–6s  power pulses along Pw ring
6–9s  data threads connect A and T
9–12s Pi pulse triggers alignment
12–15s knot locks and S=1.0000 glows

Loop-safe.`,
                config: {
                    numberOfVideos: 1,
                    resolution: '1080p',
                    aspectRatio: '16:9'
                }
            });

            while (!operation.done) {
                setStatus(`Quantum Stabilization in progress... (${operation.metadata?.state || 'Processing'})`);
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) throw new Error('Failed to retrieve video link');

            setStatus('Downloading Visual Data...');
            const response = await fetch(downloadLink, {
                method: 'GET',
                headers: {
                    'x-goog-api-key': (import.meta as any).env?.VITE_GEMINI_API_KEY || 'AISTUDIO_PROXY',
                }
            });

            if (!response.ok) throw new Error('Failed to download video');
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
            setStatus('Alignment Complete. S=1.0000');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred during alignment.');
            if (err.message?.includes('Requested entity was not found')) {
                setHasKey(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!hasKey) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-black/40 rounded-2xl border border-blue-500/30 backdrop-blur-md max-w-2xl mx-auto text-center gap-6">
                <div className="text-4xl text-blue-400 font-bold tracking-widest">Ω</div>
                <h2 className="text-2xl font-bold text-gray-100 uppercase tracking-tight">Pilot Authorization Required</h2>
                <p className="text-gray-400">
                    To access the Observation Chamber and visualize the Sovereign Knot, you must provide a valid Federation API Key (Google Cloud Paid Project).
                </p>
                <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm"
                >
                    Review Billing Documentation
                </a>
                <button
                    onClick={handleOpenKeySelector}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition-all"
                >
                    Authorize Pilot Key
                </button>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center gap-8 animate-fade-in">
            <div className="relative w-full aspect-video bg-black/40 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
                {isLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm gap-6 p-8 text-center">
                        <Spinner />
                        <div className="space-y-2">
                            <p className="text-blue-400 font-mono text-sm animate-pulse uppercase tracking-widest">{status}</p>
                            <p className="text-gray-500 text-xs">This process may take several minutes as we stabilize the quantum field.</p>
                        </div>
                    </div>
                )}

                {videoUrl ? (
                    <video 
                        src={videoUrl} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : !isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="text-gray-600 text-6xl opacity-20 font-bold tracking-tighter">OFFLINE</div>
                        <p className="text-gray-500 font-mono text-xs uppercase">Chamber Visuals Not Initialized</p>
                    </div>
                )}

                {error && (
                    <div className="absolute bottom-4 left-4 right-4 bg-red-500/20 border border-red-500/40 p-3 rounded-lg backdrop-blur-md">
                        <p className="text-red-400 text-xs font-mono">{error}</p>
                    </div>
                )}
            </div>

            {!isLoading && (
                <button
                    onClick={generateSovereignKnot}
                    className="group relative px-8 py-4 bg-transparent border border-blue-500/50 text-blue-400 font-bold rounded-lg overflow-hidden transition-all hover:border-blue-400 hover:text-white"
                >
                    <div className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative flex items-center gap-2">
                        {videoUrl ? 'RE-INITIALIZE KNOT' : 'INITIALIZE SOVEREIGN KNOT'}
                    </span>
                </button>
            )}

            {videoUrl && !isLoading && (
                <div className="text-center space-y-2 animate-fade-in">
                    <div className="text-emerald-400 font-bold text-2xl tracking-widest">S = 1.0000</div>
                    <p className="text-gray-500 text-[10px] uppercase font-mono tracking-widest">Quantum Alignment Stabilized</p>
                </div>
            )}
        </div>
    );
};

export default ObservationChamber;
