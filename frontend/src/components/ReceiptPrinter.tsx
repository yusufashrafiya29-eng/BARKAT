
interface ReceiptPrinterProps {
  order: any;
  tableNumber?: string | number;
  restaurantName: string;
  gstin?: string;
  fssai?: string;
}

export default function ReceiptPrinter({ order, tableNumber, restaurantName, gstin, fssai }: ReceiptPrinterProps) {
  if (!order) return null;

  // Formatting helpers
  const fmt = (n: number) => n.toFixed(2);

  // Calculate taxes
  const taxAmount = order.tax_amount || 0;
  const cgst = taxAmount / 2;
  const sgst = taxAmount / 2;

  const dateStr = new Date(order.created_at).toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    // This wrapper ensures it is only visible during print via the 'print-container' class from globals.css
    // We add 'hidden print:block' so Tailwind hides it normally, but globals.css 'print-container' takes over during print.
    <div className="hidden print:block print-container">
      <div className="print-receipt bg-white text-black p-4">
        
        {/* HEADER */}
        <div className="text-center mb-4">
          <h1 className="text-[18px] font-bold uppercase mb-1">{restaurantName || 'Restaurant Name'}</h1>
          {gstin && <div className="text-[10px]">GSTIN: {gstin}</div>}
          {fssai && <div className="text-[10px]">FSSAI: {fssai}</div>}
          <div className="text-[12px] font-bold mt-2 border-b border-black border-dashed pb-2">TAX INVOICE</div>
        </div>

        {/* META INFO */}
        <div className="text-[11px] mb-2 flex justify-between">
          <div>Bill No: {order.id.slice(0, 8).toUpperCase()}</div>
          <div>Date: {dateStr.split(',')[0]}</div>
        </div>
        <div className="text-[11px] mb-3 flex justify-between">
          <div>Table: {tableNumber || 'Takeaway'}</div>
          <div>Time: {dateStr.split(',')[1]?.trim()}</div>
        </div>

        <div className="border-b border-black border-dashed mb-2" />

        {/* ITEMS HEADER */}
        <div className="flex text-[11px] font-bold mb-1">
          <div className="flex-1">ITEM</div>
          <div className="w-8 text-center">QTY</div>
          <div className="w-12 text-right">RATE</div>
          <div className="w-16 text-right">AMT</div>
        </div>
        
        <div className="border-b border-black border-dashed mb-2" />

        {/* ITEMS LIST */}
        <div className="space-y-1 mb-2">
          {order.items?.map((item: any, idx: number) => {
            const itemName = item.menu_item?.name || 'Item';
            const price = item.price_at_order_time || 0;
            const amt = price * item.quantity;
            return (
              <div key={idx} className="flex text-[11px] items-start">
                <div className="flex-1 pr-1 break-words">{itemName}</div>
                <div className="w-8 text-center">{item.quantity}</div>
                <div className="w-12 text-right">{fmt(price)}</div>
                <div className="w-16 text-right">{fmt(amt)}</div>
              </div>
            );
          })}
        </div>

        <div className="border-b border-black border-dashed mb-2" />

        {/* FINANCIALS */}
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <div>Subtotal:</div>
            <div>{fmt(order.subtotal_amount || order.total_amount - taxAmount)}</div>
          </div>
          
          {taxAmount > 0 && (
            <>
              <div className="flex justify-between text-[10px]">
                <div>CGST (2.5%):</div>
                <div>{fmt(cgst)}</div>
              </div>
              <div className="flex justify-between text-[10px]">
                <div>SGST (2.5%):</div>
                <div>{fmt(sgst)}</div>
              </div>
            </>
          )}

          <div className="border-b border-black border-dashed my-1" />
          
          <div className="flex justify-between text-[14px] font-bold">
            <div>GRAND TOTAL:</div>
            <div>₹{fmt(order.total_amount)}</div>
          </div>
        </div>

        <div className="border-b border-black border-dashed my-2" />

        {/* FOOTER */}
        <div className="text-center mt-4">
          <div className="text-[12px] font-bold mb-1">Thank you for visiting!</div>
          <div className="text-[10px]">Have a wonderful day.</div>
        </div>
        
        {/* Adds padding at the bottom of the roll before cutting */}
        <div className="h-8" />
      </div>
    </div>
  );
}
