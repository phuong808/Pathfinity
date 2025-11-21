import { headers } from "next/headers";
import { auth } from "./auth";

const getBaseURL = () => {
    // Server-side base URL determination
    if (process.env.BETTER_AUTH_URL) {
        return process.env.BETTER_AUTH_URL;
    }
    
    // Fallback to production URL
    return "https://pathfinity.vercel.app";
};

export const getSession = async () => {
    return auth.api.getSession({
        headers: await headers()
    });
};

// Export base URL getter if needed elsewhere on server
export { getBaseURL };