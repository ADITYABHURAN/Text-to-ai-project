import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wand2, Image as ImageIcon, Loader2, AlertCircle, Info } from 'lucide-react';

function App() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  useEffect(() => {
    // Check if API key is configured
    const apiKey = import.meta.env.VITE_STABILITY_API_KEY;
    setApiKeyMissing(!apiKey);
  }, []);

  const generateImage = async () => {
    if (apiKeyMissing) {
      setError('Please configure your Stability AI API key in the .env file (VITE_STABILITY_API_KEY)');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        {
          text_prompts: [{ text: prompt }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_STABILITY_API_KEY}`,
          },
        }
      );

      const generatedImage = `data:image/png;base64,${response.data.artifacts[0].base64}`;
      setImage(generatedImage);
      setShowGuidelines(false);
    } catch (err) {
      let errorMessage = 'Failed to generate image. Please try again.';
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          errorMessage = 'Invalid API key. Please check your Stability AI API key in the .env file.';
          setApiKeyMissing(true);
        } else if (err.response?.status === 402) {
          errorMessage = 'API credit exhausted. Please check your Stability AI account.';
        } else if (err.response?.status === 403 && err.response?.data?.message?.includes('content moderation')) {
          errorMessage = 'Your prompt was flagged by content moderation. Please ensure your prompt follows the content guidelines.';
          setShowGuidelines(true);
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      setError(errorMessage);
      const safeError = {
        message: errorMessage,
        status: axios.isAxiosError(err) ? err.response?.status : undefined,
        statusText: axios.isAxiosError(err) ? err.response?.statusText : undefined
      };
      console.error('Error generating image:', safeError);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      generateImage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Wand2 className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold">AI Image Generator</h1>
        </div>

        {apiKeyMissing && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-500">API Key Required</h3>
              <p className="text-yellow-500/90 text-sm mt-1">
                To use this image generator, you need to add your Stability AI API key to the .env file:
              </p>
              <code className="mt-2 block bg-black/30 p-2 rounded text-sm font-mono">
                VITE_STABILITY_API_KEY=your-api-key-here
              </code>
              <p className="text-yellow-500/90 text-sm mt-2">
                You can get an API key from the{' '}
                <a
                  href="https://platform.stability.ai/docs/getting-started/authentication"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 hover:text-yellow-300 underline"
                >
                  Stability AI platform
                </a>
              </p>
            </div>
          </div>
        )}

        {showGuidelines && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-500">Content Guidelines</h3>
              <p className="text-blue-500/90 text-sm mt-1">
                Please ensure your prompts follow these guidelines:
              </p>
              <ul className="list-disc list-inside text-blue-500/90 text-sm mt-2 space-y-1">
                <li>No explicit adult content or nudity</li>
                <li>No violence or gore</li>
                <li>No hate speech or discriminatory content</li>
                <li>No copyrighted characters or trademarks</li>
                <li>No personal information or identifiable individuals</li>
              </ul>
              <p className="text-blue-500/90 text-sm mt-2">
                Try using descriptive, creative prompts that focus on landscapes, abstract art, nature, or general scenes.
              </p>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
          <div className="mb-6">
            <label htmlFor="prompt" className="block text-sm font-medium mb-2">
              Enter your prompt
            </label>
            <div className="flex gap-3">
              <input
                id="prompt"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="A serene lake at sunset with mountains in the background..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={generateImage}
                disabled={loading || apiKeyMissing}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate
                  </>
                )}
              </button>
            </div>
            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
          </div>

          <div className="relative min-h-[200px] bg-gray-700 rounded-lg overflow-hidden">
            {!image && !loading && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Your generated image will appear here</p>
                </div>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            )}
            {image && (
              <img
                src={image}
                alt="Generated artwork"
                className="w-full h-auto rounded-lg"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;