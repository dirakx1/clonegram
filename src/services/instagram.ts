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
  const corsProxyUrl = 'https://api.allorigins.win/get?url='; // Using api.allorigins.win as a CORS proxy

  try {
    const response = await fetch(`${corsProxyUrl}${encodeURIComponent(`https://instagram.com/api/v1/users/web_profile_info/?username=${accountName}`)}`, {
      headers: {
        'X-IG-App-ID': '936619743392459', // Required header for accessing the Instagram API
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch Instagram posts. Status: ${response.status}, Body: ${errorText}`);
    }

    const data = await response.json();

    if (!data.contents) {
      throw new Error(`Could not find data contents. Response: ${JSON.stringify(data)}`);
    }

    let parsedData;
    try {
        parsedData = JSON.parse(data.contents);
    } catch (e: any) {
        throw new Error(`Failed to parse JSON: ${e.message}. Data: ${data.contents}`);
    }


    if (!parsedData.data?.user) {
      throw new Error(`Could not find user ${accountName}. Response: ${JSON.stringify(parsedData)}`);
    }

    // Check if edge_owner_to_timeline_media exists before accessing edges
    const timelineMedia = parsedData.data.user.edge_owner_to_timeline_media;
    const edges = timelineMedia ? timelineMedia.edges : [];

    const posts: InstagramPost[] = edges.map((edge: any) => ({
      imageUrl: edge.node.display_url,
    }));

    return posts;
  } catch (error: any) {
    console.error('Error fetching Instagram posts:', error);
    // Include the stack trace in the error message
    const errorMessage = `Failed to fetch Instagram posts for account ${accountName}: ${error.message}. Stack: ${error.stack}`;
    throw new Error(errorMessage);
  }
}
