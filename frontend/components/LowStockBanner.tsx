import { useLang } from "../lang";
import { IconWarn } from "./Icon";

interface Props { count: number }

export function LowStockBanner({ count }: Props) {
  const { t } = useLang();
  if (count === 0) return null;
  return (
    <div className="mb-6 flex items-center gap-3 border-t border-b border-hair px-4 py-3 text-sm text-ink">
      <IconWarn size={16} className="text-warn-fg" />
      <span>
        <span className="font-mono font-medium">{count}</span> {t("low_stock_banner")}
      </span>
    </div>
  );
}
