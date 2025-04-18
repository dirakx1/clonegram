'use client';

import {useState, useEffect} from 'react';
import {generateSimilarImage} from '@/ai/flows/generate-similar-image';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Download, RefreshCw} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {getLatestInstagramPosts, InstagramPost} from '@/services/instagram';

const INSTAGRAM_ACCOUNT = 'renatacolombia';

export default function Home() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(false);
  const {toast} = useToast();

  const generateImages = async () => {
    setLoading(true);
    try {
      const result = await generateSimilarImage({
        instagramAccount: INSTAGRAM_ACCOUNT,
        numberOfImages: 3, // Generate 3 images
      });
      setImageUrls(result.imageUrls);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error generating images',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInstagramPosts = async () => {
    try {
      const posts = await getLatestInstagramPosts(INSTAGRAM_ACCOUNT);
      setInstagramPosts(posts);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching Instagram posts',
        description: error.message,
      });
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

  useEffect(() => {
    generateImages(); // Initial image generation on component mount
    fetchInstagramPosts(); // Fetch Instagram posts on component mount
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Clonegram</h1>
        <p className="text-gray-500 mb-8">
          Generating images similar to{' '}
          <a
            href={`https://www.instagram.com/${INSTAGRAM_ACCOUNT}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            @{INSTAGRAM_ACCOUNT}
          </a>
        </p>

        <h2 className="text-2xl font-bold mb-4">Generated Images</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {imageUrls.map((imageUrl, index) => (
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
                  style={{
                    minHeight: '200px',
                  }}
                  onError={(e: any) => {
                    e.target.onerror = null; // Prevents infinite loop
                    e.target.src = `https://picsum.photos/200/200?random=${index}`; // Placeholder
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
          ))}
        </div>

        <Button
          disabled={loading}
          onClick={generateImages}
          className="mt-8 flex items-center space-x-2"
        >
          {loading && <RefreshCw className="animate-spin h-4 w-4" />}
          <span>{loading ? 'Generating...' : 'Generate More Images'}</span>
        </Button>

        <h2 className="text-2xl font-bold mt-12 mb-4">Actual Instagram Posts</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {instagramPosts.map((post, index) => (
            <Card key={index} className="w-80 shadow-md">
              <CardHeader>
                <CardTitle>Instagram Post #{index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <img
                  src={post.imageUrl}
                  alt={`Instagram Post ${index + 1}`}
                  className="rounded-md aspect-square object-cover w-full h-full"
                  style={{
                    minHeight: '200px',
                  }}
                  onError={(e: any) => {
                    e.target.onerror = null; // Prevents infinite loop
                    e.target.src = `https://picsum.photos/200/200?random=${index}`; // Placeholder
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
