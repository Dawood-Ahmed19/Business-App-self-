import { NextResponse } from "next/server";

export async function POST() {
    // Clear the authToken cookie
    return NextResponse.json(
        { success: true, message: "Logged out" },
        {
            status: 200,
            headers: {
                "Set-Cookie": `authToken=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
            },
        }
    );
}