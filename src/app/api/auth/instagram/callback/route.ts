// src/app/api/auth/instagram/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get('code');

  if (!code) {
    console.error('Authorization code not found in callback.');
    return NextResponse.redirect(new URL('/?error=auth_code_missing', url.origin));
  }

  console.log(`Received authorization code: ${code}`);

  const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
  const clientSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Instagram app credentials or redirect URI are not configured.');
    return NextResponse.redirect(new URL('/?error=config_missing', url.origin));
  }

  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('grant_type', 'authorization_code');
  params.append('redirect_uri', redirectUri);
  params.append('code', code);

  try {
    console.log('Exchanging code for access token...');
    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error exchanging code for token:', data);
      throw new Error(data.error_message || 'Failed to obtain access token.');
    }

    const accessToken = data.access_token;
    const userId = data.user_id; // Instagram User ID

    if (!accessToken || !userId) {
      console.error('Access token or user ID not found in response:', data);
      throw new Error('Access token or user ID missing in response.');
    }

    console.log('Successfully obtained access token and user ID.');

    // Redirect back to the homepage, passing the token and user ID
    // Note: Passing tokens in URL is generally discouraged for production.
    // Consider server-side sessions or secure client-side storage (e.g., HttpOnly cookies) for real apps.
    const redirectUrl = new URL('/', url.origin);
    redirectUrl.searchParams.set('access_token', accessToken);
    redirectUrl.searchParams.set('user_id', userId.toString());

    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error('Error during token exchange process:', error);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message || 'token_exchange_failed')}`, url.origin));
  }
}
