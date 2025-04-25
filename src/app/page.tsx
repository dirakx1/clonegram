'use client';

import { useState, useEffect } from 'react';
import { generateSimilarImage } from '@/ai/flows/generate-similar-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RefreshCw, LogOut } from 'lucide-react'; // Added LogOut
import { useToast } from '@/hooks/use-toast';
import InstagramLoginButton from '@/components/instagram-login-button';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [igId, setIgId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('access_token');
    const id = searchParams.get('user_id');
    const authError = searchParams.get('error');
    const igId = searchParams.get('ig_id');

    if (authError) {
      setError(`Authentication failed: ${authError}`);
      toast({
        variant: 'destructive',
        title: 'Login Error',
        description: `Could not log in. Reason: ${authError}`,
      });
      // Clear error from URL
      window.history.replaceState({}, document.title, "/");
    }

    if (token && id && igId) {
      console.log("Received access token, user ID, and Instagram ID from callback.");
      setAccessToken(token);
      setUserId(id);
      setIgId(igId);
      setError(null); // Clear any previous errors
      // Clear token/ID from URL for security
      window.history.replaceState({}, document.title, "/");
    } else if (!authError) {
        // Check local storage if token/id aren't in URL (for persistence)
        const storedToken = localStorage.getItem('instagram_access_token');
        const storedUserId = localStorage.getItem('instagram_user_id');
        const storedIgId = localStorage.getItem('instagram_ig_id');
        if (storedToken && storedUserId && storedIgId) {
            console.log("Restored token, user ID, and Instagram ID from local storage.")
            setAccessToken(storedToken);
            setUserId(storedUserId);
            setIgId(storedIgId);
        }
    }

  }, [searchParams, toast]);

  // Store token in local storage when it changes
  useEffect(() => {
      if (accessToken && userId && igId) {
          localStorage.setItem('instagram_access_token', accessToken);
          localStorage.setItem('instagram_user_id', userId);
          localStorage.setItem('instagram_ig_id', igId);
      } else {
          localStorage.removeItem('instagram_access_token');
          localStorage.removeItem('instagram_user_id');
          localStorage.removeItem('instagram_ig_id');
      }
  }, [accessToken, userId, igId]);

  const handleLogout = () => {
      setAccessToken(null);
      setUserId(null);
      setIgId(null);
      // No need to remove from localStorage here, useEffect handles it
      console.log("Logged out.");
      toast({ title: "Logged Out", description: "You have been logged out." });
  };

  const generateImages = async () => {
    if (!accessToken || !igId) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'Please login with Instagram first.',
        });
        return;
    }

    setLoading(true);
    setImageUrls([]);
    setError(null);
    try {
      // Use the actual access token and IG ID
      // NOTE: generateSimilarImage might need adjustment if it relies on accountName
      // It should ideally use the userId and token to fetch the logged-in user's media
      const result = await generateSimilarImage({
        numberOfImages: 1,
        accessToken: accessToken,
        igId: igId,
      });
      
      setImageUrls(result.imageUrls);
    } catch (error: any) {
      console.error("Error generating images:", error);
      const errorMessage = error.message || 'An unknown error occurred during image generation';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error Generating Images',
        description: errorMessage,
      });
      setImageUrls([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `clonegram_image_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Image downloaded',
      description: 'The image has been saved to your device.',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-6">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 text-center">
        <div className="w-full max-w-4xl flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Clonegram</h1>
          {!accessToken ? (
            <InstagramLoginButton />
          ) : (
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          )}
        </div>

        {error && (
            <p className="text-red-500 mb-4">Error: {error}</p>
        )}

        {accessToken ? (
          <>
            <p className="text-gray-500 mb-8">
              Generating images similar to the style found in your recent Instagram posts.
            </p>

            <h2 className="text-2xl font-bold mb-4">Generated Images</h2>
            <div className="flex flex-wrap justify-center gap-4 min-h-[200px]">
              {/* Image display logic remains the same */}
              {loading && !imageUrls.length ? (
                <p>Generating initial images...</p>
              ) : imageUrls.length > 0 ? (
                imageUrls.map((imageUrl, index) => (
                  <Card key={index} className="w-80 shadow-md transition-transform hover:scale-105">
                    <CardHeader>
                      <CardTitle>Generated Image #{index + 1}</CardTitle>
                      <CardDescription>Similar style</CardDescription>
                    </CardHeader>
                    <CardContent className="p-2">
                      <img
                        src={imageUrl}
                        alt={`Generated Image ${index + 1}`}
                        className="rounded-md aspect-square object-cover w-full h-full"
                        style={{ minHeight: '200px' }}
                        onError={(e: any) => {
                          e.target.onerror = null;
                          e.target.src = `https://picsum.photos/200/200?random=${index}`;
                        }}
                      />
                    </CardContent>
                    <div className="flex justify-between items-center p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadImage(imageUrl)}
                        className="flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                 !loading && <p>No images generated yet. Click "Generate Images" to start.</p>
              )}
            </div>

            <Button
              disabled={loading || !accessToken}
              onClick={generateImages}
              className="mt-8 flex items-center space-x-2"
            >
              {loading && <RefreshCw className="animate-spin h-4 w-4" />}
              <span>{loading ? 'Generating...' : 'Generate Images'}</span>
            </Button>
          </>
        ) : (
          <p className="text-xl mt-10">Please login with Instagram to use Clonegram.</p>
        )}
      </main>
    </div>
  );
}
