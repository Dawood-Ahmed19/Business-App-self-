"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faNoteSticky } from "@fortawesome/free-solid-svg-icons";


export default function TotalInvestment() {
    const [total, setTotal] = useState(0);

    useEffect(() => {
        async function fetchData() {
            const res = await fetch("/api/inventory");
            const json = await res.json();

            if (!json.success) return;

            let grandTotal = 0;

            for (const item of json.items) {
                const qty = Number(item.quantity) || 0;
                const ft = Number(item.lengthFt || item.ft) || 0;
                const kg = Number(item.weight) || 0;

                const pricePerUnit = Number(item.pricePerUnit) || 0;
                const pricePerFt = Number(item.pricePerFt) || 0;
                const pricePerKg = Number(item.pricePerKg) || 0;

                grandTotal +=
                    qty * pricePerUnit +
                    ft * pricePerFt +
                    kg * pricePerKg;
            }

            setTotal(Math.round(grandTotal));
        }

        fetchData();
    }, []);

    return (
        <div className="bg-cardBg rounded-lg w-[220px] h-[100px] flex items-center justify-center gap-4">
            <div className="bg-blue-500/20 p-3 rounded-lg">
                <FontAwesomeIcon
                    className="text-iconColor text-xl"
                    icon={faNoteSticky}
                />
            </div>

            <div className="text-left">
                <p className="text-sm text-gray-300">Total Investment</p>
                <p className="text-xl font-bold text-white">
                    {total.toLocaleString("en-US")}
                </p>
            </div>
        </div>
    );
}