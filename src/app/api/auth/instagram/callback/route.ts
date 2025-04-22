// src/app/api/auth/instagram/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorReason = url.searchParams.get('error_reason');
  const errorDescription = url.searchParams.get('error_description');

  // Handle authentication errors
  if (error) {
    console.error('Authentication error:', { error, errorReason, errorDescription });
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(errorDescription || error)}`, url.origin));
  }

  if (!code) {
    console.error('Authorization code not found in callback.');
    return NextResponse.redirect(new URL('/?error=auth_code_missing', url.origin));
  }

  const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
  const clientSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Instagram app credentials or redirect URI are not configured.');
    return NextResponse.redirect(new URL('/?error=config_missing', url.origin));
  }

  try {
    // Exchange code for access token using Instagram OAuth endpoint
    console.log('Exchanging code for access token...');
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Error exchanging code for token:', tokenData);
      throw new Error(tokenData.error_message || 'Failed to obtain access token.');
    }

    const { access_token, user_id } = tokenData;

    if (!access_token || !user_id) {
      throw new Error('Access token or user ID missing in response.');
    }

    console.log('Successfully obtained access token and user ID.');

    // get me endpoint
    const meResponse = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`);
    const meData = await meResponse.json();
    if (!meResponse.ok) {
      console.error('Error fetching user info:', meData);
      throw new Error(meData.error.message || 'Failed to fetch user info.');
    }

    // Redirect back with the tokens and user ID
    
    const redirectUrl = new URL('/', process.env.HOST_URL || url.origin);
    redirectUrl.searchParams.set('access_token', access_token);
    redirectUrl.searchParams.set('user_id', user_id.toString());
    redirectUrl.searchParams.set('ig_id', meData.id);

    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error('Error during authentication process:', error);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message || 'authentication_failed')}`, url.origin));
  }
}
