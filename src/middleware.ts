// import { NextResponse } from "next/server";
// import { jwtVerify } from "jose";
// import type { NextRequest } from "next/server";

// const JWT_SECRET = process.env.JWT_SECRET || "replace_this_secret";
// const encoder = new TextEncoder();
// const secret = encoder.encode(JWT_SECRET);

// const roleAccessMap = {
//   admin: [
//     "/Dashboard",
//     "/Inventory",
//     "/addItem",
//     "/Invoice",
//     "/Reports",
//     "/Returned",
//     "/Ratelist",
//     "/Expenses",
//     "/Settings",
//     "/Salary",
//     "/AddSalary",
//     "/admin",
//   ],
//   user: [
//     "/Dashboard",
//     "/Inventory",
//     "/addItem",
//     "/Invoice",
//     "/Returned",
//     "/Settings",
//     "/Expenses",
//   ],
// };

// async function verifyJWT(token: string) {
//   try {
//     const { payload } = await jwtVerify(token, secret);
//     return payload;
//   } catch (err) {
//     console.error("❌ JWT verification failed:", err);
//     return null;
//   }
// }

// export async function middleware(req: NextRequest) {
//   const token = req.cookies.get("authToken")?.value;
//   const pathname = req.nextUrl.pathname;

//   // Handle root path "/"
//   if (pathname === "/") {
//     if (!token) {
//       const url = req.nextUrl.clone();
//       url.pathname = "/Login";
//       return NextResponse.redirect(url);
//     } else {
//       const decoded: any = await verifyJWT(token);
//       if (!decoded) {
//         const url = req.nextUrl.clone();
//         url.pathname = "/Login";
//         return NextResponse.redirect(url);
//       }
//       const url = req.nextUrl.clone();
//       url.pathname = "/Dashboard";
//       return NextResponse.redirect(url);
//     }
//   }

//   // Handle "/Login" path
//   if (pathname === "/Login") {
//     if (token) {
//       const decoded: any = await verifyJWT(token);
//       if (decoded) {
//         const url = req.nextUrl.clone();
//         url.pathname = "/Dashboard";
//         return NextResponse.redirect(url);
//       }
//     }
//     // If not logged in, allow access to /Login
//     return NextResponse.next();
//   }

//   // For protected routes (role-based)
//   if (!token) {
//     const url = req.nextUrl.clone();
//     url.pathname = "/Login";
//     return NextResponse.redirect(url);
//   }

//   const decoded: any = await verifyJWT(token);
//   if (!decoded) {
//     const url = req.nextUrl.clone();
//     url.pathname = "/Login";
//     return NextResponse.redirect(url);
//   }

//   const role = (decoded.role || "guest").toString().toLowerCase();
//   const allowedPaths = roleAccessMap[role as keyof typeof roleAccessMap] || [];
//   const hasAccess = allowedPaths.some((p) => pathname.startsWith(p));

//   if (!hasAccess) {
//     const url = req.nextUrl.clone();
//     url.pathname = "/Dashboard";
//     return NextResponse.redirect(url);
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/",
//     "/Login",
//     "/Dashboard/:path*",
//     "/Inventory/:path*",
//     "/addItem/:path*",
//     "/Invoice/:path*",
//     "/Reports/:path*",
//     "/Returned/:path*",
//     "/Ratelist/:path*",
//     "/Expenses/:path*",
//     "/Settings/:path*",
//     "/Salary/:path*",
//     "/AddSalary/:path*",
//     "/admin/:path*",
//   ],
// };



import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "replace_this_secret";
const encoder = new TextEncoder();
const secret = encoder.encode(JWT_SECRET);

const roleAccessMap = {
  admin: [
    "/Dashboard",
    "/Inventory",
    "/addItem",
    "/Invoice",
    "/Reports",
    "/Returned",
    "/Ratelist",
    "/Expenses",
    "/Settings",
    "/Salary",
    "/AddSalary",
    "/admin",
  ],
  user: [
    "/Dashboard",
    "/Inventory",
    "/addItem",
    "/Invoice",
    "/Returned",
    "/Settings",
    "/Expenses",
  ],
};

async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    console.error("❌ JWT verification failed:", err);
    return null;
  }
}

// ✅ Checks if user still exists in MongoDB
async function checkUserExists(userId: string, req: NextRequest): Promise<boolean> {
  try {
    const validateUrl = new URL("/api/auth/validate", req.nextUrl.origin);
    const res = await fetch(validateUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    return data.valid === true;
  } catch (err) {
    console.error("❌ User existence check failed:", err);
    return false;
  }
}

// ✅ Clears cookie and redirects to login
function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/Login";
  const response = NextResponse.redirect(url);
  response.cookies.delete("authToken");
  return response;
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("authToken")?.value;
  const pathname = req.nextUrl.pathname;

  // ── Handle root path "/" ───────────────────────────────────────────────
  if (pathname === "/") {
    if (!token) {
      return redirectToLogin(req);
    }

    const decoded: any = await verifyJWT(token);
    if (!decoded) return redirectToLogin(req);

    // ✅ Check DB even on root redirect
    const userExists = await checkUserExists(decoded.id, req);
    if (!userExists) return redirectToLogin(req);

    const url = req.nextUrl.clone();
    url.pathname = "/Dashboard";
    return NextResponse.redirect(url);
  }

  // ── Handle "/Login" path ───────────────────────────────────────────────
  if (pathname === "/Login") {
    if (token) {
      const decoded: any = await verifyJWT(token);
      if (decoded) {
        // ✅ Don't let deleted users get bounced back to Dashboard
        const userExists = await checkUserExists(decoded.id, req);
        if (userExists) {
          const url = req.nextUrl.clone();
          url.pathname = "/Dashboard";
          return NextResponse.redirect(url);
        }
        // User deleted — clear cookie and stay on Login
        const response = NextResponse.next();
        response.cookies.delete("authToken");
        return response;
      }
    }
    return NextResponse.next();
  }

  // ── Protected routes ───────────────────────────────────────────────────
  if (!token) return redirectToLogin(req);

  const decoded: any = await verifyJWT(token);
  if (!decoded) return redirectToLogin(req);

  // ✅ Core fix: verify user still exists in DB
  const userExists = await checkUserExists(decoded.id, req);
  if (!userExists) return redirectToLogin(req);

  // ── Role-based access ──────────────────────────────────────────────────
  const role = (decoded.role || "guest").toString().toLowerCase();
  const allowedPaths = roleAccessMap[role as keyof typeof roleAccessMap] || [];
  const hasAccess = allowedPaths.some((p) => pathname.startsWith(p));

  if (!hasAccess) {
    const url = req.nextUrl.clone();
    url.pathname = "/Dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/Login",
    "/Dashboard/:path*",
    "/Inventory/:path*",
    "/addItem/:path*",
    "/Invoice/:path*",
    "/Reports/:path*",
    "/Returned/:path*",
    "/Ratelist/:path*",
    "/Expenses/:path*",
    "/Settings/:path*",
    "/Salary/:path*",
    "/AddSalary/:path*",
    "/admin/:path*",
  ],
};