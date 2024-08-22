import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { createAptosKeyPair, registerForZAPT, mintZAPT } from "@/lib/aptos"
import { setUpUser, getUser } from "@/lib/api"

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
        }
      }
    })
  ],
  debug: true,
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log("Sign in attempt:", { user, account, profile, email })
      try {
        if (!user.email) {
          console.error("User email is missing")
          return false
        }

        const existingUser = await getUser(user.email)
        console.log("Existing user:", existingUser)

        if (!existingUser) {
          console.log("Creating new user")
          const walletInfo = await createAptosKeyPair()

          if (!walletInfo) {
            console.error("Failed to create Aptos wallet")
            return false
          }

          console.log("Wallet info created:", walletInfo)

          await registerForZAPT(walletInfo.account)
          console.log("Registered for ZAPT")

          await mintZAPT(walletInfo.public_address, 1000)
          console.log("Minted ZAPT")

          const newUser = await setUpUser({
            email: user.email,
            username: user.name || '',
            image: user.image || '',
            referred_by: null,
          })

          if (!newUser) {
            console.error("Failed to set up user")
            return false
          }

          console.log("New user set up:", newUser)
        }

        return true
      } catch (error) {
        console.error("Error in sign in callback:", error)
        return false
      }
    },
    async jwt({ token, account, profile }) {
      console.log("JWT callback:", { token, account, profile })
      return token
    },
    async session({ session, token, user }) {
      console.log("Session callback:", { session, token, user })
      return session
    }
  },
  events: {
    async signIn(message) { console.log("signIn", message) },
    async signOut(message) { console.log("signOut", message) },
    async createUser(message) { console.log("createUser", message) },
    async linkAccount(message) { console.log("linkAccount", message) },
    async session(message) { console.log("session", message) },
  },
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