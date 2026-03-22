import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
    ],
    trustHost: true,
    debug: true,
    callbacks: {
        signIn: async ({ user }) => {
            if (!user.email) return false;

            const allowedUsersStr = process.env.ALLOWED_USERS;
            if (allowedUsersStr) {
                const allowedUsers = allowedUsersStr.split(',').map(e => e.trim().toLowerCase());
                if (!allowedUsers.includes(user.email.toLowerCase())) {
                    console.log(`[AUTH FAILED] Unauthorized email attempted login: ${user.email}`);
                    return false; // Access Denied
                }
            }
            return true;
        },
        authorized: async ({ auth }) => {
            // Logged in users are authenticated, otherwise redirect to login
            return !!auth
        },
    },
    pages: {
        signIn: '/', // Using the landing page as sign-in
    },
})
