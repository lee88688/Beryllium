import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { getIronSession } from "iron-session/edge";
import { ironOptions } from "./config";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession(req, res, ironOptions);
  if (!session.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  } else if (
    req.nextUrl.pathname === "/" ||
    req.nextUrl.pathname === "/login"
  ) {
    return NextResponse.redirect(new URL("/bookshelf", req.url));
  }

  return res;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/", "/bookshelf", "/reader", "/setting"],
};
