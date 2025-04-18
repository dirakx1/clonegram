/**
 * Represents an Instagram post with an image URL.
 */
export interface InstagramPost {
  /**
   * The URL of the image in the Instagram post.
   */
  imageUrl: string;
}

/**
 * Asynchronously retrieves the latest Instagram posts from a given account.
 *
 * @param accountName The Instagram account name to fetch posts from.
 * @returns A promise that resolves to an array of InstagramPost objects.
 */
export async function getLatestInstagramPosts(accountName: string): Promise<InstagramPost[]> {
  // Using corsproxy.io as a CORS proxy
  const corsProxyUrl = 'https://api.allorigins.win/raw?url=';

  if (!corsProxyUrl) {
    console.error('CORS proxy URL is not defined in environment variables. Ensure NEXT_PUBLIC_CORS_PROXY_URL is set.');
    throw new Error('CORS proxy URL is not defined. Check your environment variables.');
  }

  try {
    const targetUrl = `https://instagram.com/api/v1/users/web_profile_info/?username=${accountName}`;

    try {
      const response = await fetch(`${corsProxyUrl}${targetUrl}`, {
        headers: {
          'X-IG-App-ID': '936619743392459', // Required header for accessing the Instagram API
          //'Cookie': 'ig_did=YOUR_IG_DID_VALUE; ig_nrcb=1', // Add a cookie to the header
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch Instagram posts. Status: ${response.status}, Body: ${errorText}`);
        throw new Error(`Failed to fetch Instagram posts. Status: ${response.status}, Body: ${errorText}`);
      }

      const data = await response.json();

      if (!data.data?.user) {
        throw new Error(`Could not find user ${accountName}. Response: ${JSON.stringify(data)}`);
      }

      // Check if edge_owner_to_timeline_media exists before accessing edges
      const timelineMedia = data.data.user.edge_owner_to_timeline_media;
      const edges = timelineMedia ? timelineMedia.edges : [];

      const posts: InstagramPost[] = edges.map((edge: any) => ({
        imageUrl: edge.node.display_url,
      }));

      return posts;
    } catch (fetchError: any) {
      console.error('Error during fetch:', fetchError);
      throw new Error(`Failed to fetch Instagram posts due to network error: ${fetchError.message}`);
    }
  } catch (error: any) {
    console.error('Error fetching Instagram posts:', error);
    // Include the stack trace in the error message
    const errorMessage = `Failed to fetch Instagram posts for account ${accountName}: ${error.message}. Stack: ${error.stack}`;
    throw new Error(errorMessage);
  }
}
