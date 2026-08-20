import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

type AddShopButtonProps = {
  language: Language;
  disabled?: boolean;
  onAdd: () => void;
};

export function AddShopButton({ language, disabled, onAdd }: AddShopButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onAdd}
      className="text-xs text-ink-soft underline-offset-2 hover:underline disabled:opacity-50"
    >
      {copy.addShop[language]}
    </button>
  );
}
