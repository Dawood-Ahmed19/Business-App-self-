"use client";

import ItemCard from "@/components/itemCard/page";

const AddItem = () => {
  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-[1280px] mx-auto px-12 py-8 h-full flex flex-col gap-12">
      <span className="flex justify-between items-center w-full">
        <h1 className="text-xl font-bold text-white">Add Item to Inventory</h1>
        <p className="text-sm text-white">{formattedDate}</p>
      </span>

      <ItemCard />
    </div>
  );
};

export default AddItem;
