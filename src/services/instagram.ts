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
  try {
    const response = await fetch(`https://instagram.com/api/v1/users/web_profile_info/?username=${accountName}`, {
      headers: {
        'X-IG-App-ID': '936619743392459', // Required header for accessing the Instagram API
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Instagram posts. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data.user) {
      throw new Error(`Could not find user ${accountName}`);
    }

    // Check if edge_owner_to_timeline_media exists before accessing edges
    const timelineMedia = data.data.user.edge_owner_to_timeline_media;
    const edges = timelineMedia ? timelineMedia.edges : [];

    const posts: InstagramPost[] = edges.map((edge: any) => ({
      imageUrl: edge.node.display_url,
    }));

    return posts;
  } catch (error: any) {
    console.error('Error fetching Instagram posts:', error);
    throw new Error(`Failed to fetch Instagram posts for account ${accountName}: ${error.message}`);
  }
}
