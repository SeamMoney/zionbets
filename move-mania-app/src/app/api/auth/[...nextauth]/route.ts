console.log("NextAuth file is being loaded");
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

        if (!existingUser) {
          const walletInfo = await createAptosKeyPair()

          if (!walletInfo) {
            console.error("Failed to create Aptos wallet")
            return false
          }

          await registerForZAPT(walletInfo.account)
          await mintZAPT(walletInfo.public_address, 1000)

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
        }

        return true
      } catch (error) {
        console.error("Error in sign in callback:", error)
        return false
      }
    },
  },
});

export { handler as GET, handler as POST }