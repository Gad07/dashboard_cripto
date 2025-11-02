/**
 * Navbar component: shows brand, last-updated timestamp and controls (theme + language).
 */
import ThemeToggle from "./ThemeToggle";
import useTranslation from "../i18n";

/**
 * Barra superior de la aplicación.
 * - Muestra la marca, la última sincronización y controles (idioma y tema).
 */

interface NavbarProps {
  lastUpdated?: Date | null;
}

export function Navbar({ lastUpdated }: NavbarProps) {
  const { t, locale, setLocale } = useTranslation();

  const label = lastUpdated
    ? `${t("updated")} ${lastUpdated.toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : t("syncing");

  return (
    <nav className="app-navbar" aria-label="Main navigation">
      <div className="nav-left">
        <span className="nav-brand">{t("brand")}</span>
      </div>
      <div className="nav-right">
        <div className="nav-updated" aria-hidden="true">{label}</div>
        <div>
          {/* compact language toggle: click to toggle between EN/ES */}
          <button
            type="button"
            className="lang-toggle"
            onClick={() => setLocale(locale === "en" ? "es" : "en")}
            aria-label={t("languageSelect")}
            title={t("languageSelect")}
          >
            {locale.toUpperCase()}
          </button>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}

export default Navbar;
