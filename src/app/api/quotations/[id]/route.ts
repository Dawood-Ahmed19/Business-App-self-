import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

// -------- GET Single Invoice ----------

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const quotations = db.collection("quotations");

    const query = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { quotationId: id };

    const quotation = await quotations.findOne(query);

    if (!quotation) {
      return NextResponse.json(
        { success: false, message: "Quotation not found" },
        { status: 404 }
      );
    }

    const normalizedQuotation = {
      ...quotation,
      customerName: quotation.customerName || "",
      discount: quotation.discount || 0,
      loading: quotation.loading || 0,
      payments: Array.isArray(quotation.payments) ? quotation.payments : [],
      items: Array.isArray(quotation.items) ? quotation.items : [],
    };

    if (Array.isArray(normalizedQuotation.items)) {
      normalizedQuotation.items = normalizedQuotation.items.map((item: any) => {
        let adjustedCostPerUnit = item.costPerUnit;
        if (item.itemType === "pipe") {
          adjustedCostPerUnit = (item.costPerUnit || 0) * 20;
        }

        const profitPerUnit =
          (item.invoiceRatePerUnit || 0) - (adjustedCostPerUnit || 0);
        const totalProfit = (profitPerUnit || 0) * (item.qty || 0);

        return {
          ...item,
          adjustedCostPerUnit,
          profitPerUnit,
          totalProfit,
        };
      });
    }

    (normalizedQuotation as any).quotationTotalProfit =
      normalizedQuotation.items.reduce(
        (sum: number, i: any) => sum + (i.totalProfit || 0),
        0
      );

    return NextResponse.json(
      { success: true, quotation: normalizedQuotation },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const client = await clientPromise;
    const db = client.db("MakkaMetals");
    const quotations = db.collection("quotations");
    const inventory = db.collection("inventory");

    let query: any = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { quotationId: id };
    }

    const invoice = await quotations.findOne(query);

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Quotation not found" },
        { status: 404 }
      );
    }

    if (invoice.items && Array.isArray(invoice.items)) {
      for (const item of invoice.items) {
        console.log("Restoring item:", item);

        const qtyToRestore = Number(item.qty) || 0;
        const weightToRestore = Number(item.weight) || 0;

        const result = await inventory.updateOne(
          { name: item.originalName },
          {
            $inc: {
              quantity: qtyToRestore,
              weight: weightToRestore,
            },
          }
        );

        if (result.matchedCount === 0) {
          console.warn(
            `No inventory found for ${item.originalName}, inserting new...`
          );

          await inventory.insertOne({
            name: item.originalName,
            type: item.item ?? "unknown",
            size: item.size ?? "",
            guage: item.guage ?? "",
            gote: item.gote ?? "",
            quantity: qtyToRestore,
            weight: weightToRestore,
            color: item.color ?? "",
            pricePerKg: item.rate ?? 0,
            pricePerUnit: item.costPerUnit ?? 0,
            date: new Date(),
            uniqueKey: item.uniqueKey ?? `${item.originalName}_${Date.now()}`,
          });
        }
      }
    }

    const result = await quotations.deleteOne({ _id: invoice._id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to delete quotation" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Quotation deleted and stock restored (with safeguard)",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
