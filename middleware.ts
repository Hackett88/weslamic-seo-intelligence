import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isAppRoute = pathname.startsWith("/app");
  const isRoot = pathname === "/";
  if ((isAppRoute || isRoot) && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/", "/app/:path*"],
};
