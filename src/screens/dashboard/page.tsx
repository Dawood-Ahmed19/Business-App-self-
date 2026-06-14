"use client";

import TotalItem from "@/components/totalitem/page";
import TotalQuotations from "@/components/totalQuot/page";
import ShowInvoices from "@/components/ShowInvoices/page";
import ShowItem from "@/components/ShowItem/page";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader/page";
import TotalReturns from "@/components/totalReturns/page";
import ShowReturned from "@/components/showReturned/page";
import ShowInvestment from "@/components/showInvestment/page";
import TotalInvestment from "@/components/totalInvestment/page";


export default function DashboardScreen() {
  const today = new Date();

  const [activeTab, setActiveTab] = useState<
    "items" | "quotations" | "returns" | "investment"
  >("quotations");
  const [loading, setLoading] = useState(false);
  const [quotationCount, setQuotationCount] = useState(0);
  const [returnCount, setReturnCount] = useState(0);

  const handleTabSwitch = (tab: "items" | "quotations" | "returns" | "investment") => {
    if (tab === activeTab) return;
    setLoading(true);
    setActiveTab(tab);

    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const fetchQuotationsAndReturns = async () => {
      try {
        const res = await fetch("/api/quotations");
        const data = await res.json();
        if (data.success) {
          setQuotationCount(data.count);
        }

        const resRet = await fetch("/api/returns");
        const dataRet = await resRet.json();
        if (dataRet.success) {
          setReturnCount(dataRet.returns?.length ?? 0);
        }
      } catch (err) {
        console.error("Error fetching quotations:", err);
      }
    };

    fetchQuotationsAndReturns();
  }, []);

  return (
    <div
      className="px-[75px] py-[35px] h-full flex flex-col items-center gap-[50px] 
     2xl:max-w-[1600px] 2xl:mx-auto xl-only:max-w-[1200px] xl-only:mx-auto w-full"
    >
      {/* Header */}
      <span className="flex justify-between w-full">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white">{formattedDate}</p>
      </span>

      {/* Cards */}
      <span className="w-full flex items-center justify-start gap-6">
        <button
          className="hover:cursor-pointer"
          onClick={() => handleTabSwitch("items")}
        >
          <TotalItem />
        </button>
        <button
          className="hover:cursor-pointer"
          onClick={() => handleTabSwitch("quotations")}
        >
          <TotalQuotations count={quotationCount} />
        </button>
        <button
          className="hover:cursor-pointer"
          onClick={() => handleTabSwitch("returns")}
        >
          <TotalReturns count={returnCount} />
        </button>
        <button
          className="hover:cursor-pointer"
          onClick={() => handleTabSwitch("investment")}
        >
          <TotalInvestment />
        </button>
      </span>

      {/* Recent Invoices */}
      {loading ? (
        <Loader />
      ) : activeTab === "quotations" ? (
        <ShowInvoices />
      ) : activeTab === "items" ? (
        <ShowItem />
      ) : activeTab === "returns" ? (
        <ShowReturned />
      ) : activeTab === "investment" ? (
        <ShowInvestment />
      ) : (
        ""
      )}
    </div>
  );
}
