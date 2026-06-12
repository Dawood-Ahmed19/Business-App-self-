"use client";

import { useEffect, useState } from "react";
import FormField from "../FormField/page";
import { inventoryGridCols } from "@/layoutConfig";
import InventoryItem from "../inventoryItem/page";

export interface Item {
  _id: string;
  name?: string;
  type: string;
  color?: string;
  guage: number | string;
  size: string;
  lengthFt?: number;
  weight?: number;
  quantity?: number;
  pricePerFt?: number;
  pricePerUnit?: number;
  pricePerKg?: number;
  date: string;
  amount: number;
  batches: any[];
}

export default function InventoryCard() {
  const [items, setItems] = useState<Item[]>([]);
  const [searchItem, setSearchItem] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sizeFilter, setSizeFilter] = useState("All");
  const [guageFilter, setGuageFilter] = useState("All");
  const [allSizes, setAllSizes] = useState<string[]>(["All"]);
  const [allGuages, setAllGuages] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(false);
  const [allTypes, setAllTypes] = useState<string[]>(["All"]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (searchItem.trim()) query.append("search", searchItem.trim());
      if (typeFilter !== "All") query.append("type", typeFilter);
      if (sizeFilter !== "All") query.append("size", sizeFilter);
      if (guageFilter !== "All") query.append("guage", guageFilter);

      const res = await fetch(`/api/items?${query.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) setItems(data.items || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const res = await fetch("/api/items/filters");
      const data = await res.json();
      if (data.success) {
        setAllTypes(data.types || ["All"]);
        setAllSizes(data.sizes || ["All"]);
        setAllGuages(data.guages || ["All"]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
    fetchItems();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [searchItem, typeFilter, sizeFilter, guageFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) fetchItems();
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  return (
    <div className="max-w-[1530px] w-full bg-cardBg max-h-[750px] rounded-lg py-[80px] px-[80px] flex flex-col gap-5 2xl:px-[80px] 2xl:py-[80px] xl-only:px-[50px] xl-only:py-[50px]">
      <FormField
        label="Search your Item"
        value={searchItem}
        onChange={setSearchItem}
        placeholder="Type here"
        fontSize="14px"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <label className="mr-2 text-white text-sm">Filter by Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm"
          >
            {allTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mr-2 text-white text-sm">Filter by Size:</label>
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="px-3 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm"
          >
            {allSizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mr-2 text-white text-sm">Filter by Gauge:</label>
          <select
            value={guageFilter}
            onChange={(e) => setGuageFilter(e.target.value)}
            className="px-3 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm"
          >
            {allGuages.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setSearchItem("");
            setTypeFilter("All");
            setSizeFilter("All");
            setGuageFilter("All");
          }}
          className="bg-BgColor hover:bg-IconBg text-white px-3 py-1 rounded text-sm"
        >
          Reset Filters
        </button>
      </div>

      {/* Table Header */}
      <div
        className={`${inventoryGridCols} px-[30px] xl-only:px-[80px] py-[20px] bg-fieldBg border-b rounded-t-sm border-gray-600 text-white text-xs xl-only:text-[14px]`}
      >
        <p>Item Name</p>
        <p>Item Type</p>
        <p>Size</p>
        <p>Number</p>
        <p>Color</p>
        <p>Gauge</p>
        <p>Length (FT)</p>
        <p>Weight (KG)</p>
        <p>Qty Available</p>
        <p>Price Per Ft</p>
        <p>Price Per Kg</p>
        <p>Price Per Unit</p>
        <p>Amount</p>
        <p>Actions</p>
        <p>Date</p>
      </div>

      {/* Table Body */}
      <div className="max-h-[800px] overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading items…</p>
        ) : items.length > 0 ? (
          items.map((item) => (
            <InventoryItem
              key={item._id}
              {...item}
              batches={item.batches}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <p className="text-center text-gray-400 py-8">
            No items match current filters.
          </p>
        )}
      </div>
    </div>
  );
}
