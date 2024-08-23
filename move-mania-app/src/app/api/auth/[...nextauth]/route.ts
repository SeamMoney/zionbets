import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { setUpAndGetUser } from "@/lib/api"

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || 'secret',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    })
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      if (!user.email) {
        console.error("User email is missing")
        return false
      }

      try {
        const newUser = await setUpAndGetUser({
          username: user.name || "",
          image: user.image || "",
          email: user.email,
          referral_code: "",
          referred_by: null,
        })

        if (!newUser) {
          console.error("Failed to set up user")
          return false
        }

        return true
      } catch (error) {
        console.error("Error in sign in callback:", error)
        return false
      }
    },
  },
  debug: true,
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