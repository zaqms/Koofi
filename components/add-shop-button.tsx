import { copy } from "@/lib/copy";

type AddShopButtonProps = {
  disabled?: boolean;
  onAdd: () => void;
};

export function AddShopButton({ disabled, onAdd }: AddShopButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onAdd}
      className="rounded-2xl border border-dashed border-line bg-foam px-3 py-1.5 text-start hover:border-bean hover:bg-paper-deep disabled:opacity-50"
    >
      <span className="block text-[11px] leading-4 text-ink" dir="rtl">
        {copy.addShop.ar}
      </span>
      <span className="block text-[10px] leading-4 text-ink-soft" dir="ltr">
        {copy.addShop.en}
      </span>
    </button>
  );
}
