'use client';

import {Button} from "@/components/ui/button";
import {FaInstagram} from "react-icons/fa";

export default function InstagramLoginButton() {
  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
    const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;
    const scope = 'user_profile,user_media';

    if (!clientId || !redirectUri) {
      console.error("Instagram App ID or Redirect URI is not configured in environment variables.");
      // Optionally: Show an error message to the user
      return;
    }

    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;

    console.log("Redirecting to Instagram login...");
    window.location.href = authUrl;
  }
  return (
    <Button onClick={handleLogin}>
      <FaInstagram className="mr-2" />
      Login with Instagram
    </Button>
  );
}
