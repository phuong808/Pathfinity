import { createAuthClient } from "better-auth/react" // make sure to import from better-auth/react

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL || "https://pathfinity.vercel.app"
})

// Export commonly used hooks for convenience
export const { useSession, signIn, signOut, signUp } = authClient;