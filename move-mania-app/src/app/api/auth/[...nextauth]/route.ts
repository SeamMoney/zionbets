import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

console.log("NextAuth configuration file is being executed")
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID)
console.log("GOOGLE_CLIENT_SECRET is set:", !!process.env.GOOGLE_CLIENT_SECRET)
console.log("NEXTAUTH_SECRET is set:", !!process.env.NEXTAUTH_SECRET)

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