"use client";
import { useEffect, useState } from "react";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const TotalPendingToday = () => {
    const [total, setTotal] = useState<number | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/quotations");
                const data = await res.json();
                if (!data.success) return;

                const todayStr = new Date().toISOString().slice(0, 10);

const sum = data.quotations.reduce((acc: number, q: any) => {
    if (q.status === "returned") return acc;
    const qDateStr = new Date(q.date).toISOString().slice(0, 10);
    if (qDateStr !== todayStr) return acc;
    const balance =
        typeof q.balance === "number"
            ? q.balance
            : (q.grandTotal || q.amount || 0) - (q.totalReceived || 0);
    return acc + (balance > 0 ? balance : 0);
}, 0);
                setTotal(Math.round(sum));
            } catch (err) {
                console.error("Error fetching today's pending:", err);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="max-w-[250px] max-h-[170px] bg-cardBg px-[38px] py-[13px] flex flex-col items-center gap-4 rounded-xl">
            <span className="flex items-center gap-2">
                <span className="bg-IconBg flex items-center justify-center py-2 px-2 rounded-xl">
                    <FontAwesomeIcon className="text-iconColor text-xl" icon={faClock} />
                </span>
                <span className="flex flex-col text-white">
                    <span className="text-xs">Pending</span>
                    <span className="font-bold">Today</span>
                </span>
            </span>
            <span className="font-bold text-white text-sm">
                {total === null ? "..." : `${total.toLocaleString("en-US")} Rs`}
            </span>
        </div>
    );
};

export default TotalPendingToday;
