"use client";

import { inventoryGridCols } from "@/layoutConfig";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";

interface Batch {
  quantity?: number;
  weight?: number;
  lengthFt?: number;
  pricePerUnit?: number | null;
  pricePerKg?: number | null;
  pricePerFt?: number | null;
  date?: string;
}

interface InventoryItemsProps {
  _id: string;
  name?: string;
  type: string;
  color?: string | null;
  guage?: number | string | null;
  size?: number | string | null;
  number?: number | string | null;
  lengthFt?: number | string | null;
  weight?: number | string | null;
  quantity?: number | string | null;
  pricePerFt?: number | string | null;
  pricePerKg?: number | string | null;
  pricePerUnit?: number | string | null;
  amount?: number;
  date: string;
  onDelete: (id: string) => void;
  batches?: Batch[];
}

export default function InventoryItem({
  _id,
  name,
  type,
  color,
  guage,
  size,
  number,
  lengthFt,
  weight,
  quantity,
  pricePerFt,
  pricePerKg,
  pricePerUnit,
  amount,
  date,
  onDelete,
  batches = [],
}: InventoryItemsProps) {
  const router = useRouter();
  const handleEditItem = () => router.push(`/Inventory/edit/${_id}`);

  const renderValue = (value: any, suffix?: string, allowZero = false) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (!allowZero && Number(value) === 0)
    )
      return <span className="text-gray-500">N/A</span>;

    if (typeof value === "string" && /[a-zA-Zx/]/.test(value)) {
      return value;
    }

    const num = parseFloat(value);
    if (!isNaN(num)) {
      let truncated = Math.trunc(num * 100) / 100;
      const formatted =
        truncated % 1 === 0 ? truncated.toString() : truncated.toString();
      return suffix ? `${formatted} ${suffix}` : formatted;
    }

    return value;
  };

  const lowerType = type.toLowerCase();

  // ✅ treat diamond chadar and tanka barfi jali properly
  const isPipe =
    lowerType === "pipe" ||
    lowerType === "jali" ||
    lowerType === "tanka barfi jali";
  const isHardware = lowerType === "hardware";
  const isDiamondChadar = lowerType === "diamond chadar";
  const hasQuantityInDB =
    quantity !== undefined &&
    quantity !== null &&
    quantity !== "" &&
    !Number.isNaN(Number(quantity));
  const isJaliOnly =
    lowerType === "jali" || lowerType === "tanka barfi jali";


  const isPerKgItem =
    [
      "angle",
      "patti",
      "sarrya",
      "diamond chadar",
      "tanka barfi jali",
      "choras khana china jali",
    ].includes(lowerType) ||
    (!!pricePerKg && !pricePerUnit);

  const isHardwarePerKg = isHardware && !!pricePerKg && !pricePerUnit;
  const isHardwarePerUnit = isHardware && !!pricePerUnit && !pricePerKg;
  const isHardwarePerFt =
    isHardware && !!pricePerFt && !pricePerKg && !pricePerUnit;

  const getDisplayName = () => {
    if (name && name.trim() && name.toLowerCase() !== "unnamed") return name;

    let prefix = "";
    if (isPipe) prefix = "P";
    else if (lowerType === "angle") prefix = "AN";
    else if (lowerType === "patti") prefix = "PT";
    else if (lowerType === "sarrya") prefix = "SR";
    else if (isDiamondChadar) prefix = "DC";
    else if (lowerType === "jal i") prefix = "JL";
    else if (lowerType === "tanka barfi jali") prefix = "TBJ";
    else if (lowerType === "choras khana china jali") prefix = "CKJ";
    else if (lowerType === "plate") prefix = "PL";
    else if (lowerType === "sheet") prefix = "SH";
    else if (lowerType === "rod") prefix = "RD";
    else if (lowerType === "chowkat") prefix = "CH";
    else return name || "unnamed";

    const idSuffix = _id.slice(-4);
    return `${prefix}${idSuffix.toUpperCase()}`;
  };

  // --- FIFO BATCH LOGIC START ---
  // Get total available quantity from all batches
  const totalQty = Array.isArray(batches)
    ? batches.reduce((sum, b) => sum + (b.quantity || 0), 0)
    : Number(quantity) || 0;

  // Get total weight from all batches (for per-kg items)
  const totalWeight = Array.isArray(batches)
    ? batches.reduce((sum, b) => sum + (b.weight || 0), 0)
    : Number(weight) || 0;

  // Get total lengthFt from all batches (for per-ft items)
  const totalLengthFt = Array.isArray(batches)
    ? batches.reduce((sum, b) => sum + (b.lengthFt || 0), 0)
    : Number(lengthFt) || 0;

  // Get the first batch with quantity > 0 for current price
  const currentBatch = Array.isArray(batches)
    ? batches.find((b) => b.quantity && b.quantity > 0)
    : null;

  const currentPricePerUnit = currentBatch?.pricePerUnit ?? pricePerUnit;
  const currentPricePerKg = currentBatch?.pricePerKg ?? pricePerKg;
  const currentPricePerFt = currentBatch?.pricePerFt ?? pricePerFt;

  // Total amount (sum of all batch amounts)
  const totalAmount = Array.isArray(batches)
    ? batches.reduce(
      (sum, b) =>
        sum +
        (b.quantity || 0) * (b.pricePerUnit || 0) +
        (b.weight || 0) * (b.pricePerKg || 0) +
        (b.lengthFt || 0) * (b.pricePerFt || 0),
      0
    )
    : amount;

  // --- FIFO BATCH LOGIC END ---

  const length = Number(lengthFt) || 0;
  const weightNum = Number(weight) || 0;
  const qty = Number(quantity) || 0;
  const priceFt = Number(pricePerFt) || 0;
  const priceKg = Number(pricePerKg) || 0;
  const priceUnit = Number(pricePerUnit) || 0;

  const computedAmount =
    isPipe || isHardwarePerFt
      ? length * priceFt
      : isDiamondChadar
        ? weightNum * priceKg
        : isPerKgItem
          ? weightNum * priceKg
          : qty * priceUnit;

  return (
    <div
      className={`${inventoryGridCols} px-[30px] xl-only:px-[80px] py-[20px] border-b border-gray-800 text-xs items-center bg-fieldBg text-white xl-only:px-[50px] xl-only:py-[15px] xl-only:text-[14px]`}
    >
      {/* Item Name */}
      <p>{getDisplayName()}</p>

      {/* Type */}
      <p>{renderValue(type)}</p>

      {/* Size */}
      <p>{String(size)}</p>

      {/* "Number" Column */}
      <p>{renderValue(number)}</p>

      {/* Color */}
      <p>{renderValue(color)}</p>

      {/* Guage */}
      <p>{renderValue(guage)}</p>

      {/* Length (FT) – Pipe, Jali & Tanka Barfi Jali */}
      <p>
        {isPipe || isHardwarePerFt ? (
          totalLengthFt > 0 ? (
            renderValue(totalLengthFt, "FT")
          ) : (
            <span className="text-red-500 font-semibold">Out of Stock</span>
          )
        ) : (
          <span className="text-gray-500">N/A</span>
        )}
      </p>

      {/* Weight (KG) – per‑kg items and Diamond Chadar hardware per‑kg */}
      <p>
        {isPerKgItem || isHardwarePerKg || isDiamondChadar ? (
          totalWeight > 0 ? (
            renderValue(totalWeight, "KG")
          ) : (
            <span className="text-red-500 font-semibold">Out of Stock</span>
          )
        ) : (
          <span className="text-gray-500">N/A</span>
        )}
      </p>

      {/* Quantity – show total from batches */}
      {/* <p>
        {lowerType === "jali" ||
          lowerType === "tanka barfi jali" ||
          isDiamondChadar ||
          isPerKgItem ||
          isHardwarePerKg ||
          isPipe ||
          isHardwarePerFt ? (
          <span className="text-gray-500">N/A</span>
        ) : totalQty > 0 ? (
          renderValue(totalQty)
        ) : (
          <span className="text-red-500 font-semibold">Out of Stock</span>
        )}
      </p> */}
      <p>
        {isJaliOnly || isHardwarePerKg || isHardwarePerFt || isDiamondChadar || lowerType === "chowkat" ? (
          <span className="text-gray-500">N/A</span>
        ) : hasQuantityInDB ? (
          totalQty > 0 ? (
            renderValue(totalQty)
          ) : (
            <span className="text-red-500 font-semibold">Out of Stock</span>
          )
        ) : (
          <span className="text-gray-500">N/A</span>
        )}
      </p>


      {/* Price / Ft – Pipe, Jali & Tanka Barfi Jali */}
      <p>
        {isPipe || isHardwarePerFt ? (
          renderValue(currentPricePerFt, "PKR")
        ) : (
          <span className="text-gray-500">N/A</span>
        )}
      </p>

      {/* Price / Kg – per‑kg items and Diamond Chadar */}
      <p>
        {isPerKgItem || isHardwarePerKg || isDiamondChadar ? (
          renderValue(currentPricePerKg, "PKR")
        ) : (
          <span className="text-gray-500">N/A</span>
        )}
      </p>

      {/* Price / Unit – hardware per‑unit */}
      <p>
        {isHardwarePerUnit ? (
          renderValue(currentPricePerUnit, "PKR")
        ) : (
          <span className="text-gray-500">N/A</span>
        )}
      </p>

      {/* Amount – show total from batches */}
      <p>
        {totalAmount && totalAmount > 0
          ? totalAmount.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })
          : computedAmount > 0
            ? computedAmount.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })
            : "N/A"}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        {/* <button
          onClick={handleEditItem}
          className="text-blue-400 hover:text-blue-500"
        >
          <FontAwesomeIcon icon={faPen} />
        </button> */}
        <button
          onClick={() => onDelete(_id)}
          className="text-red-400 hover:text-red-500"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>

      {/* Date */}
      <p>{new Date(date).toLocaleDateString()}</p>
    </div>
  );
}
