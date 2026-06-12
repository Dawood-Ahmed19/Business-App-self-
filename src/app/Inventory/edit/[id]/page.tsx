"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const GuageOptions = ["14", "16", "18", "19", "20", "21", "22", "23", "24"];
const RoundItemSizeOptions = [
  `1/2`,
  `1`,
  `1-H`,
  `1-1/2-Prime`,
  `1-1/2-Hard`,
  `1-7/8`,
  `1-5/8`,
  `2-Prime`,
  `2-Hard`,
  `2-7/8`,
  `2-7/8-H`,
  `1-Prime`,
  `1-1/4-Prime`,
  `1-1/4-Hard`,
  `1/2-Prime`,
  `1/2-Hard`,
  `3/4 Prime`,
  `3/4 Hard`,
  `4-Hard`,
  `L-small`,
  `L-small-1-5/8`,
  `T-Small`,
  `D-SADA`,
  `Z-1-7/8`,
  `Z-Pipe`,
  `T-Big`,
  `L-Big`,
  `D-MJ`,
  `D-MJ BIG`,
  `D-J`,
];
const SquareItemSizeOptions = [
  `1-1/2x3`,
  `1x2-1/2`,
  `2x2`,
  `2x4-H`,
  `1-1/2x2`,
  `1-1/2x1-1/2`,
  `1x1`,
  `1x2`,
  `1/2x1/2`,
  `1/2x1-1/2-Patti`,
  `3/4x3/4`,
  `3/4x1-1/2`,
  `1x1-1/2`,
  `1/2x1`,
  `1x3`,
  `1-1/4x2-1/2`,
  `1-1/4x1-1/4`,
  `3/8x3/8`,
  `3/4x3/8`,
  `3x3-HR`,
  `1-1/2x4-HR`,
];
const AngleSizeOptions = [
  `1/2x1/16`,
  `3/4x1/16`,
  `3/4x1/8`,
  `1x1/16`,
  `1x1/8`,
  `1-1/4x1/8`,
  `1-1/4x3/16`,
  `2x1/8`,
];
const PattiSizeOptions = [
  `1/2x1/16`,
  `1x1/16`,
  `1x1/8`,
  `1-1/4x1/8`,
  `1-1/4x3/16`,
  `1-1/2x3/16`,
];
const RoundSarryaSize = [`5/8x2/8`, `1/2x1`, `1xPolish 7/2`];
const SquareSarryaSize = [`1/4x3/8`];
const JaliSizeOptions = [`3`, `3-1/2`, `4`, `4-1/2`, `5`, `6`, `7`, `8`];
const JaliNumberOptions = [
  `12 x 12`,
  `12 x 24 Kali`,
  `Black 12 x 24`,
  `1/16 Murgha Special`,
  `3/16 Tanka barfi`,
  `3/16 Barfi Normal`,
  `1/2 China steel`,
  `16x26 Jasti Jali`
];
const ChorasKhanaChinaJaliSizeOptions = [`3'`, `4'`, `5'`, `6'`];
const PER_KG_TYPES = [
  "Angle",
  "Patti",
  "Sarrya",
  "Choras Khana China Jali",
  "Diamond Chadar",
];

export default function EditItemPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<any>(null);

  // Controlled states for all fields
  const [itemType, setItemType] = useState("");
  const [pipeType, setPipeType] = useState("");
  const [number, setNumber] = useState("");
  const [priceField, setPriceField] = useState("");
  const [ft, setFt] = useState("");
  const [weight, setWeight] = useState("");
  const [size, setSize] = useState("");
  const [guage, setGuage] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState("");
  const [batches, setBatches] = useState<any[]>([]);

  // Fetch and set item, pipeType, etc. (but NOT size)
  // useEffect(() => {
  //   async function fetchItem() {
  //     try {
  //       const res = await fetch(`/api/items/${id}`);
  //       const data = await res.json();
  //       if (data.success) {
  //         setItem(data.item);
  //         setBatches(data.item.batches || []);
  //         setItemType(
  //           data.item.type.charAt(0).toUpperCase() + data.item.type.slice(1)
  //         );
  //         // Capitalize pipeType for select
  //         let pipeTypeValue = "";
  //         if (data.item.pipeType) {
  //           pipeTypeValue =
  //             data.item.pipeType.charAt(0).toUpperCase() +
  //             data.item.pipeType.slice(1).toLowerCase();
  //         }
  //         setPipeType(pipeTypeValue);
  //         setNumber(data.item.number ?? "");
  //         setPriceField(
  //           data.item.pricePerFt ||
  //             data.item.pricePerKg ||
  //             data.item.pricePerUnit ||
  //             ""
  //         );
  //         setWeight(data.item.weight ?? "");
  //         setGuage(data.item.guage ?? "");
  //         setColor(data.item.color ?? "");
  //         // Set size after pipeType is set
  //         setTimeout(() => {
  //           setSize(data.item.size ?? "");
  //         }, 0);

  //         const totalQty = (data.item.batches || []).reduce(
  //           (sum, b) => sum + Number(b.quantity || 0),
  //           0
  //         );
  //         const totalFt = (data.item.batches || []).reduce(
  //           (sum, b) => sum + Number(b.lengthFt || 0),
  //           0
  //         );
  //         setQuantity(totalQty.toString());
  //         setFt(totalFt.toString());
  //       }
  //     } catch (e) {
  //       console.error("Fetch error:", e);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   if (id) fetchItem();
  // }, [id]);

  const itemTypeOptions = [
    "Pipe",
    "Hardware",
    "Angle",
    "Patti",
    "Sarrya",
    "Jali",
    "Tanka Barfi Jali",
    "Choras Khana China Jali",
    "Diamond Chadar",
  ];

  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetch(`/api/items/${id}`);
        const data = await res.json();
        if (data.success) {
          setItem(data.item);

          // Find the correct option for itemType (case-insensitive)
          const fetchedType = (data.item.type || "").trim().toLowerCase();
          const matchedType = itemTypeOptions.find(
            (opt) => opt.trim().toLowerCase() === fetchedType
          );
          setItemType(matchedType || itemTypeOptions[0]);

          // Capitalize pipeType for select
          let pipeTypeValue = "";
          if (data.item.pipeType) {
            pipeTypeValue =
              data.item.pipeType.charAt(0).toUpperCase() +
              data.item.pipeType.slice(1).toLowerCase();
          }
          setPipeType(pipeTypeValue);

          // Set fields based on type
          if (matchedType === "Diamond Chadar") {
            setPriceField(data.item.pricePerKg ?? "");
            setWeight(data.item.weight ?? "");
            setNumber("");
          } else if (matchedType === "Jali" || matchedType === "Tanka Barfi Jali") {
            setPriceField(data.item.pricePerFt ?? "");
            const dbNumber = (data.item.number ?? "").trim().toLowerCase();
            const matchedNumber = JaliNumberOptions.find(
              (opt) => opt.trim().toLowerCase() === dbNumber
            );
            setNumber(matchedNumber || "");
            setWeight("");
          } else if (matchedType === "Pipe") {
            setPriceField(data.item.pricePerFt ?? "");
            setWeight("");
            setNumber("");
          } else if (matchedType === "Hardware") {
            setPriceField(data.item.pricePerUnit ?? "");
            setWeight(data.item.weight ?? "");
            setNumber("");
          } else {
            setPriceField(
              data.item.pricePerFt ||
              data.item.pricePerKg ||
              data.item.pricePerUnit ||
              ""
            );
            setWeight(data.item.weight ?? "");
            setNumber(data.item.number ?? "");
          }

          setGuage(data.item.guage ?? "");
          setColor(data.item.color ?? "");

          // Set size after pipeType is set
          setTimeout(() => {
            setSize(data.item.size ?? "");
          }, 0);

          // Set batches (for batch rendering)
          setBatches(data.item.batches || []);

          // Calculate totals from batches
          const totalQty = (data.item.batches || []).reduce(
            (sum, b) => sum + Number(b.quantity || 0),
            0
          );
          const totalFt = (data.item.batches || []).reduce(
            (sum, b) => sum + Number(b.lengthFt || 0),
            0
          );
          setQuantity(totalQty.toString());
          setFt(totalFt.toString());
        }
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchItem();
  }, [id]);

  // Live update main fields when batches change
  useEffect(() => {
    if (batches.length > 0) {
      const totalQty = batches.reduce(
        (sum, b) => sum + Number(b.quantity || 0),
        0
      );
      const totalFt = batches.reduce(
        (sum, b) => sum + Number(b.lengthFt || 0),
        0
      );
      setQuantity(totalQty.toString());
      setFt(totalFt.toString());
    }
  }, [batches]);

  function handleBatchChange(idx: number, field: string, value: any) {
    setBatches((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b))
    );
  }

  // Set size after pipeType and item are set
  useEffect(() => {
    if (item && item.size) {
      setSize(item.size);
    }
  }, [pipeType, item]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Loading item…
      </div>
    );

  if (!item)
    return (
      <div className="flex items-center justify-center h-screen text-red-400">
        Item not found.
      </div>
    );

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleDecimalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(".")) {
      const [intPart, decPart] = value.split(".");
      if (decPart.length > 2) {
        e.target.value = `${intPart}.${decPart.slice(0, 2)}`;
      }
    }
  };

  // field controls
  const isPipe = itemType === "Pipe";
  const isHardware = itemType === "Hardware";
  const isJali = itemType === "Jali" || itemType === "Tanka Barfi Jali";
  const isDiamondChadar = itemType === "Diamond Chadar";
  const isPerKg = isHardware && !!item?.pricePerKg;
  const isPerUnit = isHardware && !!item?.pricePerUnit;

  const isPerFt = !!item?.pricePerFt || isPipe || isJali;

  // dynamic size options like ItemCard
  const sizeOptions =
    itemType === "Pipe"
      ? pipeType === "Round"
        ? RoundItemSizeOptions
        : pipeType === "Square"
          ? SquareItemSizeOptions
          : []
      : itemType === "Angle"
        ? AngleSizeOptions
        : itemType === "Patti"
          ? PattiSizeOptions
          : itemType === "Sarrya"
            ? pipeType === "Round"
              ? RoundSarryaSize
              : pipeType === "Square"
                ? SquareSarryaSize
                : []
            : itemType === "Jali" || itemType === "Tanka Barfi Jali"
              ? JaliSizeOptions
              : itemType === "Choras Khana China Jali"
                ? ChorasKhanaChinaJaliSizeOptions
                : [];

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Calculate new totals from batches
    const totalQty = batches.reduce(
      (sum, b) => sum + Number(b.quantity || 0),
      0
    );
    const totalWeight = batches.reduce(
      (sum, b) => sum + Number(b.weight || 0),
      0
    );
    const totalLengthFt = batches.reduce(
      (sum, b) => sum + Number(b.lengthFt || 0),
      0
    );

    const updated: any = {
      type: itemType.trim().toLowerCase(),
      name: item.name,
      color,
      guage:
        guage !== undefined && guage !== null ? guage.toString().trim() : "",
      size: size !== undefined && size !== null ? size.toString().trim() : "",
      pipeType,
      number,
      date: new Date().toISOString(),
      batches,
      quantity: totalQty,
      weight: totalWeight,
      lengthFt: totalLengthFt,
    };

    // ...rest of your price logic
    if (isPipe || isJali) {
      updated.pricePerFt = Number(priceField);
      updated.ft = Number(ft);
    }
    if (isPerKg) {
      updated.pricePerKg = Number(priceField);
      updated.weight = Number(weight);
    }
    if (isHardware) {
      updated.pricePerUnit = Number(priceField);
      updated.weight = Number(weight);
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const result = await res.json();
      if (result.success) router.push("/Inventory");
      else console.error("Update failed:", result.error);
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center gap-[50px] px-[75px] py-[35px]">
      <span className="flex justify-between w-full">
        <h1 className="text-xl font-bold text-white">Your Inventory</h1>
        <p className="text-sm text-white">{today}</p>
      </span>

      <div className="flex justify-center items-start py-10 px-4">
        <div
          className="w-full max-w-4xl rounded-xl shadow-md p-10"
          style={{ backgroundColor: "var(--color-cardBg)" }}
        >
          <h1 className="text-2xl font-bold mb-8 text-center text-white">
            Edit Item
          </h1>

          <form
            onSubmit={handleUpdate}
            className="grid grid-cols-2 gap-6 text-white"
          >
            {/* Item Type */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm">Item Type</label>
              <select
                name="type"
                value={itemType}
                onChange={(e) => {
                  setItemType(e.target.value);
                  setPipeType("");
                  setNumber("");
                  setSize("");
                  setGuage("");
                }}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-fieldBg)",
                  color: "white",
                  borderColor: "transparent",
                }}
              >
                {[
                  "Pipe",
                  "Hardware",
                  "Angle",
                  "Patti",
                  "Sarrya",
                  "Jali",
                  "Tanka Barfi Jali",
                  "Choras Khana China Jali",
                  "Diamond Chadar",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Pipe Type */}
            {(itemType === "Pipe" || itemType === "Sarrya") && (
              <div className="flex flex-col">
                <label className="mb-1 text-sm">Pipe Type</label>
                <select
                  value={pipeType}
                  onChange={(e) => {
                    setPipeType(e.target.value);
                    setSize(""); // reset size when pipe type changes
                  }}
                  className="rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--color-fieldBg)",
                    color: "white",
                    borderColor: "transparent",
                  }}
                >
                  <option value="">Select type</option>
                  <option value="Round">Round</option>
                  <option value="Square">Square</option>
                </select>
              </div>
            )}

            {/* Number (for Jali / Tanka Barfi Jali) */}
            {isJali && (
              <div className="flex flex-col">
                <label className="mb-1 text-sm">Number</label>
                <select
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--color-fieldBg)",
                    color: "white",
                    borderColor: "transparent",
                  }}
                >
                  <option value="">Select number</option>
                  {JaliNumberOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Size */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm">Size</label>
              <select
                name="size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-fieldBg)",
                  borderColor: "transparent",
                  color: "white",
                }}
              >
                <option value="">Select size</option>
                {sizeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Gauge (Pipe only) */}
            {itemType === "Pipe" && (
              <div className="flex flex-col">
                <label className="mb-1 text-sm">Gauge</label>
                <select
                  name="guage"
                  value={guage}
                  onChange={(e) => setGuage(e.target.value)}
                  className="rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--color-fieldBg)",
                    borderColor: "transparent",
                    color: "white",
                  }}
                >
                  <option value="">Select Guage</option>
                  {GuageOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Color */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm">Color</label>
              <input
                type="text"
                name="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-fieldBg)",
                  borderColor: "transparent",
                  color: "white",
                }}
              />
            </div>

            {/* Quantity (live sum) */}
            {/* <div className="flex flex-col">
              <label className="mb-1 text-sm">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={quantity}
                readOnly
                className="rounded-lg px-3 py-2 text-sm outline-none bg-gray-700 text-gray-300"
                style={{
                  borderColor: "transparent",
                }}
              />
            </div> */}

            {isDiamondChadar ? (
              <div className="flex flex-col">
                <label className="mb-1 text-sm">Weight (KG)</label>
                <input
                  type="number"
                  name="weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="rounded-lg px-3 py-2 text-sm outline-none bg-gray-700 text-gray-300"
                  style={{
                    borderColor: "transparent",
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col">
                <label className="mb-1 text-sm">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={quantity}
                  readOnly
                  className="rounded-lg px-3 py-2 text-sm outline-none bg-gray-700 text-gray-300"
                  style={{
                    borderColor: "transparent",
                  }}
                />
              </div>
            )}
            {/* Weight or Ft based fields */}
            {(isPipe || isJali) && (
              <>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm">Price per Ft (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceField}
                    onChange={(e) => setPriceField(e.target.value)}
                    onInput={handleDecimalInput}
                    className="rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      backgroundColor: "var(--color-fieldBg)",
                      color: "white",
                      borderColor: "transparent",
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm">Length (Ft)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ft}
                    readOnly
                    className="rounded-lg px-3 py-2 text-sm outline-none bg-gray-700 text-gray-300"
                    style={{
                      borderColor: "transparent",
                    }}
                  />
                </div>
              </>
            )}

            {(isHardware || isPerKg) && (
              <>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm">Weight (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    onInput={handleDecimalInput}
                    className="rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      backgroundColor: "var(--color-fieldBg)",
                      borderColor: "transparent",
                      color: "white",
                    }}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 text-sm">
                    {isHardware ? "Price per Unit (PKR)" : "Price per Kg (PKR)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceField}
                    onChange={(e) => setPriceField(e.target.value)}
                    onInput={handleDecimalInput}
                    className="rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      backgroundColor: "var(--color-fieldBg)",
                      borderColor: "transparent",
                      color: "white",
                    }}
                  />
                </div>
              </>
            )}

            <div className="col-span-2 mt-6 flex justify-center">
              <button
                type="submit"
                disabled={saving}
                className="font-semibold px-6 py-2 rounded-lg transition-all ease-in-out"
                style={{
                  backgroundColor: saving
                    ? "var(--color-IconBg)"
                    : "var(--color-iconColor)",
                  color: "white",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
            {batches.length > 0 && (
              <div className="col-span-2">
                <h2 className="text-lg font-bold mb-2">Batches</h2>
                {/* Labels Row */}
                <div
                  className={`grid gap-2 mb-2 px-1 ${isPipe
                    ? "grid-cols-3"
                    : isHardware && isPerKg
                      ? "grid-cols-2"
                      : isHardware && isPerUnit
                        ? "grid-cols-2"
                        : isDiamondChadar
                          ? "grid-cols-2"
                          : isPerFt
                            ? "grid-cols-2"
                            : "grid-cols-1"
                    }`}
                >
                  {isPipe && (
                    <>
                      <label className="text-xs text-gray-300">Qty</label>
                      <label className="text-xs text-gray-300">LengthFt</label>
                      <label className="text-xs text-gray-300">Price/Ft</label>
                    </>
                  )}
                  {isHardware && isPerKg && (
                    <>
                      <label className="text-xs text-gray-300">Weight</label>
                      <label className="text-xs text-gray-300">Price/Kg</label>
                    </>
                  )}
                  {isHardware && isPerUnit && (
                    <>
                      <label className="text-xs text-gray-300">Qty</label>
                      <label className="text-xs text-gray-300">
                        Price/Unit
                      </label>
                    </>
                  )}
                  {!isPipe && !isHardware && isPerFt && (
                    <>
                      <label className="text-xs text-gray-300">LengthFt</label>
                      <label className="text-xs text-gray-300">Price/Ft</label>
                    </>
                  )}
                  {isDiamondChadar && (
                    <>
                      <label className="text-xs text-gray-300">Weight</label>
                      <label className="text-xs text-gray-300">Price/Kg</label>
                    </>
                  )}
                </div>
                {/* Batch Inputs */}
                <div className="space-y-4">
                  {batches.map((batch, idx) => (
                    <div
                      key={idx}
                      className={`grid gap-2 bg-fieldBg p-3 rounded-lg ${isPipe
                        ? "grid-cols-3"
                        : isHardware && isPerKg
                          ? "grid-cols-2"
                          : isHardware && isPerUnit
                            ? "grid-cols-2"
                            : isPerFt
                              ? "grid-cols-2"
                              : "grid-cols-1"
                        }`}
                    >
                      {isPipe && (
                        <>
                          <input
                            type="number"
                            value={batch.quantity ?? ""}
                            onChange={(e) =>
                              handleBatchChange(idx, "quantity", e.target.value)
                            }
                            placeholder="Qty"
                            className="rounded px-2 py-1 bg-BgColor"
                          />
                          <input
                            type="number"
                            value={batch.lengthFt ?? ""}
                            onChange={(e) =>
                              handleBatchChange(idx, "lengthFt", e.target.value)
                            }
                            placeholder="LengthFt"
                            className="rounded px-2 py-1 bg-BgColor"
                          />
                          <input
                            type="number"
                            value={batch.pricePerFt ?? ""}
                            onChange={(e) =>
                              handleBatchChange(
                                idx,
                                "pricePerFt",
                                e.target.value
                              )
                            }
                            placeholder="Price/Ft"
                            className="rounded px-2 py-1 bg-BgColor"
                          />
                        </>
                      )}
                      {isHardware && isPerKg && (
                        <>
                          <input
                            type="number"
                            value={batch.weight ?? ""}
                            onChange={(e) =>
                              handleBatchChange(idx, "weight", e.target.value)
                            }
                            placeholder="Weight"
                            className="rounded px-2 py-1 bg-BgColor"
                          />
                          <input
                            type="number"
                            value={batch.pricePerKg ?? ""}
                            onChange={(e) =>
                              handleBatchChange(
                                idx,
                                "pricePerKg",
                                e.target.value
                              )
                            }
                            placeholder="Price/Kg"
                            className="rounded px-2 py-1 bg-BgColor"
                          />
                        </>
                      )}
                      {isHardware && isPerUnit && (
                        <>
                          <input
                            type="number"
                            value={batch.quantity ?? ""}
                            onChange={(e) =>
                              handleBatchChange(idx, "quantity", e.target.value)
                            }
                            placeholder="Qty"
                            className="rounded px-2 py-1 bg-BgColor"
                          />
                          <input
                            type="number"
                            value={batch.pricePerUnit ?? ""}
                            onChange={(e) =>
                              handleBatchChange(
                                idx,
                                "pricePerUnit",
                                e.target.value
                              )
                            }
                            placeholder="Price/Unit"
                            className="rounded px-2 py-1 bg-BgColor"
                          />
                        </>
                      )}
                      {!isPipe && !isHardware && isPerFt && (
                        <>
                          <input
                            type="number"
                            value={batch.lengthFt ?? ""}
                            onChange={(e) =>
                              handleBatchChange(idx, "lengthFt", e.target.value)
                            }
                            placeholder="LengthFt"
                            className="rounded px-2 py-1 bg-BgColor"
                          />
                          <input
                            type="number"
                            value={batch.pricePerFt ?? ""}
                            onChange={(e) =>
                              handleBatchChange(
                                idx,
                                "pricePerFt",
                                e.target.value
                              )
                            }
                            placeholder="Price/Ft"
                            className="rounded px-2 py-1 bg-BgColor"
                          />
                        </>
                      )}
                      {isDiamondChadar && (
                        <>
                          <input
                            type="number"
                            value={batch.weight ?? ""}
                            onChange={(e) =>
                              handleBatchChange(idx, "weight", e.target.value)
                            }
                            placeholder="Weight"
                            className="rounded px-2 py-1 bg-BgColor"
                          />
                          <input
                            type="number"
                            value={batch.pricePerKg ?? ""}
                            onChange={(e) =>
                              handleBatchChange(idx, "pricePerKg", e.target.value)
                            }
                            placeholder="Price/Kg"
                            className="rounded px-2 py-1 bg-BgColor"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
