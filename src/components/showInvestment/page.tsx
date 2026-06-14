"use client";
import { useEffect, useState } from "react";

interface InvestmentByType {
    type: string;
    total: number;
}

export default function ShowInvestment() {
    const [data, setData] = useState<InvestmentByType[]>([]);
    const [grandTotal, setGrandTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const res = await fetch("/api/inventory");
            const json = await res.json();
            if (!json.success) return;

            const typeMap: Record<string, number> = {};

            for (const item of json.items) {
                const type = (item.type || "unknown").toLowerCase();
                const qty = Number(item.quantity) || 0;
                const ft = Number(item.lengthFt || item.ft) || 0;
                const kg = Number(item.weight) || 0;
                const pricePerUnit = Number(item.pricePerUnit) || 0;
                const pricePerFt = Number(item.pricePerFt) || 0;
                const pricePerKg = Number(item.pricePerKg) || 0;

                const itemTotal =
                    qty * pricePerUnit + ft * pricePerFt + kg * pricePerKg;

                typeMap[type] = (typeMap[type] || 0) + itemTotal;
            }

            const sorted = Object.entries(typeMap)
                .map(([type, total]) => ({ type, total: Math.round(total) }))
                .sort((a, b) => b.total - a.total);

            setData(sorted);
            setGrandTotal(sorted.reduce((s, i) => s + i.total, 0));
            setLoading(false);
        }
        fetchData();
    }, []);

    const colors = [
        "#6366f1", "#f59e0b", "#10b981", "#ef4444",
        "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6",
        "#f97316", "#84cc16",
    ];

    if (loading)
        return <p className="text-gray-400 text-center p-6">Loading investment data...</p>;

    return (
        <div className="relative w-full bg-cardBg rounded-lg px-[50px] py-[30px]">
            <div className="flex justify-between items-center mb-6">
                <p className="text-lg text-white font-semibold">Investment by Item Type</p>
                <p className="text-white font-bold text-sm">
                    Total:{" "}
                    <span className="text-yellow-400">
                        {grandTotal.toLocaleString("en-US")} Rs
                    </span>
                </p>
            </div>

            {/* Bar Chart */}
            <div className="flex flex-col gap-4">
                {data.map((entry, i) => {
                    const pct = grandTotal > 0 ? (entry.total / grandTotal) * 100 : 0;
                    const color = colors[i % colors.length];
                    return (
                        <div key={entry.type} className="flex items-center gap-4">
                            {/* Label */}
                            <div
                                className="text-xs text-gray-300 capitalize text-right"
                                style={{ minWidth: 120 }}
                            >
                                {entry.type}
                            </div>

                            {/* Bar */}
                            <div className="flex-1 bg-gray-700 rounded-full h-5 relative overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${pct}%`, backgroundColor: color }}
                                />
                            </div>

                            {/* Value */}
                            <div className="text-xs text-white font-semibold" style={{ minWidth: 120 }}>
                                {entry.total.toLocaleString("en-US")} Rs
                                <span className="text-gray-400 ml-1">({pct.toFixed(1)}%)</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}