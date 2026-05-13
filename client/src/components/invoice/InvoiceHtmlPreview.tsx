import type { InvoiceViewModel } from "../../utils/invoiceViewModel";
import { cn } from "../../utils/cn";

function money(n: number) {
  return `${n.toLocaleString("mn-MN")}`;
}

export function InvoiceHtmlPreview({
  data,
  className,
}: {
  data: InvoiceViewModel;
  className?: string;
}) {
  const { company } = data;
  return (
    <div
      className={cn(
        "max-w-3xl mx-auto bg-white text-slate-800 text-sm p-8 shadow-sm border rounded-lg print:shadow-none print:border-0",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-base font-bold">Infitech</p>
          <p className="font-semibold">{company.name}</p>
        </div>
        <h1 className="text-2xl font-bold">НЭХЭМЖЛЭХ</h1>
      </div>

      <div className="flex justify-end clear-both mb-4">
        <div className="border border-black w-48 p-2 text-xs space-y-1">
          <div className="flex justify-between">
            <span>Огноо:</span>
            <span>{data.issuedDateLabel}</span>
          </div>
          <div className="flex justify-between">
            <span>Дугаар:</span>
            <span className="font-medium">{data.invoiceNumber}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1 mb-4 text-xs leading-relaxed">
        <p>{company.address}</p>
        <p>Утас: {company.phone}</p>
        <p>Данс: {company.bank}</p>
      </div>

      <div className="space-y-2 mb-4 text-xs">
        <div>
          <p className="text-muted-foreground uppercase text-[10px]">Хаана</p>
          <p>{data.clientName}</p>
        </div>
        <div>
          <p className="text-muted-foreground uppercase text-[10px]">
            Байгууллага
          </p>
          <p className="text-primary underline">{data.clientName}</p>
        </div>
        <div>
          <p className="text-muted-foreground uppercase text-[10px]">Регистр</p>
          <p>{data.clientReg}</p>
        </div>
      </div>

      <div className="border border-black overflow-hidden text-xs mb-4">
        <div className="grid grid-cols-[12%_43%_10%_17%_18%] bg-black text-white font-medium px-1 py-2">
          <span>№</span>
          <span>Тайлбар</span>
          <span className="text-center">Тоо</span>
          <span className="text-right">Нэгж үнэ</span>
          <span className="text-right">Нийт үнэ</span>
        </div>
        <div className="grid grid-cols-[12%_43%_10%_17%_18%] px-1 py-2 border-t border-black">
          <span>{data.invoiceNumber}</span>
          <span>{data.description}</span>
          <span className="text-center">{data.quantity}</span>
          <span className="text-right">{money(data.unitPrice)}</span>
          <span className="text-right font-medium">{money(data.total)}</span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mb-6">{data.paymentNote}</p>

      <div className="flex flex-col items-end gap-1 text-xs w-56 ml-auto">
        <div className="flex justify-between w-full">
          <span>Нийт:</span>
          <span>{money(data.total)}</span>
        </div>
        <div className="flex justify-between w-full bg-slate-200 px-2 py-1 font-bold border border-slate-300">
          <span>Нийт үнэ:</span>
          <span>{money(data.total)}</span>
        </div>
      </div>

      <p className="text-right font-bold mt-8 text-sm">[{company.name}]</p>
    </div>
  );
}
