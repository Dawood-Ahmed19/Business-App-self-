// import { inventoryDb } from "./mongodb";

// export type Item = {
//   name: string;
//   type: string;
//   size: string;
//   date: string;
// };

// export async function addItem(item: Item) {
//   return await inventoryDb.insert(item);
// }

// export async function getItems() {
//   return await inventoryDb.find({}).sort({ date: -1 });
// }

// export async function deleteItem(id: string) {
//   return await inventoryDb.remove({ _id: id }, {});
// }
