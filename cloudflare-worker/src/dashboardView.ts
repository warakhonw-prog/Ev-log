import { DashboardPayload } from "./dashboardData";

export function renderDashboardHtml(
  payload: DashboardPayload,
  initialTab: string = "dashboard"
): string {
  const payloadJson = JSON.stringify(payload);
  const meta = (payload && payload.data && payload.data.meta) || ({} as any);
  const initialBatCap = Number(meta.batteryCapacity || 68.5).toFixed(1);
  const initialRate = Number(meta.rate || 4.90).toFixed(2);

  return `<!DOCTYPE html>
<html lang="th">
<head>
<base target="_top">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>EV Charging Management Dashboard | ระบบบันทึกและวิเคราะห์การชาร์จรถยนต์ไฟฟ้า</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anuphan:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap">
<style>
:root {
  --bg: #F8FAFC;
  --surface: #FFFFFF;
  --surface-subtle: #F1F5F9;
  --border: #E2E8F0;
  --border-strong: #CBD5E1;
  --text-main: #0F172A;
  --text-muted: #64748B;
  --text-subtle: #94A3B8;

  --teal: #0D9488;
  --teal-hover: #0F766E;
  --teal-light: #14B8A6;
  --teal-soft: #CCFBF1;
  --teal-pale: #F0FDFA;

  --sky: #0284C7;
  --sky-hover: #0369A1;
  --sky-light: #38BDF8;
  --sky-soft: #E0F2FE;
  --sky-pale: #F0F9FF;

  --emerald: #10B981;
  --emerald-soft: #D1FAE5;
  --amber: #F59E0B;
  --amber-soft: #FEF3C7;
  --rose: #EF4444;
  --rose-soft: #FEE2E2;
  --indigo: #6366F1;
  --indigo-soft: #EEF2FF;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --shadow-sm: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
  --shadow-md: 0 4px 12px -2px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 10px 25px -3px rgba(15, 23, 42, 0.1);
  --font-sans: "Anuphan", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --sidebar-w: 260px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background-color: var(--bg);
  color: var(--text-main);
  font-family: var(--font-sans);
  font-size: 14.5px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  display: flex;
  overflow-x: hidden;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

/* Layout Shell */
.app-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

/* Sidebar (Desktop) */
.sidebar {
  width: var(--sidebar-w);
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border);
}

.logo-badge {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--teal), var(--sky));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  box-shadow: 0 4px 10px rgba(13, 148, 136, 0.3);
  flex-shrink: 0;
}

.logo-text h1 {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-main);
  line-height: 1.2;
}

.logo-text span {
  font-size: 11px;
  font-weight: 600;
  color: var(--teal);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Vehicle Quick Widget in Sidebar */
.sidebar-vehicle-box {
  margin: 16px 16px 8px;
  padding: 12px;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.v-box-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.v-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 6px;
}

.v-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--emerald);
  box-shadow: 0 0 0 2px var(--emerald-soft);
}

.v-plate {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.v-bat-track {
  width: 100%;
  height: 6px;
  background: #E2E8F0;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 6px;
}

.v-bat-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--teal), var(--emerald));
  border-radius: 999px;
  transition: width 0.4s ease;
}

.v-box-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
  font-family: var(--font-mono);
}

/* Navigation List */
.nav-section-title {
  padding: 12px 20px 4px;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.nav-list {
  list-style: none;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow-y: auto;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  transition: all 0.15s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.nav-link:hover {
  background: var(--teal-pale);
  color: var(--teal-hover);
}

.nav-link.active {
  background: var(--teal-soft);
  color: var(--teal);
  font-weight: 600;
  border-color: rgba(13, 148, 136, 0.2);
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.nav-badge {
  margin-left: auto;
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.nav-link.active .nav-badge {
  background: var(--teal);
  color: #FFFFFF;
  border-color: var(--teal);
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--surface-subtle);
  border-radius: var(--radius-sm);
  font-size: 11.5px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* Main Content Area */
.main-wrapper {
  margin-left: var(--sidebar-w);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100vh;
}

/* Top App Header */
.top-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-mobile-menu {
  display: none;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px;
  cursor: pointer;
  color: var(--text-main);
}

.page-title-box h2 {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-main);
}

.page-title-box p {
  font-size: 12px;
  color: var(--text-muted);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rate-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--teal-soft);
  color: var(--teal-hover);
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 600;
  font-family: var(--font-mono);
  border: 1px solid rgba(13, 148, 136, 0.2);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-sans);
  font-size: 13.5px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}

.btn-primary {
  background: var(--teal);
  color: #FFFFFF;
  box-shadow: 0 2px 6px rgba(13, 148, 136, 0.25);
}

.btn-primary:hover {
  background: var(--teal-hover);
}

.btn-secondary {
  background: var(--surface);
  border-color: var(--border-strong);
  color: var(--text-main);
}

.btn-secondary:hover {
  background: var(--surface-subtle);
  border-color: #94A3B8;
}

.btn-icon-only {
  padding: 8px;
  border-radius: var(--radius-md);
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12.5px;
  border-radius: var(--radius-sm);
}

.btn-danger {
  background: var(--rose-soft);
  color: var(--rose);
  border-color: rgba(239, 68, 68, 0.2);
}

.btn-danger:hover {
  background: var(--rose);
  color: #FFFFFF;
}

/* Main View Body */
.page-content {
  padding: 24px;
  max-width: 1380px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
}

/* Cards & Grid Systems */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* KPI 6-Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.kpi-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--kpi-accent, var(--teal));
}

.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.kpi-label {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-muted);
}

.kpi-icon-pill {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--kpi-soft, var(--teal-soft));
  color: var(--kpi-accent, var(--teal));
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-value-box {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.kpi-value {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.kpi-unit {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
}

.kpi-subtext {
  font-size: 11.5px;
  color: var(--text-subtle);
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Insight Banner */
.insight-banner {
  background: linear-gradient(135deg, #F0FDFA, #E0F2FE);
  border: 1px solid #99F6E4;
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.insight-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.insight-icon-bubble {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #FFFFFF;
  color: var(--teal);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(13, 148, 136, 0.15);
  flex-shrink: 0;
}

.insight-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.insight-desc {
  font-size: 12.5px;
  color: var(--text-muted);
}

/* Chart Rows */
.chart-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

@media (max-width: 1024px) {
  .chart-grid { grid-template-columns: 1fr; }
}

/* Table Container & UI */
.table-wrapper {
  overflow-x: auto;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

table.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13.5px;
}

table.data-table th {
  background: var(--surface-subtle);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

table.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text-main);
  vertical-align: middle;
}

table.data-table tr:last-child td {
  border-bottom: none;
}

table.data-table tr:hover td {
  background: #FAFAFC;
}

.mono { font-family: var(--font-mono); }

/* Status Badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}

.badge-teal { background: var(--teal-soft); color: var(--teal-hover); }
.badge-sky { background: var(--sky-soft); color: var(--sky); }
.badge-emerald { background: var(--emerald-soft); color: #059669; }
.badge-amber { background: var(--amber-soft); color: #D97706; }
.badge-rose { background: var(--rose-soft); color: var(--rose); }
.badge-subtle { background: var(--surface-subtle); color: var(--text-muted); }

/* Search & Filter Bar */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.input-text, .select-input {
  font-family: var(--font-sans);
  font-size: 13px;
  padding: 7px 12px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-main);
  outline: none;
  transition: border-color 0.15s ease;
}

.input-text:focus, .select-input:focus {
  border-color: var(--teal);
  box-shadow: 0 0 0 2px var(--teal-soft);
}

/* Report Sub-Tabs & Period Selectors */
.report-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid var(--border);
  margin-bottom: 18px;
  overflow-x: auto;
}
.report-tab-btn {
  padding: 10px 18px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-muted);
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.report-tab-btn:hover {
  color: var(--text-main);
}
.report-tab-btn.active {
  color: var(--teal);
  border-bottom-color: var(--teal);
}
.report-pill-group {
  display: inline-flex;
  background: var(--surface-subtle);
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  gap: 4px;
}
.report-pill {
  padding: 6px 14px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.report-pill:hover {
  color: var(--text-main);
}
.report-pill.active {
  background: var(--surface);
  color: var(--teal);
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.report-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
.report-kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  box-shadow: var(--shadow-sm);
}
.report-kpi-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.report-kpi-val {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
}
.report-kpi-sub {
  font-size: 11.5px;
  color: var(--text-subtle);
  margin-top: 4px;
}
@media print {
  body {
    background: #fff !important;
  }
  .sidebar, .top-header, .mobile-bottom-nav, .report-tabs, .report-pill-group, .btn-mobile-menu, #btnRefreshData, #btnExportReportCsv, .btn-print-hide {
    display: none !important;
  }
  .main-wrapper {
    margin: 0 !important;
    padding: 0 !important;
  }
  .page-content {
    padding: 0 !important;
  }
  .card {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .table-wrapper {
    overflow: visible !important;
    border: 1px solid #ddd !important;
  }
  table.data-table {
    font-size: 10px !important;
  }
  table.data-table th, table.data-table td {
    padding: 6px 8px !important;
  }
}

/* Forms */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.form-group .form-hint {
  font-size: 11.5px;
  color: var(--text-subtle);
}

.form-control {
  font-family: var(--font-sans);
  font-size: 14px;
  padding: 10px 14px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-main);
  outline: none;
}

.form-control:focus {
  border-color: var(--teal);
  box-shadow: 0 0 0 3px var(--teal-soft);
}

/* Battery SOC Bar Visual */
.soc-range-bar {
  height: 12px;
  border-radius: 999px;
  background: #E2E8F0;
  position: relative;
  overflow: hidden;
  margin: 8px 0;
}

.soc-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  background: linear-gradient(90deg, var(--teal), var(--sky));
  border-radius: 999px;
}

/* Floating / Modal Sheet */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-content {
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  max-width: 640px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border);
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: var(--surface-subtle);
  border-bottom-left-radius: var(--radius-xl);
  border-bottom-right-radius: var(--radius-xl);
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 120;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  background: var(--surface);
  color: var(--text-main);
  border-radius: var(--radius-md);
  padding: 12px 18px;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  font-weight: 500;
  border-left: 4px solid var(--teal);
}

.toast.success { border-left-color: var(--emerald); }
.toast.error { border-left-color: var(--rose); }
.toast.info { border-left-color: var(--sky); }

/* Mobile Bottom Nav */
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  z-index: 50;
  padding: 0 8px;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.bottom-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  font-size: 10.5px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.bottom-tab.active {
  color: var(--teal);
  font-weight: 700;
}

/* Drawer Backdrop for Mobile Menu */
.drawer-backdrop {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 39;
}

.drawer-backdrop.show {
  display: block;
}

/* Responsive Rules */
@media (max-width: 900px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .main-wrapper {
    margin-left: 0;
    padding-bottom: 70px;
  }
  .btn-mobile-menu {
    display: inline-flex;
  }
  .mobile-bottom-nav {
    display: flex;
  }
  .page-content {
    padding: 16px;
    gap: 16px;
  }
  .rate-badge {
    display: none;
  }
}

/* Reports & Analytics View Styles */
.report-section-nav {
  display: flex;
  gap: 10px;
  background: var(--surface-subtle);
  padding: 6px;
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
  border: 1px solid var(--border);
  flex-wrap: wrap;
}

.report-section-btn {
  flex: 1;
  min-width: 220px;
  padding: 10px 18px;
  font-size: 13.5px;
  font-weight: 600;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.report-section-btn.active {
  background: var(--surface);
  color: var(--teal);
  box-shadow: var(--shadow-sm);
}

.report-period-pills {
  display: inline-flex;
  gap: 6px;
  background: var(--surface-subtle);
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.report-pill-btn {
  padding: 6px 14px;
  font-size: 12.5px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.report-pill-btn.active {
  background: var(--teal);
  color: #FFFFFF;
  box-shadow: var(--shadow-sm);
}

.report-table th {
  text-align: center;
  font-size: 12px;
}

.report-table td {
  font-size: 12.5px;
}

.report-table tfoot td {
  background: var(--surface-subtle);
  font-weight: 700;
  border-top: 2px solid var(--border-strong);
}

.ratio-bar {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: var(--border);
  margin-top: 4px;
}

.ratio-bar-ac {
  background: var(--teal);
}

.ratio-bar-dc {
  background: var(--sky);
}

@media print {
  .sidebar, .mobile-bottom-nav, .top-nav, .report-section-nav, .report-period-pills, .btn, .card-header .btn {
    display: none !important;
  }
  .main-wrapper {
    margin-left: 0 !important;
    padding: 0 !important;
  }
  .card {
    box-shadow: none !important;
    border: 1px solid #ccc !important;
  }
}
</style>
</head>
<body>

<div class="app-container" id="appRoot">
  <!-- Mobile Drawer Backdrop -->
  <div class="drawer-backdrop" id="drawerBackdrop"></div>

  <!-- Sidebar -->
  <aside class="sidebar" id="appSidebar">
    <div class="sidebar-header">
      <div class="logo-badge">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </div>
      <div class="logo-text">
        <h1>EV LOG HUB</h1>
        <span>Smart Fleet & Energy</span>
      </div>
    </div>

    <!-- Active Vehicle Box -->
    <div class="sidebar-vehicle-box">
      <div class="v-box-top">
        <span class="v-title" id="sbVehicleName">
          <span class="v-status-dot"></span>
          XPENG G6 STD
        </span>
        <span class="v-plate" id="sbVehiclePlate">4ขข 8821</span>
      </div>
      <div class="v-bat-track">
        <div class="v-bat-fill" id="sbBatFill" style="width: 78%;"></div>
      </div>
      <div class="v-box-meta">
        <span id="sbBatText">แบตเตอรี่: 78%</span>
        <span id="sbBatCapText">${initialBatCap} kWh</span>
      </div>
    </div>

    <!-- Navigation Items -->
    <div class="nav-section-title">เมนูหลัก (Navigation)</div>
    <ul class="nav-list">
      <li>
        <a class="nav-link" data-view="dashboard">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          แดชบอร์ดภาพรวม
        </a>
      </li>
      <li>
        <a class="nav-link" data-view="charging-history">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          ประวัติการชาร์จ
          <span class="nav-badge" id="badgeChargeCount">0</span>
        </a>
      </li>
      <li>
        <a class="nav-link" data-view="add-charging">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          + บันทึกการชาร์จ
        </a>
      </li>
      <li>
        <a class="nav-link" data-view="trips">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
          บันทึกการเดินทาง (Trips)
          <span class="nav-badge" id="badgeTripCount" style="background:#EEF2FF;color:#4F46E5;">0</span>
        </a>
      </li>
      <li>
        <a class="nav-link" data-view="add-trip">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          + บันทึกการเดินทาง
        </a>
      </li>

      <div class="nav-section-title" style="margin-top:8px">วิเคราะห์และข้อมูลรถ</div>
      <li>
        <a class="nav-link" data-view="vehicles">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          โปรไฟล์รถยนต์ (Vehicles)
        </a>
      </li>
      <li>
        <a class="nav-link" data-view="vehicle-detail">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          สุขภาพแบตเตอรี่ (Telemetry)
        </a>
      </li>
      <li>
        <a class="nav-link" data-view="cost-analysis">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          วิเคราะห์ค่าใช้จ่ายและประหยัด
        </a>
      </li>
      <li>
        <a class="nav-link" data-view="reports">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          สรุปรายงาน (Reports)
        </a>
      </li>
      <li>
        <a class="nav-link" data-view="manage">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
          จัดการชีต (Manage Sheet)
        </a>
      </li>
      <li>
        <a class="nav-link" data-view="settings">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          ตั้งค่าระบบ (Settings)
        </a>
      </li>
    </ul>

    <div class="sidebar-footer">
      <div class="footer-chip">
        <span>⚡ ค่าไฟพื้นฐาน</span>
        <strong id="sbRateText">${initialRate} ฿/u</strong>
      </div>
      <div class="footer-chip">
        <span>🔋 ขนาดแบตเตอรี่</span>
        <strong id="sbCapText">${initialBatCap} kWh</strong>
      </div>
    </div>
  </aside>

  <!-- Main Wrapper -->
  <main class="main-wrapper">
    <!-- Top Header -->
    <header class="top-header">
      <div class="header-left">
        <button class="btn-mobile-menu" id="btnOpenMobileMenu" title="เปิดเมนู">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <div class="page-title-box">
          <h2 id="headerTitle">แดชบอร์ดภาพรวม</h2>
          <p id="headerSubtitle">สรุปข้อมูลการใช้พลังงานและค่าใช้จ่ายของรถยนต์ไฟฟ้า</p>
        </div>
      </div>

      <div class="header-right">
        <div class="rate-badge">
          <span>⚡ อัตราค่าไฟ:</span>
          <span id="topRateDisplay">4.90 ฿/kWh</span>
        </div>
        <button class="btn btn-secondary btn-icon-only" id="btnRefreshData" title="รีเฟรชข้อมูลจาก Google Sheets">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        </button>
        <button class="btn btn-secondary btn-sm" data-nav="add-trip" style="display:inline-flex;align-items:center;gap:5px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
          + บันทึกการเดินทาง
        </button>
        <button class="btn btn-primary btn-sm" data-nav="add-charging" style="display:inline-flex;align-items:center;gap:5px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          + บันทึกการชาร์จ
        </button>
      </div>
    </header>

    <!-- Page Content Container (Dynamically Swapped) -->
    <div class="page-content" id="viewContainer">
      <!-- Views will be rendered here by JS -->
    </div>
  </main>
</div>

<!-- Mobile Bottom Navigation -->
<nav class="mobile-bottom-nav">
  <div class="bottom-tab" data-nav="dashboard">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    ภาพรวม
  </div>
  <div class="bottom-tab" data-nav="charging-history">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
    ประวัติชาร์จ
  </div>
  <div class="bottom-tab" data-nav="add-charging" style="color:var(--teal)">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
    + บันทึก
  </div>
  <div class="bottom-tab" data-nav="trips">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
    การเดินทาง
  </div>
  <div class="bottom-tab" data-nav="settings">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
    ตั้งค่า
  </div>
</nav>

<!-- Modals Container -->
<div id="modalContainer"></div>

<!-- Toast Notifications Container -->
<div class="toast-container" id="toastContainer"></div>

<script>
window.__INITIAL_PAYLOAD__ = ${payloadJson};
window.__INITIAL_VIEW__ = "${initialTab}";

(function() {
  var state = {
    payload: window.__INITIAL_PAYLOAD__,
    activeView: window.__INITIAL_VIEW__ || "dashboard",
    batteryCapacity: (function() {
      var saved = localStorage.getItem("ev_battery_capacity");
      if (saved && saved !== "66" && saved !== "66.0") return parseFloat(saved);
      return (window.__INITIAL_PAYLOAD__.data && window.__INITIAL_PAYLOAD__.data.meta && window.__INITIAL_PAYLOAD__.data.meta.batteryCapacity) || 68.5;
    })(),
    unitRate: parseFloat(localStorage.getItem("ev_unit_rate")) || ((window.__INITIAL_PAYLOAD__.data && window.__INITIAL_PAYLOAD__.data.meta && window.__INITIAL_PAYLOAD__.data.meta.rate) || 4.90),
    rateOnPeak: parseFloat(localStorage.getItem("ev_rate_onpeak")) || 4.70,
    rateOffPeak: parseFloat(localStorage.getItem("ev_rate_offpeak")) || 2.60,
    petrolRate: parseFloat(localStorage.getItem("ev_petrol_rate")) || 38.5,
    petrolKmPerL: parseFloat(localStorage.getItem("ev_petrol_km_l")) || 16.0,
    vehicleName: localStorage.getItem("ev_vehicle_name") || ((window.__INITIAL_PAYLOAD__.data && window.__INITIAL_PAYLOAD__.data.meta && window.__INITIAL_PAYLOAD__.data.meta.vehicle) || "XPENG G6 STD"),
    vehiclePlate: localStorage.getItem("ev_vehicle_plate") || "4ขข 8821 กทม.",
    filterStation: "all",
    filterSearch: "",
    editRecord: null,
    deleteRecord: null,
    reportSection: "charging",
    reportChargePeriod: "monthly",
    reportTripPeriod: "monthly"
  };

  function fmtNum(n, d) {
    if (d === undefined) d = 2;
    if (n === null || n === undefined || isNaN(n)) return "0.00";
    return Number(n).toLocaleString("th-TH", { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function showToast(message, type) {
    if (!type) type = "info";
    var container = document.getElementById("toastContainer");
    if (!container) return;
    var t = document.createElement("div");
    t.className = "toast " + type;
    t.innerHTML = "<span>" + message + "</span>";
    container.appendChild(t);
    setTimeout(function() {
      t.style.opacity = "0";
      setTimeout(function() { t.remove(); }, 250);
    }, 3500);
  }

  function updateSidebarVehicle() {
    var rows = (state.payload.data && state.payload.data.rows) || [];
    var chargeRows = rows.filter(function(r) { return r.kind === "charge"; });
    var lastCharge = chargeRows.length > 0 ? chargeRows[chargeRows.length - 1] : null;
    var currentSoc = lastCharge ? (lastCharge.s1 || 80) : 80;

    var sbName = document.getElementById("sbVehicleName");
    var sbPlate = document.getElementById("sbVehiclePlate");
    var sbFill = document.getElementById("sbBatFill");
    var sbText = document.getElementById("sbBatText");
    var sbBatCapText = document.getElementById("sbBatCapText");
    var sbCapText = document.getElementById("sbCapText");
    var sbRateText = document.getElementById("sbRateText");
    var topRateDisplay = document.getElementById("topRateDisplay");
    var badgeChargeCount = document.getElementById("badgeChargeCount");
    var badgeTripCount = document.getElementById("badgeTripCount");
    var tripRows = rows.filter(function(r) { return r.kind === "trip"; });

    if (sbName) sbName.innerHTML = '<span class="v-status-dot"></span> ' + state.vehicleName;
    if (sbPlate) sbPlate.innerText = state.vehiclePlate;
    if (sbFill) sbFill.style.width = Math.min(100, Math.max(5, currentSoc)) + "%";
    if (sbText) sbText.innerText = "SOC ล่าสุด: " + currentSoc + "%";
    if (sbBatCapText) sbBatCapText.innerText = state.batteryCapacity.toFixed(1) + " kWh";
    if (sbCapText) sbCapText.innerText = state.batteryCapacity.toFixed(1) + " kWh";
    if (sbRateText) sbRateText.innerText = state.unitRate.toFixed(2) + " ฿/u";
    if (topRateDisplay) topRateDisplay.innerText = state.unitRate.toFixed(2) + " ฿/kWh";
    if (badgeChargeCount) badgeChargeCount.innerText = chargeRows.length;
    if (badgeTripCount) badgeTripCount.innerText = tripRows.length;
  }

  function computeAggregates() {
    var rows = (state.payload.data && state.payload.data.rows) || [];
    var chargeRows = rows.filter(function(r) { return r.kind === "charge"; });
    var tripRows = rows.filter(function(r) { return r.kind === "trip"; });

    var totalChargedKwh = 0;
    var totalCostThb = 0;
    var totalDistanceKm = 0;
    var latestOdo = 0;

    chargeRows.forEach(function(r) {
      totalChargedKwh += (r.kwh || 0);
      totalCostThb += (r.net || 0);
      if (r.odoEnd && r.odoEnd > latestOdo) latestOdo = r.odoEnd;
    });

    tripRows.forEach(function(r) {
      totalDistanceKm += (r.km || 0);
      if (r.odoEnd && r.odoEnd > latestOdo) latestOdo = r.odoEnd;
    });

    if (totalDistanceKm === 0 && rows.length > 0) {
      var minOdo = Infinity, maxOdo = -Infinity;
      rows.forEach(function(r) {
        if (r.odoStart && r.odoStart > 0) minOdo = Math.min(minOdo, r.odoStart);
        if (r.odoEnd && r.odoEnd > 0) maxOdo = Math.max(maxOdo, r.odoEnd);
      });
      if (maxOdo > minOdo && minOdo !== Infinity) {
        totalDistanceKm = maxOdo - minOdo;
      }
    }

    var efficiencyKmPerKwh = totalChargedKwh > 0 ? (totalDistanceKm / totalChargedKwh) : 0;
    var costPerKm = totalDistanceKm > 0 ? (totalCostThb / totalDistanceKm) : 0;
    var petrolCostPerKm = state.petrolRate / state.petrolKmPerL;
    var totalPetrolCost = totalDistanceKm * petrolCostPerKm;
    var totalSavings = Math.max(0, totalPetrolCost - totalCostThb);
    var chargeCycles = state.batteryCapacity > 0 ? (totalChargedKwh / state.batteryCapacity) : 0;

    return {
      totalChargedKwh: totalChargedKwh,
      totalCostThb: totalCostThb,
      totalDistanceKm: totalDistanceKm,
      efficiencyKmPerKwh: efficiencyKmPerKwh,
      costPerKm: costPerKm,
      petrolCostPerKm: petrolCostPerKm,
      totalSavings: totalSavings,
      chargeCycles: chargeCycles,
      latestOdo: latestOdo,
      chargeCount: chargeRows.length,
      tripCount: tripRows.length
    };
  }

  function computeMonthlyData() {
    var rows = (state.payload.data && state.payload.data.rows) || [];
    var monthly = {};
    rows.forEach(function(r) {
      if (!r.iso) return;
      var m = r.iso.substring(0, 7);
      if (!monthly[m]) monthly[m] = { kwh: 0, cost: 0, count: 0 };
      if (r.kind === "charge") {
        monthly[m].kwh += (r.kwh || 0);
        monthly[m].cost += (r.net || 0);
        monthly[m].count += 1;
      }
    });
    return Object.keys(monthly).sort().map(function(m) {
      return {
        month: m,
        kwh: monthly[m].kwh,
        cost: monthly[m].cost,
        count: monthly[m].count
      };
    });
  }

  function renderView() {
    updateSidebarVehicle();
    var container = document.getElementById("viewContainer");
    if (!container) return;

    document.querySelectorAll(".nav-link, .bottom-tab").forEach(function(el) {
      var v = el.getAttribute("data-view") || el.getAttribute("data-nav");
      if (v === state.activeView) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });

    var agg = computeAggregates();
    var rows = (state.payload.data && state.payload.data.rows) || [];

    var titles = {
      "dashboard": ["แดชบอร์ดภาพรวม", "สรุปข้อมูลการใช้พลังงาน สถิติค่าใช้จ่าย และสถานะตัวรถ"],
      "charging-history": ["ประวัติการชาร์จ", "บันทึกประวัติการชาร์จไฟทั้งหมด ค้นหา กรอง และจัดการข้อมูล"],
      "add-charging": ["บันทึกการชาร์จใหม่", "กรอกข้อมูลการชาร์จพร้อมคำนวณพลังงานและค่าไฟอัตโนมัติ"],
      "trips": ["บันทึกการเดินทาง (Trips)", "ติดตามระยะทาง อัตรากินไฟ และประวัติการขับขี่"],
      "add-trip": ["บันทึกการเดินทางใหม่ (New Trip)", "กรอกข้อมูลระยะทาง เลขไมล์ อัตราสิ้นเปลือง และคำนวณพลังงานที่ใช้"],
      "vehicles": ["โปรไฟล์รถยนต์", "ข้อมูลจำเพาะ ขนาดแบตเตอรี่ และสถานะรถยนต์ไฟฟ้าในระบบ"],
      "vehicle-detail": ["สเปกและสุขภาพแบตเตอรี่", "การประเมินรอบการชาร์จ (Cycles) และสุขภาพแบตเตอรี่"],
      "cost-analysis": ["วิเคราะห์ค่าใช้จ่ายและประหยัด", "เปรียบเทียบต้นทุนต่อกิโลเมตรกับรถน้ำมันเบนซิน"],
      "reports": ["สรุปรายงานและส่งออก", "ดาวน์โหลดรายงาน สรุปข้อมูลตามช่วงเวลา"],
      "manage": ["จัดการฐานข้อมูล Google Sheets", "ตรวจสอบแถวข้อมูล แก้ไข หรือลบรายการโดยตรง"],
      "settings": ["ตั้งค่าระบบ (Settings)", "ปรับแต่งความจุแบตเตอรี่ (kWh) และอัตราค่าไฟฟ้าพื้นฐาน (฿/kWh)"]
    };

    var headerTitle = document.getElementById("headerTitle");
    var headerSubtitle = document.getElementById("headerSubtitle");
    if (headerTitle && titles[state.activeView]) headerTitle.innerText = titles[state.activeView][0];
    if (headerSubtitle && titles[state.activeView]) headerSubtitle.innerText = titles[state.activeView][1];

    var html = "";
    switch (state.activeView) {
      case "dashboard":
        html = renderDashboardView(agg, rows);
        break;
      case "charging-history":
        html = renderChargingHistoryView(rows);
        break;
      case "add-charging":
        html = renderAddChargingView();
        break;
      case "trips":
        html = renderTripsView(agg, rows);
        break;
      case "add-trip":
        html = renderAddTripView(rows);
        break;
      case "vehicles":
        html = renderVehiclesView(agg);
        break;
      case "vehicle-detail":
        html = renderVehicleDetailView(agg);
        break;
      case "cost-analysis":
        html = renderCostAnalysisView(agg);
        break;
      case "reports":
        html = renderReportsView(agg, rows);
        break;
      case "manage":
        html = renderManageView(rows);
        break;
      case "settings":
        html = renderSettingsView();
        break;
      default:
        html = renderDashboardView(agg, rows);
    }

    container.innerHTML = html;
    bindViewEvents();
  }

  function renderDashboardView(agg, rows) {
    var chargeRows = rows.filter(function(r) { return r.kind === "charge"; });
    var recentCharges = chargeRows.slice(-5).reverse();
    var monthly = computeMonthlyData();

    var chartSvg = '<div style="text-align:center;color:var(--text-muted);padding:40px 0;">ยังไม่มีข้อมูลประวัติการชาร์จเพียงพอสำหรับแสดงกราฟ</div>';
    if (monthly.length > 0) {
      var maxKwh = Math.max.apply(Math, monthly.map(function(m) { return m.kwh; }).concat([10]));
      var chartH = 140;
      var barW = 32;
      var gap = 24;
      var totalW = Math.max(380, monthly.length * (barW + gap) + 40);

      var bars = monthly.map(function(m, i) {
        var h = Math.round((m.kwh / maxKwh) * (chartH - 30));
        var x = 30 + i * (barW + gap);
        var y = chartH - h - 20;
        return '<g class="bar-group">' +
          '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + h + '" rx="6" fill="url(#tealGradient)" />' +
          '<text x="' + (x + barW/2) + '" y="' + (y - 6) + '" font-size="11" font-family="JetBrains Mono" fill="#0D9488" text-anchor="middle" font-weight="600">' + m.kwh.toFixed(0) + '</text>' +
          '<text x="' + (x + barW/2) + '" y="' + chartH + '" font-size="10.5" font-family="Anuphan" fill="#64748B" text-anchor="middle">' + m.month.substring(5) + '/' + m.month.substring(2,4) + '</text>' +
          '</g>';
      }).join("");

      chartSvg = '<div style="overflow-x:auto;padding-bottom:8px;">' +
        '<svg width="' + totalW + '" height="' + (chartH + 10) + '" viewBox="0 0 ' + totalW + ' ' + (chartH + 10) + '">' +
        '<defs><linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#14B8A6" /><stop offset="100%" stop-color="#0D9488" /></linearGradient></defs>' +
        '<line x1="20" y1="' + (chartH - 20) + '" x2="' + (totalW - 20) + '" y2="' + (chartH - 20) + '" stroke="#E2E8F0" stroke-width="1" />' +
        bars +
        '</svg></div>';
    }

    var recentRowsHtml = recentCharges.length === 0 ?
      '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px;">ยังไม่มีข้อมูลการชาร์จ</td></tr>' :
      recentCharges.map(function(r) {
        var isDc = r.note && r.note.includes("DC");
        return '<tr>' +
          '<td><strong>' + (r.iso || "-") + '</strong><div style="font-size:11.5px;color:var(--text-muted);font-family:var(--font-mono)">' + (r.time || "-") + '</div></td>' +
          '<td><span class="badge ' + (isDc ? 'badge-sky' : 'badge-teal') + '">' + (r.note || "ชาร์จไฟ") + '</span></td>' +
          '<td class="mono">' + (r.s0 || 0) + '% → <strong>' + (r.s1 || 0) + '%</strong></td>' +
          '<td class="mono"><strong>' + fmtNum(r.kwh, 2) + '</strong> kWh</td>' +
          '<td class="mono" style="color:var(--teal);font-weight:600;">' + fmtNum(r.net, 2) + ' ฿</td>' +
          '<td class="mono" style="color:var(--text-muted)">' + (r.kwh > 0 ? fmtNum(r.net / r.kwh, 2) : "-") + '</td>' +
          '<td><button class="btn btn-secondary btn-sm" data-action="edit" data-row="' + r.sheetRowIndex + '">แก้ไข</button></td>' +
          '</tr>';
      }).join("");

    return '<div class="kpi-grid">' +
      '<div class="kpi-card" style="--kpi-accent:var(--teal);--kpi-soft:var(--teal-soft)">' +
        '<div class="kpi-top"><span class="kpi-label">พลังงานสะสมที่ชาร์จ</span><div class="kpi-icon-pill"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></div></div>' +
        '<div class="kpi-value-box"><span class="kpi-value">' + fmtNum(agg.totalChargedKwh, 1) + '</span><span class="kpi-unit">kWh</span></div>' +
        '<div class="kpi-subtext">เทียบเท่า ~' + agg.chargeCycles.toFixed(1) + ' รอบแบตเตอรี่เต็ม</div>' +
      '</div>' +

      '<div class="kpi-card" style="--kpi-accent:var(--sky);--kpi-soft:var(--sky-soft)">' +
        '<div class="kpi-top"><span class="kpi-label">ค่าใช้จ่ายการชาร์จรวม</span><div class="kpi-icon-pill"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div></div>' +
        '<div class="kpi-value-box"><span class="kpi-value">' + fmtNum(agg.totalCostThb, 0) + '</span><span class="kpi-unit">฿</span></div>' +
        '<div class="kpi-subtext">เฉลี่ย ' + (agg.chargeCount > 0 ? fmtNum(agg.totalCostThb / agg.chargeCount, 0) : 0) + ' ฿ ต่อครั้ง</div>' +
      '</div>' +

      '<div class="kpi-card" style="--kpi-accent:var(--emerald);--kpi-soft:var(--emerald-soft)">' +
        '<div class="kpi-top"><span class="kpi-label">ระยะทางวิ่งสะสม</span><div class="kpi-icon-pill"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div></div>' +
        '<div class="kpi-value-box"><span class="kpi-value">' + fmtNum(agg.totalDistanceKm, 0) + '</span><span class="kpi-unit">km</span></div>' +
        '<div class="kpi-subtext">Odometer ล่าสุด: ' + fmtNum(agg.latestOdo, 0) + ' km</div>' +
      '</div>' +

      '<div class="kpi-card" style="--kpi-accent:var(--indigo);--kpi-soft:var(--indigo-soft)">' +
        '<div class="kpi-top"><span class="kpi-label">ประสิทธิภาพพลังงาน</span><div class="kpi-icon-pill"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg></div></div>' +
        '<div class="kpi-value-box"><span class="kpi-value">' + fmtNum(agg.efficiencyKmPerKwh, 1) + '</span><span class="kpi-unit">km/kWh</span></div>' +
        '<div class="kpi-subtext">เฉลี่ย ~' + (agg.efficiencyKmPerKwh > 0 ? fmtNum(1000 / agg.efficiencyKmPerKwh, 0) : 0) + ' Wh/km</div>' +
      '</div>' +

      '<div class="kpi-card" style="--kpi-accent:var(--teal);--kpi-soft:var(--teal-soft)">' +
        '<div class="kpi-top"><span class="kpi-label">ต้นทุนต่อกิโลเมตร</span><div class="kpi-icon-pill"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div></div>' +
        '<div class="kpi-value-box"><span class="kpi-value">' + fmtNum(agg.costPerKm, 2) + '</span><span class="kpi-unit">฿/km</span></div>' +
        '<div class="kpi-subtext">น้ำมันเบนซิน ~' + fmtNum(agg.petrolCostPerKm, 2) + ' ฿/km</div>' +
      '</div>' +

      '<div class="kpi-card" style="--kpi-accent:var(--emerald);--kpi-soft:var(--emerald-soft)">' +
        '<div class="kpi-top"><span class="kpi-label">ประหยัดเทียบกับน้ำมัน</span><div class="kpi-icon-pill"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div></div>' +
        '<div class="kpi-value-box"><span class="kpi-value">' + fmtNum(agg.totalSavings, 0) + '</span><span class="kpi-unit">฿</span></div>' +
        '<div class="kpi-subtext">ประหยัดได้ถึง ~' + (agg.totalDistanceKm > 0 ? fmtNum((agg.totalSavings / (agg.totalDistanceKm * agg.petrolCostPerKm)) * 100, 0) : 0) + '%</div>' +
      '</div>' +
    '</div>' +

    '<div class="insight-banner">' +
      '<div class="insight-content">' +
        '<div class="insight-icon-bubble"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>' +
        '<div>' +
          '<div class="insight-title">คำแนะนำการประหยัดพลังงานอัจฉริยะ (EV Smart Insight)</div>' +
          '<div class="insight-desc">ขนาดแบตเตอรี่ปัจจุบันตั้งไว้ที่ <strong>' + state.batteryCapacity.toFixed(1) + ' kWh</strong> และอัตราค่าไฟ <strong>' + state.unitRate.toFixed(2) + ' ฿/kWh</strong> การชาร์จช่วง Off-Peak สามารถช่วยประหยัดค่าไฟได้สูงสุดถึง 45% เมื่อเทียบกับตู้ชาร์จสาธารณะ DC</div>' +
        '</div>' +
      '</div>' +
      '<button class="btn btn-secondary btn-sm" data-nav="settings">แก้ไขค่าตัวรถ/ค่าไฟ</button>' +
    '</div>' +

    '<div class="chart-grid">' +
      '<div class="card">' +
        '<div class="card-header"><div><div class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> แนวโน้มการชาร์จไฟรายเดือน (Monthly Energy kWh)</div><div class="card-subtitle">ปริมาณพลังงานไฟฟ้าที่รับเข้าสู่แบตเตอรี่ในแต่ละเดือน</div></div></div>' +
        chartSvg +
      '</div>' +

      '<div class="card">' +
        '<div class="card-header"><div><div class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sky)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg> สถานะรถและแบตเตอรี่</div><div class="card-subtitle">' + state.vehicleName + ' (' + state.batteryCapacity.toFixed(1) + ' kWh)</div></div></div>' +
        '<div style="display:flex;flex-direction:column;gap:14px;padding:8px 0;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:13px;color:var(--text-muted)">ระดับแบตเตอรี่เป้าหมาย</span><strong style="font-family:var(--font-mono);color:var(--teal)">80% (แนะนำเพื่อถนอมแบต)</strong></div>' +
          '<div class="soc-range-bar"><div class="soc-fill" style="width: 80%;"></div></div>' +
          '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-subtle);font-family:var(--font-mono)"><span>0%</span><span>20%</span><span>50%</span><span>80%</span><span>100%</span></div>' +
          '<div style="background:var(--surface-subtle);border-radius:var(--radius-md);padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">' +
            '<div><div style="font-size:11px;color:var(--text-muted)">พลังงานคงเหลือ ~</div><strong style="font-family:var(--font-mono);font-size:15px;">' + (state.batteryCapacity * 0.8).toFixed(1) + ' kWh</strong></div>' +
            '<div><div style="font-size:11px;color:var(--text-muted)">ระยะทางวิ่งได้ ~</div><strong style="font-family:var(--font-mono);font-size:15px;color:var(--emerald);">' + ((state.batteryCapacity * 0.8) * (agg.efficiencyKmPerKwh || 6.5)).toFixed(0) + ' km</strong></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<div class="card-header"><div><div class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> รายการชาร์จล่าสุด (Recent Charges)</div><div class="card-subtitle">5 รายการล่าสุดจากระบบ</div></div><button class="btn btn-secondary btn-sm" data-nav="charging-history">ดูทั้งหมด (' + agg.chargeCount + ')</button></div>' +
      '<div class="table-wrapper">' +
        '<table class="data-table"><thead><tr><th>วันที่ / เวลา</th><th>ประเภท / สถานี</th><th>SOC เริ่ม → จบ</th><th>พลังงาน (kWh)</th><th>ค่าไฟ (฿)</th><th>เฉลี่ย (฿/kWh)</th><th>จัดการ</th></tr></thead>' +
        '<tbody>' + recentRowsHtml + '</tbody></table>' +
      '</div>' +
    '</div>';
  }

  function renderChargingHistoryView(rows) {
    var chargeRows = rows.filter(function(r) { return r.kind === "charge"; });

    if (state.filterSearch) {
      var q = state.filterSearch.toLowerCase();
      chargeRows = chargeRows.filter(function(r) {
        return (r.iso && r.iso.toLowerCase().indexOf(q) !== -1) ||
               (r.note && r.note.toLowerCase().indexOf(q) !== -1) ||
               (r.time && r.time.toLowerCase().indexOf(q) !== -1);
      });
    }

    if (state.filterStation !== "all") {
      if (state.filterStation === "home") {
        chargeRows = chargeRows.filter(function(r) {
          return r.note && (r.note.indexOf("บ้าน") !== -1 || r.note.toLowerCase().indexOf("home") !== -1 || r.note.indexOf("AC") !== -1);
        });
      } else if (state.filterStation === "dc") {
        chargeRows = chargeRows.filter(function(r) {
          return r.note && (r.note.toLowerCase().indexOf("dc") !== -1 || r.note.indexOf("เร็ว") !== -1 || r.note.indexOf("fast") !== -1);
        });
      }
    }

    var reversedRows = chargeRows.slice().reverse();

    var rowsHtml = reversedRows.length === 0 ?
      '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</td></tr>' :
      reversedRows.map(function(r) {
        var isDc = r.note && (r.note.toLowerCase().indexOf("dc") !== -1 || r.note.indexOf("เร็ว") !== -1);
        var addedSoc = Math.max(0, (r.s1 || 0) - (r.s0 || 0));
        return '<tr>' +
          '<td class="mono" style="color:var(--text-subtle)">#' + r.sheetRowIndex + '</td>' +
          '<td><strong>' + (r.iso || "-") + '</strong><div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">' + (r.time || "-") + '</div></td>' +
          '<td><span class="badge ' + (isDc ? 'badge-sky' : 'badge-teal') + '">' + (r.note || "ชาร์จไฟ") + '</span></td>' +
          '<td class="mono">' + (r.s0 || 0) + '% → <strong>' + (r.s1 || 0) + '%</strong> <span style="font-size:11px;color:var(--emerald);font-weight:600;">(+' + addedSoc + '%)</span></td>' +
          '<td class="mono"><strong>' + fmtNum(r.kwh, 2) + '</strong> kWh</td>' +
          '<td class="mono" style="color:var(--teal);font-weight:600;">' + fmtNum(r.net, 2) + ' ฿</td>' +
          '<td class="mono" style="font-size:12px;color:var(--text-muted)">' + (r.kwh > 0 ? fmtNum(r.net / r.kwh, 2) + ' ฿/u' : '-') + '</td>' +
          '<td class="mono" style="font-size:12px;">' + (r.odoEnd ? fmtNum(r.odoEnd, 0) + ' km' : '-') + '</td>' +
          '<td><div style="display:flex;gap:6px;">' +
            '<button class="btn btn-secondary btn-sm" data-action="edit" data-row="' + r.sheetRowIndex + '">แก้ไข</button>' +
            '<button class="btn btn-danger btn-sm" data-action="delete" data-row="' + r.sheetRowIndex + '">ลบ</button>' +
          '</div></td>' +
          '</tr>';
      }).join("");

    return '<div class="card">' +
      '<div class="filter-bar">' +
        '<div class="filter-group">' +
          '<input type="text" class="input-text" id="inputSearchCharge" placeholder="🔍 ค้นหาวันที่, สถานี, หมายเหตุ..." value="' + state.filterSearch + '" style="width:240px;">' +
          '<select class="select-input" id="selectStationType">' +
            '<option value="all" ' + (state.filterStation === "all" ? "selected" : "") + '>ทุกประเภทหัวชาร์จ</option>' +
            '<option value="home" ' + (state.filterStation === "home" ? "selected" : "") + '>ชาร์จบ้าน (Home AC)</option>' +
            '<option value="dc" ' + (state.filterStation === "dc" ? "selected" : "") + '>ตู้สาธารณะ (DC Fast)</option>' +
          '</select>' +
        '</div>' +
        '<div class="filter-group">' +
          '<button class="btn btn-secondary btn-sm" id="btnExportCsv">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> ส่งออก CSV' +
          '</button>' +
          '<button class="btn btn-primary btn-sm" data-nav="add-charging">+ บันทึกชาร์จใหม่</button>' +
        '</div>' +
      '</div>' +
      '<div class="table-wrapper">' +
        '<table class="data-table"><thead><tr><th>แถว</th><th>วันที่ / เวลา</th><th>สถานี / ประเภท</th><th>SOC เริ่ม → จบ</th><th>พลังงาน (kWh)</th><th>ค่าไฟสุทธิ (฿)</th><th>อัตราเฉลี่ย</th><th>Odometer</th><th>จัดการ</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody></table>' +
      '</div>' +
    '</div>';
  }

  function renderAddChargingView() {
    var today = new Date().toISOString().substring(0, 10);
    var nowTime = new Date().toTimeString().substring(0, 5);

    return '<div class="card" style="max-width:860px;margin:0 auto;width:100%;">' +
      '<div class="card-header"><div><div class="card-title"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> แบบฟอร์มบันทึกข้อมูลการชาร์จรถยนต์ไฟฟ้า</div><div class="card-subtitle">ระบบจะช่วยคำนวณพลังงาน (kWh) และค่าไฟตามอัตราที่ตั้งค่าไว้ให้อัตโนมัติ</div></div></div>' +
      '<form id="formAddCharge" style="display:flex;flex-direction:column;gap:20px;">' +
        '<div class="form-grid">' +
          '<div class="form-group"><label>📅 วันที่ชาร์จ</label><input type="date" class="form-control" name="date" value="' + today + '" required></div>' +
          '<div class="form-group"><label>⏰ เวลาที่ชาร์จ</label><input type="time" class="form-control" name="time" value="' + nowTime + '" required></div>' +
        '</div>' +
        '<div class="form-grid">' +
          '<div class="form-group"><label>🚗 เลือกรถยนต์</label><select class="form-control" name="vehicle" id="addVehicleSelect"><option value="' + state.vehicleName + '">' + state.vehicleName + ' (' + state.batteryCapacity.toFixed(1) + ' kWh)</option></select></div>' +
          '<div class="form-group"><label>🔌 สถานที่ / สถานีชาร์จ</label><input type="text" class="form-control" name="note" id="addNote" placeholder="เช่น บ้าน (Home AC), PTT EV Station, EA Anywhere" value="บ้าน (Home AC)" required></div>' +
        '</div>' +
        '<div style="background:var(--teal-pale);border:1px solid #99F6E4;border-radius:var(--radius-lg);padding:18px;">' +
          '<div style="font-weight:600;color:var(--teal-hover);margin-bottom:12px;font-size:14px;display:flex;align-items:center;gap:6px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="18" height="12" rx="2"></rect><line x1="23" y1="11" x2="23" y2="13"></line></svg> ระดับแบตเตอรี่และการคำนวณอัตโนมัติ (Battery SOC Auto-Calculation)</div>' +
          '<div class="form-grid">' +
            '<div class="form-group"><label>SOC เริ่มต้น (%)</label><input type="number" class="form-control" name="socStart" id="addSocStart" min="0" max="100" value="20" required></div>' +
            '<div class="form-group"><label>SOC สิ้นสุด (%)</label><input type="number" class="form-control" name="socEnd" id="addSocEnd" min="0" max="100" value="80" required></div>' +
          '</div>' +
          '<div class="form-grid" style="margin-top:14px;">' +
            '<div class="form-group"><label>⚡ พลังงานที่ชาร์จเข้า (kWh)</label><input type="number" step="0.01" class="form-control" name="energyKwh" id="addEnergyKwh" required><span class="form-hint" id="addKwhHint">คำนวณจาก (80 - 20)% × ' + state.batteryCapacity.toFixed(1) + ' kWh</span></div>' +
            '<div class="form-group"><label>💰 ค่าไฟสุทธิ (฿)</label><input type="number" step="0.01" class="form-control" name="costNetThb" id="addCostNetThb" required><span class="form-hint" id="addCostHint">คำนวณจากพลังงาน × อัตราค่าไฟ ' + state.unitRate.toFixed(2) + ' ฿/kWh</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="form-grid">' +
          '<div class="form-group"><label>⏱️ ระยะเวลาชาร์จ (นาที)</label><input type="number" class="form-control" name="durationMin" placeholder="เช่น 60 หรือ 360" value="360"></div>' +
          '<div class="form-group"><label>📍 เลขไมล์ปัจจุบัน (Odometer km)</label><input type="number" class="form-control" name="odoEnd" placeholder="เช่น 12450"></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:flex-end;gap:12px;margin-top:10px;">' +
          '<button type="button" class="btn btn-secondary" data-nav="dashboard">ยกเลิก</button>' +
          '<button type="submit" class="btn btn-primary" id="btnSubmitAddCharge"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> บันทึกข้อมูลการชาร์จ</button>' +
        '</div>' +
      '</form>' +
    '</div>';
  }

  function renderAddTripView(rows) {
    var today = new Date().toISOString().substring(0, 10);
    var nowTime = new Date().toTimeString().substring(0, 5);

    var tripRows = (rows || []).filter(function(r) { return r.kind === "trip"; });
    var lastTrip = tripRows.length > 0 ? tripRows[tripRows.length - 1] : null;
    var lastOdo = lastTrip && lastTrip.odoEnd ? lastTrip.odoEnd : (state.payload.data && state.payload.data.meta ? (state.payload.data.meta.odoEnd || 0) : 0);
    var lastSoc = lastTrip && lastTrip.s1 ? lastTrip.s1 : 80;

    return '<div class="card" style="max-width:860px;margin:0 auto;width:100%;">' +
      '<div class="card-header"><div><div class="card-title"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg> แบบฟอร์มบันทึกข้อมูลการเดินทาง (New Trip Driving Log)</div><div class="card-subtitle">บันทึกระยะทาง เลขไมล์ อัตราสิ้นเปลือง และคำนวณพลังงานที่ใช้อัตโนมัติ</div></div></div>' +
      '<form id="formAddTrip" style="display:flex;flex-direction:column;gap:20px;">' +
        '<div class="form-grid">' +
          '<div class="form-group"><label>📅 วันที่เดินทาง</label><input type="date" class="form-control" name="date" value="' + today + '" required></div>' +
          '<div class="form-group"><label>⏰ เวลาออกเดินทาง / บันทึก</label><input type="time" class="form-control" name="time" value="' + nowTime + '" required></div>' +
        '</div>' +
        '<div class="form-grid">' +
          '<div class="form-group"><label>🚗 เลือกรถยนต์</label><select class="form-control" name="vehicle" id="tripVehicleSelect"><option value="' + state.vehicleName + '">' + state.vehicleName + ' (' + state.batteryCapacity.toFixed(1) + ' kWh)</option></select></div>' +
          '<div class="form-group"><label>🗺️ รายละเอียดเส้นทาง / สภาพการขับขี่</label><input type="text" class="form-control" name="note" id="tripNote" placeholder="เช่น ECO mode, 28°C หรือ เดินทางไปทำงาน" value="การเดินทางทั่วไป" required></div>' +
        '</div>' +
        '<div style="background:var(--surface-subtle);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px;">' +
          '<div style="font-weight:600;color:var(--text-main);margin-bottom:12px;font-size:14px;display:flex;align-items:center;gap:6px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg> 📍 เลขไมล์และระยะทาง (Odometer & Distance)</div>' +
          '<div class="form-grid">' +
            '<div class="form-group"><label>เลขไมล์เริ่มต้น (km)</label><input type="number" step="0.1" class="form-control mono" name="odoStart" id="tripOdoStart" value="' + (lastOdo || "") + '" placeholder="เช่น 2039"><span class="form-hint">ไมล์ล่าสุดจากทริปก่อนหน้า</span></div>' +
            '<div class="form-group"><label>เลขไมล์สิ้นสุด (km)</label><input type="number" step="0.1" class="form-control mono" name="odoEnd" id="tripOdoEnd" placeholder="เช่น 2054"><span class="form-hint">กรอกเพื่อคำนวณระยะทางอัตโนมัติ</span></div>' +
          '</div>' +
          '<div class="form-grid" style="margin-top:14px;">' +
            '<div class="form-group"><label>📏 ระยะทางที่วิ่งได้ (km) *</label><input type="number" step="0.1" class="form-control mono" name="distanceKm" id="tripDistanceKm" placeholder="เช่น 15.4" required><span class="form-hint" id="tripDistHint">ระยะทางสุทธิของทริปนี้</span></div>' +
            '<div class="form-group"><label>⏱️ ระยะเวลาเดินทาง (นาที)</label><input type="number" class="form-control mono" name="durationMin" id="tripDurationMin" placeholder="เช่น 25" value="25"><span class="form-hint">เวลาที่ใช้บนท้องถนน</span></div>' +
          '</div>' +
        '</div>' +
        '<div style="background:var(--teal-pale);border:1px solid #99F6E4;border-radius:var(--radius-lg);padding:18px;">' +
          '<div style="font-weight:600;color:var(--teal-hover);margin-bottom:12px;font-size:14px;display:flex;align-items:center;gap:6px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="18" height="12" rx="2"></rect><line x1="23" y1="11" x2="23" y2="13"></line></svg> ⚡ ระดับแบตเตอรี่ พลังงาน และค่าใช้จ่าย (SOC & Energy)</div>' +
          '<div class="form-grid">' +
            '<div class="form-group"><label>SOC เริ่มต้น (%)</label><input type="number" class="form-control mono" name="socStart" id="tripSocStart" min="0" max="100" value="' + lastSoc + '"><span class="form-hint">ระดับแบตก่อนออกเดินทาง</span></div>' +
            '<div class="form-group"><label>SOC สิ้นสุด (%)</label><input type="number" class="form-control mono" name="socEnd" id="tripSocEnd" min="0" max="100" placeholder="เช่น ' + Math.max(0, lastSoc - 4) + '"><span class="form-hint">ระดับแบตเมื่อถึงที่หมาย</span></div>' +
          '</div>' +
          '<div class="form-grid" style="margin-top:14px;">' +
            '<div class="form-group"><label>อัตราสิ้นเปลืองเฉลี่ย (Wh/km)</label><input type="number" step="0.1" class="form-control mono" name="avgConsumption" id="tripAvgConsumption" placeholder="เช่น 14.5"><span class="form-hint">Wh/km หรือคำนวณจาก SOC / ระยะทาง</span></div>' +
            '<div class="form-group"><label>พลังงานที่ใช้ (kWh) *</label><input type="number" step="0.01" class="form-control mono" name="energyKwh" id="tripEnergyKwh" required><span class="form-hint" id="tripKwhHint">พลังงานสุทธิที่ใช้ไป</span></div>' +
          '</div>' +
          '<div class="form-group" style="margin-top:14px;"><label>💰 ค่าไฟเฉลี่ยในการเดินทาง (฿) *</label><input type="number" step="0.01" class="form-control mono" name="costNetThb" id="tripCostNetThb" required><span class="form-hint" id="tripCostHint">คำนวณจากพลังงาน × อัตราค่าไฟ ' + state.unitRate.toFixed(2) + ' ฿/kWh</span></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:flex-end;gap:12px;margin-top:10px;">' +
          '<button type="button" class="btn btn-secondary" data-nav="trips">ยกเลิก</button>' +
          '<button type="submit" class="btn btn-primary" id="btnSubmitAddTrip"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> บันทึกข้อมูลการเดินทาง</button>' +
        '</div>' +
      '</form>' +
    '</div>';
  }

  function renderTripsView(agg, rows) {
    var tripRows = rows.filter(function(r) { return r.kind === "trip"; });
    var reversedTrips = tripRows.slice().reverse();

    var rowsHtml = reversedTrips.length === 0 ?
      '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">ยังไม่มีบันทึกการเดินทาง สามารถกดบันทึกรายการเดินทางใหม่ได้ทันที</td></tr>' :
      reversedTrips.map(function(r) {
        return '<tr>' +
          '<td><strong>' + (r.iso || "-") + '</strong></td>' +
          '<td>' + (r.note || "การเดินทางทั่วไป") + '</td>' +
          '<td class="mono">' + (r.odoStart ? fmtNum(r.odoStart, 0) : "-") + '</td>' +
          '<td class="mono">' + (r.odoEnd ? fmtNum(r.odoEnd, 0) : "-") + '</td>' +
          '<td class="mono"><strong>' + fmtNum(r.km, 1) + '</strong> km</td>' +
          '<td class="mono">' + (r.min ? r.min + " นาที" : "-") + '</td>' +
          '<td class="mono">' + (r.cons ? fmtNum(r.cons, 1) + " Wh/km" : "-") + '</td>' +
          '<td><button class="btn btn-secondary btn-sm" data-action="edit" data-row="' + r.sheetRowIndex + '">แก้ไข</button></td>' +
          '</tr>';
      }).join("");

    return '<div class="card">' +
      '<div class="card-header"><div><div class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg> ประวัติการเดินทางและการขับขี่ (Trip Driving Log)</div><div class="card-subtitle">บันทึกระยะทางและอัตราสิ้นเปลืองในแต่ละเส้นทาง</div></div><button class="btn btn-primary btn-sm" data-nav="add-trip"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> + บันทึกการเดินทางใหม่</button></div>' +
      '<div class="table-wrapper">' +
        '<table class="data-table"><thead><tr><th>วันที่</th><th>รายละเอียดเส้นทาง / จุดหมาย</th><th>ไมล์เริ่มต้น</th><th>ไมล์สิ้นสุด</th><th>ระยะทาง (km)</th><th>ระยะเวลา (นาที)</th><th>อัตราสิ้นเปลือง</th><th>จัดการ</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody></table>' +
      '</div>' +
    '</div>';
  }

  function renderVehiclesView(agg) {
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:20px;">' +
      '<div class="card" style="border-top:4px solid var(--teal);">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">' +
          '<div><span class="badge badge-teal" style="margin-bottom:6px;">รถคันปัจจุบันในระบบ</span><h3 style="font-size:18px;font-weight:700;">' + state.vehicleName + '</h3><p style="font-family:var(--font-mono);font-size:13px;color:var(--text-muted);">' + state.vehiclePlate + '</p></div>' +
          '<div style="width:48px;height:48px;border-radius:var(--radius-md);background:var(--teal-soft);display:flex;align-items:center;justify-content:center;color:var(--teal)"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;background:var(--surface-subtle);padding:14px;border-radius:var(--radius-md);">' +
          '<div><div style="font-size:11.5px;color:var(--text-muted)">ความจุแบตเตอรี่ (Battery)</div><strong style="font-family:var(--font-mono);font-size:16px;color:var(--teal);">' + state.batteryCapacity.toFixed(1) + ' kWh</strong></div>' +
          '<div><div style="font-size:11.5px;color:var(--text-muted)">รองรับกำลังชาร์จ DC</div><strong style="font-family:var(--font-mono);font-size:16px;">สูงสุด ~280 kW</strong></div>' +
          '<div><div style="font-size:11.5px;color:var(--text-muted)">ระยะทางวิ่งสะสม</div><strong style="font-family:var(--font-mono);font-size:16px;">' + fmtNum(agg.totalDistanceKm, 0) + ' km</strong></div>' +
          '<div><div style="font-size:11.5px;color:var(--text-muted)">รอบการชาร์จสะสม</div><strong style="font-family:var(--font-mono);font-size:16px;">~' + agg.chargeCycles.toFixed(1) + ' Cycles</strong></div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;margin-top:16px;">' +
          '<button class="btn btn-secondary btn-sm" style="flex:1;" data-nav="settings">แก้ไขสเปกรถ</button>' +
          '<button class="btn btn-primary btn-sm" style="flex:1;" data-nav="vehicle-detail">ดูสุขภาพแบตเตอรี่</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderVehicleDetailView(agg) {
    var healthEstimate = Math.max(90, Math.min(100, 100 - (agg.chargeCycles * 0.015))).toFixed(1);

    return '<div class="card" style="max-width:800px;margin:0 auto;width:100%;">' +
      '<div class="card-header"><div><div class="card-title"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> สุขภาพและการวิเคราะห์แบตเตอรี่ (Battery Health & Telemetry)</div><div class="card-subtitle">ประเมินจากรอบการชาร์จและประวัติการรับพลังงาน</div></div></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:20px;">' +
        '<div style="border:1px solid var(--border);border-radius:var(--radius-md);padding:16px;text-align:center;">' +
          '<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">สถานะสุขภาพแบต (SOH Estimate)</div>' +
          '<div style="font-family:var(--font-mono);font-size:32px;font-weight:700;color:var(--emerald);">' + healthEstimate + '%</div>' +
          '<span class="badge badge-emerald" style="margin-top:6px;">สมบูรณ์ดีเยี่ยม (Excellent)</span>' +
        '</div>' +
        '<div style="border:1px solid var(--border);border-radius:var(--radius-md);padding:16px;text-align:center;">' +
          '<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">รอบการชาร์จเทียบเท่า (Full Cycles)</div>' +
          '<div style="font-family:var(--font-mono);font-size:32px;font-weight:700;color:var(--teal);">' + agg.chargeCycles.toFixed(1) + '</div>' +
          '<div style="font-size:11.5px;color:var(--text-subtle);margin-top:6px;">รองรับได้อีกกว่า 2,500 รอบ</div>' +
        '</div>' +
      '</div>' +
      '<div style="background:var(--surface-subtle);border-radius:var(--radius-lg);padding:18px;display:flex;flex-direction:column;gap:12px;">' +
        '<h4 style="font-size:14px;font-weight:600;">แนวทางการถนอมแบตเตอรี่รถยนต์ไฟฟ้า:</h4>' +
        '<ul style="padding-left:20px;font-size:13px;color:var(--text-muted);display:flex;flex-direction:column;gap:6px;">' +
          '<li>สำหรับการใช้งานประจำวัน แนะนำชาร์จอยู่ในช่วง <strong>20% - 80%</strong> เพื่ออายุการใช้งานที่ยาวนานที่สุด</li>' +
          '<li>ควรชาร์จแบบ AC เป็นหลัก และใช้ DC Fast Charging เมื่อจำเป็นระหว่างการเดินทางไกล</li>' +
          '<li>หากจอดรถทิ้งไว้เป็นเวลานาน แนะนำรักษาระดับแบตเตอรี่ไว้ที่ประมาณ 50%</li>' +
        '</ul>' +
      '</div>' +
    '</div>';
  }

  function renderCostAnalysisView(agg) {
    return '<div class="card">' +
      '<div class="card-header"><div><div class="card-title"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> วิเคราะห์ความคุ้มค่าและเงินที่ประหยัดได้ (Cost & Savings Analysis)</div><div class="card-subtitle">เปรียบเทียบค่าใช้จ่ายจริงระหว่างพลังงานไฟฟ้ากับรถยนต์น้ำมัน</div></div></div>' +
      '<div class="kpi-grid" style="margin-bottom:24px;">' +
        '<div class="kpi-card" style="--kpi-accent:var(--teal);--kpi-soft:var(--teal-soft)">' +
          '<span class="kpi-label">ต้นทุนรถ EV ของคุณ</span>' +
          '<div class="kpi-value-box" style="margin-top:8px;"><span class="kpi-value" style="color:var(--teal);">' + fmtNum(agg.costPerKm, 2) + '</span><span class="kpi-unit">฿/กิโลเมตร</span></div>' +
          '<div class="kpi-subtext">คำนวณจากค่าไฟจริงทั้งหมด</div>' +
        '</div>' +
        '<div class="kpi-card" style="--kpi-accent:var(--amber);--kpi-soft:var(--amber-soft)">' +
          '<span class="kpi-label">เทียบกับรถน้ำมันเบนซิน</span>' +
          '<div class="kpi-value-box" style="margin-top:8px;"><span class="kpi-value" style="color:var(--amber);">' + fmtNum(agg.petrolCostPerKm, 2) + '</span><span class="kpi-unit">฿/กิโลเมตร</span></div>' +
          '<div class="kpi-subtext">อิงราคาน้ำมัน ' + state.petrolRate.toFixed(1) + ' ฿/ลิตร (' + state.petrolKmPerL.toFixed(0) + ' km/L)</div>' +
        '</div>' +
        '<div class="kpi-card" style="--kpi-accent:var(--emerald);--kpi-soft:var(--emerald-soft)">' +
          '<span class="kpi-label">เงินที่ประหยัดได้สะสมทั้งหมด</span>' +
          '<div class="kpi-value-box" style="margin-top:8px;"><span class="kpi-value" style="color:var(--emerald);">' + fmtNum(agg.totalSavings, 0) + '</span><span class="kpi-unit">฿</span></div>' +
          '<div class="kpi-subtext">ประหยัดเฉลี่ย ' + fmtNum(agg.petrolCostPerKm - agg.costPerKm, 2) + ' ฿ ในทุกๆ 1 km</div>' +
        '</div>' +
      '</div>' +
      '<div style="border-top:1px solid var(--border);padding-top:18px;">' +
        '<h4 style="font-size:14px;font-weight:600;margin-bottom:10px;">ตารางเปรียบเทียบระยะทางต่างๆ:</h4>' +
        '<div class="table-wrapper"><table class="data-table"><thead><tr><th>ระยะทาง</th><th>ค่าไฟ EV (ประมาณการ)</th><th>ค่าน้ำมัน (ประมาณการ)</th><th>เงินที่คุณประหยัดได้</th></tr></thead>' +
        '<tbody>' +
          '<tr><td><strong>100 กิโลเมตร</strong></td><td class="mono">' + fmtNum(agg.costPerKm * 100, 1) + ' ฿</td><td class="mono">' + fmtNum(agg.petrolCostPerKm * 100, 1) + ' ฿</td><td class="mono" style="color:var(--emerald);font-weight:600;">+' + fmtNum((agg.petrolCostPerKm - agg.costPerKm) * 100, 1) + ' ฿</td></tr>' +
          '<tr><td><strong>1,000 กิโลเมตร</strong></td><td class="mono">' + fmtNum(agg.costPerKm * 1000, 1) + ' ฿</td><td class="mono">' + fmtNum(agg.petrolCostPerKm * 1000, 1) + ' ฿</td><td class="mono" style="color:var(--emerald);font-weight:600;">+' + fmtNum((agg.petrolCostPerKm - agg.costPerKm) * 1000, 1) + ' ฿</td></tr>' +
          '<tr><td><strong>10,000 กิโลเมตร</strong></td><td class="mono">' + fmtNum(agg.costPerKm * 10000, 0) + ' ฿</td><td class="mono">' + fmtNum(agg.petrolCostPerKm * 10000, 0) + ' ฿</td><td class="mono" style="color:var(--emerald);font-weight:600;">+' + fmtNum((agg.petrolCostPerKm - agg.costPerKm) * 10000, 0) + ' ฿</td></tr>' +
        '</tbody></table></div>' +
      '</div>' +
    '</div>';
  }

  var thaiMonthNamesShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  var thaiMonthNamesFull = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  function formatThaiDate(iso) {
    if (!iso || iso.length < 10) return iso || "-";
    var p = iso.split("-");
    var y = parseInt(p[0], 10) + 543;
    var m = parseInt(p[1], 10) - 1;
    var d = parseInt(p[2], 10);
    return d + " " + (thaiMonthNamesShort[m] || p[1]) + " " + y;
  }

  function formatThaiMonth(ym) {
    if (!ym || ym.length < 7) return ym || "-";
    var p = ym.split("-");
    var y = parseInt(p[0], 10) + 543;
    var m = parseInt(p[1], 10) - 1;
    return (thaiMonthNamesFull[m] || p[1]) + " " + y;
  }

  function formatThaiYear(y) {
    if (!y) return "-";
    var yr = parseInt(y, 10);
    return isNaN(yr) ? y : (yr + 543) + " (" + y + ")";
  }

  function isDcChargeRecord(r) {
    var text = ((r.note || "") + " " + (r.kind || "")).toLowerCase();
    return text.includes("dc") || text.includes("เร็ว") || text.includes("fast") ||
           text.includes("pea") || text.includes("ptt") || text.includes("ea ") ||
           text.includes("station") || text.includes("charge+");
  }

  function computeMonthlyChargeSummary(rows) {
    var chargeRows = rows.filter(function(r) { return r.kind === "charge"; });
    var map = {};
    chargeRows.forEach(function(r) {
      var ym = (r.iso || "").substring(0, 7) || "Unknown";
      if (!map[ym]) {
        map[ym] = {
          period: ym,
          acCount: 0, acKwh: 0, acCost: 0,
          dcCount: 0, dcKwh: 0, dcCost: 0
        };
      }
      var isDc = isDcChargeRecord(r);
      if (isDc) {
        map[ym].dcCount += 1;
        map[ym].dcKwh += (r.kwh || 0);
        map[ym].dcCost += (r.net || 0);
      } else {
        map[ym].acCount += 1;
        map[ym].acKwh += (r.kwh || 0);
        map[ym].acCost += (r.net || 0);
      }
    });

    var keys = Object.keys(map).sort().reverse();
    return keys.map(function(k) {
      var m = map[k];
      var totCount = m.acCount + m.dcCount;
      var totKwh = m.acKwh + m.dcKwh;
      var totCost = m.acCost + m.dcCost;
      return {
        period: k,
        label: formatThaiMonth(k),
        acCount: m.acCount,
        acKwh: m.acKwh,
        acCost: m.acCost,
        acRate: m.acKwh > 0 ? (m.acCost / m.acKwh) : 0,
        dcCount: m.dcCount,
        dcKwh: m.dcKwh,
        dcCost: m.dcCost,
        dcRate: m.dcKwh > 0 ? (m.dcCost / m.dcKwh) : 0,
        totCount: totCount,
        totKwh: totKwh,
        totCost: totCost,
        totRate: totKwh > 0 ? (totCost / totKwh) : 0,
        acPct: totKwh > 0 ? (m.acKwh / totKwh * 100) : 0,
        dcPct: totKwh > 0 ? (m.dcKwh / totKwh * 100) : 0
      };
    });
  }

  function computeYearlyChargeSummary(rows) {
    var chargeRows = rows.filter(function(r) { return r.kind === "charge"; });
    var map = {};
    chargeRows.forEach(function(r) {
      var y = (r.iso || "").substring(0, 4) || "Unknown";
      if (!map[y]) {
        map[y] = {
          period: y,
          acCount: 0, acKwh: 0, acCost: 0,
          dcCount: 0, dcKwh: 0, dcCost: 0
        };
      }
      var isDc = isDcChargeRecord(r);
      if (isDc) {
        map[y].dcCount += 1;
        map[y].dcKwh += (r.kwh || 0);
        map[y].dcCost += (r.net || 0);
      } else {
        map[y].acCount += 1;
        map[y].acKwh += (r.kwh || 0);
        map[y].acCost += (r.net || 0);
      }
    });

    var keys = Object.keys(map).sort().reverse();
    return keys.map(function(k) {
      var m = map[k];
      var totCount = m.acCount + m.dcCount;
      var totKwh = m.acKwh + m.dcKwh;
      var totCost = m.acCost + m.dcCost;
      return {
        period: k,
        label: formatThaiYear(k),
        acCount: m.acCount,
        acKwh: m.acKwh,
        acCost: m.acCost,
        acRate: m.acKwh > 0 ? (m.acCost / m.acKwh) : 0,
        dcCount: m.dcCount,
        dcKwh: m.dcKwh,
        dcCost: m.dcCost,
        dcRate: m.dcKwh > 0 ? (m.dcCost / m.dcKwh) : 0,
        totCount: totCount,
        totKwh: totKwh,
        totCost: totCost,
        totRate: totKwh > 0 ? (totCost / totKwh) : 0,
        acPct: totKwh > 0 ? (m.acKwh / totKwh * 100) : 0,
        dcPct: totKwh > 0 ? (m.dcKwh / totKwh * 100) : 0
      };
    });
  }

  function computeDailyTripSummary(rows) {
    var tripRows = rows.filter(function(r) { return r.kind === "trip"; });
    var map = {};
    var petrolRate = state.petrolRate || 38.5;
    var petrolKmPerL = state.petrolKmPerL || 16.0;

    tripRows.forEach(function(r) {
      var d = r.iso || "Unknown";
      if (!map[d]) {
        map[d] = {
          period: d,
          trips: 0,
          km: 0,
          mins: 0,
          kwh: 0,
          cost: 0
        };
      }
      map[d].trips += 1;
      map[d].km += (r.km || 0);
      map[d].mins += (r.mins || 0);
      map[d].kwh += (r.kwh || 0);
      map[d].cost += (r.net || 0);
    });

    var keys = Object.keys(map).sort().reverse();
    return keys.map(function(k) {
      var d = map[k];
      var whKm = d.km > 0 && d.kwh > 0 ? (d.kwh * 1000 / d.km) : 0;
      var costKm = d.km > 0 && d.cost > 0 ? (d.cost / d.km) : 0;
      var petrolCost = d.km * (petrolRate / petrolKmPerL);
      var savings = Math.max(0, petrolCost - d.cost);
      return {
        period: k,
        label: formatThaiDate(k),
        trips: d.trips,
        km: d.km,
        mins: d.mins,
        kwh: d.kwh,
        cost: d.cost,
        whKm: whKm,
        costKm: costKm,
        petrolCost: petrolCost,
        savings: savings
      };
    });
  }

  function computeMonthlyTripSummary(rows) {
    var tripRows = rows.filter(function(r) { return r.kind === "trip"; });
    var map = {};
    var petrolRate = state.petrolRate || 38.5;
    var petrolKmPerL = state.petrolKmPerL || 16.0;

    tripRows.forEach(function(r) {
      var ym = (r.iso || "").substring(0, 7) || "Unknown";
      if (!map[ym]) {
        map[ym] = {
          period: ym,
          trips: 0,
          km: 0,
          mins: 0,
          kwh: 0,
          cost: 0
        };
      }
      map[ym].trips += 1;
      map[ym].km += (r.km || 0);
      map[ym].mins += (r.mins || 0);
      map[ym].kwh += (r.kwh || 0);
      map[ym].cost += (r.net || 0);
    });

    var keys = Object.keys(map).sort().reverse();
    return keys.map(function(k) {
      var d = map[k];
      var whKm = d.km > 0 && d.kwh > 0 ? (d.kwh * 1000 / d.km) : 0;
      var costKm = d.km > 0 && d.cost > 0 ? (d.cost / d.km) : 0;
      var petrolCost = d.km * (petrolRate / petrolKmPerL);
      var savings = Math.max(0, petrolCost - d.cost);
      return {
        period: k,
        label: formatThaiMonth(k),
        trips: d.trips,
        km: d.km,
        mins: d.mins,
        kwh: d.kwh,
        cost: d.cost,
        whKm: whKm,
        costKm: costKm,
        petrolCost: petrolCost,
        savings: savings
      };
    });
  }

  function computeYearlyTripSummary(rows) {
    var tripRows = rows.filter(function(r) { return r.kind === "trip"; });
    var map = {};
    var petrolRate = state.petrolRate || 38.5;
    var petrolKmPerL = state.petrolKmPerL || 16.0;

    tripRows.forEach(function(r) {
      var y = (r.iso || "").substring(0, 4) || "Unknown";
      if (!map[y]) {
        map[y] = {
          period: y,
          trips: 0,
          km: 0,
          mins: 0,
          kwh: 0,
          cost: 0
        };
      }
      map[y].trips += 1;
      map[y].km += (r.km || 0);
      map[y].mins += (r.mins || 0);
      map[y].kwh += (r.kwh || 0);
      map[y].cost += (r.net || 0);
    });

    var keys = Object.keys(map).sort().reverse();
    return keys.map(function(k) {
      var d = map[k];
      var whKm = d.km > 0 && d.kwh > 0 ? (d.kwh * 1000 / d.km) : 0;
      var costKm = d.km > 0 && d.cost > 0 ? (d.cost / d.km) : 0;
      var petrolCost = d.km * (petrolRate / petrolKmPerL);
      var savings = Math.max(0, petrolCost - d.cost);
      return {
        period: k,
        label: formatThaiYear(k),
        trips: d.trips,
        km: d.km,
        mins: d.mins,
        kwh: d.kwh,
        cost: d.cost,
        whKm: whKm,
        costKm: costKm,
        petrolCost: petrolCost,
        savings: savings
      };
    });
  }

  function exportCurrentReportToCsv(rows) {
    var isCharging = (state.reportSection || "charging") === "charging";
    var csvRows = [];
    var filename = "";

    if (isCharging) {
      var isMonthly = (state.reportChargePeriod || "monthly") === "monthly";
      var data = isMonthly ? computeMonthlyChargeSummary(rows) : computeYearlyChargeSummary(rows);
      filename = isMonthly ? "ev_charging_summary_monthly.csv" : "ev_charging_summary_yearly.csv";

      csvRows.push([
        "ช่วงเวลา",
        "ชาร์จ AC (ครั้ง)", "ชาร์จ AC (kWh)", "ค่าไฟ AC (บาท)", "อัตราเฉลี่ย AC (บาท/kWh)",
        "ชาร์จ DC (ครั้ง)", "ชาร์จ DC (kWh)", "ค่าไฟ DC (บาท)", "อัตราเฉลี่ย DC (บาท/kWh)",
        "รวมชาร์จ (ครั้ง)", "รวมพลังงาน (kWh)", "รวมค่าไฟ (บาท)", "อัตราเฉลี่ยรวม (บาท/kWh)",
        "สัดส่วน AC (%)", "สัดส่วน DC (%)"
      ]);

      var sumAcN = 0, sumAcKwh = 0, sumAcCost = 0;
      var sumDcN = 0, sumDcKwh = 0, sumDcCost = 0;
      var sumTotN = 0, sumTotKwh = 0, sumTotCost = 0;

      data.forEach(function(d) {
        sumAcN += d.acCount; sumAcKwh += d.acKwh; sumAcCost += d.acCost;
        sumDcN += d.dcCount; sumDcKwh += d.dcKwh; sumDcCost += d.dcCost;
        sumTotN += d.totCount; sumTotKwh += d.totKwh; sumTotCost += d.totCost;

        csvRows.push([
          '"' + d.label + ' (' + d.period + ')"',
          d.acCount, d.acKwh.toFixed(2), d.acCost.toFixed(2), d.acRate.toFixed(2),
          d.dcCount, d.dcKwh.toFixed(2), d.dcCost.toFixed(2), d.dcRate.toFixed(2),
          d.totCount, d.totKwh.toFixed(2), d.totCost.toFixed(2), d.totRate.toFixed(2),
          d.acPct.toFixed(1) + "%", d.dcPct.toFixed(1) + "%"
        ]);
      });

      var totAcRate = sumAcKwh > 0 ? (sumAcCost / sumAcKwh) : 0;
      var totDcRate = sumDcKwh > 0 ? (sumDcCost / sumDcKwh) : 0;
      var totRate = sumTotKwh > 0 ? (sumTotCost / sumTotKwh) : 0;
      var totAcPct = sumTotKwh > 0 ? (sumAcKwh / sumTotKwh * 100) : 0;
      var totDcPct = sumTotKwh > 0 ? (sumDcKwh / sumTotKwh * 100) : 0;

      csvRows.push([
        '"รวมทั้งหมด"',
        sumAcN, sumAcKwh.toFixed(2), sumAcCost.toFixed(2), totAcRate.toFixed(2),
        sumDcN, sumDcKwh.toFixed(2), sumDcCost.toFixed(2), totDcRate.toFixed(2),
        sumTotN, sumTotKwh.toFixed(2), sumTotCost.toFixed(2), totRate.toFixed(2),
        totAcPct.toFixed(1) + "%", totDcPct.toFixed(1) + "%"
      ]);
    } else {
      var period = state.reportTripPeriod || "monthly";
      var tripData = period === "daily" ? computeDailyTripSummary(rows) :
                     period === "yearly" ? computeYearlyTripSummary(rows) : computeMonthlyTripSummary(rows);
      filename = "ev_trip_summary_" + period + ".csv";

      csvRows.push([
        "ช่วงเวลา", "เที่ยววิ่ง (ครั้ง)", "ระยะทางรวม (km)", "เวลาเดินทาง (นาที)",
        "พลังงานที่ใช้ (kWh)", "ค่าไฟเดินทาง (บาท)", "อัตราสิ้นเปลือง (Wh/km)",
        "ต้นทุน (บาท/km)", "ค่าน้ำมันเทียบเคียง (บาท)", "ประหยัดค่าน้ำมัน (บาท)"
      ]);

      var sumTrips = 0, sumKm = 0, sumMins = 0, sumKwh = 0, sumCost = 0, sumPetrol = 0, sumSav = 0;
      tripData.forEach(function(d) {
        sumTrips += d.trips; sumKm += d.km; sumMins += d.mins; sumKwh += d.kwh;
        sumCost += d.cost; sumPetrol += d.petrolCost; sumSav += d.savings;

        csvRows.push([
          '"' + d.label + ' (' + d.period + ')"',
          d.trips, d.km.toFixed(1), d.mins,
          d.kwh.toFixed(2), d.cost.toFixed(2), d.whKm.toFixed(1),
          d.costKm.toFixed(2), d.petrolCost.toFixed(2), d.savings.toFixed(2)
        ]);
      });

      var totWhKm = sumKm > 0 && sumKwh > 0 ? (sumKwh * 1000 / sumKm) : 0;
      var totCostKm = sumKm > 0 && sumCost > 0 ? (sumCost / sumKm) : 0;

      csvRows.push([
        '"รวมทั้งหมด"',
        sumTrips, sumKm.toFixed(1), sumMins,
        sumKwh.toFixed(2), sumCost.toFixed(2), totWhKm.toFixed(1),
        totCostKm.toFixed(2), sumPetrol.toFixed(2), sumSav.toFixed(2)
      ]);
    }

    var csvContent = "\uFEFF" + csvRows.map(function(e) { return e.join(","); }).join("\r\n");
    var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("ส่งออกไฟล์ " + filename + " เรียบร้อยแล้ว", "success");
  }

  function renderReportsView(agg, rows) {
    var chargeRows = rows.filter(function(r) { return r.kind === "charge"; });
    var tripRows = rows.filter(function(r) { return r.kind === "trip"; });

    var totalAcKwh = 0, totalAcCost = 0, totalAcCount = 0;
    var totalDcKwh = 0, totalDcCost = 0, totalDcCount = 0;
    chargeRows.forEach(function(r) {
      if (isDcChargeRecord(r)) {
        totalDcCount += 1;
        totalDcKwh += (r.kwh || 0);
        totalDcCost += (r.net || 0);
      } else {
        totalAcCount += 1;
        totalAcKwh += (r.kwh || 0);
        totalAcCost += (r.net || 0);
      }
    });

    var totalAllChargeKwh = totalAcKwh + totalDcKwh;
    var totalAllChargeCost = totalAcCost + totalDcCost;
    var totalAllChargeCount = totalAcCount + totalDcCount;
    var avgAllRate = totalAllChargeKwh > 0 ? (totalAllChargeCost / totalAllChargeKwh) : 0;
    var avgAcRate = totalAcKwh > 0 ? (totalAcCost / totalAcKwh) : 0;
    var avgDcRate = totalDcKwh > 0 ? (totalDcCost / totalDcKwh) : 0;
    var acPctTotal = totalAllChargeKwh > 0 ? (totalAcKwh / totalAllChargeKwh * 100) : 0;
    var dcPctTotal = totalAllChargeKwh > 0 ? (totalDcKwh / totalAllChargeKwh * 100) : 0;

    var sec = state.reportSection || "charging";
    var chargePeriod = state.reportChargePeriod || "monthly";
    var tripPeriod = state.reportTripPeriod || "monthly";

    // Top KPI Cards
    var topKpisHtml = '<div class="kpi-grid" style="margin-bottom:20px;">' +
      '<div class="kpi-card" style="--kpi-accent:var(--emerald);--kpi-soft:var(--emerald-soft)">' +
        '<div class="kpi-top"><span class="kpi-label">ระยะทางใช้งานรถสะสม</span><div class="kpi-icon-pill"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div></div>' +
        '<div class="kpi-value-box"><span class="kpi-value">' + fmtNum(agg.totalDistanceKm, 0) + '</span><span class="kpi-unit">km</span></div>' +
        '<div class="kpi-subtext">บันทึกแล้ว ' + tripRows.length + ' เที่ยวเดินทาง | ไมล์ล่าสุด ' + fmtNum(agg.latestOdo, 0) + ' km</div>' +
      '</div>' +

      '<div class="kpi-card" style="--kpi-accent:var(--teal);--kpi-soft:var(--teal-soft)">' +
        '<div class="kpi-top"><span class="kpi-label">ชาร์จไฟ AC (บ้าน / ปกติ)</span><div class="kpi-icon-pill"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div></div>' +
        '<div class="kpi-value-box"><span class="kpi-value">' + fmtNum(totalAcKwh, 1) + '</span><span class="kpi-unit">kWh</span></div>' +
        '<div class="kpi-subtext">' + totalAcCount + ' ครั้ง | ' + fmtNum(totalAcCost, 0) + ' ฿ (เฉลี่ย ' + fmtNum(avgAcRate, 2) + ' ฿/u)</div>' +
      '</div>' +

      '<div class="kpi-card" style="--kpi-accent:var(--sky);--kpi-soft:var(--sky-soft)">' +
        '<div class="kpi-top"><span class="kpi-label">ชาร์จไฟ DC (Fast Charge)</span><div class="kpi-icon-pill"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></div></div>' +
        '<div class="kpi-value-box"><span class="kpi-value">' + fmtNum(totalDcKwh, 1) + '</span><span class="kpi-unit">kWh</span></div>' +
        '<div class="kpi-subtext">' + totalDcCount + ' ครั้ง | ' + fmtNum(totalDcCost, 0) + ' ฿ (เฉลี่ย ' + fmtNum(avgDcRate, 2) + ' ฿/u)</div>' +
      '</div>' +

      '<div class="kpi-card" style="--kpi-accent:var(--indigo);--kpi-soft:var(--indigo-soft)">' +
        '<div class="kpi-top"><span class="kpi-label">รวมชาร์จไฟสุทธิ (AC+DC)</span><div class="kpi-icon-pill"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div></div>' +
        '<div class="kpi-value-box"><span class="kpi-value">' + fmtNum(totalAllChargeKwh, 1) + '</span><span class="kpi-unit">kWh</span></div>' +
        '<div class="kpi-subtext">รวม ' + fmtNum(totalAllChargeCost, 0) + ' ฿ | สัดส่วน AC ' + acPctTotal.toFixed(0) + '% : DC ' + dcPctTotal.toFixed(0) + '%</div>' +
      '</div>' +
    '</div>';

    // Section Tabs
    var sectionNavHtml = '<div class="report-section-nav">' +
      '<button class="report-section-btn ' + (sec === "charging" ? "active" : "") + '" data-report-section="charging">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>' +
        'รายงานสรุปยอดการชาร์จไฟ (AC / DC / รวม)' +
      '</button>' +
      '<button class="report-section-btn ' + (sec === "trips" ? "active" : "") + '" data-report-section="trips">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
        'รายงานสรุปการใช้งานรถ (วัน / เดือน / ปี)' +
      '</button>' +
    '</div>';

    var reportContentHtml = "";

    if (sec === "charging") {
      var isMonthly = chargePeriod === "monthly";
      var chargeData = isMonthly ? computeMonthlyChargeSummary(rows) : computeYearlyChargeSummary(rows);

      var periodPills = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">' +
        '<div class="report-period-pills">' +
          '<button class="report-pill-btn ' + (isMonthly ? "active" : "") + '" data-report-charge-period="monthly">📅 สรุปรายเดือน (Monthly)</button>' +
          '<button class="report-pill-btn ' + (!isMonthly ? "active" : "") + '" data-report-charge-period="yearly">📆 สรุปรายปี (Yearly)</button>' +
        '</div>' +
        '<div style="font-size:12.5px;color:var(--text-muted);">แสดง ' + chargeData.length + ' ช่วงเวลา | แยกประเภท Home AC & Station DC</div>' +
      '</div>';

      var tableRowsHtml = "";
      var sumAcCount = 0, sumAcKwh = 0, sumAcCost = 0;
      var sumDcCount = 0, sumDcKwh = 0, sumDcCost = 0;
      var sumTotCount = 0, sumTotKwh = 0, sumTotCost = 0;

      if (chargeData.length === 0) {
        tableRowsHtml = '<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted);">ยังไม่มีประวัติการชาร์จ</td></tr>';
      } else {
        tableRowsHtml = chargeData.map(function(d) {
          sumAcCount += d.acCount; sumAcKwh += d.acKwh; sumAcCost += d.acCost;
          sumDcCount += d.dcCount; sumDcKwh += d.dcKwh; sumDcCost += d.dcCost;
          sumTotCount += d.totCount; sumTotKwh += d.totKwh; sumTotCost += d.totCost;

          return '<tr>' +
            '<td><strong>' + d.label + '</strong><div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">' + d.period + '</div></td>' +
            '<td class="mono" style="text-align:center;">' + (d.acCount > 0 ? d.acCount + ' ครั้ง' : '-') + '</td>' +
            '<td class="mono" style="text-align:right;">' + (d.acKwh > 0 ? fmtNum(d.acKwh, 1) : '-') + '</td>' +
            '<td class="mono" style="text-align:right;color:var(--teal);font-weight:600;">' + (d.acCost > 0 ? fmtNum(d.acCost, 0) + ' ฿' : '-') + '</td>' +
            '<td class="mono" style="text-align:center;">' + (d.dcCount > 0 ? d.dcCount + ' ครั้ง' : '-') + '</td>' +
            '<td class="mono" style="text-align:right;">' + (d.dcKwh > 0 ? fmtNum(d.dcKwh, 1) : '-') + '</td>' +
            '<td class="mono" style="text-align:right;color:var(--sky);font-weight:600;">' + (d.dcCost > 0 ? fmtNum(d.dcCost, 0) + ' ฿' : '-') + '</td>' +
            '<td class="mono" style="text-align:center;font-weight:700;">' + d.totCount + '</td>' +
            '<td class="mono" style="text-align:right;font-weight:700;">' + fmtNum(d.totKwh, 1) + '</td>' +
            '<td class="mono" style="text-align:right;font-weight:700;color:var(--text-main);">' + fmtNum(d.totCost, 0) + ' ฿</td>' +
            '<td class="mono" style="text-align:right;color:var(--text-muted);">' + fmtNum(d.totRate, 2) + '</td>' +
            '<td>' +
              '<div style="font-size:11.5px;font-family:var(--font-mono);display:flex;justify-content:space-between;gap:6px;">' +
                '<span style="color:var(--teal);font-weight:600;">AC ' + d.acPct.toFixed(0) + '%</span>' +
                '<span style="color:var(--sky);font-weight:600;">DC ' + d.dcPct.toFixed(0) + '%</span>' +
              '</div>' +
              '<div class="ratio-bar"><div class="ratio-bar-ac" style="width:' + d.acPct + '%;"></div><div class="ratio-bar-dc" style="width:' + d.dcPct + '%;"></div></div>' +
            '</td>' +
          '</tr>';
        }).join("");
      }

      var grandAcRate = sumAcKwh > 0 ? (sumAcCost / sumAcKwh) : 0;
      var grandDcRate = sumDcKwh > 0 ? (sumDcCost / sumDcKwh) : 0;
      var grandTotRate = sumTotKwh > 0 ? (sumTotCost / sumTotKwh) : 0;
      var grandAcPct = sumTotKwh > 0 ? (sumAcKwh / sumTotKwh * 100) : 0;
      var grandDcPct = sumTotKwh > 0 ? (sumDcKwh / sumTotKwh * 100) : 0;

      var footerHtml = '<tfoot><tr>' +
        '<td><strong>รวมทั้งสิ้น (Grand Total)</strong></td>' +
        '<td class="mono" style="text-align:center;font-weight:700;">' + sumAcCount + ' ครั้ง</td>' +
        '<td class="mono" style="text-align:right;font-weight:700;">' + fmtNum(sumAcKwh, 1) + '</td>' +
        '<td class="mono" style="text-align:right;font-weight:700;color:var(--teal);">' + fmtNum(sumAcCost, 0) + ' ฿</td>' +
        '<td class="mono" style="text-align:center;font-weight:700;">' + sumDcCount + ' ครั้ง</td>' +
        '<td class="mono" style="text-align:right;font-weight:700;">' + fmtNum(sumDcKwh, 1) + '</td>' +
        '<td class="mono" style="text-align:right;font-weight:700;color:var(--sky);">' + fmtNum(sumDcCost, 0) + ' ฿</td>' +
        '<td class="mono" style="text-align:center;font-weight:800;font-size:14px;">' + sumTotCount + '</td>' +
        '<td class="mono" style="text-align:right;font-weight:800;font-size:14px;">' + fmtNum(sumTotKwh, 1) + '</td>' +
        '<td class="mono" style="text-align:right;font-weight:800;font-size:14px;color:var(--teal);">' + fmtNum(sumTotCost, 0) + ' ฿</td>' +
        '<td class="mono" style="text-align:right;font-weight:700;">' + fmtNum(grandTotRate, 2) + '</td>' +
        '<td>' +
          '<div style="font-size:11px;font-family:var(--font-mono);display:flex;justify-content:space-between;">' +
            '<span style="color:var(--teal);font-weight:700;">' + grandAcPct.toFixed(0) + '%</span>' +
            '<span style="color:var(--sky);font-weight:700;">' + grandDcPct.toFixed(0) + '%</span>' +
          '</div>' +
          '<div class="ratio-bar"><div class="ratio-bar-ac" style="width:' + grandAcPct + '%;"></div><div class="ratio-bar-dc" style="width:' + grandDcPct + '%;"></div></div>' +
        '</td>' +
      '</tr></tfoot>';

      reportContentHtml = periodPills +
        '<div class="table-wrapper">' +
          '<table class="data-table report-table">' +
            '<thead>' +
              '<tr>' +
                '<th rowspan="2" style="vertical-align:middle;text-align:left;">ช่วงเวลา</th>' +
                '<th colspan="3" style="background:rgba(13,148,136,0.08);color:var(--teal);border-bottom:1px solid var(--border);">🏠 ชาร์จ AC (บ้าน/ปกติ)</th>' +
                '<th colspan="3" style="background:rgba(2,132,199,0.08);color:var(--sky);border-bottom:1px solid var(--border);">⚡ ชาร์จ DC (สถานี/เร็ว)</th>' +
                '<th colspan="4" style="background:rgba(99,102,241,0.08);color:var(--indigo);border-bottom:1px solid var(--border);">🔌 รวมสุทธิ (AC + DC)</th>' +
                '<th rowspan="2" style="vertical-align:middle;min-width:110px;">สัดส่วน AC:DC</th>' +
              '</tr>' +
              '<tr>' +
                '<th style="background:rgba(13,148,136,0.04);">ครั้ง</th><th style="background:rgba(13,148,136,0.04);">kWh</th><th style="background:rgba(13,148,136,0.04);">ยอดเงิน (฿)</th>' +
                '<th style="background:rgba(2,132,199,0.04);">ครั้ง</th><th style="background:rgba(2,132,199,0.04);">kWh</th><th style="background:rgba(2,132,199,0.04);">ยอดเงิน (฿)</th>' +
                '<th style="background:rgba(99,102,241,0.04);">รวมครั้ง</th><th style="background:rgba(99,102,241,0.04);">รวม kWh</th><th style="background:rgba(99,102,241,0.04);">รวมเงิน (฿)</th><th style="background:rgba(99,102,241,0.04);">฿/kWh</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + tableRowsHtml + '</tbody>' +
            footerHtml +
          '</table>' +
        '</div>';
    } else {
      // Trips Section
      var tripData = tripPeriod === "daily" ? computeDailyTripSummary(rows) :
                     tripPeriod === "yearly" ? computeYearlyTripSummary(rows) : computeMonthlyTripSummary(rows);

      var periodPills = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">' +
        '<div class="report-period-pills">' +
          '<button class="report-pill-btn ' + (tripPeriod === "daily" ? "active" : "") + '" data-report-trip-period="daily">📆 สรุปรายวัน (Daily)</button>' +
          '<button class="report-pill-btn ' + (tripPeriod === "monthly" ? "active" : "") + '" data-report-trip-period="monthly">📅 สรุปรายเดือน (Monthly)</button>' +
          '<button class="report-pill-btn ' + (tripPeriod === "yearly" ? "active" : "") + '" data-report-trip-period="yearly">🗓️ สรุปรายปี (Yearly)</button>' +
        '</div>' +
        '<div style="font-size:12.5px;color:var(--text-muted);">แสดง ' + tripData.length + ' ช่วงเวลา | ติดตามระยะทางและประสิทธิภาพการขับขี่</div>' +
      '</div>';

      var sumTrips = 0, sumKm = 0, sumMins = 0, sumKwh = 0, sumCost = 0, sumPetrol = 0, sumSav = 0;
      var tableRowsHtml = "";

      if (tripData.length === 0) {
        tableRowsHtml = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">ยังไม่มีประวัติการเดินทาง</td></tr>';
      } else {
        tableRowsHtml = tripData.map(function(d) {
          sumTrips += d.trips; sumKm += d.km; sumMins += d.mins; sumKwh += d.kwh;
          sumCost += d.cost; sumPetrol += d.petrolCost; sumSav += d.savings;

          var durationStr = d.mins > 0 ? (Math.floor(d.mins / 60) > 0 ? Math.floor(d.mins / 60) + ' ชม. ' : '') + (d.mins % 60) + ' น.' : '-';

          return '<tr>' +
            '<td><strong>' + d.label + '</strong><div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">' + d.period + '</div></td>' +
            '<td class="mono" style="text-align:center;">' + d.trips + ' เที่ยว</td>' +
            '<td class="mono" style="text-align:right;font-weight:700;">' + fmtNum(d.km, 1) + ' km</td>' +
            '<td class="mono" style="text-align:center;">' + durationStr + '</td>' +
            '<td class="mono" style="text-align:right;">' + (d.kwh > 0 ? fmtNum(d.kwh, 2) + ' kWh' : '-') + '</td>' +
            '<td class="mono" style="text-align:right;color:var(--teal);font-weight:600;">' + (d.cost > 0 ? fmtNum(d.cost, 1) + ' ฿' : '-') + '</td>' +
            '<td class="mono" style="text-align:right;">' + (d.whKm > 0 ? fmtNum(d.whKm, 1) + ' Wh/km' : '-') + '</td>' +
            '<td class="mono" style="text-align:right;">' + (d.costKm > 0 ? fmtNum(d.costKm, 2) + ' ฿' : '-') + '</td>' +
            '<td class="mono" style="text-align:right;color:var(--text-muted);">' + fmtNum(d.petrolCost, 1) + ' ฿</td>' +
            '<td class="mono" style="text-align:right;color:var(--emerald);font-weight:700;">+' + fmtNum(d.savings, 1) + ' ฿</td>' +
          '</tr>';
        }).join("");
      }

      var grandWhKm = sumKm > 0 && sumKwh > 0 ? (sumKwh * 1000 / sumKm) : 0;
      var grandCostKm = sumKm > 0 && sumCost > 0 ? (sumCost / sumKm) : 0;
      var grandDurationStr = sumMins > 0 ? (Math.floor(sumMins / 60) > 0 ? Math.floor(sumMins / 60) + ' ชม. ' : '') + (sumMins % 60) + ' น.' : '-';

      var footerHtml = '<tfoot><tr>' +
        '<td><strong>รวมทั้งสิ้น (Grand Total)</strong></td>' +
        '<td class="mono" style="text-align:center;font-weight:800;">' + sumTrips + ' เที่ยว</td>' +
        '<td class="mono" style="text-align:right;font-weight:800;color:var(--text-main);">' + fmtNum(sumKm, 1) + ' km</td>' +
        '<td class="mono" style="text-align:center;font-weight:700;">' + grandDurationStr + '</td>' +
        '<td class="mono" style="text-align:right;font-weight:700;">' + fmtNum(sumKwh, 1) + ' kWh</td>' +
        '<td class="mono" style="text-align:right;font-weight:800;color:var(--teal);">' + fmtNum(sumCost, 1) + ' ฿</td>' +
        '<td class="mono" style="text-align:right;font-weight:700;">' + (grandWhKm > 0 ? fmtNum(grandWhKm, 1) + ' Wh/km' : '-') + '</td>' +
        '<td class="mono" style="text-align:right;font-weight:700;">' + (grandCostKm > 0 ? fmtNum(grandCostKm, 2) + ' ฿' : '-') + '</td>' +
        '<td class="mono" style="text-align:right;font-weight:700;color:var(--text-muted);">' + fmtNum(sumPetrol, 1) + ' ฿</td>' +
        '<td class="mono" style="text-align:right;font-weight:800;color:var(--emerald);font-size:14px;">+' + fmtNum(sumSav, 1) + ' ฿</td>' +
      '</tr></tfoot>';

      reportContentHtml = periodPills +
        '<div class="table-wrapper">' +
          '<table class="data-table report-table">' +
            '<thead>' +
              '<tr>' +
                '<th style="text-align:left;">ช่วงเวลา</th>' +
                '<th>เที่ยววิ่ง</th>' +
                '<th style="text-align:right;">ระยะทางรวม</th>' +
                '<th>เวลาเดินทาง</th>' +
                '<th style="text-align:right;">พลังงานที่ใช้</th>' +
                '<th style="text-align:right;">ค่าไฟเดินทาง</th>' +
                '<th style="text-align:right;">อัตราสิ้นเปลือง</th>' +
                '<th style="text-align:right;">ต้นทุน / กม.</th>' +
                '<th style="text-align:right;">ค่าน้ำมันเทียบเคียง</th>' +
                '<th style="text-align:right;color:var(--emerald);">ประหยัดได้</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + tableRowsHtml + '</tbody>' +
            footerHtml +
          '</table>' +
        '</div>';
    }

    return '<div class="card">' +
      '<div class="card-header"><div>' +
        '<div class="card-title">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>' +
          'รายงานสรุปการใช้งานและยอดการชาร์จ (Reports & Analytics)' +
        '</div>' +
        '<div class="card-subtitle">วิเคราะห์การใช้งานรถรายวัน/เดือน/ปี และยอดชาร์จแยกตาม AC (Home) / DC (Fast Charge)</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="btn btn-secondary btn-sm" onclick="window.print()"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> พิมพ์รายงาน</button>' +
        '<button class="btn btn-primary btn-sm" id="btnExportReportCsv"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> ส่งออกรายงานนี้ (.CSV)</button>' +
      '</div></div>' +
      topKpisHtml +
      sectionNavHtml +
      reportContentHtml +
    '</div>';
  }

  function renderManageView(rows) {
    var meta = (state.payload.data && state.payload.data.meta) || {};
    var reversedRows = rows.slice().reverse();

    var rowsHtml = reversedRows.map(function(r) {
      return '<tr>' +
        '<td class="mono"><strong>#' + r.sheetRowIndex + '</strong></td>' +
        '<td><span class="badge ' + (r.kind === 'charge' ? 'badge-teal' : 'badge-subtle') + '">' + (r.kind === 'charge' ? 'ชาร์จไฟ' : 'เดินทาง') + '</span></td>' +
        '<td>' + (r.iso || "-") + '</td>' +
        '<td class="mono">' + (r.time || "-") + '</td>' +
        '<td class="mono">' + (r.kwh ? fmtNum(r.kwh, 2) + ' kWh' : '-') + '</td>' +
        '<td class="mono">' + (r.net ? fmtNum(r.net, 2) + ' ฿' : '-') + '</td>' +
        '<td>' + (r.note || "-") + '</td>' +
        '<td><div style="display:flex;gap:6px;">' +
          '<button class="btn btn-secondary btn-sm" data-action="edit" data-row="' + r.sheetRowIndex + '">แก้ไข</button>' +
          '<button class="btn btn-danger btn-sm" data-action="delete" data-row="' + r.sheetRowIndex + '">ลบ</button>' +
        '</div></td>' +
        '</tr>';
    }).join("");

    return '<div class="card">' +
      '<div class="card-header"><div><div class="card-title"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg> จัดการฐานข้อมูล Google Sheets (Direct Sheet CRUD)</div><div class="card-subtitle">ตรวจสอบแถวข้อมูล แก้ไข หรือลบแถวโดยตรงใน Google Sheets</div></div><div><a href="' + (meta.sheetUrl || '#') + '" target="_blank" class="btn btn-secondary btn-sm">🔗 เปิดใน Google Sheets</a></div></div>' +
      '<div class="table-wrapper"><table class="data-table"><thead><tr><th>แถวชีต</th><th>ประเภท</th><th>วันที่</th><th>เวลา</th><th>พลังงาน</th><th>ค่าไฟ</th><th>หมายเหตุ / สถานที่</th><th>การกระทำ</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody></table></div>' +
    '</div>';
  }

  function renderSettingsView() {
    return '<div class="card" style="max-width:800px;margin:0 auto;width:100%;">' +
      '<div class="card-header"><div><div class="card-title"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2.2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> ตั้งค่าระบบ (System Configuration)</div><div class="card-subtitle">แก้ไขความจุแบตเตอรี่รถและอัตราค่าไฟฟ้าพื้นฐาน ซึ่งจะนำไปคำนวณในแดชบอร์ดและฟอร์มทั้งหมดทันที</div></div></div>' +
      '<form id="formSettings" style="display:flex;flex-direction:column;gap:24px;">' +
        '<div style="border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px;">' +
          '<h4 style="font-size:14.5px;font-weight:700;color:var(--text-main);margin-bottom:12px;">⚡ กำหนดค่าอัตราค่าไฟฟ้าพื้นฐาน (Electricity Unit Rates)</h4>' +
          '<div class="form-grid">' +
            '<div class="form-group"><label>อัตราค่าไฟฟ้าปกติ / พื้นฐาน (฿/kWh)</label><input type="number" step="0.01" class="form-control mono" id="cfgUnitRate" value="' + state.unitRate + '" required><span class="form-hint">ใช้เป็นอัตราอ้างอิงในการคำนวณค่าไฟต่อหน่วย (Default: 4.90 หรือ 4.20)</span></div>' +
            '<div class="form-group"><label>อัตราช่วง On-Peak (฿/kWh)</label><input type="number" step="0.01" class="form-control mono" id="cfgRateOnPeak" value="' + state.rateOnPeak + '"><span class="form-hint">เช่น อัตราค่าไฟ TOU ช่วง 09:00 - 22:00 น.</span></div>' +
            '<div class="form-group"><label>อัตราช่วง Off-Peak (฿/kWh)</label><input type="number" step="0.01" class="form-control mono" id="cfgRateOffPeak" value="' + state.rateOffPeak + '"><span class="form-hint">เช่น อัตราค่าไฟ TOU ช่วง 22:00 - 09:00 น. หรือวันหยุด</span></div>' +
          '</div>' +
        '</div>' +
        '<div style="border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px;">' +
          '<h4 style="font-size:14.5px;font-weight:700;color:var(--text-main);margin-bottom:12px;">🔋 ตั้งค่าความจุแบตเตอรี่และข้อมูลรถยนต์ (Battery Capacity & Vehicle)</h4>' +
          '<div class="form-grid">' +
            '<div class="form-group"><label>ชื่อรุ่นรถยนต์ (Vehicle Model)</label><input type="text" class="form-control" id="cfgVehicleName" value="' + state.vehicleName + '" required></div>' +
            '<div class="form-group"><label>ความจุแบตเตอรี่ (kWh) *แก้ไขได้ตลอดเวลา</label><input type="number" step="0.1" class="form-control mono" id="cfgBatteryCapacity" value="' + state.batteryCapacity + '" required><span class="form-hint">ใช้คำนวณ SOC% และพลังงานเข้าสู่แบตเตอรี่ (เช่น 68.5, 60.4, 82.5)</span></div>' +
            '<div class="form-group"><label>เลขทะเบียนรถ</label><input type="text" class="form-control" id="cfgVehiclePlate" value="' + state.vehiclePlate + '"></div>' +
          '</div>' +
          '<div style="margin-top:14px;">' +
            '<div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px;">เลือกรุ่นรถสำเร็จรูป (Presets):</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
              '<button type="button" class="btn btn-secondary btn-sm" data-preset="XPENG G6 Standard" data-cap="68.5">XPENG G6 STD (68.5 kWh)</button>' +
              '<button type="button" class="btn btn-secondary btn-sm" data-preset="XPENG G6 Long Range" data-cap="87.5">XPENG G6 LR (87.5 kWh)</button>' +
              '<button type="button" class="btn btn-secondary btn-sm" data-preset="BYD Atto 3 Extended" data-cap="60.48">BYD Atto 3 (60.5 kWh)</button>' +
              '<button type="button" class="btn btn-secondary btn-sm" data-preset="BYD Seal Premium" data-cap="82.5">BYD Seal (82.5 kWh)</button>' +
              '<button type="button" class="btn btn-secondary btn-sm" data-preset="Tesla Model Y RWD" data-cap="60.0">Tesla Model Y (60 kWh)</button>' +
              '<button type="button" class="btn btn-secondary btn-sm" data-preset="Tesla Model 3 LR" data-cap="75.0">Tesla Model 3 LR (75 kWh)</button>' +
              '<button type="button" class="btn btn-secondary btn-sm" data-preset="MG4 Electric" data-cap="51.0">MG4 (51 kWh)</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px;">' +
          '<h4 style="font-size:14.5px;font-weight:700;color:var(--text-main);margin-bottom:12px;">⛽ ค่าเปรียบเทียบน้ำมันเบนซิน (Petrol Benchmark for Savings)</h4>' +
          '<div class="form-grid">' +
            '<div class="form-group"><label>ราคาน้ำมันเบนซินอ้างอิง (฿/ลิตร)</label><input type="number" step="0.1" class="form-control mono" id="cfgPetrolRate" value="' + state.petrolRate + '"></div>' +
            '<div class="form-group"><label>อัตราสิ้นเปลืองรถน้ำมัน (กิโลเมตร/ลิตร)</label><input type="number" step="0.5" class="form-control mono" id="cfgPetrolKmL" value="' + state.petrolKmPerL + '"></div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">' +
          '<button type="button" class="btn btn-secondary" id="btnResetSettings">คืนค่าเริ่มต้น (Reset Defaults)</button>' +
          '<button type="submit" class="btn btn-primary" id="btnSaveSettings"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> บันทึกการตั้งค่าลงระบบ (Save Settings)</button>' +
        '</div>' +
      '</form>' +
    '</div>';
  }

  function bindViewEvents() {
    var btnRefresh = document.getElementById("btnRefreshData");
    if (btnRefresh) {
      btnRefresh.onclick = async function() {
        btnRefresh.disabled = true;
        try {
          var res = await fetch("/api/data");
          var json = await res.json();
          if (json.ok && json.data) {
            state.payload = json;
            showToast("อัปเดตข้อมูลล่าสุดจาก Google Sheets สำเร็จ!", "success");
            renderView();
          } else {
            showToast("ไม่สามารถดึงข้อมูลได้: " + (json.error || "Unknown"), "error");
          }
        } catch (e) {
          showToast("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว", "error");
        } finally {
          btnRefresh.disabled = false;
        }
      };
    }

    var inputSearch = document.getElementById("inputSearchCharge");
    if (inputSearch) {
      inputSearch.oninput = function(e) {
        state.filterSearch = e.target.value;
        renderView();
        var nextInput = document.getElementById("inputSearchCharge");
        if (nextInput) {
          nextInput.focus();
          nextInput.selectionStart = nextInput.selectionEnd = nextInput.value.length;
        }
      };
    }

    var selectStation = document.getElementById("selectStationType");
    if (selectStation) {
      selectStation.onchange = function(e) {
        state.filterStation = e.target.value;
        renderView();
      };
    }

    var btnExport = document.getElementById("btnExportCsv");
    if (btnExport) {
      btnExport.onclick = function() {
        var rows = (state.payload.data && state.payload.data.rows) || [];
        var lines = ["﻿Row,Date,Time,Kind,Distance_km,SOC_Start,SOC_End,Energy_kWh,Cost_Net_THB,Note"];
        rows.forEach(function(r) {
          lines.push([
            r.sheetRowIndex,
            r.iso || '',
            r.time || '',
            r.kind || '',
            r.km || 0,
            r.s0 || 0,
            r.s1 || 0,
            r.kwh || 0,
            r.net || 0,
            (r.note || '').replace(/"/g, '""')
          ].map(function(v) { return '"' + v + '"'; }).join(","));
        });
        var csv = lines.join(String.fromCharCode(10));
        var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "ev-charging-log-" + new Date().toISOString().substring(0, 10) + ".csv";
        a.click();
        URL.revokeObjectURL(url);
        showToast("ส่งออกไฟล์ CSV สำเร็จ!", "success");
      };
    }

    var formAdd = document.getElementById("formAddCharge");
    if (formAdd) {
      var s0In = document.getElementById("addSocStart");
      var s1In = document.getElementById("addSocEnd");
      var kwhIn = document.getElementById("addEnergyKwh");
      var costIn = document.getElementById("addCostNetThb");
      var kwhHint = document.getElementById("addKwhHint");
      var costHint = document.getElementById("addCostHint");

      var recalc = function() {
        var s0 = parseFloat(s0In.value) || 0;
        var s1 = parseFloat(s1In.value) || 0;
        var diff = Math.max(0, s1 - s0);
        var calculatedKwh = (diff / 100) * state.batteryCapacity;
        kwhIn.value = calculatedKwh.toFixed(2);
        var calculatedCost = calculatedKwh * state.unitRate;
        costIn.value = calculatedCost.toFixed(2);

        if (kwhHint) kwhHint.innerText = "คำนวณจาก (" + s1 + " - " + s0 + ")% × " + state.batteryCapacity.toFixed(1) + " kWh";
        if (costHint) costHint.innerText = "คำนวณจาก " + calculatedKwh.toFixed(2) + " kWh × " + state.unitRate.toFixed(2) + " ฿/kWh";
      };

      s0In.oninput = recalc;
      s1In.oninput = recalc;
      recalc();

      formAdd.onsubmit = async function(e) {
        e.preventDefault();
        var btnSubmit = document.getElementById("btnSubmitAddCharge");
        if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerText = "กำลังบันทึกข้อมูล..."; }

        var formData = new FormData(formAdd);
        var payload = {
          date: formData.get("date"),
          time: formData.get("time"),
          socStart: formData.get("socStart"),
          socEnd: formData.get("socEnd"),
          energyKwh: formData.get("energyKwh"),
          costNetThb: formData.get("costNetThb"),
          costGridThb: formData.get("costNetThb"),
          durationMin: formData.get("durationMin"),
          odoEnd: formData.get("odoEnd"),
          note: formData.get("note")
        };

        try {
          var res = await fetch("/api/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          var json = await res.json();
          if (json.ok) {
            showToast("บันทึกการชาร์จใหม่เข้า Google Sheets เรียบร้อยแล้ว!", "success");
            var dRes = await fetch("/api/data");
            var dJson = await dRes.json();
            if (dJson.ok) state.payload = dJson;
            window.evNavigate("charging-history");
          } else {
            showToast("บันทึกไม่สำเร็จ: " + (json.error || "Unknown"), "error");
          }
        } catch (err) {
          showToast("เกิดข้อผิดพลาดในการส่งข้อมูล: " + err.message, "error");
        } finally {
          if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = "บันทึกข้อมูลการชาร์จ"; }
        }
      };
    }

    var formTrip = document.getElementById("formAddTrip");
    if (formTrip) {
      var odo0In = document.getElementById("tripOdoStart");
      var odo1In = document.getElementById("tripOdoEnd");
      var distIn = document.getElementById("tripDistanceKm");
      var s0In = document.getElementById("tripSocStart");
      var s1In = document.getElementById("tripSocEnd");
      var consIn = document.getElementById("tripAvgConsumption");
      var kwhIn = document.getElementById("tripEnergyKwh");
      var costIn = document.getElementById("tripCostNetThb");
      var distHint = document.getElementById("tripDistHint");
      var kwhHint = document.getElementById("tripKwhHint");
      var costHint = document.getElementById("tripCostHint");

      var recalcTrip = function(source) {
        var o0 = parseFloat(odo0In.value);
        var o1 = parseFloat(odo1In.value);
        var d = parseFloat(distIn.value);
        var s0 = parseFloat(s0In.value);
        var s1 = parseFloat(s1In.value);
        var cons = parseFloat(consIn.value);

        if (source === "odo" && !isNaN(o0) && !isNaN(o1) && o1 >= o0) {
          d = Math.round((o1 - o0) * 10) / 10;
          distIn.value = d;
          if (distHint) distHint.innerText = "คำนวณจาก " + o1 + " - " + o0 + " = " + d + " km";
        } else if (source === "dist" && !isNaN(o0) && !isNaN(d) && d > 0) {
          o1 = Math.round((o0 + d) * 10) / 10;
          odo1In.value = o1;
        }

        var kwh = 0;
        if (!isNaN(s0) && !isNaN(s1) && s0 > s1) {
          var socDiff = s0 - s1;
          kwh = (socDiff / 100) * state.batteryCapacity;
          kwhIn.value = kwh.toFixed(2);
          if (kwhHint) kwhHint.innerText = "คำนวณจาก (" + s0 + " - " + s1 + ")% × " + state.batteryCapacity.toFixed(1) + " kWh";
          if (d > 0 && isNaN(cons)) {
            cons = (kwh * 1000) / d;
            consIn.value = cons.toFixed(1);
          }
        } else if (!isNaN(cons) && cons > 0 && d > 0) {
          kwh = (d * cons) / 1000;
          kwhIn.value = kwh.toFixed(2);
          if (kwhHint) kwhHint.innerText = "คำนวณจาก (" + d + " km × " + cons + " Wh/km) ÷ 1,000";
        }

        var currentKwh = parseFloat(kwhIn.value) || kwh;
        var cost = currentKwh * state.unitRate;
        costIn.value = cost.toFixed(2);
        if (costHint) costHint.innerText = "คำนวณจาก " + currentKwh.toFixed(2) + " kWh × " + state.unitRate.toFixed(2) + " ฿/kWh";
      };

      if (odo0In) odo0In.oninput = function() { recalcTrip("odo"); };
      if (odo1In) odo1In.oninput = function() { recalcTrip("odo"); };
      if (distIn) distIn.oninput = function() { recalcTrip("dist"); };
      if (s0In) s0In.oninput = function() { recalcTrip("soc"); };
      if (s1In) s1In.oninput = function() { recalcTrip("soc"); };
      if (consIn) consIn.oninput = function() { recalcTrip("cons"); };
      if (kwhIn) kwhIn.oninput = function() { recalcTrip("kwh"); };

      formTrip.onsubmit = async function(e) {
        e.preventDefault();
        var btnSubmit = document.getElementById("btnSubmitAddTrip");
        if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerText = "กำลังบันทึกข้อมูล..."; }

        var formData = new FormData(formTrip);
        var payload = {
          date: formData.get("date"),
          time: formData.get("time"),
          odoStart: formData.get("odoStart"),
          odoEnd: formData.get("odoEnd"),
          distanceKm: formData.get("distanceKm"),
          durationMin: formData.get("durationMin"),
          avgConsumption: formData.get("avgConsumption"),
          socStart: formData.get("socStart"),
          socEnd: formData.get("socEnd"),
          energyKwh: formData.get("energyKwh"),
          costNetThb: formData.get("costNetThb"),
          costGridThb: formData.get("costNetThb"),
          note: formData.get("note")
        };

        try {
          var res = await fetch("/api/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          var json = await res.json();
          if (json.ok) {
            showToast("บันทึกการเดินทางใหม่เข้า Google Sheets เรียบร้อยแล้ว!", "success");
            var dRes = await fetch("/api/data");
            var dJson = await dRes.json();
            if (dJson.ok) state.payload = dJson;
            window.evNavigate("trips");
          } else {
            showToast("บันทึกไม่สำเร็จ: " + (json.error || "Unknown"), "error");
          }
        } catch (err) {
          showToast("เกิดข้อผิดพลาดในการส่งข้อมูล: " + err.message, "error");
        } finally {
          if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = "บันทึกข้อมูลการเดินทาง"; }
        }
      };
    }

    var formSettings = document.getElementById("formSettings");
    if (formSettings) {
      formSettings.onsubmit = function(e) {
        e.preventDefault();
        var cap = parseFloat(document.getElementById("cfgBatteryCapacity").value) || 68.5;
        var rate = parseFloat(document.getElementById("cfgUnitRate").value) || 4.90;
        var onPeak = parseFloat(document.getElementById("cfgRateOnPeak").value) || 4.70;
        var offPeak = parseFloat(document.getElementById("cfgRateOffPeak").value) || 2.60;
        var petRate = parseFloat(document.getElementById("cfgPetrolRate").value) || 38.5;
        var petKmL = parseFloat(document.getElementById("cfgPetrolKmL").value) || 16.0;
        var vName = document.getElementById("cfgVehicleName").value.trim() || "XPENG G6 STD";
        var vPlate = document.getElementById("cfgVehiclePlate").value.trim() || "4ขข 8821";

        state.batteryCapacity = cap;
        state.unitRate = rate;
        state.rateOnPeak = onPeak;
        state.rateOffPeak = offPeak;
        state.petrolRate = petRate;
        state.petrolKmPerL = petKmL;
        state.vehicleName = vName;
        state.vehiclePlate = vPlate;

        localStorage.setItem("ev_battery_capacity", cap.toString());
        localStorage.setItem("ev_unit_rate", rate.toString());
        localStorage.setItem("ev_rate_onpeak", onPeak.toString());
        localStorage.setItem("ev_rate_offpeak", offPeak.toString());
        localStorage.setItem("ev_petrol_rate", petRate.toString());
        localStorage.setItem("ev_petrol_km_l", petKmL.toString());
        localStorage.setItem("ev_vehicle_name", vName);
        localStorage.setItem("ev_vehicle_plate", vPlate);

        showToast("บันทึกการตั้งค่าสำเร็จ! อัตราค่าไฟและขนาดแบตเตอรี่อัปเดตเรียบร้อยแล้ว", "success");
        renderView();
      };

      var btnReset = document.getElementById("btnResetSettings");
      if (btnReset) {
        btnReset.onclick = function() {
          if (!confirm("คุณต้องการคืนค่าเริ่มต้นทั้งหมดใช่หรือไม่?")) return;
          localStorage.removeItem("ev_battery_capacity");
          localStorage.removeItem("ev_unit_rate");
          localStorage.removeItem("ev_rate_onpeak");
          localStorage.removeItem("ev_rate_offpeak");
          localStorage.removeItem("ev_petrol_rate");
          localStorage.removeItem("ev_petrol_km_l");
          localStorage.removeItem("ev_vehicle_name");
          localStorage.removeItem("ev_vehicle_plate");

          state.batteryCapacity = (window.__INITIAL_PAYLOAD__.data && window.__INITIAL_PAYLOAD__.data.meta && window.__INITIAL_PAYLOAD__.data.meta.batteryCapacity) || 68.5;
          state.unitRate = (window.__INITIAL_PAYLOAD__.data && window.__INITIAL_PAYLOAD__.data.meta && window.__INITIAL_PAYLOAD__.data.meta.rate) || 4.90;
          state.rateOnPeak = 4.70;
          state.rateOffPeak = 2.60;
          state.petrolRate = 38.5;
          state.petrolKmPerL = 16.0;
          state.vehicleName = (window.__INITIAL_PAYLOAD__.data && window.__INITIAL_PAYLOAD__.data.meta && window.__INITIAL_PAYLOAD__.data.meta.vehicle) || "XPENG G6 STD";
          state.vehiclePlate = "4ขข 8821 กทม.";

          showToast("คืนค่าเริ่มต้นเรียบร้อยแล้ว", "info");
          renderView();
        };
      }
    }
  }

  window.evNavigate = function(view) {
    state.activeView = view;
    if (history.pushState) {
      var newPath = view === "dashboard" ? "/" : "/" + view;
      history.pushState(null, "", newPath);
    }
    var sidebar = document.getElementById("appSidebar");
    var backdrop = document.getElementById("drawerBackdrop");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("show");

    renderView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.evApplyPreset = function(modelName, capacity) {
    var capIn = document.getElementById("cfgBatteryCapacity");
    var nameIn = document.getElementById("cfgVehicleName");
    if (capIn) capIn.value = capacity;
    if (nameIn) nameIn.value = modelName;
    showToast("เลือกสเปก " + modelName + " (" + capacity + " kWh) แล้ว กรุณากดบันทึก", "info");
  };

  window.evEditRecord = function(sheetRowIndex) {
    var rows = (state.payload.data && state.payload.data.rows) || [];
    var record = rows.find(function(r) { return r.sheetRowIndex === sheetRowIndex; });
    if (!record) return;

    var modal = document.getElementById("modalContainer");
    modal.innerHTML = '<div class="modal-backdrop" id="editModalBackdrop">' +
      '<div class="modal-content">' +
        '<div class="modal-header">' +
          '<div class="modal-title">✏️ แก้ไขข้อมูลแถวที่ #' + record.sheetRowIndex + '</div>' +
          '<button class="btn btn-secondary btn-sm" id="btnCloseEditModal">✕</button>' +
        '</div>' +
        '<form id="formEditRecord">' +
          '<div class="modal-body">' +
            '<input type="hidden" name="sheetRowIndex" value="' + record.sheetRowIndex + '">' +
            '<div class="form-grid">' +
              '<div class="form-group"><label>วันที่ (YYYY-MM-DD)</label><input type="date" class="form-control" name="date" value="' + (record.iso || '') + '" required></div>' +
              '<div class="form-group"><label>เวลา (HH:MM)</label><input type="time" class="form-control" name="time" value="' + (record.time || '') + '"></div>' +
            '</div>' +
            '<div class="form-grid">' +
              '<div class="form-group"><label>SOC เริ่ม (%)</label><input type="number" class="form-control" name="socStart" value="' + (record.s0 || 0) + '"></div>' +
              '<div class="form-group"><label>SOC จบ (%)</label><input type="number" class="form-control" name="socEnd" value="' + (record.s1 || 0) + '"></div>' +
            '</div>' +
            '<div class="form-grid">' +
              '<div class="form-group"><label>พลังงาน (kWh)</label><input type="number" step="0.01" class="form-control" name="energyKwh" value="' + (record.kwh || 0) + '" required></div>' +
              '<div class="form-group"><label>ค่าไฟสุทธิ (฿)</label><input type="number" step="0.01" class="form-control" name="costNetThb" value="' + (record.net || 0) + '" required></div>' +
            '</div>' +
            '<div class="form-grid">' +
              '<div class="form-group"><label>ระยะทาง (km)</label><input type="number" step="0.1" class="form-control" name="distanceKm" value="' + (record.km || 0) + '"></div>' +
              '<div class="form-group"><label>เลขไมล์สิ้นสุด (Odometer)</label><input type="number" class="form-control" name="odoEnd" value="' + (record.odoEnd || '') + '"></div>' +
            '</div>' +
            '<div class="form-group"><label>หมายเหตุ / สถานีชาร์จ</label><input type="text" class="form-control" name="note" value="' + (record.note || '') + '"></div>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-secondary" id="btnCancelEdit">ยกเลิก</button>' +
            '<button type="submit" class="btn btn-primary" id="btnSubmitEdit">บันทึกการแก้ไข</button>' +
          '</div>' +
        '</form>' +
      '</div>' +
    '</div>';

    var close = function() { modal.innerHTML = ""; };
    document.getElementById("btnCloseEditModal").onclick = close;
    document.getElementById("btnCancelEdit").onclick = close;

    var f = document.getElementById("formEditRecord");
    f.onsubmit = async function(e) {
      e.preventDefault();
      var btn = document.getElementById("btnSubmitEdit");
      btn.disabled = true; btn.innerText = "กำลังบันทึก...";
      var fd = new FormData(f);
      var data = {
        sheetRowIndex: parseInt(fd.get("sheetRowIndex"), 10),
        date: fd.get("date"),
        time: fd.get("time"),
        socStart: fd.get("socStart"),
        socEnd: fd.get("socEnd"),
        energyKwh: fd.get("energyKwh"),
        costNetThb: fd.get("costNetThb"),
        costGridThb: fd.get("costNetThb"),
        distanceKm: fd.get("distanceKm"),
        odoEnd: fd.get("odoEnd"),
        note: fd.get("note")
      };

      try {
        var res = await fetch("/api/records", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        var json = await res.json();
        if (json.ok) {
          showToast("แก้ไขแถวที่ #" + data.sheetRowIndex + " เรียบร้อยแล้ว!", "success");
          close();
          var dRes = await fetch("/api/data");
          var dJson = await dRes.json();
          if (dJson.ok) state.payload = dJson;
          renderView();
        } else {
          showToast("แก้ไขไม่สำเร็จ: " + (json.error || "Unknown"), "error");
        }
      } catch (err) {
        showToast("เกิดข้อผิดพลาด: " + err.message, "error");
      } finally {
        btn.disabled = false; btn.innerText = "บันทึกการแก้ไข";
      }
    };
  };

  window.evDeleteRecord = function(sheetRowIndex) {
    var modal = document.getElementById("modalContainer");
    modal.innerHTML = '<div class="modal-backdrop">' +
      '<div class="modal-content" style="max-width:440px;">' +
        '<div class="modal-header">' +
          '<div class="modal-title" style="color:var(--rose)">⚠️ ยืนยันการลบข้อมูล</div>' +
          '<button class="btn btn-secondary btn-sm" id="btnCloseDelModal">✕</button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<p>คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลแถวที่ <strong>#' + sheetRowIndex + '</strong> ใน Google Sheets? การกระทำนี้ไม่สามารถย้อนกลับได้</p>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-secondary" id="btnCancelDel">ยกเลิก</button>' +
          '<button class="btn btn-danger" id="btnConfirmDel">ยืนยันลบข้อมูล</button>' +
        '</div>' +
      '</div>' +
    '</div>';

    var close = function() { modal.innerHTML = ""; };
    document.getElementById("btnCloseDelModal").onclick = close;
    document.getElementById("btnCancelDel").onclick = close;

    document.getElementById("btnConfirmDel").onclick = async function() {
      var btn = document.getElementById("btnConfirmDel");
      btn.disabled = true; btn.innerText = "กำลังลบ...";
      try {
        var res = await fetch("/api/records", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetRowIndex: sheetRowIndex })
        });
        var json = await res.json();
        if (json.ok) {
          showToast("ลบแถวที่ #" + sheetRowIndex + " เรียบร้อยแล้ว", "success");
          close();
          var dRes = await fetch("/api/data");
          var dJson = await dRes.json();
          if (dJson.ok) state.payload = dJson;
          renderView();
        } else {
          showToast("ลบไม่สำเร็จ: " + (json.error || "Unknown"), "error");
        }
      } catch (err) {
        showToast("เกิดข้อผิดพลาด: " + err.message, "error");
      } finally {
        btn.disabled = false; btn.innerText = "ยืนยันลบข้อมูล";
      }
    };
  };

  document.addEventListener("click", function(e) {
    var navTarget = e.target.closest("[data-view], [data-nav]");
    if (navTarget) {
      e.preventDefault();
      var v = navTarget.getAttribute("data-view") || navTarget.getAttribute("data-nav");
      if (v) window.evNavigate(v);
      return;
    }

    var editTarget = e.target.closest("[data-action='edit']");
    if (editTarget) {
      e.preventDefault();
      var row = parseInt(editTarget.getAttribute("data-row"), 10);
      if (row) window.evEditRecord(row);
      return;
    }

    var delTarget = e.target.closest("[data-action='delete']");
    if (delTarget) {
      e.preventDefault();
      var row = parseInt(delTarget.getAttribute("data-row"), 10);
      if (row) window.evDeleteRecord(row);
      return;
    }

    var presetTarget = e.target.closest("[data-preset]");
    if (presetTarget) {
      e.preventDefault();
      var model = presetTarget.getAttribute("data-preset");
      var cap = parseFloat(presetTarget.getAttribute("data-cap"));
      window.evApplyPreset(model, cap);
      return;
    }

    var reportSecTarget = e.target.closest("[data-report-section]");
    if (reportSecTarget) {
      e.preventDefault();
      var sec = reportSecTarget.getAttribute("data-report-section");
      if (sec) {
        state.reportSection = sec;
        renderView();
      }
      return;
    }

    var reportChargePeriodTarget = e.target.closest("[data-report-charge-period]");
    if (reportChargePeriodTarget) {
      e.preventDefault();
      var cp = reportChargePeriodTarget.getAttribute("data-report-charge-period");
      if (cp) {
        state.reportChargePeriod = cp;
        renderView();
      }
      return;
    }

    var reportTripPeriodTarget = e.target.closest("[data-report-trip-period]");
    if (reportTripPeriodTarget) {
      e.preventDefault();
      var tp = reportTripPeriodTarget.getAttribute("data-report-trip-period");
      if (tp) {
        state.reportTripPeriod = tp;
        renderView();
      }
      return;
    }

    var btnExpReport = e.target.closest("#btnExportReportCsv, #btnExportCsv");
    if (btnExpReport) {
      e.preventDefault();
      var rows = (state.payload.data && state.payload.data.rows) || [];
      exportCurrentReportToCsv(rows);
      return;
    }
  });

  var btnMobileMenu = document.getElementById("btnOpenMobileMenu");
  var sidebar = document.getElementById("appSidebar");
  var drawerBackdrop = document.getElementById("drawerBackdrop");

  if (btnMobileMenu && sidebar && drawerBackdrop) {
    btnMobileMenu.onclick = function() {
      sidebar.classList.add("open");
      drawerBackdrop.classList.add("show");
    };
    drawerBackdrop.onclick = function() {
      sidebar.classList.remove("open");
      drawerBackdrop.classList.remove("show");
    };
  }

  window.onpopstate = function() {
    var p = window.location.pathname.startsWith("/") ? window.location.pathname.substring(1) : window.location.pathname;
    state.activeView = p || "dashboard";
    renderView();
  };

  renderView();
})();
</script>
</body>
</html>
`;
}
