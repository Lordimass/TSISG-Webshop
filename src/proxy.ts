import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";

export default function proxy(request: NextRequest) {
    const headers = new Headers(request.headers);
    headers.set("x-origin", request.nextUrl.origin);
    return NextResponse.next({ headers });
}

export const config = {
    matcher: [
        // match all routes except static files and APIs
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};