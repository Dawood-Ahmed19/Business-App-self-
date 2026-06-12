// import { NextResponse } from "next/server";
// import { getDb } from "@/lib/mongodb";

// const COLLECTION = "expenses";

// // ─── GET ──────────────────────────────────────────────────────
// export async function GET(req: Request) {
//   try {
//     const db = await getDb();
//     const { searchParams } = new URL(req.url);
//     const month = searchParams.get("month");

//     // return list of distinct months if none is given
//     if (!month) {
//       const months = await db.collection(COLLECTION).distinct("month");
//       return NextResponse.json({ success: true, months });
//     }

//     // load data for that month
//     const doc = await db.collection(COLLECTION).findOne({ month });
//     const entries = doc?.entries || [];

//     // compute current totals to return
//     const monthlyTotal = entries.reduce(
//       (sum: number, e: any) => sum + (Number(e.amount) || 0),
//       0
//     );

//     const salaryAgg = await db
//       .collection("salaries")
//       .aggregate([
//         { $match: { month } },
//         {
//           $group: {
//             _id: null,
//             totalPaid: {
//               $sum: {
//                 $add: [
//                   { $toDouble: { $ifNull: ["$paidAmount", 0] } },
//                   { $toDouble: { $ifNull: ["$advancePaid", 0] } },
//                 ],
//               },
//             },
//           },
//         },
//       ])
//       .toArray();

//     const salariesPaid = salaryAgg.length ? salaryAgg[0].totalPaid : 0;
//     const grandTotal = monthlyTotal + salariesPaid;

//     // ✅ update document with totals so they’re persisted
//     await db.collection(COLLECTION).updateOne(
//       { month },
//       {
//         $set: {
//           month,
//           path: `expenses/${month}`,
//           entries,
//           monthlyTotal,
//           salariesPaid,
//           grandTotal,
//           updatedAt: new Date(),
//         },
//         $setOnInsert: { createdAt: new Date() },
//       },
//       { upsert: true }
//     );

//     return NextResponse.json({
//       success: true,
//       month,
//       entries,
//       monthlyTotal,
//       salariesPaid,
//       grandTotal,
//     });
//   } catch (err: any) {
//     console.error("GET /api/expenses", err);
//     return NextResponse.json(
//       { success: false, message: err.message },
//       { status: 500 }
//     );
//   }
// }

// // ─── POST ─────────────────────────────────────────────────────
// export async function POST(req: Request) {
//   try {
//     const db = await getDb();
//     const { month, entries } = await req.json();

//     if (!month) {
//       return NextResponse.json(
//         { success: false, message: "Month is required" },
//         { status: 400 }
//       );
//     }

//     // compute totals before saving
//     const monthlyTotal = Array.isArray(entries)
//       ? entries.reduce(
//           (sum: number, e: any) => sum + (Number(e.amount) || 0),
//           0
//         )
//       : 0;

//     const salaryAgg = await db
//       .collection("salaries")
//       .aggregate([
//         { $match: { month } },
//         {
//           $group: {
//             _id: null,
//             totalPaid: {
//               $sum: {
//                 $add: [
//                   { $toDouble: { $ifNull: ["$paidAmount", 0] } },
//                   { $toDouble: { $ifNull: ["$advancePaid", 0] } },
//                 ],
//               },
//             },
//           },
//         },
//       ])
//       .toArray();

//     const salariesPaid = salaryAgg.length ? salaryAgg[0].totalPaid : 0;
//     const grandTotal = monthlyTotal + salariesPaid;

//     const result = await db.collection(COLLECTION).updateOne(
//       { month },
//       {
//         $set: {
//           month,
//           path: `expenses/${month}`,
//           entries: Array.isArray(entries) ? entries : [],
//           monthlyTotal,
//           salariesPaid,
//           grandTotal,
//           updatedAt: new Date(),
//         },
//         $setOnInsert: { createdAt: new Date() },
//       },
//       { upsert: true }
//     );

//     return NextResponse.json({
//       success: true,
//       result,
//       monthlyTotal,
//       salariesPaid,
//       grandTotal,
//     });
//   } catch (err: any) {
//     console.error("POST /api/expenses", err);
//     return NextResponse.json(
//       { success: false, message: err.message },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const COLLECTION = "expenses";

// ─── GET ──────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    // return list of distinct months if none is given
    if (!month) {
      const months = await db.collection(COLLECTION).distinct("month");
      return NextResponse.json({ success: true, months });
    }

    // load data for that month
    const doc = await db.collection(COLLECTION).findOne({ month });

    const rawEntries = doc?.entries || [];

    // ensure numeric amounts
    const entries = rawEntries.map((e: any) => ({
      date: e.date,
      description: e.description,
      amount: Number(e.amount) || 0,
    }));

    // compute totals
    const monthlyTotal = entries.reduce(
      (sum: number, e: any) => sum + e.amount,
      0
    );

    const salaryAgg = await db
      .collection("salaries")
      .aggregate([
        { $match: { month } },
        {
          $group: {
            _id: null,
            totalPaid: {
              $sum: {
                $add: [
                  { $toDouble: { $ifNull: ["$paidAmount", 0] } },
                  { $toDouble: { $ifNull: ["$advancePaid", 0] } },
                ],
              },
            },
          },
        },
      ])
      .toArray();

    const salariesPaid = salaryAgg.length ? salaryAgg[0].totalPaid : 0;
    const grandTotal = monthlyTotal + salariesPaid;

    return NextResponse.json({
      success: true,
      month,
      entries,
      monthlyTotal,
      salariesPaid,
      grandTotal,
    });
  } catch (err: any) {
    console.error("GET /api/expenses", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const db = await getDb();
    const { month, entries: rawEntries } = await req.json();

    if (!month) {
      return NextResponse.json(
        { success: false, message: "Month is required" },
        { status: 400 }
      );
    }

    // force clean numeric entries
    const entries = Array.isArray(rawEntries)
      ? rawEntries.map((e: any) => ({
          date: e.date,
          description: e.description,
          amount: Number(e.amount) || 0,
        }))
      : [];

    // compute totals
    const monthlyTotal = entries.reduce(
      (sum: number, e: any) => sum + e.amount,
      0
    );

    const salaryAgg = await db
      .collection("salaries")
      .aggregate([
        { $match: { month } },
        {
          $group: {
            _id: null,
            totalPaid: {
              $sum: {
                $add: [
                  { $toDouble: { $ifNull: ["$paidAmount", 0] } },
                  { $toDouble: { $ifNull: ["$advancePaid", 0] } },
                ],
              },
            },
          },
        },
      ])
      .toArray();

    const salariesPaid = salaryAgg.length ? salaryAgg[0].totalPaid : 0;
    const grandTotal = monthlyTotal + salariesPaid;

    const result = await db.collection(COLLECTION).updateOne(
      { month },
      {
        $set: {
          month,
          path: `expenses/${month}`,
          entries,
          monthlyTotal,
          salariesPaid,
          grandTotal,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      result,
      monthlyTotal,
      salariesPaid,
      grandTotal,
    });
  } catch (err: any) {
    console.error("POST /api/expenses", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
