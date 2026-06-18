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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [deleteError, setDeleteError] = useState("");

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

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setPasswordInput("");
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (passwordInput !== "MakkahSteelTraders00") {
      setDeleteError("Incorrect password.");
      return;
    }
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/items/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchItems();
        setDeleteId(null);
      } else {
        setDeleteError("Failed to delete item.");
      }
    } catch (err) {
      console.error("Error deleting:", err);
      setDeleteError("Error deleting item.");
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

      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-xs">
            <h2 className="text-lg font-bold mb-4 text-white">Confirm Delete</h2>
            <p className="text-gray-300 text-sm mb-3">
              Enter password to delete this item.
            </p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 mb-3"
              autoFocus
            />
            {deleteError && (
              <p className="text-red-400 text-sm mb-3">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
