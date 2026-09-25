import React from "react";
import { WholesaleBillLayout } from "@/components/billing/WholesaleBillLayout";

export const BillRenderer = React.forwardRef(({ data }: any, ref: any) => {
  return (
    <div ref={ref} className="print-container">
      <WholesaleBillLayout data={data} />
    </div>
  );
});
