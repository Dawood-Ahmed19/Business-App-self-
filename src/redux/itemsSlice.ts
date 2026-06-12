// import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// type Item = {
//   _id?: string;
//   name: string;
//   type: string;
//   guage: number | string;
//   gote: number | string;
//   size: string;
//   weight: number;
//   quantity: number;
//   price: number;
// };

// type ItemState = {
//   list: Item[];
// };

// const initialState: ItemState = {
//   list: [],
// };

// const itemsSlice = createSlice({
//   name: "items",
//   initialState,
//   reducers: {
//     addItem: (state, action: PayloadAction<Item>) => {
//       state.list.push(action.payload);
//     },
//     editItem: (state, action: PayloadAction<Item>) => {
//       const index = state.list.findIndex((i) => i._id === action.payload._id);
//       if (index !== -1) {
//         state.list[index] = action.payload;
//       }
//     },
//     removeItem: (state, action: PayloadAction<string>) => {
//       state.list = state.list.filter((item) => item._id !== action.payload);
//     },
//   },
// });

// export const { addItem, editItem, removeItem } = itemsSlice.actions;
// export default itemsSlice.reducer;
