import { NextRequest, NextResponse } from "next/server";
import { getRegionFromHost } from "@/lib/regions";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const region = getRegionFromHost(host);

  const response = NextResponse.next();
  response.headers.set("x-wallio-region", region);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon|icon|.*\\..*).*)"],
};
