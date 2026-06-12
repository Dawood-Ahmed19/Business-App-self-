"use client";

import InventoryCard from "@/components/Inventory/page";

export default function Inventory() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div
      className="h-full flex flex-col items-center 
      gap-[50px] px-[75px] py-[35px] 
      2xl:px-[75px] 2xl:py-[35px] 
      xl:px-[40px] xl:py-[25px] xl:gap-[35px]"
    >
      <span className="flex justify-between w-full">
        <h1 className="text-xl font-bold text-white">Your Inventory</h1>
        <p className="text-sm text-white">{formattedDate}</p>
      </span>

      <InventoryCard />
    </div>
  );
}
