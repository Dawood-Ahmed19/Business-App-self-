"use client";

import { useEffect, useState } from "react";

interface Item {
  _id: string;
  name: string;
  quantity?: number | null;
  weight?: number | null;
  lengthFt?: number | null;
  ft?: number | null;
  type?: string;
}

const ShowItem = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();
        if (data.success) {
          setItems(data.items);
        }
      } catch (err) {
        console.error("Error fetching inventory:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const renderFt = (ft?: number | null, lengthFt?: number | null) => {
    const val = ft ?? lengthFt;
    if (!val || isNaN(val) || val <= 0)
      return <span className="text-gray-400">N/A</span>;
    return `${val.toLocaleString()} ft`;
  };

  const renderWeight = (weight?: number | null) => {
    if (!weight || isNaN(weight) || weight <= 0)
      return <span className="text-gray-400">N/A</span>;
    return `${weight.toFixed(2)} kg`;
  };

  const renderQuantity = (
    qty?: number | null,
    weight?: number | null,
    ft?: number | null,
    lengthFt?: number | null
  ) => {
    if (
      (weight && weight > 0) ||
      (ft && ft > 0) ||
      (lengthFt && lengthFt > 0)
    ) {
      if (!qty || isNaN(qty) || qty <= 0)
        return <span className="text-gray-400">N/A</span>;
    }

    if (qty === null || qty === undefined || isNaN(qty))
      return <span className="text-gray-400">N/A</span>;
    if (qty === 0)
      return (
        <span className="text-red-500 text-xs font-bold">Out of Stock</span>
      );
    return <span className="text-white text-xs">Qty: {qty}</span>;
  };

  return (
    <div className="flex flex-col gap-2 max-h-[600px] h-full w-full overflow-y-auto bg-cardBg rounded-lg py-[30px] px-[20px]">
      {/* Header */}
      <div className="flex items-center justify-between h-[70px] w-full bg-BgColor px-[50px] py-[20px]">
        <p className="text-white text-xs w-[100px]">Item Name</p>
        <p className="text-white text-xs w-[80px] text-center">Ft</p>
        <p className="text-white text-xs w-[120px] text-center">Quantity</p>
        <p className="text-white text-xs w-[80px] text-center">Weight</p>
      </div>

      <span>
        {items.length === 0 ? (
          <p className="text-gray-400 text-sm p-4">No items in inventory.</p>
        ) : (
          items.map((item) => (
            <div key={item._id} className="flex flex-col gap-2">
              <span className="flex items-center justify-between px-[50px] py-[10px]">
                <p className="text-white text-xs">{item.name}</p>

                <p className="text-white text-xs">
                  {renderFt(item.ft, item.lengthFt)}
                </p>

                <p>
                  {renderQuantity(
                    item.quantity,
                    item.weight,
                    item.ft,
                    item.lengthFt
                  )}
                </p>

                <p className="text-white text-xs">
                  Weight: {renderWeight(item.weight)}
                </p>
              </span>
              <hr className="opacity-25 text-white" />
            </div>
          ))
        )}
      </span>
    </div>
  );
};

export default ShowItem;
