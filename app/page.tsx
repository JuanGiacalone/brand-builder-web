'use client';

import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Image as ImageIcon, LayoutTemplate, Newspaper, Smartphone } from 'lucide-react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

interface GeneratedImage {
  name: string;
  url: string;
  icon: React.ReactNode;
}

export default function Page() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [variations, setVariations] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const extractImage = (response: any): string | null => {
    if (!response.candidates || response.candidates.length === 0) return null;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setBaseImage(null);
    setVariations([]);

    try {
      // Step 1: Generate the base product image
      setLoadingStep('Designing base product...');
      
      const baseResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: `A clean, professional studio photography shot of: ${prompt}. Plain white background, highly detailed, product focused. Absolutely no people, no humans, no hands.` }
          ]
        }
      });

      const baseImageUrl = extractImage(baseResponse);
      if (!baseImageUrl) throw new Error('Failed to generate base image.');
      
      setBaseImage(baseImageUrl);

      // Extract raw base64 data and mime type for the next requests
      const base64Data = baseImageUrl.split(',')[1];
      const mimeType = baseImageUrl.split(';')[0].split(':')[1];

      // Step 2: Generate variations using the base image as reference
      setLoadingStep('Adapting to different mediums...');

      const mediums = [
        { 
          name: 'Billboard', 
          icon: <LayoutTemplate className="w-5 h-5" />,
          prompt: 'Edit this image to place the product on a massive outdoor city billboard. Photorealistic urban environment. Absolutely no people, no humans, no pedestrians.' 
        },
        { 
          name: 'Newspaper', 
          icon: <Newspaper className="w-5 h-5" />,
          prompt: 'Edit this image to make the product appear as a printed vintage black-and-white newspaper advertisement. Newsprint texture, monochrome. Absolutely no people, no humans.' 
        },
        { 
          name: 'Social Post', 
          icon: <Smartphone className="w-5 h-5" />,
          prompt: 'Edit this image to place the product in a trendy, aesthetic lifestyle Instagram social media post setting, resting on a stylish modern table. Absolutely no people, no humans, no hands.' 
        }
      ];

      const variationPromises = mediums.map(async (medium) => {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: medium.prompt }
              ]
            }
          });
          const url = extractImage(response);
          return url ? { name: medium.name, url, icon: medium.icon } : null;
        } catch (err) {
          console.error(`Failed to generate ${medium.name}:`, err);
          return null;
        }
      });

      const results = await Promise.all(variationPromises);
      setVariations(results.filter(res => res !== null) as GeneratedImage[]);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
      setLoadingStep('');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center py-16 px-6 sm:px-12 max-w-6xl mx-auto">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-12 w-full max-w-2xl"
      >
        <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-[#0F4C81]/10 text-[#0F4C81]">
          <ImageIcon className="w-8 h-8" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-[#0F4C81]">
          Brand Builder
        </h1>
        <p className="text-lg text-[#939597] leading-relaxed">
          Describe your product and instantly visualize it across multiple mediums. 
          Powered by Nano-Banana.
        </p>
      </motion.div>

      {/* Input Form */}
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        onSubmit={handleGenerate}
        className="w-full max-w-2xl bg-white p-2 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row gap-2 border border-[#0F4C81]/10"
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A sleek, matte black smart coffee mug with a glowing LED..."
          className="flex-1 bg-transparent px-6 py-4 outline-none text-[#0F4C81] placeholder:text-[#939597]/60 text-lg"
          disabled={isGenerating}
        />
        <button
          type="submit"
          disabled={isGenerating || !prompt.trim()}
          className="bg-[#0F4C81] text-white px-8 py-4 rounded-2xl font-medium transition-all hover:bg-[#0F4C81]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Building</span>
            </>
          ) : (
            <span>Visualize</span>
          )}
        </button>
      </motion.form>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-500 mt-6 bg-red-50 px-6 py-4 rounded-2xl border border-red-100"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-16 flex flex-col items-center text-[#0F4C81]"
          >
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 border-4 border-[#0F4C81]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#0F4C81] rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-lg font-medium animate-pulse">{loadingStep}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {baseImage && !isGenerating && (
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="w-full mt-20 flex flex-col gap-16"
        >
          {/* Base Product */}
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#0F4C81]/10 text-[#0F4C81] text-sm font-medium mb-6 shadow-sm">
              <ImageIcon className="w-4 h-4" />
              Base Product
            </div>
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-[#0F4C81]/10 border-4 border-white bg-white">
              <img src={baseImage} alt="Base Product" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Variations Grid */}
          {variations.length > 0 && (
            <div>
              <div className="flex items-center justify-center gap-4 mb-10">
                <div className="h-px bg-[#0F4C81]/10 flex-1 max-w-[100px]"></div>
                <h3 className="text-[#939597] font-medium uppercase tracking-widest text-sm">Campaign Mediums</h3>
                <div className="h-px bg-[#0F4C81]/10 flex-1 max-w-[100px]"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {variations.map((variation, idx) => (
                  <motion.div 
                    key={variation.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + (idx * 0.1) }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-xl shadow-[#0F4C81]/5 border-4 border-white bg-white mb-6 group">
                      <img src={variation.url} alt={variation.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex items-center gap-2 text-[#0F4C81] font-medium">
                      {variation.icon}
                      <span>{variation.name}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

    </main>
  );
}
