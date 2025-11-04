// middleware.js
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {},
  {
    callbacks: {
      authorized: ({ token }) => {
        const authorizedRoles = ['Admin', 'Moderator', 'Editor', 'Analyst'];
        return !!token && authorizedRoles.includes(token.role);
      },
    },
    pages: {
      signIn: "/admin",
    },
  }
);

// This config now ONLY protects the admin pages and the main admin API
export const config = {
  matcher: [
    // Protect all the admin UI pages
    "/manage-team",
    "/add-event",
    "/add-collabrate",
    "/add-sponser",
    "/add-galary",
    "/add-past-events",
    "/add-webinar",

    // Protect the core admin API for managing members
    "/api/admin/:path*",
  ],
};
