import { Link } from "react-router-dom";
import { useLang } from "../lang";
import { IconArrow } from "../components/Icon";

export function ForbiddenPage() {
  const { t } = useLang();
  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-lg flex-col justify-center px-6 py-16">
      <div className="rise border-t border-hair pt-10">
        <h1 className="font-heading text-5xl text-brown-deep">{t("forbidden")}</h1>
        <p className="mt-6 max-w-md text-mid">{t("forbidden_desc")}</p>
        <p className="mt-3 font-mono text-xs text-muted">HTTP 403</p>
        <Link to="/" className="btn-ghost mt-10 inline-flex">
          {t("back_home")}
          <IconArrow size={14} />
        </Link>
      </div>
    </main>
  );
}
