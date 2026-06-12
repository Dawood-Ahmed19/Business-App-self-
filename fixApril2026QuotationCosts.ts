import "dotenv/config";
import { getDb } from "./src/lib/mongodb.ts";

interface Quotation {
    _id: any;
    quotationId: string;
    items: any[];
    date: string;
    carriage?: number;
}

async function main() {
    console.log("🚀 Fixing April 2026 quotation costs (costPerUnit = ratePerFt × 20)...");

    // 🧪 Debug check
    console.log("📌 ENV CHECK:", {
        MONGODB_URI: !!process.env.MONGODB_URI,
        DB: process.env.MONGODB_DB,
        cwd: process.cwd(),
    });

    const db = await getDb();
    const quotationsCol = db.collection<Quotation>("quotations");
    const inventoryCol = db.collection("inventory");

    // ✅ April 2026 filter
    const start = new Date("2026-04-01T00:00:00.000Z");
    const end = new Date("2026-04-30T23:59:59.999Z");

    const quotations = await quotationsCol
        .find({
            date: {
                $gte: start.toISOString(),
                $lte: end.toISOString(),
            },
        })
        .toArray();

    console.log(`📦 Found ${quotations.length} quotations`);

    let updatedCount = 0;

    for (const q of quotations) {
        let itemsChanged = false;
        const updatedItems: any[] = [];

        for (const item of q.items || []) {
            const inv = await inventoryCol.findOne({
                name: item.originalName || item.item,
                size: item.size || "",
                guage: item.guage || "",
            });

            if (!inv) {
                console.log(`⚠️ Inventory not found for: ${item.item}`);
                updatedItems.push(item);
                continue;
            }

            const invType = (inv.type || "").toLowerCase();
            const pricePerFt = Number(inv.pricePerFt) || 0;
            const pricePerKg = Number(inv.pricePerKg) || 0;
            const pricePerUnit = Number(inv.pricePerUnit) || 0;

            let costPerUnit = 0;

            // ✅ PIPE → cost per piece (ratePerFt × 20)
            if (invType === "pipe") {
                costPerUnit = pricePerFt * 20;
            }

            // ✅ KG-based item → cost per kg
            else if (pricePerKg > 0 && Number(item.weight) > 0) {
                costPerUnit = pricePerKg;
            }

            // ✅ FT-based item → cost per ft
            else if (pricePerFt > 0 && Number(item.ft) > 0) {
                costPerUnit = pricePerFt;
            }

            // ✅ Default → fallback to unit price
            else {
                costPerUnit = pricePerUnit;
            }

            const invoiceRatePerUnit = Number(item.rate) || 0;
            const profitPerUnit = Math.round(invoiceRatePerUnit - costPerUnit);
            const qty = Number(item.qty) || 1;

            // total profit only from quantity, not ft
            const totalProfit = Math.round(profitPerUnit * qty);

            if (
                item.costPerUnit !== costPerUnit ||
                item.profitPerUnit !== profitPerUnit ||
                item.totalProfit !== totalProfit
            ) {
                itemsChanged = true;
            }

            updatedItems.push({
                ...item,
                costPerUnit,
                invoiceRatePerUnit,
                profitPerUnit,
                totalProfit,
            });
        }

        if (!itemsChanged) continue;

        const quotationTotalProfit =
            updatedItems.reduce((s, i) => s + (i.totalProfit || 0), 0) +
            (Number(q.carriage) || 0);

        await quotationsCol.updateOne(
            { _id: q._id },
            {
                $set: {
                    items: updatedItems,
                    quotationTotalProfit,
                    updatedAt: new Date().toISOString(),
                },
            }
        );

        updatedCount++;
        console.log(`✅ Updated ${q.quotationId}`);
    }

    console.log(`🎯 Done! Updated ${updatedCount} quotations.`);
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Script failed:", err);
    process.exit(1);
});