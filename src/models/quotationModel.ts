import mongoose, { Schema, Document } from "mongoose";

interface ItemSchema {
  itemId: string;
  itemName: string;
  quantity: number;
  weight: number;
  costPerUnit: number;
  invoiceRatePerUnit: number;
  amount: number;
  profitPerUnit: number;
  totalProfit: number;
}

export interface QuotationDocument extends Document {
  quotationName: string;
  items: ItemSchema[];
  createdAt: Date;
}

const ItemSchema = new Schema<ItemSchema>({
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  weight: { type: Number, required: true },
  costPerUnit: { type: Number, required: true },
  invoiceRatePerUnit: { type: Number, required: true },
  amount: { type: Number, required: true },
  profitPerUnit: { type: Number, required: true },
  totalProfit: { type: Number, required: true },
});

const QuotationSchema = new Schema<QuotationDocument>(
  {
    quotationName: { type: String, required: true },
    items: [ItemSchema],
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "quotations" }
);

export default mongoose.models.Quotation ||
  mongoose.model<QuotationDocument>("Quotation", QuotationSchema);
