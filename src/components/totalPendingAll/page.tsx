"use client";
import { useEffect, useState } from "react";
import { faHourglassHalf } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const TotalPendingAll = () => {
    const [total, setTotal] = useState<number | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/quotations");
                const data = await res.json();
                if (!data.success) return;

                const sum = data.quotations.reduce((acc: number, q: any) => {
                    if (q.status === "returned") return acc;
                    const balance =
                        typeof q.balance === "number"
                            ? q.balance
                            : (q.grandTotal || q.amount || 0) - (q.totalReceived || 0);
                    return acc + (balance > 0 ? balance : 0);
                }, 0);


                setTotal(Math.round(sum));
            } catch (err) {
                console.error("Error fetching total pending:", err);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="max-w-[250px] max-h-[170px] bg-cardBg px-[38px] py-[13px] flex flex-col items-center gap-4 rounded-xl">
            <span className="flex items-center gap-2">
                <span className="bg-IconBg flex items-center justify-center py-2 px-2 rounded-xl">
                    <FontAwesomeIcon className="text-iconColor text-xl" icon={faHourglassHalf} />
                </span>
                <span className="flex flex-col text-white">
                    <span className="text-xs">Total</span>
                    <span className="font-bold">Pending</span>
                </span>
            </span>
            <span className="font-bold text-white text-sm">
                {total === null ? "..." : `${total.toLocaleString("en-US")} Rs`}
            </span>
        </div>
    );
};

export default TotalPendingAll;