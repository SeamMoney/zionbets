import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

console.log("NextAuth configuration file is being executed")
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL)
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID)
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not set")
console.log("NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "Set" : "Not set")

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
      return true
    },
  },
});

export { handler as GET, handler as POST }