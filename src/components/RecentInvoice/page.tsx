"use client";

interface RecentInvoiceProps {
  quotationId: string;
  date: string;
  amount: number;
  discount: number;
  received: number;
  balance: number;
}

const RecentInvoice = ({
  quotationId,
  date,
  amount,
  discount,
  received,
  balance,
}: RecentInvoiceProps) => {
  return (
    <>
      <div className="flex items-center justify-between hover:bg-BgColor px-[50px] py-[10px] hover:cursor-pointer">
        <span>
          <p className="text-white text-xs">{quotationId}</p>
        </span>

        <span>
          <p className="text-white text-xs">
            {new Date(date).toLocaleDateString()}
          </p>
        </span>

        <span>
          <p className="text-white text-xs">-{discount}Rs</p>
        </span>

        <span>
          <p className="text-white text-xs">{amount}Rs</p>
        </span>
        <span>
          <p className="text-white text-xs">{received}Rs</p>
        </span>
        <span>
          <p className="text-white text-xs">{balance}Rs</p>
        </span>
      </div>
      <hr className="text-white opacity-20" />
    </>
  );
};

export default RecentInvoice;
