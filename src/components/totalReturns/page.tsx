"use client";

import { faNoteSticky } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface TotalReturnsProps {
  count: number;
}

const TotalReturns = ({ count }: TotalReturnsProps) => {
  return (
    <div className="max-w-[250px] max-h-[170px] bg-cardBg px-[38px] py-[13px] flex flex-col items-center gap-4 rounded-xl">
      <span className="flex items-center gap-2">
        <span className="bg-IconBg flex items-center justify-center py-2 px-2 rounded-xl">
          <FontAwesomeIcon
            className="text-iconColor text-xl"
            icon={faNoteSticky}
          />
        </span>
        <span className="flex flex-col text-white">
          <span className="text-xs">Returned</span>
          <span className="font-bold">Quotations</span>
        </span>
      </span>
      <span className="font-bold text-white text-sm">{count}</span>
    </div>
  );
};

export default TotalReturns;
