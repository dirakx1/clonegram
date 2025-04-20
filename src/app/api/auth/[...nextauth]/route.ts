import NextAuth from 'next-auth';
import InstagramProvider from 'next-auth/providers/instagram';

if (!process.env.INSTAGRAM_APP_ID || !process.env.INSTAGRAM_APP_SECRET) {
  throw new Error('Missing Instagram environment variables');
}

export const authOptions = {
  providers: [
    InstagramProvider({
      clientId: process.env.INSTAGRAM_APP_ID,
      clientSecret: process.env.INSTAGRAM_APP_SECRET,
      // Requesting 'user_profile' and 'user_media' scopes
      // See: https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-access-tokens-and-permissions#step-1--get-authorization
      authorization: {
        params: { scope: 'user_profile,user_media' },
      },
    }),
  ],
  secret: process.env.AUTH_SECRET, // Secret for JWT signing/encryption
  callbacks: {
    async jwt({ token, account }: { token: any, account: any }) {
      // Persist the access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.userId = account.providerAccountId; // Instagram user ID
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken;
      session.userId = token.userId;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
