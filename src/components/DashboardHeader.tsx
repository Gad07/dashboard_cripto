import useTranslation from "../i18n";

/**
 * DashboardHeader
 *
 * Encabezado principal del panel que muestra título, descripción y estado de sincronización.
 * - `lastUpdated` se muestra en la esquina derecha como indicador de la última actualización.
 */
interface DashboardHeaderProps {
  lastUpdated?: Date | null;
}

export function DashboardHeader({ lastUpdated }: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="dashboard-header" aria-label={t("headerAria")}>
      <div>
        <h1>{t("brand")}</h1>
        <p>{t("headerDescription")}</p>
      </div>
      <div className="dashboard-meta" aria-live="polite">
        <span className="status-dot" aria-hidden="true" />
        <span>{lastUpdated ? `${t("updated")} ${lastUpdated.toLocaleTimeString()}` : t("syncing")}</span>
      </div>
    </header>
  );
}
