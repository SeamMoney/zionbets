import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || 'secret',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    })
  ],
  debug: true, // Enable debug mode
  logger: {
    error(code, metadata) {
      console.error(code, metadata)
    },
    warn(code) {
      console.warn(code)
    },
    debug(code, metadata) {
      console.log(code, metadata)
    }
  }
});

export { handler as GET, handler as POST }