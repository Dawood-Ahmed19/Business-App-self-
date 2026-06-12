import mongoose, { Schema, model, models, Model, Document } from "mongoose";

interface ExpenseEntry {
  date: string;
  description: string;
  amount: number;
}

interface Expense extends Document {
  month: string;
  entries: ExpenseEntry[];
}

const expenseSchema = new Schema<Expense>(
  {
    month: { type: String, required: true },
    entries: [
      {
        date: { type: String, required: true },
        description: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

const ExpenseModel: Model<Expense> =
  models.Expense || model<Expense>("Expense", expenseSchema);

export default ExpenseModel;