"use client";

import { useState, useEffect } from "react";
import FormField from "../FormField/page";
import { useRouter } from "next/navigation";

const GuageOptions = ["14", "16", "18", "19", "20", "21", "22", "23", "24"];
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

const angleSizeOptions = [
  `1/2x1/16`,
  `3/4x1/16`,
  `1x1/16`,
  `1x1/8`,
  `3/4x1/8`,
  `1-1/4x1/16`,
  `1-1/4x1/8`,
  `1-1/4x3/16`,
  `1-1/2x3/16`,
  `2x1/8`,
];

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

const PER_KG_TYPES = ["Angle", "Patti", "Sarrya", "Choras Khana China Jali"];

export default function ItemCard({ initialData }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [hardwareItems, setHardwareItems] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/hardware-items");
        const data = await res.json();
        if (data.success) setHardwareItems(data.items);
      } catch (err) {
        console.error("Error fetching hardware items", err);
      }
    })();
  }, []);

  const [formData, setFormData] = useState({
    id: "",
    itemType: "",
    itemName: "",
    pipeType: "",
    itemSize: "",
    number: "",
    guage: "",
    price: "",
    ft: "",
    weight: "",
    stock: "",
    color: "",
  });

  useEffect(() => {
    if (!initialData) return;
    let priceValue = "";
    if (initialData.type?.toLowerCase() === "pipe" && initialData.pricePerFt) {
      priceValue = String(initialData.pricePerFt);
    } else if (
      initialData.type?.toLowerCase() === "hardware" &&
      initialData.pricePerUnit
    ) {
      priceValue = String(initialData.pricePerUnit);
    } else if (initialData.pricePerKg) {
      priceValue = String(initialData.pricePerKg);
    }

    setFormData({
      id: initialData.id,
      itemType: initialData.type ?? "",
      pipeType: initialData.pipeType ?? "",
      itemName: initialData.name ?? "",
      itemSize: initialData.size ?? "",
      number: initialData.number ?? "",
      guage: initialData.guage != null ? String(initialData.guage) : "",
      price: priceValue,
      ft:
        initialData.type?.toLowerCase() === "pipe" ||
          initialData.type === "Jali" ||
          initialData.type === "Tanka Barfi Jali"
          ? String(initialData.ft ?? "")
          : "",
      stock: String(initialData.quantity ?? ""),
      weight: String(initialData.weight ?? ""),
      color: initialData.color ?? "",
    });
  }, [initialData]);

  const selectedHardware = hardwareItems.find(
    (item) => item.name === formData.itemName
  );
  const hardwareNameOptions = hardwareItems.map((h) => h.name);

  const hwPriceType =
    selectedHardware?.priceType?.toString().toLowerCase() || "unit";

  const hardwareHasSizes = Array.isArray(selectedHardware?.sizes)
    ? selectedHardware?.sizes.length > 0
    : !!(
      selectedHardware?.sizes?.general?.length ||
      selectedHardware?.sizes?.Round?.length ||
      selectedHardware?.sizes?.Square?.length
    );

  let sizeOptions: string[] = [];
  if (formData.itemType === "Hardware" && selectedHardware) {
    if (selectedHardware.hasPipeTypes) {
      const pipeKey = formData.pipeType?.trim();
      if (pipeKey && typeof selectedHardware.sizes === "object") {
        sizeOptions =
          selectedHardware.sizes[pipeKey] ||
          selectedHardware.sizes[pipeKey.toLowerCase()] ||
          [];
      }
    } else if (Array.isArray(selectedHardware.sizes)) {
      sizeOptions = selectedHardware.sizes;
    } else if (selectedHardware.sizes?.general) {
      sizeOptions = selectedHardware.sizes.general;
    }
  } else if (formData.itemType === "Angle") {
    sizeOptions = AngleSizeOptions;
  } else if (formData.itemType === "Patti") {
    sizeOptions = PattiSizeOptions;
  } else if (formData.itemType === "Diamond Chadar") {
    sizeOptions = []; // no item size for Diamond Chadar
  } else if (
    formData.itemType === "Jali" ||
    formData.itemType === "Tanka Barfi Jali"
  ) {
    sizeOptions = JaliSizeOptions;
  } else if (formData.itemType === "Choras Khana China Jali") {
    sizeOptions = ChorasKhanaChinaJaliSizeOptions;
  } else if (formData.itemType === "Pipe") {
    sizeOptions =
      formData.pipeType === "Round"
        ? RoundItemSizeOptions
        : formData.pipeType === "Square"
          ? SquareItemSizeOptions
          : [];
  } else if (formData.itemType === "Sarrya") {
    sizeOptions =
      formData.pipeType === "Round"
        ? RoundSarryaSize
        : formData.pipeType === "Square"
          ? SquareSarryaSize
          : [];
  }

  const colorOptions = selectedHardware?.colors ?? [];

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const type = formData.itemType;
    const isPipe = type === "Pipe";
    const isJali = type === "Jali";
    const isTankaBarfiJali = type === "Tanka Barfi Jali";
    const isHardware = type === "Hardware";
    const isPerKgItem = PER_KG_TYPES.includes(type);

    if (
      !type ||
      ((isPipe || type === "Sarrya") && !formData.pipeType) ||
      (isHardware && !formData.itemName) ||
      ((hardwareHasSizes || isPipe || isJali || isTankaBarfiJali) &&
        !formData.itemSize) ||
      formData.price === "" ||
      ((isPipe || isJali || isTankaBarfiJali) && !formData.price)
    ) {
      alert("Please fill all required fields before submitting.");
      return;
    }

    const newItem: any = {
      type: type.toLowerCase(),
      pipeType: formData.pipeType,
      size: formData.itemSize,
      guage: formData.guage,
      color: formData.color,
      number: String(formData.number).trim(),
      date: new Date().toISOString(),
    };

    const safeNumber = (val: string) => {
      const n = parseFloat(val);
      return isNaN(n) ? 0 : n;
    };

    if (isHardware) {
      newItem.name = formData.itemName.trim();
      if (hwPriceType === "kg") {
        newItem.pricePerKg = safeNumber(formData.price);
        newItem.weight = safeNumber(formData.weight);
      } else if (hwPriceType === "ft") {
        newItem.pricePerFt = safeNumber(formData.price);
        newItem.lengthFt = safeNumber(formData.ft);
      } else {
        newItem.pricePerUnit = safeNumber(formData.price);
        newItem.quantity = safeNumber(formData.stock);
      }
    }
    if (isPipe || isJali || isTankaBarfiJali) {
      newItem.pricePerFt = safeNumber(formData.price);
      newItem.ft = safeNumber(formData.ft);
      newItem.quantity = safeNumber(formData.stock);
    }

    if (isPerKgItem) {
      newItem.pricePerKg = safeNumber(formData.price);
      newItem.weight = safeNumber(formData.weight);
      newItem.quantity = safeNumber(formData.stock);
    }

    if (type === "Diamond Chadar") {
      newItem.pricePerKg = safeNumber(formData.price);
      newItem.weight = safeNumber(formData.weight);
    }

    if (type === "Chowkat") {
      newItem.pricePerKg = safeNumber(formData.price);
      newItem.weight = safeNumber(formData.weight);
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        initialData ? `/api/items/${initialData.id}` : "/api/items",
        {
          method: initialData ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem),
        }
      );

      if (!res.ok) throw new Error("Failed to save item");

      alert("Item saved successfully ✅");
      router.push("/Inventory");
    } catch (err) {
      console.error("Error saving item:", err);
      alert("Could not save item. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fields: any[] = [
    {
      label: "Item Type",
      value: formData.itemType,
      type: "select",
      options: [
        "Pipe",
        "Hardware",
        "Angle",
        "Patti",
        "Sarrya",
        "Jali",
        "Diamond Chadar",
        "Chowkat",
      ],
      onChange: (value: string) =>
        setFormData({
          ...formData,
          itemType: value,
          pipeType: "",
          itemSize: "",
          number: "",
          guage: "",
          itemName: "",
          color: "",
          ft: "",
          stock: "",
          weight: "",
          price: "",
        }),
    },

    ...(formData.itemType === "Hardware"
      ? [
        {
          label: "Item Name",
          value: formData.itemName,
          type: "select",
          options: hardwareNameOptions,
          onChange: (value: string) =>
            setFormData({ ...formData, itemName: value }),
        },
        ...(hardwareHasSizes
          ? [
            {
              label: "Item Size",
              value: formData.itemSize,
              type: "select",
              options: sizeOptions,
              onChange: (value: string) =>
                setFormData({ ...formData, itemSize: value }),
            },
          ]
          : []),
        ...(hwPriceType === "kg"
          ? [
            {
              label: "Weight (KG)",
              value: formData.weight,
              placeholder: "Enter total weight in KG",
              onChange: (value: string) =>
                setFormData({ ...formData, weight: value }),
            },
            {
              label: "Price Per KG (PKR)",
              value: formData.price,
              type: "number",
              step: "0.0001",
              placeholder: "Enter price per KG",
              onChange: (value: string) =>
                setFormData({ ...formData, price: value }),
            },
          ]
          : hwPriceType === "ft"
            ? [
              {
                label: "Price Per Ft (PKR)",
                value: formData.price,
                type: "number",
                step: "0.0001",
                placeholder: "Enter price per Ft",
                onChange: (value: string) =>
                  setFormData({ ...formData, price: value }),
              },
              {
                label: "Total Ft",
                value: formData.ft,
                placeholder: "Enter total length in Ft",
                onChange: (value: string) =>
                  setFormData({ ...formData, ft: value }),
              },
            ]
            : [
              {
                label: "Price Per Unit (PKR)",
                value: formData.price,
                type: "number",
                step: "0.0001",
                placeholder: "Enter per-item price",
                onChange: (value: string) =>
                  setFormData({ ...formData, price: value }),
              },
              {
                label: "Total Stock",
                value: formData.stock,
                placeholder: "Enter total stock",
                onChange: (value: string) =>
                  setFormData({ ...formData, stock: value }),
              },
            ]),
      ]
      : []),

    ...(formData.itemType === "Pipe" || formData.itemType === "Sarrya"
      ? [
        {
          label: "Pipe Type",
          value: formData.pipeType,
          type: "select",
          options: ["Round", "Square"],
          onChange: (value: string) =>
            setFormData({ ...formData, pipeType: value, itemSize: "" }),
        },
      ]
      : []),

    ...(formData.itemType === "Pipe"
      ? [
        {
          label: "Item Size",
          value: formData.itemSize,
          type: "select",
          options: sizeOptions,
          onChange: (value: string) =>
            setFormData({ ...formData, itemSize: value }),
        },
        {
          label: "Guage",
          value: formData.guage,
          type: "select",
          options: GuageOptions,
          onChange: (value: string) =>
            setFormData({ ...formData, guage: value }),
        },
        {
          label: "Price Per Ft (PKR)",
          value: formData.price,
          type: "number",
          step: "0.0001",
          placeholder: "Enter price per Ft",
          onChange: (value: string) =>
            setFormData({ ...formData, price: value }),
        },
        {
          label: "Ft",
          value: formData.ft,
          placeholder: "Enter Pipe length in Ft",
          onChange: (value: string) =>
            setFormData({ ...formData, ft: value }),
        },
        {
          label: "Total Stock",
          value: formData.stock,
          placeholder: "Enter total stock",
          onChange: (value: string) =>
            setFormData({ ...formData, stock: value }),
        },
      ]
      : []),

    ...(formData.itemType === "Angle"
      ? [
        {
          label: "Item Size",
          value: formData.itemSize,
          type: "select",
          options: angleSizeOptions,
          onChange: (value: string) =>
            setFormData({ ...formData, itemSize: value }),
        },
      ]
      : []),

    ...(formData.itemType === "Diamond Chadar"
      ? [
        {
          label: "Price Per KG (PKR)",
          value: formData.price,
          type: "number",
          step: "0.0001",
          placeholder: "Enter price per KG",
          onChange: (value: string) =>
            setFormData({ ...formData, price: value }),
        },
        {
          label: "Weight (KG)",
          value: formData.weight,
          placeholder: "Enter total weight in KG",
          onChange: (value: string) =>
            setFormData({ ...formData, weight: value }),
        },
      ]
      : []),

    ...(formData.itemType === "Chowkat"
      ? [
        {
          label: "Guage",
          value: formData.guage,
          type: "select",
          options: GuageOptions,
          onChange: (value: string) =>
            setFormData({ ...formData, guage: value }),
        },
        {
          label: "Price Per KG (PKR)",
          value: formData.price,
          type: "number",
          step: "0.0001",
          placeholder: "Enter price per KG",
          onChange: (value: string) =>
            setFormData({ ...formData, price: value }),
        },
        {
          label: "Weight (KG)",
          value: formData.weight,
          placeholder: "Enter total weight in KG",
          onChange: (value: string) =>
            setFormData({ ...formData, weight: value }),
        },
      ]
      : []),

    ...(formData.itemType === "Patti"
      ? [
        {
          label: "Item Size",
          value: formData.itemSize,
          type: "select",
          options: PattiSizeOptions,
          onChange: (value: string) =>
            setFormData({ ...formData, itemSize: value }),
        },
      ]
      : []),

    ...(formData.itemType === "Sarrya"
      ? [
        {
          label: "Item Size",
          value: formData.itemSize,
          type: "select",
          options:
            formData.pipeType === "Round"
              ? RoundSarryaSize
              : formData.pipeType === "Square"
                ? SquareSarryaSize
                : [],
          onChange: (value: string) =>
            setFormData({ ...formData, itemSize: value }),
        },
      ]
      : []),

    ...(formData.itemType === "Jali" || formData.itemType === "Tanka Barfi Jali"
      ? [
        {
          label: "Number",
          value: formData.number,
          type: "select",
          options: JaliNumberOptions,
          onChange: (value: string) =>
            setFormData({ ...formData, number: value }),
        },
        {
          label: "Item Size",
          value: formData.itemSize,
          type: "select",
          options: JaliSizeOptions,
          onChange: (value: string) =>
            setFormData({ ...formData, itemSize: value }),
        },
        {
          label: "Price Per Ft (PKR)",
          value: formData.price,
          type: "number",
          step: "0.0001",
          placeholder: "Enter price per Ft",
          onChange: (value: string) =>
            setFormData({ ...formData, price: value }),
        },
        {
          label: "Ft",
          value: formData.ft,
          placeholder: "Enter length in Ft",
          onChange: (value: string) =>
            setFormData({ ...formData, ft: value }),
        },
      ]
      : []),

    ...(colorOptions.length
      ? [
        {
          label: "Color",
          value: formData.color,
          type: "select",
          options: colorOptions,
          onChange: (value: string) =>
            setFormData({ ...formData, color: value }),
        },
      ]
      : []),

    ...(PER_KG_TYPES.includes(formData.itemType)
      ? [
        {
          label: "Weight (KG)",
          value: formData.weight,
          placeholder: "Enter total weight in KG",
          onChange: (value: string) =>
            setFormData({ ...formData, weight: value }),
        },
        {
          label: "Price Per KG (PKR)",
          value: formData.price,
          type: "number",
          step: "0.0001",
          placeholder: "Enter price per KG",
          onChange: (value: string) =>
            setFormData({ ...formData, price: value }),
        },

        ...(![
          "Angle",
          "Patti",
          "Sarrya",
          "Diamond Chadar",
          "Chowkat",
        ].includes(formData.itemType)
          ? [
            {
              label: "Total Stock",
              value: formData.stock,
              placeholder: "Enter total stock",
              onChange: (value: string) =>
                setFormData({ ...formData, stock: value }),
            },
          ]
          : []),
      ]
      : []),
  ];

  return (
    <span className="bg-cardBg px-12 py-10 h-full w-full max-w-[715px] rounded-xl flex flex-col justify-between mx-auto">
      <h1 className="font-bold text-base text-white">
        {initialData ? "Edit Item" : "Add Item"}
      </h1>

      <div className="grid grid-cols-2 gap-6 mt-4">
        {fields.map((field) => (
          <FormField key={field.label} {...field} />
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          {isLoading
            ? initialData
              ? "Updating..."
              : "Adding..."
            : initialData
              ? "Update Item"
              : "Add Item"}
        </button>
      </div>
    </span>
  );
}
