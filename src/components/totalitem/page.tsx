"use client";
import { useEffect, useState } from "react";
import { faTags } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const TotalItem = () => {
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const fetchTotalItems = async () => {
      try {
        const res = await fetch("/api/items");
        const data = await res.json();

        const items = Array.isArray(data) ? data : data.items;

        setTotal(items.length);
      } catch (err) {
        console.error("Error fetching total items:", err);
      }
    };

    fetchTotalItems();
  }, []);

  return (
    <div className="max-w-[250px] max-h-[170px] bg-cardBg px-[50px] py-[13px] flex flex-col items-center gap-4 rounded-xl">
      <span className="flex items-center gap-2">
        <span className="bg-IconBg flex items-center justify-center py-2 px-2 rounded-xl">
          <FontAwesomeIcon className="text-iconColor text-xl" icon={faTags} />
        </span>
        <span className="flex flex-col text-white">
          <span className="text-xs">Total Items</span>
          <span className="font-bold">In Stock</span>
        </span>
      </span>
      <span className="font-bold text-white text-sm">{total}</span>
    </div>
  );
};

export default TotalItem;
