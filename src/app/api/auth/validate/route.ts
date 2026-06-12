import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ valid: false }, { status: 400 });
        }

        const db = await getDb();
        const user = await db
            .collection("users")
            .findOne({ _id: new ObjectId(userId) }, { projection: { _id: 1 } });

        if (!user) {
            return NextResponse.json({ valid: false }, { status: 401 });
        }

        return NextResponse.json({ valid: true });
    } catch (err) {
        return NextResponse.json({ valid: false }, { status: 500 });
    }
}