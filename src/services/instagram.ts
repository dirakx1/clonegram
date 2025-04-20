// src/services/instagram.ts

export interface InstagramPost {
  imageUrl: string;
  id: string;
  caption?: string; // Optional caption
}

/**
 * Asynchronously retrieves the latest Instagram posts for the authenticated user.
 *
 * Uses the Instagram Basic Display API.
 * https://developers.facebook.com/docs/instagram-basic-display-api/reference/user/media#reading
 *
 * @param accessToken The valid Instagram user access token.
 * @param userId The Instagram user ID associated with the token.
 * @param limit Optional limit for the number of posts to fetch (default/max might be imposed by API).
 * @returns A promise that resolves to an array of InstagramPost objects.
 */
export async function getLatestInstagramPosts(
  accessToken: string,
  userId: string, // User ID is needed for the endpoint
  limit: number = 10 // Default to fetching 10 posts
): Promise<InstagramPost[]> {
  console.log(`Fetching Instagram media for user ID: ${userId} using Basic Display API.`);

  // Construct the API URL
  // We need 'id' and 'media_url' fields. 'caption' is optional but potentially useful.
  const fields = 'id,media_url,caption';
  const url = `https://graph.instagram.com/${userId}/media?fields=${fields}&access_token=${accessToken}&limit=${limit}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        let errorMessage = `API error: ${response.status}`;
        if (data?.error?.message) {
            errorMessage += ` - ${data.error.message}`;
        }
        console.error('Error fetching Instagram media:', data);
        // Special handling for common errors
        if (data?.error?.code === 190) { // OAuthException: Token invalid or expired
            throw new Error('Instagram token is invalid or expired. Please log in again.');
        }
        throw new Error(errorMessage);
    }

    if (!data.data || !Array.isArray(data.data)) {
      console.error('Unexpected API response format:', data);
      throw new Error('Unexpected response format from Instagram API.');
    }

    // Filter out any items that might not have a media_url (e.g., unsupported types)
    const posts: InstagramPost[] = data.data
      .filter((item: any) => item.media_url)
      .map((item: any) => ({
        id: item.id,
        imageUrl: item.media_url,
        caption: item.caption || '',
      }));

    console.log(`Successfully fetched ${posts.length} Instagram posts.`);
    return posts;

  } catch (error: any) {
    console.error('Failed to fetch or process Instagram posts:', error);
    // Re-throw the error to be handled by the caller
    throw new Error(`Failed to retrieve Instagram posts: ${error.message}`);
  }
}
