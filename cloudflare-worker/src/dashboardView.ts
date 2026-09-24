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
<html lang="th" data-theme="light">
<head>
<base target="_top">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
<title>EV Charging Management Dashboard | ระบบบันทึกและวิเคราะห์การชาร์จรถยนต์ไฟฟ้า</title>
<script>
  (function() {
    try {
      var t = localStorage.getItem("ev_theme") || "light";
      document.documentElement.setAttribute("data-theme", t);
    } catch(e) {}
  })();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anuphan:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap">
<style>
/* Clean Minimal EV Tech - Sky Blue & Crisp White (Default Light Mode) */
:root {
  --theme: light;
  --bg: #F8FAFC;
  --surface: #FFFFFF;
  --surface-subtle: #F0F9FF;
  --surface-card: #FFFFFF;
  --border: #E2E8F0;
  --border-strong: #CBD5E1;
  --border-focus: #0284C7;
  --text-main: #0F172A;
  --text-muted: #64748B;
  --text-subtle: #94A3B8;

  /* Primary Electric Sky Blue */
  --primary: #0284C7;
  --primary-hover: #0369A1;
  --primary-light: #38BDF8;
  --primary-soft: #E0F2FE;
  --primary-pale: #F0F9FF;
  --primary-border: #BAE6FD;
  --primary-gradient: linear-gradient(135deg, #0284C7, #0EA5E9);

  /* Unified Aliases for Blue & White theme */
  --sky: #0284C7;
  --sky-hover: #0369A1;
  --sky-light: #38BDF8;
  --sky-soft: #E0F2FE;
  --sky-pale: #F0F9FF;
  --teal: #0284C7;
  --teal-hover: #0369A1;
  --teal-light: #38BDF8;
  --teal-soft: #E0F2FE;
  --teal-pale: #F0F9FF;

  /* Accent status colors */
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
  --shadow-sm: 0 1px 3px 0 rgba(15, 23, 42, 0.05);
  --shadow-md: 0 4px 14px -2px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 10px 25px -3px rgba(15, 23, 42, 0.1);
  --shadow-fab: 0 8px 22px -2px rgba(2, 132, 199, 0.38);

  --font-sans: "Anuphan", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --sidebar-w: 260px;
}

/* Dark Mode - Midnight Obsidian / Slate-950 (No pure #000000) */
[data-theme="dark"] {
  --theme: dark;
  --bg: #0B1329;
  --surface: #111C44;
  --surface-subtle: #17234D;
  --surface-card: #111C44;
  --border: rgba(255, 255, 255, 0.09);
  --border-strong: rgba(255, 255, 255, 0.18);
  --border-focus: #38BDF8;
  --text-main: #F8FAFC;
  --text-muted: #94A3B8;
  --text-subtle: #64748B;

  /* Primary Luminous Sky Blue */
  --primary: #38BDF8;
  --primary-hover: #7DD3FC;
  --primary-light: #BAE6FD;
  --primary-soft: rgba(56, 189, 248, 0.16);
  --primary-pale: rgba(56, 189, 248, 0.08);
  --primary-border: rgba(56, 189, 248, 0.25);
  --primary-gradient: linear-gradient(135deg, #0284C7, #38BDF8);

  --sky: #38BDF8;
  --sky-hover: #7DD3FC;
  --sky-light: #BAE6FD;
  --sky-soft: rgba(56, 189, 248, 0.16);
  --sky-pale: rgba(56, 189, 248, 0.08);
  --teal: #38BDF8;
  --teal-hover: #7DD3FC;
  --teal-light: #BAE6FD;
  --teal-soft: rgba(56, 189, 248, 0.16);
  --teal-pale: rgba(56, 189, 248, 0.08);

  --emerald: #34D399;
  --emerald-soft: rgba(52, 211, 153, 0.16);
  --amber: #FBBF24;
  --amber-soft: rgba(251, 191, 36, 0.16);
  --rose: #F87171;
  --rose-soft: rgba(248, 113, 113, 0.16);
  --indigo: #818CF8;
  --indigo-soft: rgba(129, 140, 248, 0.16);

  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.35);
  --shadow-md: 0 4px 14px -2px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 25px -3px rgba(0, 0, 0, 0.65);
  --shadow-fab: 0 8px 24px -2px rgba(56, 189, 248, 0.45);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background-color: var(--bg);
  color: var(--text-main);
  font-family: var(--font-sans);
  font-size: 14.5px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  min-height: 100dvh;
  display: flex;
  overflow-x: hidden;
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* Smooth Theme Transitions */
.sidebar, .top-header, .card, .modal-content, .btn, .nav-link, .input-text, .form-control, .mobile-bottom-nav, .sidebar-vehicle-box, .footer-chip, table.data-table th, table.data-table td {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
[data-theme="dark"] ::-webkit-scrollbar-thumb { background: #334155; }

/* Layout Shell */
.app-container {
  display: flex;
  width: 100%;
  min-height: 100dvh;
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
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease, border-color 0.2s ease;
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
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
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

/* KPI 6-Grid & Cards */
.kpi-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  margin-bottom: 2px;
}

.kpi-section-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
}

@media (max-width: 1360px) {
  .kpi-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px 16px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-strong);
}

.kpi-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--kpi-accent, var(--primary));
}

.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  background: var(--kpi-soft, var(--primary-soft));
  color: var(--kpi-accent, var(--primary));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
  line-height: 1.1;
}

.kpi-unit {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
}

.kpi-badge-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.kpi-trend-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  width: fit-content;
}

.kpi-trend-pill.positive {
  background: var(--emerald-soft);
  color: var(--emerald);
}

.kpi-trend-pill.neutral {
  background: var(--primary-soft);
  color: var(--primary);
}

.kpi-trend-pill.warning {
  background: var(--amber-soft);
  color: var(--amber);
}

.kpi-subtext {
  font-size: 11px;
  color: var(--text-subtle);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Vehicle Hero Telemetry Card */
.hero-telemetry-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 20px 22px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.hero-telemetry-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
}

.hero-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-vehicle-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.v-status-dot-pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--emerald);
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulse-green 2s infinite;
  display: inline-block;
  flex-shrink: 0;
}

@keyframes pulse-green {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.hero-plate-badge {
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.hero-sync-time {
  font-size: 11.5px;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Hero Body Grid */
.hero-body-grid {
  display: grid;
  grid-template-columns: 1fr 1.8fr;
  gap: 18px;
  align-items: center;
}

@media (max-width: 960px) {
  .hero-body-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

.hero-soc-card {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hero-soc-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.hero-soc-pill {
  font-family: var(--font-mono);
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.hero-soc-scale {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  font-family: var(--font-mono);
  color: var(--text-subtle);
}

.hero-metrics-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.hero-stat-box {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.hero-stat-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-stat-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
  margin-bottom: 2px;
}

.hero-stat-val {
  font-family: var(--font-mono);
  font-size: 17px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.1;
}

.hero-stat-unit {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
}

/* Data Visualization 2x2 Hub (Mockup 1) */
.viz-grid-2x2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 1024px) {
  .viz-grid-2x2 {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.scatter-dot {
  transition: r 0.15s ease, fill-opacity 0.15s ease;
  cursor: pointer;
}
.scatter-dot:hover {
  r: 7.5;
  fill-opacity: 1;
}

.line-dot {
  transition: r 0.15s ease, fill 0.15s ease;
  cursor: pointer;
}
.line-dot:hover {
  r: 6.5;
  fill: var(--primary);
}

.donut-segment {
  transition: stroke-width 0.2s ease, opacity 0.2s ease;
  cursor: pointer;
}
.donut-segment:hover {
  stroke-width: 25;
  opacity: 0.9;
}

/* Analytics Split Grid */
.analytics-split-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 18px;
}

@media (max-width: 1024px) {
  .analytics-split-grid {
    grid-template-columns: 1fr;
  }
}

.charging-mix-box {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0;
}

.charging-mix-bar {
  height: 14px;
  border-radius: 999px;
  background: var(--border);
  display: flex;
  overflow: hidden;
  gap: 2px;
}

.charging-mix-ac {
  background: linear-gradient(90deg, #0284C7, #38BDF8);
  transition: width 0.4s ease;
}

.charging-mix-dc {
  background: linear-gradient(90deg, #6366F1, #818CF8);
  transition: width 0.4s ease;
}

.charging-mix-legend {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.mix-legend-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
}

.mix-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 3px;
  flex-shrink: 0;
}

.mix-dot.ac {
  background: #0284C7;
}

.mix-dot.dc {
  background: #6366F1;
}

.mix-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-main);
}

.mix-val {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.bar-group rect {
  transition: opacity 0.15s ease, filter 0.15s ease;
  cursor: pointer;
}

.bar-group:hover rect {
  opacity: 0.88;
  filter: brightness(1.1);
}

.smart-advice-box {
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 10px;
}

.smart-advice-icon {
  color: var(--primary);
  flex-shrink: 0;
  margin-top: 1px;
}

.smart-advice-text {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}

/* Insight Banner */
.insight-banner {
  background: linear-gradient(135deg, #F0FDFA, #E0F2FE);
  border: 1px solid #BAE6FD;
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.insight-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.insight-icon-bubble {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.15);
  flex-shrink: 0;
}

.insight-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-main);
}

.insight-desc {
  font-size: 12px;
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

/* Mobile Bottom Nav & FAB */
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
  padding: 0 6px env(safe-area-inset-bottom, 0px) 6px;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -3px 14px rgba(0, 0, 0, 0.06);
}

.bottom-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  padding: 6px 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: none;
  background: transparent;
  touch-action: manipulation;
  user-select: none;
  transition: all 0.15s ease;
}

.bottom-tab:active {
  transform: scale(0.92);
}

.bottom-tab.active {
  color: var(--primary);
  font-weight: 700;
}

.bottom-tab-fab {
  position: relative;
  top: -12px;
  flex: 1.1;
}

.fab-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-fab);
  border: 3px solid var(--surface);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.bottom-tab-fab:active .fab-circle {
  transform: scale(0.90);
}

/* Drawer Backdrop for Mobile Menu */
.drawer-backdrop {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(11, 19, 43, 0.65);
  backdrop-filter: blur(4px);
  z-index: 55;
  transition: opacity 0.25s ease;
}

.drawer-backdrop.show {
  display: block;
}

/* Dark Mode Overrides for Components */
[data-theme="dark"] table.data-table tr:hover td { background: #17234D; }
[data-theme="dark"] .table-wrapper { border-color: rgba(255, 255, 255, 0.09); }
[data-theme="dark"] .modal-backdrop { background: rgba(5, 10, 24, 0.8); }
[data-theme="dark"] .soc-range-bar { background: #17234D; }
[data-theme="dark"] .v-bat-track { background: #17234D; }
[data-theme="dark"] .insight-banner { background: linear-gradient(135deg, #111C44, #17234D); border-color: rgba(56, 189, 248, 0.25); }
[data-theme="dark"] .insight-icon-bubble { background: #17234D; color: var(--primary); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4); }
[data-theme="dark"] .hero-telemetry-card { background: #111C44; border-color: rgba(255, 255, 255, 0.09); }
[data-theme="dark"] .hero-soc-card { background: #17234D; border-color: rgba(255, 255, 255, 0.08); }
[data-theme="dark"] .hero-stat-box { background: #17234D; border-color: rgba(255, 255, 255, 0.08); }
[data-theme="dark"] .mix-legend-item { background: #17234D; border-color: rgba(255, 255, 255, 0.08); }
[data-theme="dark"] .smart-advice-box { background: #17234D; border-color: rgba(255, 255, 255, 0.08); }


/* Responsive Rules for Tablet & Mobile */
@media (max-width: 900px) {
  .sidebar {
    transform: translateX(-100%);
    width: 280px;
    z-index: 60;
    box-shadow: var(--shadow-lg);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .main-wrapper {
    margin-left: 0;
    padding-bottom: calc(74px + env(safe-area-inset-bottom, 0px));
    min-height: 100dvh;
  }
  .btn-mobile-menu {
    display: inline-flex;
  }
  .mobile-bottom-nav {
    display: flex;
  }
  .page-content {
    padding: 16px 14px;
    gap: 16px;
  }
  .rate-badge {
    display: none;
  }
  .btn-header-action {
    display: none !important;
  }
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .kpi-card {
    padding: 14px 12px;
  }
  .kpi-value {
    font-size: 20px;
  }
  .card {
    padding: 16px 14px;
  }
}

@media (max-width: 640px) {
  .page-content {
    padding: 12px 10px;
    gap: 12px;
  }
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .kpi-card {
    padding: 12px 10px;
  }
  .kpi-label {
    font-size: 11.5px;
  }
  .kpi-value {
    font-size: 18px;
  }
  .kpi-unit {
    font-size: 11px;
  }
  .kpi-subtext {
    font-size: 10.5px;
  }
  .form-control, .input-text, .select-input {
    font-size: 16px !important; /* Prevents auto zoom in iOS Safari */
    min-height: 44px;
  }
  .btn {
    min-height: 42px;
  }
  .top-header {
    height: 56px;
    padding: 0 12px;
  }
  .page-title-box h2 {
    font-size: 15px;
  }
  .page-title-box p {
    display: none;
  }
  .hero-telemetry-card {
    padding: 14px 14px;
    gap: 12px;
  }
  .hero-vehicle-title {
    font-size: 14.5px;
  }
  .hero-actions {
    width: 100%;
  }
  .hero-actions .btn {
    flex: 1;
  }
  .hero-metrics-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .hero-stat-box {
    padding: 8px 6px;
    gap: 6px;
    flex-direction: column;
    align-items: flex-start;
  }
  .hero-stat-icon {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
  }
  .hero-stat-icon svg {
    width: 14px;
    height: 14px;
  }
  .hero-stat-label {
    font-size: 10px;
    line-height: 1.2;
  }
  .hero-stat-val {
    font-size: 14px;
  }
  .hero-stat-unit {
    font-size: 9.5px;
  }
  .hero-soc-pill {
    font-size: 22px;
  }
  .kpi-trend-pill {
    font-size: 9.5px;
    padding: 1px 5px;
  }
  .charging-mix-legend {
    grid-template-columns: 1fr;
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
        <a class="nav-link" data-view="drivers">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          เปรียบเทียบผู้ขับ (Drivers)
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
      <div style="display:flex;align-items:center;justify-content:space-between;padding:2px 0 6px;">
        <span style="font-size:12px;font-weight:600;color:var(--text-muted);display:flex;align-items:center;gap:6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          ธีมระบบ
        </span>
        <button type="button" class="btn btn-secondary btn-sm" id="btnSidebarThemeToggle" style="padding:4px 10px;font-size:11.5px;display:inline-flex;align-items:center;gap:5px;">
          <span id="sbThemeBtnText">โหมดมืด</span>
        </button>
      </div>
      <div class="footer-chip">
        <span style="display:flex;align-items:center;gap:5px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> ค่าไฟพื้นฐาน</span>
        <strong id="sbRateText">${initialRate} ฿/u</strong>
      </div>
      <div class="footer-chip">
        <span style="display:flex;align-items:center;gap:5px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="18" height="12" rx="2"></rect><line x1="23" y1="11" x2="23" y2="13"></line></svg> ขนาดแบตเตอรี่</span>
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
        <select id="vehicleSwitcher" class="select-input" title="เลือกรถที่จะแสดง" aria-label="เลือกรถ" style="display:none;max-width:180px;"></select>
        <div class="rate-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          <span>อัตราค่าไฟ:</span>
          <span id="topRateDisplay">4.90 ฿/kWh</span>
        </div>
        <button class="btn btn-secondary btn-icon-only" id="btnThemeToggle" title="สลับโหมดมืด/สว่าง">
          <svg id="themeIconSun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          <svg id="themeIconMoon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </button>
        <button class="btn btn-secondary btn-icon-only" id="btnRefreshData" title="รีเฟรชข้อมูลจาก Google Sheets">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        </button>
        <button class="btn btn-secondary btn-sm btn-header-action" data-nav="add-trip" style="display:inline-flex;align-items:center;gap:5px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
          + บันทึกการเดินทาง
        </button>
        <button class="btn btn-primary btn-sm btn-header-action" data-nav="add-charging" style="display:inline-flex;align-items:center;gap:5px;">
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
    <span>ภาพรวม</span>
  </div>
  <div class="bottom-tab" data-nav="charging-history">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
    <span>ประวัติชาร์จ</span>
  </div>
  <div class="bottom-tab bottom-tab-fab" data-nav="add-charging">
    <div class="fab-circle">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    </div>
    <span>+ ชาร์จ</span>
  </div>
  <div class="bottom-tab" data-nav="trips">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
    <span>เดินทาง</span>
  </div>
  <div class="bottom-tab" id="btnBottomMenu">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    <span>เมนู</span>
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
    rateOnPeak: parseFloat(localStorage.getItem("ev_rate_onpeak")) || 6.60,
    rateOffPeak: parseFloat(localStorage.getItem("ev_rate_offpeak")) || 3.25,
    petrolRate: parseFloat(localStorage.getItem("ev_petrol_rate")) || 38.5,
    petrolKmPerL: parseFloat(localStorage.getItem("ev_petrol_km_l")) || 16.0,
    vehicleName: localStorage.getItem("ev_vehicle_name") || ((window.__INITIAL_PAYLOAD__.data && window.__INITIAL_PAYLOAD__.data.meta && window.__INITIAL_PAYLOAD__.data.meta.vehicle) || "XPENG G6 STD"),
    vehiclePlate: localStorage.getItem("ev_vehicle_plate") || "4ขข 8821 กทม.",
    activeVehicle: (function() {
      try { return localStorage.getItem("ev_active_vehicle") || ""; } catch (e) { return ""; }
    })(),
    defaultDriver: (function() {
      try { return localStorage.getItem("ev_default_driver") || ""; } catch (e) { return ""; }
    })(),
    driverPeriod: "all",
    filterStation: "all",
    filterSearch: "",
    editRecord: null,
    deleteRecord: null,
    reportSection: "charging",
    reportChargePeriod: "monthly",
    reportTripPeriod: "monthly",
    theme: (function() {
      try {
        return localStorage.getItem("ev_theme") || "light";
      } catch(e) {
        return "light";
      }
    })()
  };

  var thaiMonthNamesShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  var thaiMonthNamesFull = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  function formatThaiMonthShort(ym) {
    if (!ym || ym.length < 7) return ym || "-";
    var p = ym.split("-");
    var y = (parseInt(p[0], 10) + 543) % 100;
    var m = parseInt(p[1], 10) - 1;
    return (thaiMonthNamesShort[m] || p[1]) + " " + (y < 10 ? "0" + y : y);
  }

  function formatThaiMonth(ym) {
    if (!ym || ym.length < 7) return ym || "-";
    var p = ym.split("-");
    var y = parseInt(p[0], 10) + 543;
    var m = parseInt(p[1], 10) - 1;
    return (thaiMonthNamesFull[m] || p[1]) + " " + y;
  }

  function updateThemeUI(t) {
    document.documentElement.setAttribute("data-theme", t);
    var sun = document.getElementById("themeIconSun");
    var moon = document.getElementById("themeIconMoon");
    var sbText = document.getElementById("sbThemeBtnText");
    if (sun && moon) {
      if (t === "dark") {
        sun.style.display = "block";
        moon.style.display = "none";
      } else {
        sun.style.display = "none";
        moon.style.display = "block";
      }
    }
    if (sbText) {
      sbText.innerText = t === "dark" ? "โหมดสว่าง" : "โหมดมืด";
    }
  }

  function setTheme(t) {
    state.theme = t;
    try {
      localStorage.setItem("ev_theme", t);
    } catch(e) {}
    updateThemeUI(t);
    showToast("เปลี่ยนเป็น " + (t === "dark" ? "โหมดมืด (Dark Mode)" : "โหมดสว่าง (Light Mode)") + " แล้ว", "info");
  }

  function toggleTheme() {
    var cur = state.theme || document.documentElement.getAttribute("data-theme") || "light";
    var next = cur === "dark" ? "light" : "dark";
    setTheme(next);
    renderView();
  }

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

  function getLatestVehicleState(rows) {
    var latestSoc = 80;
    var latestOdo = 0;
    var latestDate = "";
    var latestTime = "";
    var foundSoc = false;

    // Check rows in reverse chronological order
    for (var i = rows.length - 1; i >= 0; i--) {
      var r = rows[i];
      if (!foundSoc && r.s1 !== null && r.s1 !== undefined && r.s1 > 0) {
        latestSoc = r.s1;
        latestDate = r.iso || "";
        latestTime = r.time || "";
        foundSoc = true;
      }
      if (r.odoEnd && r.odoEnd > latestOdo) {
        latestOdo = r.odoEnd;
      }
    }

    // Full WLTP range of XPENG G6 Standard Range is 470 km
    // At 71%: 470 * 0.71 = 333.7 km ≈ 333 km (matches user car display)
    var fullWltpKm = 470;
    var estRangeKm = Math.round((latestSoc / 100) * fullWltpKm);
    var remainingKwh = (latestSoc / 100) * state.batteryCapacity;

    return {
      soc: latestSoc,
      odo: latestOdo,
      date: latestDate,
      time: latestTime,
      remainingKwh: remainingKwh,
      estRangeKm: estRangeKm,
      fullWltpKm: fullWltpKm
    };
  }

  function updateSidebarVehicle() {
    var rows = getRows();
    var vState = getLatestVehicleState(rows);
    var chargeRows = rows.filter(function(r) { return r.kind === "charge"; });
    var tripRows = rows.filter(function(r) { return r.kind === "trip"; });

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

    var fleetList = getVehicles();
    if (sbName) sbName.innerHTML = '<span class="v-status-dot"></span> ' + escHtml(state.activeVehicle === "all" ? "ทุกคัน (" + fleetList.length + " คัน)" : state.vehicleName);
    var sw = document.getElementById("vehicleSwitcher");
    if (sw) {
      sw.innerHTML = '<option value="all"' + (state.activeVehicle === "all" ? " selected" : "") + '>🚘 ทุกคัน</option>' +
        fleetList.map(function(v) { return '<option value="' + escHtml(v.id) + '"' + (state.activeVehicle === v.id ? " selected" : "") + '>' + escHtml(v.name) + '</option>'; }).join("");
      sw.style.display = fleetList.length > 1 ? "" : "none";
    }
    if (sbPlate) sbPlate.innerText = state.vehiclePlate;
    if (sbFill) sbFill.style.width = Math.min(100, Math.max(5, vState.soc)) + "%";
    if (sbText) sbText.innerText = "แบตเตอรี่: " + vState.soc + "% (~" + vState.estRangeKm + " km)";
    if (sbBatCapText) sbBatCapText.innerText = state.batteryCapacity.toFixed(1) + " kWh";
    if (sbCapText) sbCapText.innerText = state.batteryCapacity.toFixed(1) + " kWh";
    if (sbRateText) sbRateText.innerText = state.unitRate.toFixed(2) + " ฿/u";
    if (topRateDisplay) topRateDisplay.innerText = state.unitRate.toFixed(2) + " ฿/kWh";
    if (badgeChargeCount) badgeChargeCount.innerText = chargeRows.length;
    if (badgeTripCount) badgeTripCount.innerText = tripRows.length;
  }

  function computeAggregates() {
    var rows = getRows();
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
    var rows = getRows();
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
    applyActiveVehicle();
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
    var rows = getRows();

    var titles = {
      "dashboard": ["แดชบอร์ดภาพรวม", "สรุปข้อมูลการใช้พลังงาน สถิติค่าใช้จ่าย และสถานะตัวรถ"],
      "charging-history": ["ประวัติการชาร์จ", "บันทึกประวัติการชาร์จไฟทั้งหมด ค้นหา กรอง และจัดการข้อมูล"],
      "add-charging": ["บันทึกการชาร์จใหม่", "กรอกข้อมูลการชาร์จพร้อมคำนวณพลังงานและค่าไฟอัตโนมัติ"],
      "trips": ["บันทึกการเดินทาง (Trips)", "ติดตามระยะทาง อัตรากินไฟ และประวัติการขับขี่"],
      "add-trip": ["บันทึกการเดินทางใหม่ (New Trip)", "กรอกข้อมูลระยะทาง เลขไมล์ อัตราสิ้นเปลือง และคำนวณพลังงานที่ใช้"],
      "vehicles": ["โปรไฟล์รถยนต์ (Fleet)", "จัดการรถหลายคัน ความจุแบตเตอรี่ และสถิติแยกตามคัน"],
      "drivers": ["เปรียบเทียบผู้ขับ (Drivers)", "ใครขับประหยัดไฟที่สุด เทียบอัตรากินไฟ ต้นทุน และระยะทางของแต่ละคน"],
      "vehicle-detail": ["สุขภาพแบตเตอรี่ (Battery Health)", "ความจุใช้งานจริง แนวโน้มการเสื่อม ระยะทางตามสไตล์ขับ และความเร็วชาร์จ DC"],
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
      case "drivers":
        html = renderDriversView(rows);
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

  function generateEfficiencyLineChart(tripRows) {
    var trips = (tripRows || []).filter(function(r) {
      return (r.km > 0 || (r.odoEnd && r.odoStart && r.odoEnd > r.odoStart)) && (r.cons > 0 || r.kwh > 0);
    });
    trips.sort(function(a, b) {
      var da = (a.iso || "") + " " + (a.time || "");
      var db = (b.iso || "") + " " + (b.time || "");
      return da.localeCompare(db);
    });
    var recent = trips.slice(-14);
    if (recent.length < 2) {
      return '<div class="card"><div class="card-header"><div class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> แนวโน้มอัตราสิ้นเปลือง (Efficiency Trend)</div></div><div style="text-align:center;color:var(--text-muted);padding:40px 0;">ข้อมูลการเดินทางยังไม่เพียงพอ</div></div>';
    }

    var dataPoints = [];
    recent.forEach(function(t) {
      var dist = t.km || (t.odoEnd && t.odoStart ? (t.odoEnd - t.odoStart) : 0);
      var wh = 0;
      if (t.cons && t.cons > 0) {
        wh = Math.round(t.cons * 10);
      } else if (t.kwh && dist > 0) {
        wh = Math.round((t.kwh * 1000) / dist);
      }
      if (wh >= 60 && wh <= 300) {
        var dLabel = t.iso ? t.iso.substring(5).replace("-", "/") : "-";
        dataPoints.push({
          date: t.iso || "-",
          time: t.time || "",
          label: dLabel,
          dist: dist,
          wh: wh
        });
      }
    });

    if (dataPoints.length < 2) {
      return '<div class="card"><div class="card-header"><div class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> แนวโน้มอัตราสิ้นเปลือง (Efficiency Trend)</div></div><div style="text-align:center;color:var(--text-muted);padding:40px 0;">ข้อมูลการเดินทางยังไม่เพียงพอ</div></div>';
    }

    var svgW = 460;
    var svgH = 200;
    var padLeft = 46;
    var padRight = 24;
    var padTop = 26;
    var padBottom = 32;
    var plotW = svgW - padLeft - padRight;
    var plotH = svgH - padTop - padBottom;

    var minWh = 80;
    var maxWh = 220;
    var rangeWh = maxWh - minWh;

    function getX(i) {
      return padLeft + (i / (dataPoints.length - 1)) * plotW;
    }
    function getY(wh) {
      var clamped = Math.max(minWh, Math.min(maxWh, wh));
      return padTop + (1 - ((clamped - minWh) / rangeWh)) * plotH;
    }

    var yTicks = [100, 140, 180, 220];
    var gridSvg = yTicks.map(function(val) {
      var y = getY(val);
      var isTarget = (val === 140);
      var lineStyle = isTarget ? 'stroke="var(--amber)" stroke-width="1.5" stroke-dasharray="4,3"' : 'stroke="var(--border)" stroke-width="1" stroke-dasharray="2,3" opacity="0.6"';
      var textFill = isTarget ? 'fill="var(--amber)" font-weight="600"' : 'fill="var(--text-muted)" font-size="10"';
      return '<line x1="' + padLeft + '" y1="' + y + '" x2="' + (svgW - padRight) + '" y2="' + y + '" ' + lineStyle + ' />' +
        '<text x="' + (padLeft - 6) + '" y="' + (y + 3) + '" font-size="9.5" font-family="JetBrains Mono" ' + textFill + ' text-anchor="end">' + val + '</text>' +
        (isTarget ? '<text x="' + (padLeft + 6) + '" y="' + (y - 5) + '" font-size="9" font-family="Anuphan" fill="var(--amber)" text-anchor="start" font-weight="600">เป้าหมาย 140 Wh/km</text>' : '');
    }).join("");

    var pts = dataPoints.map(function(p, i) {
      return getX(i).toFixed(1) + ',' + getY(p.wh).toFixed(1);
    });
    var baseY = getY(minWh);
    var firstX = getX(0).toFixed(1);
    var lastX = getX(dataPoints.length - 1).toFixed(1);
    var areaPoly = firstX + ',' + baseY + ' ' + pts.join(' ') + ' ' + lastX + ',' + baseY;

    var minPtIdx = 0, maxPtIdx = 0;
    dataPoints.forEach(function(p, i) {
      if (p.wh < dataPoints[minPtIdx].wh) minPtIdx = i;
      if (p.wh > dataPoints[maxPtIdx].wh) maxPtIdx = i;
    });

    var lastDisplayedLabel = "";
    var dotsSvg = dataPoints.map(function(p, i) {
      var cx = getX(i).toFixed(1);
      var cy = getY(p.wh).toFixed(1);
      var showLabel = (i === 0 || i === dataPoints.length - 1 || (i % 3 === 0 && p.label !== lastDisplayedLabel));
      if (showLabel) lastDisplayedLabel = p.label;
      var labelSvg = showLabel ?
        '<text x="' + cx + '" y="' + (svgH - 12) + '" font-size="9.5" font-family="JetBrains Mono" fill="var(--text-muted)" text-anchor="middle">' + p.label + '</text>' : '';
      var isKeyPoint = (i === 0 || i === dataPoints.length - 1 || i === minPtIdx || i === maxPtIdx || i % 4 === 0);
      var valSvg = isKeyPoint ?
        '<text x="' + cx + '" y="' + (cy - 7) + '" font-size="9" font-family="JetBrains Mono" fill="var(--primary)" text-anchor="middle" font-weight="700">' + p.wh + '</text>' : '';
      return '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="var(--surface)" stroke="var(--primary)" stroke-width="2.2" class="line-dot">' +
        '<title>' + p.date + ' ' + p.time + ' | ' + p.wh + ' Wh/km (' + p.dist.toFixed(1) + ' km)</title>' +
        '</circle>' + valSvg + labelSvg;
    }).join("");

    var avgWh = Math.round(dataPoints.reduce(function(acc, p) { return acc + p.wh; }, 0) / dataPoints.length);

    return '<div class="card">' +
      '<div class="card-header">' +
        '<div>' +
          '<div class="card-title">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>' +
            ' แนวโน้มอัตราสิ้นเปลือง (Efficiency Trend)' +
          '</div>' +
          '<div class="card-subtitle">อัตราการใช้พลังงาน (Wh/km) รายทริป • ค่าเฉลี่ย ' + avgWh + ' Wh/km</div>' +
        '</div>' +
        '<span class="badge badge-sky">' + dataPoints.length + ' ทริปล่าสุด</span>' +
      '</div>' +
      '<div style="overflow-x:auto;">' +
        '<svg width="100%" height="200" viewBox="0 0 ' + svgW + ' ' + svgH + '" style="max-width:100%;min-width:320px;display:block;">' +
          '<defs>' +
            '<linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">' +
              '<stop offset="0%" stop-color="#0284C7" stop-opacity="0.32" />' +
              '<stop offset="100%" stop-color="#0284C7" stop-opacity="0.02" />' +
            '</linearGradient>' +
          '</defs>' +
          gridSvg +
          '<polygon points="' + areaPoly + '" fill="url(#effGrad)" />' +
          '<polyline points="' + pts.join(' ') + '" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />' +
          dotsSvg +
        '</svg>' +
      '</div>' +
    '</div>';
  }

  function generateChargingDonutChart(acKwh, dcKwh, acCost, dcCost, totalChargeKwh, costPerKm, acCount, dcCount, chargeRows) {
    var totalKwh = (acKwh + dcKwh) || 0;
    var acPct = totalKwh > 0 ? Math.round((acKwh / totalKwh) * 100) : 0;
    var dcPct = totalKwh > 0 ? (100 - acPct) : 0;
    var totalCost = acCost + dcCost;
    var acAvgRate = acKwh > 0 ? (acCost / acKwh) : 0;
    var dcAvgRate = dcKwh > 0 ? (dcCost / dcKwh) : 0;
    var cAcCount = (typeof acCount === 'number') ? acCount : 0;
    var cDcCount = (typeof dcCount === 'number') ? dcCount : 0;

    var r = 58;
    var C = 364.425;
    var acLen = totalKwh > 0 ? (acPct / 100) * C : 0;
    var dcLen = totalKwh > 0 ? C - acLen : 0;

    // Optional DC station breakdown chips
    var stationChipsHtml = '';
    if (chargeRows && chargeRows.length > 0) {
      var netMap = {};
      chargeRows.forEach(function(row) {
        var isDc = isDcChargeRecord ? isDcChargeRecord(row) : (row.note && row.note.toUpperCase().indexOf('DC') !== -1);
        if (isDc) {
          var raw = (row.note || 'DC Station').trim();
          var lower = raw.toLowerCase();
          var sName = 'DC อื่นๆ';
          if (lower.indexOf('ptt') !== -1 || lower.indexOf('pluz') !== -1) sName = 'PTT EV Station';
          else if (lower.indexOf('pea') !== -1 || lower.indexOf('volta') !== -1 || raw.indexOf('องครักษ์') !== -1) sName = 'PEA Volta';
          else if (lower.indexOf('ea') !== -1) sName = 'EA Anywhere';
          else if (lower.indexOf('charge+') !== -1) sName = 'Charge+';
          else if (lower.indexOf('mg') !== -1) sName = 'MG Super Charge';
          if (!netMap[sName]) netMap[sName] = { kwh: 0, cost: 0, count: 0 };
          netMap[sName].kwh += (row.kwh || 0);
          netMap[sName].cost += (row.net || 0);
          netMap[sName].count++;
        }
      });
      var netKeys = Object.keys(netMap);
      if (netKeys.length > 0) {
        stationChipsHtml = '<div style="margin-top:6px;padding:8px 10px;border-radius:var(--radius-sm);background:rgba(2,132,199,0.06);border:1px dashed rgba(2,132,199,0.22);font-size:11px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;">' +
          '<span style="font-weight:700;color:var(--sky);display:inline-flex;align-items:center;gap:4px;">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="2" width="11" height="20" rx="2"></rect><line x1="3" y1="8" x2="14" y2="8"></line><path d="M14 9h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"></path></svg>' +
            'ตู้ชาร์จ DC ที่เคยใช้:' +
          '</span>' +
          netKeys.map(function(k) {
            var st = netMap[k];
            var rate = st.kwh > 0 ? (st.cost / st.kwh).toFixed(2) : '-';
            return '<span style="background:var(--surface);border:1px solid var(--border);padding:2px 8px;border-radius:4px;color:var(--text-main);font-weight:500;">' +
              k + ' <span style="color:var(--text-muted);font-family:JetBrains Mono;">(' + st.count + ' ครั้ง • ' + rate + '฿/u)</span>' +
            '</span>';
          }).join('') +
        '</div>';
      }
    }

    return '<div class="card">' +
      '<div class="card-header">' +
        '<div>' +
          '<div class="card-title">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
            ' สัดส่วนพลังงานและค่าชาร์จ (Energy Mix)' +
          '</div>' +
          '<div class="card-subtitle">สัดส่วนการชาร์จบ้าน (AC) เทียบกับสถานีสาธารณะ (DC)</div>' +
        '</div>' +
        '<span class="badge badge-teal">รวม ' + fmtNum(totalCost, 0) + ' ฿</span>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:center;gap:18px;padding:12px 6px;flex-wrap:wrap;">' +
        '<div style="position:relative;width:150px;height:150px;flex-shrink:0;">' +
          '<svg width="150" height="150" viewBox="0 0 170 170" style="transform:rotate(-90deg);display:block;">' +
            '<circle cx="85" cy="85" r="' + r + '" fill="none" stroke="var(--border)" stroke-width="20" opacity="0.25" />' +
            (totalKwh > 0 ? (
              '<circle cx="85" cy="85" r="' + r + '" fill="none" stroke="#0D9488" stroke-width="20" stroke-dasharray="' + acLen.toFixed(1) + ' ' + C.toFixed(1) + '" stroke-dashoffset="0" class="donut-segment"><title>🏠 AC ชาร์จบ้าน: ' + acPct + '% (' + acKwh.toFixed(1) + ' kWh)</title></circle>' +
              '<circle cx="85" cy="85" r="' + r + '" fill="none" stroke="#0284C7" stroke-width="20" stroke-dasharray="' + dcLen.toFixed(1) + ' ' + C.toFixed(1) + '" stroke-dashoffset="-' + acLen.toFixed(1) + '" class="donut-segment"><title>⚡ DC ตู้ชาร์จด่วน: ' + dcPct + '% (' + dcKwh.toFixed(1) + ' kWh)</title></circle>'
            ) : '') +
          '</svg>' +
          '<div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">' +
            '<span style="font-size:20px;font-weight:800;font-family:JetBrains Mono;color:var(--text-main);line-height:1.1;">' + totalKwh.toFixed(0) + '</span>' +
            '<span style="font-size:11px;color:var(--text-muted);font-weight:500;">kWh รวม</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;flex:1;min-width:210px;">' +
          '<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:var(--radius-md);background:var(--surface-subtle);border-left:4px solid #0D9488;">' +
            '<div style="width:40px;height:40px;border-radius:10px;background:rgba(13,148,136,0.12);color:#0D9488;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(13,148,136,0.22);">' +
              '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M3 10.5 12 3l9 7.5v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9.5z"></path>' +
                '<polygon points="12 7.5 9.5 12.5 12 12.5 11 17 14.5 12 12 12 12.5 7.5" fill="currentColor"></polygon>' +
              '</svg>' +
            '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">' +
                '<span style="font-size:13.5px;font-weight:700;color:var(--text-main);white-space:nowrap;">AC ชาร์จบ้าน</span>' +
                '<span class="badge badge-teal" style="white-space:nowrap;font-size:11px;">' + acPct + '%' + (cAcCount > 0 ? ' • ' + cAcCount + 'x' : '') + '</span>' +
              '</div>' +
              '<div style="font-size:12px;color:var(--text-secondary);font-family:JetBrains Mono;margin-top:2px;white-space:nowrap;">' + fmtNum(acKwh, 1) + ' kWh • ' + fmtNum(acCost, 0) + ' ฿</div>' +
              '<div style="font-size:11px;color:var(--text-muted);white-space:nowrap;">เฉลี่ย ~' + fmtNum(acAvgRate, 2) + ' ฿/หน่วย</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:var(--radius-md);background:var(--surface-subtle);border-left:4px solid #0284C7;">' +
            '<div style="width:40px;height:40px;border-radius:10px;background:rgba(2,132,199,0.12);color:#0284C7;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(2,132,199,0.22);">' +
              '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<rect x="3" y="2" width="11" height="20" rx="2"></rect>' +
                '<line x1="3" y1="8" x2="14" y2="8"></line>' +
                '<circle cx="8.5" cy="5" r="1.2" fill="currentColor"></circle>' +
                '<path d="M14 9h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"></path>' +
                '<polygon points="8.5 10.5 6.5 14 9 14 8 17.5 11.5 13 9 13 9.5 10.5" fill="currentColor"></polygon>' +
              '</svg>' +
            '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">' +
                '<span style="font-size:13.5px;font-weight:700;color:var(--text-main);white-space:nowrap;">DC ตู้ชาร์จด่วน</span>' +
                '<span class="badge badge-sky" style="white-space:nowrap;font-size:11px;">' + dcPct + '%' + (cDcCount > 0 ? ' • ' + cDcCount + 'x' : '') + '</span>' +
              '</div>' +
              '<div style="font-size:12px;color:var(--text-secondary);font-family:JetBrains Mono;margin-top:2px;white-space:nowrap;">' + fmtNum(dcKwh, 1) + ' kWh • ' + fmtNum(dcCost, 0) + ' ฿</div>' +
              '<div style="font-size:11px;color:var(--text-muted);white-space:nowrap;">เฉลี่ย ~' + fmtNum(dcAvgRate, 2) + ' ฿/หน่วย</div>' +
            '</div>' +
          '</div>' +
          stationChipsHtml +
        '</div>' +
      '</div>' +
      '<div style="border-top:1px solid var(--border);padding-top:10px;margin-top:4px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-muted);">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
        '<span>สัดส่วน AC สูงกว่า DC ช่วยประหยัดต้นทุนค่าไฟได้มากกว่า 45%</span>' +
      '</div>' +
    '</div>';
  }

  function generateMonthlyCostBarChart(monthly) {
    if (!monthly || monthly.length === 0) {
      return '<div class="card">' +
        '<div class="card-header"><div class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> เปรียบเทียบการชาร์จรายเดือน (Monthly Comparison)</div></div>' +
        '<div style="text-align:center;color:var(--text-muted);padding:40px 0;">ยังไม่มีข้อมูลประวัติการชาร์จ</div></div>';
    }

    var maxKwh = Math.max.apply(Math, monthly.map(function(m) { return m.kwh; }).concat([10]));
    var topMargin = 45;
    var maxBarH = 88;
    var barW = 38;
    var gap = 28;
    var totalW = Math.max(360, monthly.length * (barW + gap) + 48);
    var baseY = topMargin + maxBarH;
    var svgH = baseY + 36;

    var bars = monthly.map(function(m, i) {
      var h = Math.max(4, Math.round((m.kwh / maxKwh) * maxBarH));
      var x = 28 + i * (barW + gap);
      var y = baseY - h;
      var monthLabel = formatThaiMonthShort(m.month);
      return '<g class="bar-group">' +
        '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + h + '" rx="6" fill="url(#skyGradient)" />' +
        '<text x="' + (x + barW/2) + '" y="' + (y - 17) + '" font-size="11.5" font-family="JetBrains Mono" fill="var(--primary)" text-anchor="middle" font-weight="700">' + m.kwh.toFixed(0) + ' <tspan font-size="9" fill="var(--text-muted)">kWh</tspan></text>' +
        '<text x="' + (x + barW/2) + '" y="' + (y - 4) + '" font-size="10" font-family="JetBrains Mono" fill="var(--text-secondary)" text-anchor="middle">' + fmtNum(m.cost, 0) + ' ฿</text>' +
        '<text x="' + (x + barW/2) + '" y="' + (baseY + 20) + '" font-size="11" font-family="Anuphan" fill="var(--text-muted)" text-anchor="middle" font-weight="500">' + monthLabel + '</text>' +
        '</g>';
    }).join("");

    return '<div class="card">' +
      '<div class="card-header">' +
        '<div>' +
          '<div class="card-title">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>' +
            ' เปรียบเทียบการชาร์จรายเดือน (Monthly Comparison)' +
          '</div>' +
          '<div class="card-subtitle">ปริมาณพลังงานไฟฟ้า (kWh) และยอดค่าใช้จ่าย (฿) ในแต่ละเดือน</div>' +
        '</div>' +
        '<span class="badge badge-sky">' + monthly.length + ' เดือนที่บันทึก</span>' +
      '</div>' +
      '<div style="overflow-x:auto;padding-bottom:8px;">' +
        '<svg width="100%" height="' + svgH + '" viewBox="0 0 ' + totalW + ' ' + svgH + '" style="max-width:100%;min-width:300px;display:block;">' +
          '<defs><linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38BDF8" /><stop offset="100%" stop-color="#0284C7" /></linearGradient></defs>' +
          '<line x1="16" y1="' + (baseY + 4) + '" x2="' + (totalW - 16) + '" y2="' + (baseY + 4) + '" stroke="var(--border)" stroke-width="1" />' +
          bars +
        '</svg>' +
      '</div>' +
    '</div>';
  }

  function generateDistanceEfficiencyBars(tripRows) {
    var validTrips = (tripRows || []).filter(function(r) {
      var dist = r.km || (r.odoEnd && r.odoStart ? (r.odoEnd - r.odoStart) : 0);
      return dist > 0 && (r.cons > 0 || r.kwh > 0);
    });

    if (validTrips.length < 3) {
      return '<div class="card"><div class="card-header"><div class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"></path></svg> ประสิทธิภาพแยกตามระยะทาง (Efficiency by Distance)</div></div><div style="text-align:center;color:var(--text-muted);padding:40px 0;">ข้อมูลทริปยังไม่เพียงพอ</div></div>';
    }

    var tiers = [
      {
        icon: "🚗",
        name: "ระยะใกล้ (< 10 km)",
        note: "ในซอย / สตาร์ทแอร์",
        min: 0,
        max: 10,
        count: 0,
        sumWh: 0,
        grad: "linear-gradient(90deg, #FBBF24, #F59E0B)",
        color: "var(--amber)",
        tag: "กินไฟจากแอร์ตอนเริ่มสตาร์ท"
      },
      {
        icon: "🏢",
        name: "ในเมือง (10 - 25 km)",
        note: "ไปทำงาน / ขับในเมือง",
        min: 10,
        max: 25,
        count: 0,
        sumWh: 0,
        grad: "linear-gradient(90deg, #38BDF8, #0284C7)",
        color: "var(--primary)",
        tag: "ขับขี่ประจำวันทั่วไป"
      },
      {
        icon: "🛣️",
        name: "ชานเมือง (25 - 50 km)",
        note: "วงแหวน / ความเร็วนิ่ง",
        min: 25,
        max: 50,
        count: 0,
        sumWh: 0,
        grad: "linear-gradient(90deg, #2DD4BF, #0D9488)",
        color: "var(--teal)",
        tag: "ประหยัดกว่าเป้าหมาย 11%"
      },
      {
        icon: "🚀",
        name: "ทางไกล (> 50 km)",
        note: "วิ่งข้ามจังหวัดยาวๆ",
        min: 50,
        max: 9999,
        count: 0,
        sumWh: 0,
        grad: "linear-gradient(90deg, #34D399, #10B981)",
        color: "var(--emerald)",
        tag: "ประหยัดสูงสุด (ลดลง 57%)"
      }
    ];

    validTrips.forEach(function(r) {
      var dist = r.km || (r.odoEnd && r.odoStart ? (r.odoEnd - r.odoStart) : 0);
      var eff = 0;
      if (r.kwh && r.kwh > 0) eff = dist / r.kwh;
      else if (r.cons && r.cons > 0) eff = 100 / r.cons;
      if (dist <= 0 || eff <= 0) return;
      var wh = Math.round(1000 / eff);

      for (var i = 0; i < tiers.length; i++) {
        if (dist >= tiers[i].min && dist < tiers[i].max) {
          tiers[i].count++;
          tiers[i].sumWh += wh;
          break;
        }
      }
    });

    var unitRate = (state && state.unitRate) ? state.unitRate : 4.90;
    var maxWh = 260;
    var targetWh = 140;
    var targetPct = Math.round((targetWh / maxWh) * 100);

    var rowsHtml = tiers.map(function(t) {
      if (t.count === 0) return '';
      var avgWh = Math.round(t.sumWh / t.count);
      var costKm = (avgWh * unitRate) / 1000;
      var barPct = Math.min(100, Math.round((avgWh / maxWh) * 100));
      var diffPct = Math.round(((avgWh - targetWh) / targetWh) * 100);
      var diffBadge = diffPct > 0 ?
        '<span style="font-size:10.5px;color:var(--amber);font-weight:600;">(+' + diffPct + '% สูงกว่าเป้า)</span>' :
        '<span style="font-size:10.5px;color:var(--emerald);font-weight:600;">(' + Math.abs(diffPct) + '% ประหยัดกว่าเป้า)</span>';

      return '<div style="margin-bottom:14px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<span style="font-size:14px;">' + t.icon + '</span>' +
            '<strong style="font-size:12.5px;color:var(--text-main);white-space:nowrap;">' + t.name + '</strong>' +
            '<span style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">(' + t.count + ' ทริป)</span>' +
          '</div>' +
          '<div style="display:flex;align-items:baseline;gap:6px;flex-shrink:0;">' +
            '<strong style="font-size:13px;font-family:JetBrains Mono;color:' + t.color + ';">' + avgWh + ' <span style="font-size:9.5px;font-weight:normal;color:var(--text-muted);">Wh/km</span></strong>' +
            '<span style="font-size:11px;font-family:JetBrains Mono;color:var(--text-secondary);">' + costKm.toFixed(2) + ' ฿/km</span>' +
          '</div>' +
        '</div>' +
        '<div style="position:relative;background:var(--surface-subtle);border-radius:6px;height:12px;overflow:hidden;border:1px solid var(--border);">' +
          '<div style="width:' + barPct + '%;height:100%;background:' + t.grad + ';border-radius:6px;transition:width 0.4s ease;"></div>' +
          '<div style="position:absolute;top:0;bottom:0;left:' + targetPct + '%;width:2px;background:var(--text-muted);opacity:0.45;z-index:2;" title="เป้าหมาย 140 Wh/km"></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-top:3px;">' +
          '<span style="color:var(--text-muted);font-size:10.5px;">' + t.note + '</span>' +
          '<div>' + diffBadge + '</div>' +
        '</div>' +
      '</div>';
    }).join("");

    return '<div class="card">' +
      '<div class="card-header">' +
        '<div>' +
          '<div class="card-title">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2.2"><path d="M12 20V10M18 20V4M6 20v-4"></path></svg>' +
            ' ประสิทธิภาพแยกตามระยะทาง (Efficiency by Distance)' +
          '</div>' +
          '<div class="card-subtitle">วิเคราะห์อัตรากินไฟ (Wh/km) และต้นทุน (฿/km) ตามลักษณะการเดินทาง</div>' +
        '</div>' +
        '<span class="badge badge-teal">' + validTrips.length + ' ทริป</span>' +
      '</div>' +
      '<div style="padding:10px 4px 4px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:11px;color:var(--text-muted);">' +
          '<span>ช่วงระยะทาง & จำนวนทริป</span>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<span style="display:inline-block;width:8px;height:2px;background:var(--text-muted);opacity:0.6;"></span>' +
            '<span>เส้นเป้าหมาย ' + targetWh + ' Wh/km</span>' +
          '</div>' +
        '</div>' +
        rowsHtml +
        '<div style="margin-top:14px;padding:10px 12px;border-radius:var(--radius-md);background:var(--surface-subtle);border-left:3px solid var(--emerald);display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--text-main);">' +
          '<span style="font-size:15px;">💡</span>' +
          '<div><strong>ข้อค้นพบจริง:</strong> ยิ่งเดินทางไกล อัตรากินไฟจะลดลงเหลือเพียง <strong>97 Wh/km (0.48 ฿/km)</strong> ประหยัดกว่าการขับระยะสั้นในซอยถึง <strong>57%</strong></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderDashboardView(agg, rows) {
    var vState = getLatestVehicleState(rows);
    var chargeRows = rows.filter(function(r) { return r.kind === "charge"; });
    var tripRows = rows.filter(function(r) { return r.kind === "trip"; });
    var recentCharges = chargeRows.slice(-5).reverse();
    var monthly = computeMonthlyData();

    var acKwh = 0, dcKwh = 0, acCost = 0, dcCost = 0, acCount = 0, dcCount = 0;
    chargeRows.forEach(function(r) {
      var isDc = isDcChargeRecord ? isDcChargeRecord(r) : (r.note && r.note.toUpperCase().indexOf("DC") !== -1);
      if (isDc) {
        dcKwh += (r.kwh || 0);
        dcCost += (r.net || 0);
        dcCount++;
      } else {
        acKwh += (r.kwh || 0);
        acCost += (r.net || 0);
        acCount++;
      }
    });
    var totalChargeKwh = acKwh + dcKwh;
    var acPct = totalChargeKwh > 0 ? Math.round((acKwh / totalChargeKwh) * 100) : 0;
    var dcPct = totalChargeKwh > 0 ? (100 - acPct) : 0;

    var whPerKm = agg.efficiencyKmPerKwh > 0 ? Math.round(1000 / agg.efficiencyKmPerKwh) : 0;
    var costPerKmSavedPct = agg.petrolCostPerKm > 0 ? Math.round(((agg.petrolCostPerKm - agg.costPerKm) / agg.petrolCostPerKm) * 100) : 0;
    var savingsPct = (agg.totalDistanceKm > 0 && agg.petrolCostPerKm > 0) ? Math.round((agg.totalSavings / (agg.totalDistanceKm * agg.petrolCostPerKm)) * 100) : 0;

    var socWidth = Math.min(100, Math.max(5, vState.soc));
    var socColor = vState.soc <= 20 ? "var(--rose)" : vState.soc <= 40 ? "var(--amber)" : "var(--emerald)";
    var socGradient = vState.soc <= 20 ? "linear-gradient(90deg, #F87171, #EF4444)" : vState.soc <= 40 ? "linear-gradient(90deg, #FBBF24, #F59E0B)" : "linear-gradient(90deg, #38BDF8, #10B981)";


    var recentRowsHtml = recentCharges.length === 0 ?
      '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px;">ยังไม่มีข้อมูลการชาร์จ</td></tr>' :
      recentCharges.map(function(r) {
        var isDc = isDcChargeRecord ? isDcChargeRecord(r) : (r.note && r.note.toUpperCase().indexOf("DC") !== -1);
        var iconSvg = isDc ?
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-1px;margin-right:4px;"><rect x="3" y="2" width="11" height="20" rx="2"></rect><line x1="3" y1="8" x2="14" y2="8"></line><path d="M14 9h2a2 2 0 0 1 2 2v5"></path><polygon points="8.5 11 6.5 14 9 14 8 17 11 13 8.5 13 9 11" fill="currentColor"></polygon></svg>' :
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-1px;margin-right:4px;"><path d="M3 10.5 12 3l9 7.5v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polygon points="12 8 9 13 12 13 11 17 15 12 12 12 13 8" fill="currentColor"></polygon></svg>';
        return '<tr>' +
          '<td><strong>' + (r.iso || "-") + '</strong><div style="font-size:11.5px;color:var(--text-muted);font-family:var(--font-mono)">' + (r.time || "-") + '</div></td>' +
          '<td><span class="badge ' + (isDc ? 'badge-sky' : 'badge-teal') + '" style="display:inline-flex;align-items:center;">' + iconSvg + (r.note || "ชาร์จไฟ") + '</span></td>' +
          '<td class="mono">' + (r.s0 || 0) + '% → <strong>' + (r.s1 || 0) + '%</strong></td>' +
          '<td class="mono"><strong>' + fmtNum(r.kwh, 2) + '</strong> kWh</td>' +
          '<td class="mono" style="color:var(--primary);font-weight:600;">' + fmtNum(r.net, 2) + ' ฿</td>' +
          '<td class="mono" style="color:var(--text-muted)">' + (r.kwh > 0 ? fmtNum(r.net / r.kwh, 2) : "-") + '</td>' +
          '<td><button class="btn btn-secondary btn-sm" data-action="edit" data-row="' + r.sheetRowIndex + '">แก้ไข</button></td>' +
          '</tr>';
      }).join("");

    return '<!-- Hero Vehicle Telemetry Card -->' +
      '<div class="hero-telemetry-card">' +
        '<div class="hero-top-row">' +
          '<div class="hero-vehicle-info">' +
            '<div class="hero-vehicle-title">' +
              '<span class="v-status-dot-pulse"></span>' +
              '<span>' + state.vehicleName + '</span>' +
              '<span class="hero-plate-badge">' + state.vehiclePlate + '</span>' +
            '</div>' +
            '<div class="hero-sync-time">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
              'อัปเดตล่าสุด: ' + (vState.date ? vState.date + ' ' + vState.time : 'พร้อมใช้งาน') +
            '</div>' +
          '</div>' +
          '<div class="hero-actions">' +
            '<button class="btn btn-primary btn-sm" data-nav="add-charging">' +
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>' +
              '+ บันทึกชาร์จ' +
            '</button>' +
            '<button class="btn btn-secondary btn-sm" data-nav="add-trip">' +
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>' +
              '+ บันทึกเดินทาง' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div class="hero-body-grid">' +
          '<div class="hero-soc-card">' +
            '<div class="hero-soc-header">' +
              '<span class="hero-stat-label">ระดับแบตเตอรี่คงเหลือ (SOC)</span>' +
              '<span class="hero-soc-pill" style="color:' + socColor + ';">' + vState.soc + '%</span>' +
            '</div>' +
            '<div class="soc-range-bar">' +
              '<div class="soc-fill" style="width:' + socWidth + '%;background:' + socGradient + ';"></div>' +
            '</div>' +
            '<div class="hero-soc-scale">' +
              '<span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>' +
            '</div>' +
          '</div>' +

          '<div class="hero-metrics-row">' +
            '<div class="hero-stat-box">' +
              '<div class="hero-stat-icon" style="background:var(--emerald-soft);color:var(--emerald);">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2a10 10 0 0 1 10 10"></path><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>' +
              '</div>' +
              '<div>' +
                '<div class="hero-stat-label">ระยะทางวิ่งได้ (WLTP)</div>' +
                '<div class="hero-stat-val" style="color:var(--emerald);">' + vState.estRangeKm + ' <span class="hero-stat-unit">km</span></div>' +
              '</div>' +
            '</div>' +

            '<div class="hero-stat-box">' +
              '<div class="hero-stat-icon" style="background:var(--primary-soft);color:var(--primary);">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>' +
              '</div>' +
              '<div>' +
                '<div class="hero-stat-label">พลังงานคงเหลือในแบต</div>' +
                '<div class="hero-stat-val">' + vState.remainingKwh.toFixed(1) + ' <span class="hero-stat-unit">/ ' + state.batteryCapacity.toFixed(1) + ' kWh</span></div>' +
              '</div>' +
            '</div>' +

            '<div class="hero-stat-box">' +
              '<div class="hero-stat-icon" style="background:var(--indigo-soft);color:var(--indigo);">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
              '</div>' +
              '<div>' +
                '<div class="hero-stat-label">เลขไมล์รวม (ODO)</div>' +
                '<div class="hero-stat-val">' + fmtNum(vState.odo || agg.latestOdo, 0) + ' <span class="hero-stat-unit">km</span></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Headline 6-KPI Metric Grid -->' +
      '<div class="kpi-section-header">' +
        '<div class="kpi-section-title">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>' +
          '<span>สถิติสำคัญและประสิทธิภาพ (Key Performance Indicators)</span>' +
        '</div>' +
        '<span class="badge badge-teal" style="font-size:11px;">ข้อมูลรวม ' + agg.chargeCount + ' ชาร์จ • ' + agg.tripCount + ' ทริป</span>' +
      '</div>' +

      '<div class="kpi-grid">' +
        '<!-- 1. ระยะทางวิ่งสะสม -->' +
        '<div class="kpi-card" style="--kpi-accent:var(--sky);--kpi-soft:var(--sky-soft)">' +
          '<div class="kpi-top">' +
            '<span class="kpi-label">ระยะทางวิ่งสะสม</span>' +
            '<div class="kpi-icon-pill">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
            '</div>' +
          '</div>' +
          '<div class="kpi-value-box">' +
            '<span class="kpi-value">' + fmtNum(agg.totalDistanceKm, 0) + '</span>' +
            '<span class="kpi-unit">km</span>' +
          '</div>' +
          '<div class="kpi-badge-wrap">' +
            '<span class="kpi-trend-pill positive">Odo: ' + fmtNum(vState.odo || agg.latestOdo, 0) + ' km</span>' +
            '<span class="kpi-subtext">เดินทางสะสม ' + agg.tripCount + ' ทริป</span>' +
          '</div>' +
        '</div>' +

        '<!-- 2. พลังงานสะสมที่ชาร์จ -->' +
        '<div class="kpi-card" style="--kpi-accent:var(--primary);--kpi-soft:var(--primary-soft)">' +
          '<div class="kpi-top">' +
            '<span class="kpi-label">พลังงานสะสมที่ชาร์จ</span>' +
            '<div class="kpi-icon-pill">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>' +
            '</div>' +
          '</div>' +
          '<div class="kpi-value-box">' +
            '<span class="kpi-value">' + fmtNum(agg.totalChargedKwh, 1) + '</span>' +
            '<span class="kpi-unit">kWh</span>' +
          '</div>' +
          '<div class="kpi-badge-wrap">' +
            '<span class="kpi-trend-pill neutral">~' + agg.chargeCycles.toFixed(1) + ' รอบแบตเตอรี่เต็ม</span>' +
            '<span class="kpi-subtext">ชาร์จรวม ' + agg.chargeCount + ' ครั้ง</span>' +
          '</div>' +
        '</div>' +

        '<!-- 3. ค่าใช้จ่ายชาร์จรวม -->' +
        '<div class="kpi-card" style="--kpi-accent:var(--indigo);--kpi-soft:var(--indigo-soft)">' +
          '<div class="kpi-top">' +
            '<span class="kpi-label">ค่าใช้จ่ายชาร์จรวม</span>' +
            '<div class="kpi-icon-pill">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>' +
            '</div>' +
          '</div>' +
          '<div class="kpi-value-box">' +
            '<span class="kpi-value">' + fmtNum(agg.totalCostThb, 0) + '</span>' +
            '<span class="kpi-unit">฿</span>' +
          '</div>' +
          '<div class="kpi-badge-wrap">' +
            '<span class="kpi-trend-pill neutral">เฉลี่ย ' + (agg.chargeCount > 0 ? fmtNum(agg.totalCostThb / agg.chargeCount, 0) : 0) + ' ฿/ครั้ง</span>' +
            '<span class="kpi-subtext">ค่าไฟฐาน ' + state.unitRate.toFixed(2) + ' ฿/kWh</span>' +
          '</div>' +
        '</div>' +

        '<!-- 4. ประสิทธิภาพพลังงาน -->' +
        '<div class="kpi-card" style="--kpi-accent:var(--emerald);--kpi-soft:var(--emerald-soft)">' +
          '<div class="kpi-top">' +
            '<span class="kpi-label">ประสิทธิภาพพลังงาน</span>' +
            '<div class="kpi-icon-pill">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>' +
            '</div>' +
          '</div>' +
          '<div class="kpi-value-box">' +
            '<span class="kpi-value">' + fmtNum(agg.efficiencyKmPerKwh, 1) + '</span>' +
            '<span class="kpi-unit">km/kWh</span>' +
          '</div>' +
          '<div class="kpi-badge-wrap">' +
            '<span class="kpi-trend-pill positive">~' + whPerKm + ' Wh/km</span>' +
            '<span class="kpi-subtext">มาตรฐาน SUV ไฟฟ้า</span>' +
          '</div>' +
        '</div>' +

        '<!-- 5. ต้นทุนต่อกิโลเมตร -->' +
        '<div class="kpi-card" style="--kpi-accent:var(--sky);--kpi-soft:var(--sky-soft)">' +
          '<div class="kpi-top">' +
            '<span class="kpi-label">ต้นทุนต่อกิโลเมตร</span>' +
            '<div class="kpi-icon-pill">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>' +
            '</div>' +
          '</div>' +
          '<div class="kpi-value-box">' +
            '<span class="kpi-value">' + fmtNum(agg.costPerKm, 2) + '</span>' +
            '<span class="kpi-unit">฿/km</span>' +
          '</div>' +
          '<div class="kpi-badge-wrap">' +
            '<span class="kpi-trend-pill positive">▼ ประหยัด ' + costPerKmSavedPct + '%</span>' +
            '<span class="kpi-subtext">เบนซิน ~' + fmtNum(agg.petrolCostPerKm, 2) + ' ฿/km</span>' +
          '</div>' +
        '</div>' +

        '<!-- 6. ประหยัดเทียบกับน้ำมัน -->' +
        '<div class="kpi-card" style="--kpi-accent:var(--emerald);--kpi-soft:var(--emerald-soft)">' +
          '<div class="kpi-top">' +
            '<span class="kpi-label">ประหยัดเทียบกับน้ำมัน</span>' +
            '<div class="kpi-icon-pill">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>' +
            '</div>' +
          '</div>' +
          '<div class="kpi-value-box">' +
            '<span class="kpi-value" style="color:var(--emerald);">' + fmtNum(agg.totalSavings, 0) + '</span>' +
            '<span class="kpi-unit">฿</span>' +
          '</div>' +
          '<div class="kpi-badge-wrap">' +
            '<span class="kpi-trend-pill positive">ประหยัดได้ถึง ~' + savingsPct + '%</span>' +
            '<span class="kpi-subtext">เทียบรถเบนซิน 16 km/L</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Data Visualization 2x2 Hub (Mockup 1: Executive Performance & Operations) -->' +
      '<div class="viz-grid-2x2">' +
        '<!-- Chart A: Efficiency Trend (Line Chart) -->' +
        generateEfficiencyLineChart(tripRows) +

        '<!-- Chart B: Charging Energy & Cost Mix (Donut Chart) -->' +
        generateChargingDonutChart(acKwh, dcKwh, acCost, dcCost, totalChargeKwh, agg.costPerKm, acCount, dcCount, chargeRows) +

        '<!-- Chart C: Monthly Comparison (Bar Chart) -->' +
        generateMonthlyCostBarChart(monthly) +

        '<!-- Chart D: Efficiency by Distance Range (Intuitive Bars) -->' +
        generateDistanceEfficiencyBars(tripRows) +
      '</div>' +

      '<!-- Recent Charges Table -->' +
      '<div class="card">' +
        '<div class="card-header">' +
          '<div>' +
            '<div class="card-title">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>' +
              ' รายการชาร์จล่าสุด (Recent Charges)' +
            '</div>' +
            '<div class="card-subtitle">5 รายการล่าสุดจาก Google Sheets</div>' +
          '</div>' +
          '<button class="btn btn-secondary btn-sm" data-nav="charging-history">ดูทั้งหมด (' + agg.chargeCount + ')</button>' +
        '</div>' +
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
        var isDc = isDcChargeRecord ? isDcChargeRecord(r) : (r.note && (r.note.toLowerCase().indexOf("dc") !== -1 || r.note.indexOf("เร็ว") !== -1));
        var iconSvg = isDc ?
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-1px;margin-right:4px;"><rect x="3" y="2" width="11" height="20" rx="2"></rect><line x1="3" y1="8" x2="14" y2="8"></line><path d="M14 9h2a2 2 0 0 1 2 2v5"></path><polygon points="8.5 11 6.5 14 9 14 8 17 11 13 8.5 13 9 11" fill="currentColor"></polygon></svg>' :
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-1px;margin-right:4px;"><path d="M3 10.5 12 3l9 7.5v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polygon points="12 8 9 13 12 13 11 17 15 12 12 12 13 8" fill="currentColor"></polygon></svg>';
        var addedSoc = Math.max(0, (r.s1 || 0) - (r.s0 || 0));
        return '<tr>' +
          '<td class="mono" style="color:var(--text-subtle)">#' + r.sheetRowIndex + '</td>' +
          '<td><strong>' + (r.iso || "-") + '</strong><div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">' + (r.time || "-") + '</div>' + (r.purpose === "business" ? '<div style="margin-top:3px;">' + purposeBadge("business") + '</div>' : '') + '</td>' +
          '<td><span class="badge ' + (isDc ? 'badge-sky' : 'badge-teal') + '" style="display:inline-flex;align-items:center;">' + iconSvg + (r.note || "ชาร์จไฟ") + '</span></td>' +
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
          '<div class="form-group"><label>🔌 สถานที่ / สถานีชาร์จ</label><input type="text" class="form-control" name="note" id="addNote" placeholder="เช่น บ้าน (Home AC), PTT EV Station, EA Anywhere" value="บ้าน (Home AC)" required></div>' +
        '</div>' +
        fleetFormFields("add", null) +
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
          '<div class="form-group"><label>🗺️ รายละเอียดเส้นทาง / สภาพการขับขี่</label><input type="text" class="form-control" name="note" id="tripNote" placeholder="เช่น ECO mode, 28°C หรือ เดินทางไปทำงาน" value="การเดินทางทั่วไป" required></div>' +
        '</div>' +
        fleetFormFields("trip", null) +
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
      '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">ยังไม่มีบันทึกการเดินทาง สามารถกดบันทึกรายการเดินทางใหม่ได้ทันที</td></tr>' :
      reversedTrips.map(function(r) {
        return '<tr>' +
          '<td><strong>' + (r.iso || "-") + '</strong></td>' +
          '<td style="white-space:nowrap;">' + escHtml(driverLabel(r)) + '<div style="margin-top:3px;">' + purposeBadge(r.purpose) + '</div></td>' +
          '<td>' + escHtml(r.note || "การเดินทางทั่วไป") + '</td>' +
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
        '<table class="data-table"><thead><tr><th>วันที่</th><th>ผู้ขับ / ประเภท</th><th>รายละเอียดเส้นทาง / จุดหมาย</th><th>ไมล์เริ่มต้น</th><th>ไมล์สิ้นสุด</th><th>ระยะทาง (km)</th><th>ระยะเวลา (นาที)</th><th>อัตราสิ้นเปลือง</th><th>จัดการ</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody></table>' +
      '</div>' +
    '</div>';
  }

  // ---------- Multi-Car Fleet (แผนที่ 4) ----------
  function getVehicles() {
    var meta = state.payload.data && state.payload.data.meta;
    var list = (meta && meta.vehicles) || [];
    if (list.length === 0) {
      list = [{ id: "V1", name: "XPENG G6 STD", plate: "", batteryKwh: (meta && meta.batteryCapacity) || 68.5, isDefault: true }];
    }
    return list;
  }

  function getDefaultVehicleId() {
    var meta = state.payload.data && state.payload.data.meta;
    var list = getVehicles();
    if (meta && meta.defaultVehicleId) return meta.defaultVehicleId;
    return (list.find(function(v) { return v.isDefault; }) || list[0]).id;
  }

  function getVehicleById(id) {
    return getVehicles().find(function(v) { return v.id === id; }) || null;
  }

  /** รถที่ใช้คำนวณค่าเฉพาะคัน (ความจุแบต ฯลฯ) — ถ้าเลือก "ทุกคัน" ใช้คันหลัก */
  function focusVehicleId() {
    return state.activeVehicle === "all" ? getDefaultVehicleId() : state.activeVehicle;
  }

  function applyActiveVehicle() {
    if (state.activeVehicle !== "all" && !getVehicleById(state.activeVehicle)) {
      state.activeVehicle = getDefaultVehicleId();
    }
    var v = getVehicleById(focusVehicleId()) || getVehicles()[0];
    state.vehicleName = v.name;
    state.vehiclePlate = v.plate || "-";
    state.batteryCapacity = Number(v.batteryKwh) || 68.5;
  }

  function setActiveVehicle(id) {
    state.activeVehicle = id;
    try { localStorage.setItem("ev_active_vehicle", id); } catch (e) {}
    renderView();
  }

  function rowVehicle(r) {
    return r.vehicle || getDefaultVehicleId();
  }

  function getAllRows() {
    return (state.payload.data && state.payload.data.rows) || [];
  }

  function getRows() {
    var rows = getAllRows();
    if (state.activeVehicle === "all") return rows;
    return rows.filter(function(r) { return rowVehicle(r) === state.activeVehicle; });
  }

  function driverLabel(r) {
    return r.driver || state.defaultDriver || "ไม่ระบุ";
  }

  function knownDrivers() {
    var set = {};
    getAllRows().forEach(function(r) { if (r.driver) set[r.driver] = true; });
    if (state.defaultDriver) set[state.defaultDriver] = true;
    return Object.keys(set).sort();
  }

  function purposeBadge(p) {
    return p === "business"
      ? '<span class="badge" style="background:var(--indigo-soft);color:var(--indigo);">งาน</span>'
      : '<span class="badge" style="background:var(--surface-subtle);color:var(--text-muted);">ส่วนตัว</span>';
  }

  function vehicleOptions(selectedId) {
    return getVehicles().map(function(v) {
      return '<option value="' + escHtml(v.id) + '"' + (v.id === selectedId ? " selected" : "") + '>' +
        escHtml(v.name) + (v.plate ? " · " + escHtml(v.plate) : "") + ' (' + Number(v.batteryKwh).toFixed(1) + ' kWh)</option>';
    }).join("");
  }

  /** ช่อง รถ / ผู้ขับ / ประเภทการเดินทาง ใช้ร่วมกันในฟอร์มเพิ่มและแก้ไข */
  function fleetFormFields(prefix, rec) {
    var vid = rec ? rowVehicle(rec) : focusVehicleId();
    var drv = rec ? (rec.driver || "") : (state.defaultDriver || "");
    var pur = rec ? (rec.purpose || "personal") : "personal";
    var dl = knownDrivers().map(function(d) { return '<option value="' + escHtml(d) + '">'; }).join("");
    return '<div class="form-grid">' +
      '<div class="form-group"><label>🚗 รถยนต์</label><select class="form-control" name="vehicle" id="' + prefix + 'VehicleSelect">' + vehicleOptions(vid) + '</select></div>' +
      '<div class="form-group"><label>👤 ผู้ขับ</label><input type="text" class="form-control" name="driver" list="' + prefix + 'DriverList" value="' + escHtml(drv) + '" placeholder="ชื่อผู้ขับ"><datalist id="' + prefix + 'DriverList">' + dl + '</datalist></div>' +
    '</div>' +
    '<div class="form-group"><label>🏷️ ประเภทการเดินทาง</label><select class="form-control" name="purpose">' +
      '<option value="personal"' + (pur !== "business" ? " selected" : "") + '>ส่วนตัว (Personal)</option>' +
      '<option value="business"' + (pur === "business" ? " selected" : "") + '>งาน (Business) · ใช้ออกรายงานเบิกจ่าย</option>' +
    '</select></div>';
  }

  function capForSelect(id) {
    var el = document.getElementById(id);
    var v = el ? getVehicleById(el.value) : null;
    return v ? Number(v.batteryKwh) : state.batteryCapacity;
  }

  async function refreshPayload() {
    var dRes = await fetch("/api/data");
    var dJson = await dRes.json();
    if (dJson.ok) state.payload = dJson;
  }

  async function saveVehicleProfile(body) {
    var res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    var json = await res.json();
    if (!json.ok) throw new Error(json.error || "Unknown");
    await refreshPayload();
    return json;
  }

  function vehicleStats(vid) {
    var rows = getAllRows().filter(function(r) { return rowVehicle(r) === vid; });
    var s = { rows: rows.length, trips: 0, km: 0, consKm: 0, energy: 0, charges: 0, kwh: 0, cost: 0, lastSoc: null, lastOdo: 0 };
    rows.forEach(function(r) {
      if (r.kind === "trip" && r.km > 0 && r.km < 600) {
        s.trips++;
        s.km += r.km;
        if (r.cons > 0) { s.consKm += r.km; s.energy += r.km * (r.cons > 50 ? r.cons / 1000 : r.cons / 100); }
      }
      if (r.kind === "charge") { s.charges++; s.kwh += r.kwh || 0; s.cost += r.net || 0; }
      if (r.s1 > 0 && r.s1 <= 100) s.lastSoc = r.s1;
      if (r.odoEnd > s.lastOdo && r.odoEnd < 1000000) s.lastOdo = r.odoEnd;
    });
    s.whKm = s.consKm > 0 ? s.energy / s.consKm * 1000 : null;
    return s;
  }

  function renderVehiclesView(agg) {
    var vehicles = getVehicles();
    var defId = getDefaultVehicleId();
    var cards = vehicles.map(function(v) {
      var st = vehicleStats(v.id);
      var isActive = state.activeVehicle === v.id;
      var stat = function(label, val) {
        return '<div><div style="font-size:11.5px;color:var(--text-muted)">' + label + '</div><strong style="font-family:var(--font-mono);font-size:15px;">' + val + '</strong></div>';
      };
      return '<div class="card" style="border-top:4px solid ' + (isActive ? 'var(--primary)' : 'var(--border-strong)') + ';display:flex;flex-direction:column;gap:12px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">' +
          '<div style="min-width:0;">' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">' +
              (v.id === defId ? '<span class="badge badge-teal">คันหลัก</span>' : '') +
              (isActive ? '<span class="badge badge-emerald">กำลังแสดง</span>' : '') +
              '<span class="badge" style="background:var(--surface-subtle);color:var(--text-muted);font-family:var(--font-mono);">' + escHtml(v.id) + '</span>' +
            '</div>' +
            '<h3 style="font-size:17px;font-weight:700;overflow-wrap:anywhere;">' + escHtml(v.name) + '</h3>' +
            '<p style="font-family:var(--font-mono);font-size:13px;color:var(--text-muted);">' + (v.plate ? escHtml(v.plate) : 'ยังไม่ระบุทะเบียน') + '</p>' +
          '</div>' +
          '<div style="flex-shrink:0;width:44px;height:44px;border-radius:var(--radius-md);background:var(--teal-soft);display:flex;align-items:center;justify-content:center;color:var(--teal)"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:var(--surface-subtle);padding:12px;border-radius:var(--radius-md);">' +
          stat("ความจุแบตเตอรี่", Number(v.batteryKwh).toFixed(1) + ' kWh') +
          stat("% แบตล่าสุด", st.lastSoc !== null ? st.lastSoc + '%' : '-') +
          stat("ระยะทางสะสม", fmtNum(st.km, 0) + ' km') +
          stat("อัตรากินไฟเฉลี่ย", st.whKm !== null ? st.whKm.toFixed(0) + ' Wh/km' : '-') +
          stat("ชาร์จ " + st.charges + " ครั้ง", fmtNum(st.kwh, 0) + ' kWh') +
          stat("ค่าชาร์จรวม", fmtNum(st.cost, 0) + ' ฿') +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          (isActive ? '' : '<button type="button" class="btn btn-primary btn-sm" style="flex:1;" data-vehicle-use="' + escHtml(v.id) + '">แสดงข้อมูลคันนี้</button>') +
          '<button type="button" class="btn btn-secondary btn-sm" style="flex:1;" data-vehicle-edit="' + escHtml(v.id) + '">แก้ไข</button>' +
          (v.id === defId ? '' : '<button type="button" class="btn btn-secondary btn-sm" style="flex:1;" data-vehicle-default="' + escHtml(v.id) + '">ตั้งเป็นคันหลัก</button>') +
        '</div>' +
      '</div>';
    }).join("");

    var addCard = '<button type="button" class="card" data-vehicle-edit="" style="border:2px dashed var(--border-strong);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:220px;cursor:pointer;color:var(--text-muted);font:inherit;background:var(--surface);">' +
      '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
      '<strong style="font-size:14px;color:var(--text-main);">เพิ่มรถคันใหม่</strong>' +
      '<span style="font-size:12px;">บันทึกลงแท็บ Vehicles ใน Google Sheets</span>' +
    '</button>';

    var allBtn = vehicles.length > 1
      ? '<div style="display:flex;justify-content:flex-end;"><button type="button" class="btn ' + (state.activeVehicle === "all" ? 'btn-primary' : 'btn-secondary') + ' btn-sm" data-vehicle-use="all">แสดงข้อมูลรวมทุกคัน</button></div>'
      : '';

    return '<div style="display:flex;flex-direction:column;gap:16px;">' + allBtn +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:20px;">' + cards + addCard + '</div>' +
      '<div style="font-size:12px;color:var(--text-muted);line-height:1.6;">รายการเก่าที่ยังไม่ระบุรถ นับเป็นของคันหลัก · รายการที่ส่งผ่าน LINE จะบันทึกเป็นคันหลักเสมอ แก้เป็นคันอื่นได้ในหน้าประวัติ</div>' +
    '</div>';
  }

  function openVehicleModal(id) {
    var v = id ? getVehicleById(id) : null;
    var presets = [["XPENG G6 Standard", 68.5], ["XPENG G6 Long Range", 87.5], ["BYD Atto 3 Extended", 60.48], ["BYD Seal Premium", 82.5], ["Tesla Model Y RWD", 60.0], ["Tesla Model 3 LR", 75.0], ["MG4 Electric", 51.0]];
    var modal = document.getElementById("modalContainer");
    modal.innerHTML = '<div class="modal-backdrop">' +
      '<div class="modal-content" style="max-width:520px;">' +
        '<div class="modal-header"><div class="modal-title">' + (v ? '✏️ แก้ไขรถ ' + escHtml(v.name) : '🚗 เพิ่มรถคันใหม่') + '</div><button class="btn btn-secondary btn-sm" id="btnCloseVehicleModal">✕</button></div>' +
        '<form id="formVehicle">' +
          '<div class="modal-body">' +
            '<div class="form-group"><label>ชื่อรุ่นรถ</label><input type="text" class="form-control" id="cfgVehicleName" value="' + (v ? escHtml(v.name) : '') + '" required placeholder="เช่น BYD Atto 3"></div>' +
            '<div class="form-grid">' +
              '<div class="form-group"><label>เลขทะเบียน</label><input type="text" class="form-control" id="cfgVehiclePlate" value="' + (v ? escHtml(v.plate) : '') + '" placeholder="เช่น 1กข 1234 กทม."></div>' +
              '<div class="form-group"><label>ความจุแบตเตอรี่ (kWh)</label><input type="number" step="0.1" min="5" max="250" class="form-control mono" id="cfgBatteryCapacity" value="' + (v ? v.batteryKwh : '') + '" required></div>' +
            '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 12px;">' +
              presets.map(function(p) { return '<button type="button" class="btn btn-secondary btn-sm" data-preset="' + p[0] + '" data-cap="' + p[1] + '">' + p[0] + ' (' + p[1] + ')</button>'; }).join("") +
            '</div>' +
            '<label style="display:flex;align-items:center;gap:8px;font-size:13px;"><input type="checkbox" id="cfgVehicleDefault"' + (v && v.isDefault ? ' checked disabled' : '') + '> ตั้งเป็นคันหลัก (รายการจาก LINE จะบันทึกเป็นคันนี้)</label>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-secondary" id="btnCancelVehicle">ยกเลิก</button>' +
            '<button type="submit" class="btn btn-primary" id="btnSubmitVehicle">บันทึกรถ</button>' +
          '</div>' +
        '</form>' +
      '</div>' +
    '</div>';

    var close = function() { modal.innerHTML = ""; };
    document.getElementById("btnCloseVehicleModal").onclick = close;
    document.getElementById("btnCancelVehicle").onclick = close;
    document.getElementById("formVehicle").onsubmit = async function(e) {
      e.preventDefault();
      var btn = document.getElementById("btnSubmitVehicle");
      btn.disabled = true; btn.innerText = "กำลังบันทึก...";
      try {
        await saveVehicleProfile({
          id: v ? v.id : "",
          name: document.getElementById("cfgVehicleName").value.trim(),
          plate: document.getElementById("cfgVehiclePlate").value.trim(),
          batteryKwh: parseFloat(document.getElementById("cfgBatteryCapacity").value),
          isDefault: document.getElementById("cfgVehicleDefault").checked
        });
        showToast(v ? "แก้ไขข้อมูลรถเรียบร้อยแล้ว" : "เพิ่มรถคันใหม่เรียบร้อยแล้ว", "success");
        close();
        renderView();
      } catch (err) {
        showToast("บันทึกรถไม่สำเร็จ: " + err.message, "error");
        btn.disabled = false; btn.innerText = "บันทึกรถ";
      }
    };
  }

  function renderDriversView(rows) {
    var nowMonth = new Date(Date.now() + 7 * 3600 * 1000).toISOString().substring(0, 7);
    var trips = rows.filter(function(r) {
      return r.kind === "trip" && r.km > 0 && r.km < 600 && (state.driverPeriod !== "month" || (r.iso || "").substring(0, 7) === nowMonth);
    });
    var groups = {};
    trips.forEach(function(r) {
      var d = driverLabel(r);
      var g = groups[d] || (groups[d] = { name: d, trips: 0, km: 0, consKm: 0, energy: 0, cost: 0, min: 0, minKm: 0, bizKm: 0 });
      g.trips++;
      g.km += r.km;
      g.cost += r.net || 0;
      if (r.cons > 0) { g.consKm += r.km; g.energy += r.km * (r.cons > 50 ? r.cons / 1000 : r.cons / 100); }
      if (r.min > 0) { g.min += r.min; g.minKm += r.km; }
      if (r.purpose === "business") g.bizKm += r.km;
    });
    var list = Object.keys(groups).map(function(k) {
      var g = groups[k];
      g.whKm = g.consKm > 0 ? g.energy / g.consKm * 1000 : null;
      g.costKm = g.km > 0 ? g.cost / g.km : 0;
      g.kmh = g.min > 0 ? g.minKm / (g.min / 60) : null;
      // ต้องมีทริปที่มีอัตรากินไฟรวม ≥ 20 km จึงจัดอันดับ กันค่าจากทริปสั้นๆ ไม่กี่ทริป
      g.ranked = g.whKm !== null && g.consKm >= 20;
      return g;
    });
    var ranked = list.filter(function(g) { return g.ranked; }).sort(function(a, b) { return a.whKm - b.whKm; });
    var best = ranked.length ? ranked[0].whKm : null;
    ranked.forEach(function(g, i) { g.rank = i + 1; g.score = Math.round(best / g.whKm * 100); });
    var unranked = list.filter(function(g) { return !g.ranked; }).sort(function(a, b) { return b.km - a.km; });
    var longest = list.slice().sort(function(a, b) { return b.km - a.km; })[0];
    var medals = ["🥇", "🥈", "🥉"];

    var toggle = '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      '<button type="button" class="btn btn-sm ' + (state.driverPeriod !== "month" ? 'btn-primary' : 'btn-secondary') + '" data-driver-period="all">ทั้งหมด</button>' +
      '<button type="button" class="btn btn-sm ' + (state.driverPeriod === "month" ? 'btn-primary' : 'btn-secondary') + '" data-driver-period="month">เดือนนี้ (' + formatThaiMonth(nowMonth) + ')</button>' +
    '</div>';

    var card = function(g) {
      var badges = "";
      if (g.rank === 1 && ranked.length > 1) badges += '<span class="badge badge-emerald">🏆 ประหยัดที่สุด</span>';
      if (longest && g.name === longest.name && list.length > 1) badges += '<span class="badge badge-sky">🛣️ ขับไกลที่สุด</span>';
      var stat = function(label, val) {
        return '<div><div style="font-size:11px;color:var(--text-muted)">' + label + '</div><strong style="font-family:var(--font-mono);font-size:14px;">' + val + '</strong></div>';
      };
      return '<div class="card" style="display:flex;flex-direction:column;gap:12px;' + (g.rank === 1 && ranked.length > 1 ? 'border-top:4px solid var(--emerald);' : '') + '">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="font-size:30px;line-height:1;width:40px;text-align:center;">' + (g.ranked ? (medals[g.rank - 1] || ('#' + g.rank)) : '👤') + '</div>' +
          '<div style="min-width:0;flex:1;">' +
            '<h3 style="font-size:16px;font-weight:700;overflow-wrap:anywhere;">' + escHtml(g.name) + '</h3>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">' + badges + '</div>' +
          '</div>' +
          (g.ranked ? '<div style="text-align:right;"><div style="font-size:11px;color:var(--text-muted);">คะแนนประหยัด</div><strong style="font-family:var(--font-mono);font-size:24px;color:var(--emerald);">' + g.score + '</strong></div>' : '') +
        '</div>' +
        (g.ranked ? '<div style="height:8px;background:var(--surface-subtle);border-radius:4px;overflow:hidden;"><div style="width:' + g.score + '%;height:100%;background:linear-gradient(90deg,#34D399,#10B981);"></div></div>' : '<div style="font-size:12px;color:var(--text-muted);">ข้อมูลอัตรากินไฟยังไม่ถึง 20 km จึงยังไม่จัดอันดับ</div>') +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">' +
          stat("อัตรากินไฟ", g.whKm !== null ? g.whKm.toFixed(0) + ' Wh/km' : '-') +
          stat("ระยะทาง", fmtNum(g.km, 0) + ' km') +
          stat("ทริป", g.trips) +
          stat("ต้นทุน", g.costKm.toFixed(2) + ' ฿/km') +
          stat("ความเร็วเฉลี่ย", g.kmh !== null ? g.kmh.toFixed(0) + ' km/h' : '-') +
          stat("เดินทางงาน", fmtNum(g.bizKm, 0) + ' km') +
        '</div>' +
      '</div>';
    };

    var notes = [];
    if (state.activeVehicle === "all" && getVehicles().length > 1) {
      notes.push("กำลังรวมข้อมูลทุกคัน รถต่างรุ่นกินไฟต่างกัน เลือกรถที่มุมขวาบนเพื่อเทียบกันอย่างยุติธรรม");
    }
    if (list.length <= 1) {
      notes.push("ตอนนี้มีผู้ขับคนเดียว ถ้าคนอื่นในบ้านส่งรูปเข้า LINE bot ระบบจะบันทึกชื่อ LINE ของคนนั้นเป็นผู้ขับให้อัตโนมัติ หรือแก้ชื่อผู้ขับของแต่ละรายการในหน้าประวัติก็ได้");
    }
    if (list.some(function(g) { return g.name === "ไม่ระบุ"; })) {
      notes.push("รายการที่ไม่มีชื่อผู้ขับแสดงเป็น “ไม่ระบุ” ตั้งชื่อผู้ขับหลักได้ในหน้าตั้งค่า เพื่อนับรายการเหล่านี้เป็นของคนนั้น");
    }

    var body = list.length === 0
      ? '<div class="card" style="text-align:center;color:var(--text-muted);padding:40px;">ยังไม่มีทริปในช่วงเวลานี้</div>'
      : '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:20px;">' + ranked.concat(unranked).map(card).join("") + '</div>';

    return '<div style="display:flex;flex-direction:column;gap:16px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">' +
        '<div style="font-size:12.5px;color:var(--text-muted);">คะแนนประหยัด = อัตรากินไฟของคนที่ดีที่สุด ÷ ของคนนั้น × 100</div>' + toggle +
      '</div>' +
      (notes.length ? '<div style="padding:10px 14px;border-radius:var(--radius-md);background:var(--surface-subtle);border-left:3px solid var(--primary);font-size:12.5px;line-height:1.7;">' + notes.map(escHtml).join("<br>") + '</div>' : '') +
      body +
    '</div>';
  }

  function generateExportCard() {
    var rows = getAllRows();
    var months = {};
    rows.forEach(function(r) { if (r.iso) months[r.iso.substring(0, 7)] = true; });
    var monthList = Object.keys(months).sort().reverse();
    var drivers = knownDrivers();
    var v = state.activeVehicle === "all" ? null : getVehicleById(state.activeVehicle);
    var rateKm = "";
    try { rateKm = localStorage.getItem("ev_export_rate_km") || ""; } catch (e) {}

    return '<div class="card">' +
      '<div class="card-header"><div><div class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg> ส่งออกเอกสารเบิกจ่าย (Expense Export)</div>' +
      '<div class="card-subtitle">รายงานค่าใช้จ่ายแยกงาน / ส่วนตัว เป็น Excel (.xlsx) หรือหน้าพิมพ์สำหรับบันทึกเป็น PDF · รถ: ' + (v ? escHtml(v.name) : 'ทุกคัน') + '</div></div></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;">' +
        '<div class="form-group" style="margin:0;"><label style="font-size:12px;">เดือน</label><select class="form-control exp-input" id="expMonth">' +
          monthList.map(function(m, i) { return '<option value="' + m + '"' + (i === 0 ? ' selected' : '') + '>' + formatThaiMonth(m) + '</option>'; }).join("") +
          '<option value="">ทุกเดือน</option></select></div>' +
        '<div class="form-group" style="margin:0;"><label style="font-size:12px;">ประเภทการเดินทาง</label><select class="form-control exp-input" id="expPurpose">' +
          '<option value="business">เฉพาะงาน (Business)</option><option value="all">ทั้งหมด</option><option value="personal">เฉพาะส่วนตัว</option></select></div>' +
        '<div class="form-group" style="margin:0;"><label style="font-size:12px;">ผู้ขับ</label><select class="form-control exp-input" id="expDriver">' +
          '<option value="__all__">ทุกคน</option>' + drivers.map(function(d) { return '<option value="' + escHtml(d) + '">' + escHtml(d) + '</option>'; }).join("") + '</select></div>' +
        '<div class="form-group" style="margin:0;"><label style="font-size:12px;">อัตราเบิกต่อ km (฿)</label><input type="number" step="0.01" min="0" class="form-control mono exp-input" id="expRateKm" value="' + escHtml(rateKm) + '" placeholder="เว้นว่าง = ไม่คำนวณ"></div>' +
      '</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">' +
        '<a class="btn btn-primary" id="btnExportXlsx" href="/api/export.xlsx" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> ดาวน์โหลด Excel</a>' +
        '<a class="btn btn-secondary" id="btnExportPdf" href="/report/expense" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> เปิดรายงาน PDF / พิมพ์</a>' +
      '</div>' +
      '<div style="font-size:11.5px;color:var(--text-muted);margin-top:10px;line-height:1.6;">ระบุงาน/ส่วนตัวของแต่ละรายการได้ในหน้าประวัติ (ปุ่มแก้ไข) หรือพิมพ์ "งาน" ใน LINE หลังส่งรูป · หน้า PDF กด "พิมพ์ / บันทึกเป็น PDF" แล้วเลือก Save as PDF</div>' +
    '</div>';
  }

  function updateExportLinks() {
    var m = document.getElementById("expMonth");
    if (!m) return;
    var params = [];
    var add = function(k, v) { params.push(k + "=" + encodeURIComponent(v)); };
    if (m.value) add("month", m.value);
    add("purpose", document.getElementById("expPurpose").value);
    var d = document.getElementById("expDriver").value;
    if (d !== "__all__") add("driver", d);
    add("vehicle", state.activeVehicle || "all");
    var rate = parseFloat(document.getElementById("expRateKm").value);
    if (rate > 0) add("rateKm", rate);
    var q = "?" + params.join("&");
    document.getElementById("btnExportXlsx").setAttribute("href", "/api/export.xlsx" + q);
    document.getElementById("btnExportPdf").setAttribute("href", "/report/expense" + q);
  }

  function bindFleetEvents() {
    document.querySelectorAll("[data-vehicle-use]").forEach(function(el) {
      el.onclick = function() { setActiveVehicle(el.getAttribute("data-vehicle-use")); };
    });
    document.querySelectorAll("[data-vehicle-edit]").forEach(function(el) {
      el.onclick = function() { openVehicleModal(el.getAttribute("data-vehicle-edit")); };
    });
    document.querySelectorAll("[data-vehicle-default]").forEach(function(el) {
      el.onclick = async function() {
        var v = getVehicleById(el.getAttribute("data-vehicle-default"));
        if (!v) return;
        el.disabled = true;
        try {
          await saveVehicleProfile({ id: v.id, name: v.name, plate: v.plate, batteryKwh: v.batteryKwh, isDefault: true });
          showToast("ตั้ง " + v.name + " เป็นคันหลักแล้ว", "success");
          renderView();
        } catch (err) {
          showToast("ตั้งคันหลักไม่สำเร็จ: " + err.message, "error");
          el.disabled = false;
        }
      };
    });
    document.querySelectorAll("[data-driver-period]").forEach(function(el) {
      el.onclick = function() { state.driverPeriod = el.getAttribute("data-driver-period"); renderView(); };
    });
    if (document.getElementById("expMonth")) {
      document.querySelectorAll(".exp-input").forEach(function(el) {
        el.onchange = el.oninput = function() {
          if (el.id === "expRateKm") { try { localStorage.setItem("ev_export_rate_km", el.value); } catch (e) {} }
          updateExportLinks();
        };
      });
      updateExportLinks();
    }
  }

  function escHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function batteryEmptyCard(title, msg) {
    return '<div class="card"><div class="card-header"><div class="card-title">' + title + '</div></div>' +
      '<div style="text-align:center;color:var(--text-muted);padding:32px 0;font-size:13px;">' + msg + '</div></div>';
  }

  function generateCapacityTrendChart(bat, nominal) {
    var wins = (bat.trend && bat.trend.windows) || [];
    var title = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> แนวโน้มความจุแบตเตอรี่ (Degradation Trend)';
    if (wins.length === 0) {
      return batteryEmptyCard(title, "ยังไม่มีทริปที่มี % แบตต้น/ปลายมากพอ (ต้องสะสม % แบตที่ใช้ไปรวม ≥ 60% จึงจะได้จุดแรก)");
    }
    var est = bat.capacity.estimateKwh;
    var unc = bat.capacity.uncertaintyKwh || 0;
    var sd = bat.trend.windowSdKwh;
    var W = 640, H = 230, pl = 46, pr = 18, pt = 18, pb = 50;
    var lo = nominal, hi = nominal;
    wins.forEach(function(w) {
      var e = sd !== null ? sd : w.uncertaintyKwh;
      lo = Math.min(lo, w.capacityKwh - e);
      hi = Math.max(hi, w.capacityKwh + e);
    });
    if (est !== null) { lo = Math.min(lo, est - unc); hi = Math.max(hi, est + unc); }
    lo = Math.floor(lo - 1); hi = Math.ceil(hi + 1);
    function y(v) { return pt + (hi - v) / (hi - lo) * (H - pt - pb); }
    function x(i) { return wins.length === 1 ? (pl + (W - pl - pr) / 2) : pl + 30 + i * ((W - pl - pr - 60) / (wins.length - 1)); }

    var grid = "";
    var step = (hi - lo) > 12 ? 4 : 2;
    for (var g = Math.ceil(lo / step) * step; g <= hi; g += step) {
      grid += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="var(--border)" stroke-width="1" />' +
        '<text x="' + (pl - 8) + '" y="' + (y(g) + 4) + '" font-size="10.5" font-family="JetBrains Mono" fill="var(--text-muted)" text-anchor="end">' + g + '</text>';
    }
    var band = "";
    if (est !== null) {
      band = '<rect x="' + pl + '" y="' + y(est + unc) + '" width="' + (W - pl - pr) + '" height="' + Math.max(1, y(est - unc) - y(est + unc)) + '" fill="var(--primary-soft)" opacity="0.8" />' +
        '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(est) + '" y2="' + y(est) + '" stroke="var(--primary)" stroke-width="1.5" />';
    }
    var nominalLine = '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(nominal) + '" y2="' + y(nominal) + '" stroke="var(--text-muted)" stroke-width="1.2" stroke-dasharray="5 4" />';
    var legendItem = function(swatch, text) {
      return '<span style="display:inline-flex;align-items:center;gap:6px;">' + swatch + text + '</span>';
    };
    var legend = '<div style="display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:8px;font-size:11.5px;color:var(--text-muted);">' +
      legendItem('<svg width="18" height="10"><circle cx="9" cy="5" r="3.5" fill="var(--surface)" stroke="var(--primary)" stroke-width="2" /></svg>', 'ความจุรายช่วง') +
      (est !== null ? legendItem('<span style="display:inline-block;width:18px;height:10px;background:var(--primary-soft);border-top:2px solid var(--primary);"></span>', 'ค่าประเมินรวม <strong style="color:var(--primary);font-family:var(--font-mono);">' + est.toFixed(1) + ' ±' + unc.toFixed(1) + ' kWh</strong>') : '') +
      legendItem('<span style="display:inline-block;width:18px;border-top:2px dashed var(--text-muted);"></span>', 'สเปก <span style="font-family:var(--font-mono);">' + nominal.toFixed(1) + ' kWh</span>') +
    '</div>';
    var path = wins.map(function(w, i) { return (i === 0 ? "M" : "L") + x(i) + " " + y(w.capacityKwh); }).join(" ");
    var pts = wins.map(function(w, i) {
      var e = sd !== null ? sd : w.uncertaintyKwh;
      var tip = formatThaiDate(w.fromIso) + " - " + formatThaiDate(w.toIso) + ": " + w.capacityKwh.toFixed(1) + " kWh (" + w.trips + " ทริป, SOC " + w.socPct + "%, EFC " + w.efc.toFixed(1) + ")";
      return '<g><title>' + escHtml(tip) + '</title>' +
        '<line x1="' + x(i) + '" x2="' + x(i) + '" y1="' + y(w.capacityKwh + e) + '" y2="' + y(w.capacityKwh - e) + '" stroke="var(--primary)" stroke-width="1.5" opacity="0.55" />' +
        '<line x1="' + (x(i) - 5) + '" x2="' + (x(i) + 5) + '" y1="' + y(w.capacityKwh + e) + '" y2="' + y(w.capacityKwh + e) + '" stroke="var(--primary)" stroke-width="1.5" opacity="0.55" />' +
        '<line x1="' + (x(i) - 5) + '" x2="' + (x(i) + 5) + '" y1="' + y(w.capacityKwh - e) + '" y2="' + y(w.capacityKwh - e) + '" stroke="var(--primary)" stroke-width="1.5" opacity="0.55" />' +
        '<circle cx="' + x(i) + '" cy="' + y(w.capacityKwh) + '" r="5" fill="var(--surface)" stroke="var(--primary)" stroke-width="2.5" />' +
        '<text x="' + x(i) + '" y="' + (H - pb + 18) + '" font-size="10.5" font-family="Anuphan" fill="var(--text-muted)" text-anchor="middle">' + formatThaiDate(w.toIso) + '</text>' +
        '<text x="' + x(i) + '" y="' + (H - pb + 32) + '" font-size="9.5" font-family="JetBrains Mono" fill="var(--text-subtle)" text-anchor="middle">' + (w.odo ? fmtNum(w.odo, 0) + " km" : "") + '</text>' +
        '</g>';
    }).join("");

    var trendSummary;
    if (bat.trend.slopeKwhPer10kKm !== null) {
      var s = bat.trend.slopeKwhPer10kKm;
      trendSummary = 'อัตราเปลี่ยนแปลง <strong>' + (s >= 0 ? "+" : "") + s.toFixed(2) + ' kWh ต่อ 10,000 km</strong> (' + escHtml(bat.trend.note) + ')';
    } else {
      trendSummary = escHtml(bat.trend.note);
    }
    if (bat.trend.earlyKwh !== null && bat.trend.recentKwh !== null) {
      var ch = (bat.trend.recentKwh - bat.trend.earlyKwh) / bat.trend.earlyKwh * 100;
      trendSummary += '<br>3 ช่วงแรกเฉลี่ย ' + bat.trend.earlyKwh.toFixed(1) + ' kWh → 3 ช่วงล่าสุด ' + bat.trend.recentKwh.toFixed(1) + ' kWh (' + (ch >= 0 ? "+" : "") + ch.toFixed(1) + '%)';
    }

    return '<div class="card">' +
      '<div class="card-header"><div><div class="card-title">' + title + '</div>' +
      '<div class="card-subtitle">แต่ละจุดคือความจุที่คำนวณจากทริปที่ใช้แบตรวมกัน ~60% · เส้นตั้ง = ช่วงความคลาดเคลื่อน</div></div>' +
      '<span class="badge badge-sky">' + wins.length + ' ช่วง</span></div>' +
      '<div style="overflow-x:auto;"><svg width="100%" viewBox="0 0 ' + W + ' ' + H + '" style="min-width:320px;display:block;">' +
        grid + band + nominalLine +
        '<path d="' + path + '" fill="none" stroke="var(--primary)" stroke-width="1.5" stroke-dasharray="2 3" opacity="0.6" />' +
        pts +
      '</svg></div>' +
      legend +
      '<div style="margin-top:10px;font-size:12px;color:var(--text-muted);line-height:1.6;">' + trendSummary + '</div>' +
    '</div>';
  }

  function generateRangePredictorCard(bat) {
    var title = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> คาดการณ์ระยะทางจริงตามสไตล์ขับขี่ (Dynamic Range)';
    var rg = bat.range;
    if (!rg || !rg.scenarios || rg.scenarios.length === 0) {
      return batteryEmptyCard(title, "ยังไม่มีข้อมูลทริปที่มีอัตรากินไฟ");
    }
    var soc = rg.currentSoc !== null ? Math.max(15, rg.currentSoc) : 80;
    var colors = { highway: "var(--amber)", city: "var(--rose)", eco: "var(--emerald)" };
    var icons = { highway: "🛣️", city: "🚦", eco: "🌿" };
    var cards = rg.scenarios.map(function(sc) {
      var kmpp = rg.usableKwh / 100 / (sc.whKm / 1000);
      var src = sc.source === "observed"
        ? '<span class="badge badge-emerald">จากทริปจริง ' + sc.observedTrips + ' ทริป · ' + fmtNum(sc.observedKm, 0) + ' km</span>'
        : '<span class="badge badge-amber">ประมาณการ ' + (sc.observedTrips > 0 ? '(ข้อมูลจริง ' + fmtNum(sc.observedKm, 0) + ' km ยังไม่พอ)' : '(ยังไม่มีทริปแบบนี้)') + '</span>';
      return '<div style="border:1px solid var(--border);border-top:3px solid ' + colors[sc.key] + ';border-radius:var(--radius-md);padding:14px;display:flex;flex-direction:column;gap:8px;min-width:0;">' +
        '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">' + icons[sc.key] + '</span><strong style="font-size:13.5px;">' + escHtml(sc.label) + '</strong></div>' +
        '<div style="font-size:11.5px;color:var(--text-muted);">' + escHtml(sc.desc) + '</div>' +
        '<div style="display:flex;align-items:baseline;gap:6px;margin-top:2px;">' +
          '<span class="range-from-soc" data-kmpp="' + kmpp.toFixed(4) + '" style="font-family:var(--font-mono);font-size:30px;font-weight:700;color:' + colors[sc.key] + ';">' + Math.max(0, Math.round(kmpp * (soc - 10))) + '</span>' +
          '<span style="font-size:12px;color:var(--text-muted);">km จนเหลือ 10%</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;background:var(--surface-subtle);border-radius:var(--radius-sm);padding:8px;font-size:11px;">' +
          '<div><div style="color:var(--text-muted);">อัตรากินไฟ</div><strong style="font-family:var(--font-mono);font-size:12.5px;">' + sc.whKm + '</strong> <span style="color:var(--text-muted);">Wh/km</span></div>' +
          '<div><div style="color:var(--text-muted);">100→0%</div><strong style="font-family:var(--font-mono);font-size:12.5px;">' + sc.fullKm + '</strong> <span style="color:var(--text-muted);">km</span></div>' +
          '<div><div style="color:var(--text-muted);">90→10%</div><strong style="font-family:var(--font-mono);font-size:12.5px;">' + sc.dailyKm + '</strong> <span style="color:var(--text-muted);">km</span></div>' +
        '</div>' +
        '<div>' + src + '</div>' +
      '</div>';
    }).join("");

    return '<div class="card">' +
      '<div class="card-header"><div><div class="card-title">' + title + '</div>' +
      '<div class="card-subtitle">อิงความจุใช้งานจริง ' + rg.usableKwh.toFixed(1) + ' kWh และอัตรากินไฟเฉลี่ยของคุณ ' + (rg.baselineWhKm !== null ? rg.baselineWhKm.toFixed(0) : "-") + ' Wh/km</div></div></div>' +
      '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;padding:10px 12px;background:var(--surface-subtle);border-radius:var(--radius-md);">' +
        '<label for="rangeSocSlider" style="font-size:12.5px;font-weight:600;">% แบตตอนออกเดินทาง</label>' +
        '<input type="range" id="rangeSocSlider" min="15" max="100" step="1" value="' + soc + '" style="flex:1;min-width:140px;accent-color:var(--primary);">' +
        '<strong id="rangeSocValue" style="font-family:var(--font-mono);font-size:15px;color:var(--primary);min-width:44px;text-align:right;">' + soc + '%</strong>' +
        (rg.currentSoc !== null ? '<span style="font-size:11px;color:var(--text-muted);width:100%;">ค่าเริ่มต้นคือ % แบตล่าสุดที่บันทึกไว้ (' + rg.currentSoc + '%) · คำนวณจนเหลือ 10% เพื่อเผื่อสำรอง</span>' : '') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;">' + cards + '</div>' +
      '<div style="margin-top:12px;font-size:11.5px;color:var(--text-muted);line-height:1.6;">ถ้ามีทริปจริงในช่วงความเร็วนั้นรวม ≥ 60 km จะใช้อัตรากินไฟจริงของคุณ ถ้ายังไม่มีจะใช้ค่าเฉลี่ยของคุณคูณตัวปรับ (ทางด่วน ×1.35, รถติด+แอร์ ×1.20, Eco ×0.92) ซึ่งอิงพฤติกรรม EV ทั่วไป</div>' +
    '</div>';
  }

  function generateDcProfilerCard(bat) {
    var title = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> วิเคราะห์ความเร็วชาร์จ DC (Fast Charge Profiler)';
    var dc = bat.dcProfile;
    var sessions = (dc && dc.sessions) || [];
    var stat = function(label, val, unit, color) {
      return '<div style="border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;min-width:0;">' +
        '<div style="font-size:11.5px;color:var(--text-muted);">' + label + '</div>' +
        '<div style="margin-top:4px;"><strong style="font-family:var(--font-mono);font-size:20px;color:' + color + ';">' + val + '</strong> <span style="font-size:11px;color:var(--text-muted);">' + unit + '</span></div></div>';
    };
    var stats = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;">' +
      stat("ความเร็ว DC เฉลี่ย", dc.avgKw !== null ? dc.avgKw.toFixed(0) : "-", "kW", "var(--amber)") +
      stat("เร็วที่สุดที่เคยได้", dc.maxKw !== null ? dc.maxKw.toFixed(0) : "-", "kW", "var(--amber)") +
      stat("ราคาเฉลี่ย DC", dc.avgThbPerKwh !== null ? dc.avgThbPerKwh.toFixed(2) : "-", "฿/kWh", "var(--text-main)") +
      stat("ชาร์จบ้าน AC เฉลี่ย", bat.acProfile.avgKw !== null ? bat.acProfile.avgKw.toFixed(1) : "-", "kW (" + bat.acProfile.sessions + " ครั้ง)", "var(--primary)") +
    '</div>';
    var rec = '<div style="padding:12px 14px;border-radius:var(--radius-md);background:var(--surface-subtle);border-left:3px solid var(--amber);display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;">' +
      '<div style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:var(--amber);line-height:1.2;">' + dc.recommendation.cutoffSoc + '%</div>' +
      '<div style="font-size:12.5px;line-height:1.6;"><strong>จุดตัด SOC ที่แนะนำ</strong> <span class="badge ' + (dc.recommendation.basis === "data" ? "badge-emerald" : "badge-amber") + '" style="margin-left:4px;">' + (dc.recommendation.basis === "data" ? "จากข้อมูลรถคันนี้" : "หลักการทั่วไป") + '</span><br>' + escHtml(dc.recommendation.text) + '</div>' +
    '</div>';
    if (sessions.length === 0) {
      return '<div class="card"><div class="card-header"><div class="card-title">' + title + '</div></div>' + stats + rec +
        '<div style="text-align:center;color:var(--text-muted);padding:16px 0;font-size:13px;">ยังไม่มีประวัติชาร์จ DC</div></div>';
    }
    var maxKw = dc.maxKw || 1;
    var body = sessions.slice().reverse().map(function(s) {
      var bar = s.avgKw !== null
        ? '<div style="display:flex;align-items:center;gap:6px;"><div style="flex:1;min-width:50px;height:8px;background:var(--surface-subtle);border-radius:4px;overflow:hidden;"><div style="width:' + Math.round(s.avgKw / maxKw * 100) + '%;height:100%;background:linear-gradient(90deg,#FBBF24,#F59E0B);"></div></div><span class="mono">' + s.avgKw.toFixed(0) + '</span></div>'
        : '<span style="color:var(--text-subtle);">-</span>';
      return '<tr>' +
        '<td style="white-space:nowrap;">' + formatThaiDate(s.iso) + ' <span style="color:var(--text-muted);font-size:11px;">' + escHtml(s.time) + '</span></td>' +
        '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + escHtml(s.station) + '">' + escHtml(s.station) + '</td>' +
        '<td class="mono">' + (s.s0 !== null ? s.s0 + "→" + s.s1 + "%" : '<span style="color:var(--text-subtle);">ไม่ระบุ</span>') + '</td>' +
        '<td class="mono">' + s.kwh.toFixed(2) + '</td>' +
        '<td class="mono">' + (s.min > 0 ? s.min : "-") + '</td>' +
        '<td style="min-width:110px;">' + bar + '</td>' +
        '<td class="mono">' + (s.minPer10Pct !== null ? s.minPer10Pct.toFixed(1) : "-") + '</td>' +
        '<td class="mono">' + (s.thbPerKwh !== null ? s.thbPerKwh.toFixed(2) : "-") + '</td>' +
      '</tr>';
    }).join("");
    return '<div class="card">' +
      '<div class="card-header"><div><div class="card-title">' + title + '</div>' +
      '<div class="card-subtitle">ความเร็วเฉลี่ยต่อครั้ง = kWh ÷ เวลาชาร์จ · บันทึก SOC ต้น/ปลายครบเท่าไร ยิ่งวิเคราะห์ช่วงที่ชาร์จช้าลงได้แม่นขึ้น</div></div>' +
      '<span class="badge badge-amber">' + sessions.length + ' ครั้ง</span></div>' +
      stats + rec +
      '<div class="table-wrapper"><table class="data-table"><thead><tr><th>วันที่</th><th>สถานี</th><th>SOC</th><th>kWh</th><th>นาที</th><th>kW เฉลี่ย</th><th>นาที/10%</th><th>฿/kWh</th></tr></thead><tbody>' + body + '</tbody></table></div>' +
    '</div>';
  }

  function renderVehicleDetailView(agg) {
    var byVehicle = (state.payload.data && state.payload.data.batteryByVehicle) || {};
    var bat = byVehicle[focusVehicleId()] || (state.payload.data && state.payload.data.battery);
    if (!bat) {
      return batteryEmptyCard("สุขภาพแบตเตอรี่", "ไม่พบข้อมูลวิเคราะห์แบตเตอรี่ กดรีเฟรชข้อมูลอีกครั้ง");
    }
    var nominal = state.batteryCapacity;
    var cap = bat.capacity;
    var est = cap.estimateKwh;
    var sohPct = est !== null && nominal > 0 ? est / nominal * 100 : null;
    var efc = nominal > 0 ? bat.cycles.throughputKwh / nominal : 0;
    var confMap = {
      none: ["ข้อมูลยังไม่พอ", "badge-rose"],
      low: ["ความเชื่อมั่นต่ำ", "badge-amber"],
      medium: ["ความเชื่อมั่นปานกลาง", "badge-sky"],
      high: ["ความเชื่อมั่นสูง", "badge-emerald"]
    };
    var conf = confMap[cap.confidence] || confMap.none;
    var sohColor = sohPct === null ? "var(--text-muted)" : sohPct >= 95 ? "var(--emerald)" : sohPct >= 88 ? "var(--primary)" : sohPct >= 80 ? "var(--amber)" : "var(--rose)";

    var kpis = '<div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));">' +
      '<div class="kpi-card" style="--kpi-accent:var(--primary);">' +
        '<span class="kpi-label">ความจุใช้งานจริง (ประเมิน)</span>' +
        '<div class="kpi-value-box" style="margin-top:8px;"><span class="kpi-value" style="color:var(--primary);">' + (est !== null ? est.toFixed(1) : "-") + '</span><span class="kpi-unit">kWh' + (cap.uncertaintyKwh !== null ? ' ±' + cap.uncertaintyKwh.toFixed(1) : '') + '</span></div>' +
        '<div class="kpi-subtext"><span class="badge ' + conf[1] + '">' + conf[0] + '</span> ' + cap.drive.trips + ' ทริป · SOC รวม ' + cap.drive.socPct + '%</div>' +
      '</div>' +
      '<div class="kpi-card" style="--kpi-accent:' + sohColor + ';">' +
        '<span class="kpi-label">เทียบสเปก ' + nominal.toFixed(1) + ' kWh</span>' +
        '<div class="kpi-value-box" style="margin-top:8px;"><span class="kpi-value" style="color:' + sohColor + ';">' + (sohPct !== null ? sohPct.toFixed(1) : "-") + '</span><span class="kpi-unit">%</span></div>' +
        '<div class="kpi-subtext">รวมส่วนสำรองของ BMS ด้วย ไม่ได้มาจากการเสื่อมทั้งหมด</div>' +
      '</div>' +
      '<div class="kpi-card" style="--kpi-accent:var(--indigo);">' +
        '<span class="kpi-label">รอบชาร์จเทียบเท่า (EFC)</span>' +
        '<div class="kpi-value-box" style="margin-top:8px;"><span class="kpi-value" style="color:var(--indigo);">' + efc.toFixed(1) + '</span><span class="kpi-unit">รอบ</span></div>' +
        '<div class="kpi-subtext">พลังงานเข้าแบตสะสม ' + fmtNum(bat.cycles.throughputKwh, 0) + ' kWh</div>' +
      '</div>' +
      '<div class="kpi-card" style="--kpi-accent:var(--emerald);">' +
        '<span class="kpi-label">ตรวจสอบไขว้จากการชาร์จ</span>' +
        '<div class="kpi-value-box" style="margin-top:8px;"><span class="kpi-value" style="color:var(--emerald);">' + (cap.charge.medianKwh !== null ? cap.charge.medianKwh.toFixed(1) : "-") + '</span><span class="kpi-unit">kWh</span></div>' +
        '<div class="kpi-subtext">ค่ากลางจาก ' + cap.charge.samples.length + ' ครั้งที่มี kWh มิเตอร์และ SOC</div>' +
      '</div>' +
    '</div>';

    var tips = (bat.dataTips || []).map(function(t) { return '<li>' + escHtml(t) + '</li>'; }).join("");

    var method = '<div class="card" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;">' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
        '<h4 style="font-size:14px;font-weight:600;">วิธีคำนวณ</h4>' +
        '<ul style="padding-left:20px;font-size:12.5px;color:var(--text-muted);display:flex;flex-direction:column;gap:6px;line-height:1.6;">' +
          '<li><strong>ความจุใช้งานจริง</strong> = พลังงานที่รถแสดงว่าใช้ไป (ระยะทาง × kWh/100km) ÷ % แบตที่ลดลง รวมทุกทริป ทั้งสองค่ามาจากตัวรถ จึงไม่ขึ้นกับการสูญเสียของเครื่องชาร์จ</li>' +
          '<li><strong>ตรวจสอบไขว้</strong> = kWh จากมิเตอร์ × ประสิทธิภาพ (AC 90%, DC 95%) ÷ % แบตที่เพิ่ม โดยตัดแถวที่ kWh คำนวณมาจาก % แบตออก</li>' +
          '<li><strong>EFC</strong> = พลังงานเข้าแบตสะสม ÷ ความจุสเปก (ปรับได้ในหน้าตั้งค่า)</li>' +
          '<li>ความจุใช้งานจริงมักต่ำกว่าสเปกรวม 3-6% เพราะ BMS กันส่วนสำรองไว้ ให้ดูเป็นหลักว่าค่าลดลงตามเวลาหรือไม่</li>' +
        '</ul>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
        (tips ? '<h4 style="font-size:14px;font-weight:600;">เพิ่มความแม่นยำ</h4><ul style="padding-left:20px;font-size:12.5px;color:var(--text-muted);display:flex;flex-direction:column;gap:6px;line-height:1.6;">' + tips + '</ul>' : '') +
        '<h4 style="font-size:14px;font-weight:600;margin-top:4px;">ถนอมแบตเตอรี่ LFP</h4>' +
        '<ul style="padding-left:20px;font-size:12.5px;color:var(--text-muted);display:flex;flex-direction:column;gap:6px;line-height:1.6;">' +
          '<li>ชาร์จเต็ม 100% อย่างน้อยสัปดาห์ละครั้ง ให้ BMS ปรับเทียบ % แบตให้แม่นยำ</li>' +
          '<li>ใช้ AC เป็นหลัก และใช้ DC ตอนเดินทางไกล</li>' +
          '<li>อย่าจอดตากแดดนานๆ ตอนแบตต่ำกว่า 10%</li>' +
        '</ul>' +
      '</div>' +
    '</div>';

    var vehicleNote = getVehicles().length > 1
      ? '<div style="font-size:12.5px;color:var(--text-muted);">กำลังแสดงแบตของ <strong style="color:var(--text-main);">' + escHtml(state.vehicleName) + '</strong>' + (state.activeVehicle === "all" ? ' (คันหลัก · เลือกรถคันอื่นได้ที่มุมขวาบน)' : '') + '</div>'
      : '';
    return '<div style="display:flex;flex-direction:column;gap:20px;">' +
      vehicleNote +
      kpis +
      generateCapacityTrendChart(bat, nominal) +
      generateRangePredictorCard(bat) +
      generateDcProfilerCard(bat) +
      method +
    '</div>';
  }

  function renderCostAnalysisView(agg) {
    var savingsCard = '<div class="card">' +
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

    return '<div style="display:flex;flex-direction:column;gap:20px;">' + savingsCard + generateTouWhatIfCard() + '</div>';
  }

  function readTouNumber(key, fallback) {
    try {
      var v = parseFloat(localStorage.getItem(key));
      return isNaN(v) ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function generateTouWhatIfCard() {
    var tou = state.payload.data && state.payload.data.tou;
    var title = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> เปลี่ยนเป็นมิเตอร์ TOU คุ้มไหม? (TOU What-If)';
    if (!tou || tou.sessions.length === 0) {
      return batteryEmptyCard(title, "ยังไม่มีประวัติชาร์จบ้าน (AC) สำหรับคำนวณ");
    }
    var t = tou.totals;
    var offShare = t.kwh > 0 ? t.offPeakKwh / t.kwh * 100 : 0;
    var evKwhMonth = t.kwh / tou.months;
    var houseKwh = readTouNumber("ev_tou_house_kwh", 250);
    var housePct = readTouNumber("ev_tou_house_onpeak_pct", 60);
    var serviceDelta = readTouNumber("ev_tou_service_delta", 13.6);
    var meterCost = readTouNumber("ev_tou_meter_cost", 0);

    var input = function(id, label, value, step, hint) {
      return '<div class="form-group" style="margin:0;"><label for="' + id + '" style="font-size:12px;">' + label + '</label>' +
        '<input type="number" step="' + step + '" min="0" class="form-control mono tou-input" id="' + id + '" value="' + value + '">' +
        (hint ? '<span class="form-hint">' + hint + '</span>' : '') + '</div>';
    };
    var resultBox = function(id, label, accent) {
      return '<div style="border:1px solid var(--border);border-top:3px solid ' + accent + ';border-radius:var(--radius-md);padding:12px;min-width:0;">' +
        '<div style="font-size:11.5px;color:var(--text-muted);">' + label + '</div>' +
        '<div style="margin-top:4px;"><strong id="' + id + '" style="font-family:var(--font-mono);font-size:20px;">-</strong> <span style="font-size:11px;color:var(--text-muted);">฿/เดือน</span></div>' +
        '<div id="' + id + 'Diff" style="font-size:11.5px;margin-top:2px;"></div></div>';
    };

    var basisLabel = { range: "เวลาจากโน้ต", end: "บันทึก = เวลาจบ", start: "บันทึก = เวลาเริ่ม" };
    var sessionRows = tou.sessions.slice().reverse().map(function(s) {
      return '<tr>' +
        '<td style="white-space:nowrap;">' + formatThaiDate(s.iso) + '</td>' +
        '<td class="mono" style="white-space:nowrap;font-size:11.5px;">' + escHtml(s.start.slice(5)) + ' → ' + escHtml(s.end.slice(5)) + '</td>' +
        '<td class="mono">' + s.kwh.toFixed(2) + '</td>' +
        '<td class="mono" style="color:' + (s.onPeakKwh > 0 ? "var(--amber)" : "var(--text-subtle)") + ';">' + s.onPeakKwh.toFixed(2) + '</td>' +
        '<td style="font-size:11px;color:var(--text-muted);white-space:nowrap;">' + basisLabel[s.timeBasis] + (s.durationSource === "estimated" ? " · ประมาณระยะเวลา" : "") + '</td>' +
      '</tr>';
    }).join("");

    return '<div class="card" id="touCalc" data-on="' + t.onPeakKwh + '" data-off="' + t.offPeakKwh + '" data-months="' + tou.months + '">' +
      '<div class="card-header"><div><div class="card-title">' + title + '</div>' +
      '<div class="card-subtitle">คำนวณจากเวลาชาร์จบ้านจริง ' + tou.sessions.length + ' ครั้ง ในช่วง ' + tou.spanDays + ' วัน · On-Peak = จ.-ศ. 09:00-22:00</div></div></div>' +

      '<div style="margin-bottom:16px;">' +
        '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;font-size:12.5px;margin-bottom:6px;">' +
          '<span>ชาร์จบ้านเฉลี่ย <strong class="mono">' + fmtNum(evKwhMonth, 0) + '</strong> kWh/เดือน</span>' +
          '<span>ตอนนี้ชาร์จช่วง Off-Peak อยู่แล้ว <strong class="mono" style="color:var(--emerald);">' + offShare.toFixed(0) + '%</strong></span>' +
        '</div>' +
        '<div style="display:flex;height:12px;border-radius:6px;overflow:hidden;border:1px solid var(--border);">' +
          '<div style="width:' + offShare.toFixed(1) + '%;background:var(--emerald);" title="Off-Peak ' + fmtNum(t.offPeakKwh, 1) + ' kWh"></div>' +
          '<div style="flex:1;background:var(--amber);" title="On-Peak ' + fmtNum(t.onPeakKwh, 1) + ' kWh"></div>' +
        '</div>' +
        '<div style="display:flex;gap:14px;font-size:11px;color:var(--text-muted);margin-top:4px;">' +
          '<span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--emerald);"></span> Off-Peak ' + fmtNum(t.offPeakKwh, 1) + ' kWh</span>' +
          '<span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--amber);"></span> On-Peak ' + fmtNum(t.onPeakKwh, 1) + ' kWh</span>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:6px;">' +
        input("touRateOn", "อัตรา On-Peak (฿/kWh)", state.rateOnPeak, "0.01", "") +
        input("touRateOff", "อัตรา Off-Peak (฿/kWh)", state.rateOffPeak, "0.01", "") +
        input("touHouseKwh", "ไฟบ้านที่ไม่ใช่รถ (kWh/เดือน)", houseKwh, "1", "หน่วยในบิล − หน่วยที่ชาร์จรถ") +
        input("touHousePct", "ไฟบ้านช่วง On-Peak (%)", housePct, "1", "เช่น เปิดแอร์/ทำงานกลางวันวันธรรมดา") +
        input("touService", "ค่าบริการที่เพิ่มขึ้น (฿/เดือน)", serviceDelta, "0.01", "") +
        input("touMeter", "ค่าเปลี่ยนมิเตอร์ (฿ ครั้งเดียว)", meterCost, "1", "สอบถาม กฟภ./กฟน.") +
      '</div>' +
      '<div style="font-size:11.5px;color:var(--text-muted);margin-bottom:14px;line-height:1.6;">อัตราปกติที่ใช้เทียบ <strong class="mono">' + state.unitRate.toFixed(2) + '</strong> ฿/kWh (แก้ได้ในหน้าตั้งค่า) · ให้ใส่อัตรา TOU แบบเดียวกัน คือรวม Ft และ VAT แล้ว ค่าเริ่มต้นเป็นค่าประมาณ ควรเทียบกับบิลหรือประกาศการไฟฟ้าล่าสุด</div>' +

      '<div style="font-size:13px;font-weight:600;margin-bottom:8px;">ค่าชาร์จรถที่บ้านต่อเดือน</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:14px;">' +
        resultBox("touEvFlat", "ตอนนี้ (อัตราเดียว)", "var(--text-muted)") +
        resultBox("touEvAsIs", "TOU · ชาร์จเวลาเดิม", "var(--primary)") +
        resultBox("touEvOff", "TOU · ย้ายไปชาร์จ Off-Peak ทั้งหมด", "var(--emerald)") +
      '</div>' +

      '<div style="font-size:13px;font-weight:600;margin-bottom:8px;">ผลต่อบิลทั้งบ้าน (รวมไฟบ้านและค่าบริการ)</div>' +
      '<div id="touVerdict" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;"></div>' +

      '<details style="margin-top:16px;">' +
        '<summary style="cursor:pointer;font-size:12.5px;font-weight:600;color:var(--primary);">ดูการแบ่งช่วงเวลาของแต่ละครั้ง (' + tou.sessions.length + ' ครั้ง)</summary>' +
        '<div class="table-wrapper" style="margin-top:10px;"><table class="data-table"><thead><tr><th>วันที่</th><th>ช่วงชาร์จ (ประมาณ)</th><th>kWh</th><th>On-Peak kWh</th><th>ที่มาของเวลา</th></tr></thead><tbody>' + sessionRows + '</tbody></table></div>' +
        '<div style="font-size:11.5px;color:var(--text-muted);margin-top:8px;line-height:1.6;">ครั้งที่ไม่มีระยะเวลา ประมาณจาก kWh ÷ ' + tou.chargerKw.toFixed(2) + ' kW (' + (tou.chargerKwSource === "observed" ? "กำลังชาร์จบ้านเฉลี่ยจากครั้งที่บันทึกเวลาไว้" : "ค่าเริ่มต้น") + ') · เวลาที่บันทึกช่วง 04:00-12:00 ถือเป็นเวลาชาร์จเสร็จ นอกนั้นถือเป็นเวลาเริ่ม · ไม่ได้นับวันหยุดราชการ (ส่วน On-Peak จึงอาจสูงกว่าจริงเล็กน้อย)</div>' +
      '</details>' +
    '</div>';
  }

  function updateTouCalc() {
    var card = document.getElementById("touCalc");
    if (!card) return;
    var num = function(id) { var v = parseFloat(document.getElementById(id).value); return isNaN(v) ? 0 : v; };
    var months = parseFloat(card.getAttribute("data-months")) || 1;
    var onKwh = (parseFloat(card.getAttribute("data-on")) || 0) / months;
    var offKwh = (parseFloat(card.getAttribute("data-off")) || 0) / months;
    var flat = state.unitRate;
    var rOn = num("touRateOn"), rOff = num("touRateOff");
    var houseKwh = num("touHouseKwh"), housePct = Math.min(100, num("touHousePct")) / 100;
    var service = num("touService"), meter = num("touMeter");

    var evFlat = (onKwh + offKwh) * flat;
    var evAsIs = onKwh * rOn + offKwh * rOff;
    var evOff = (onKwh + offKwh) * rOff;
    var houseDelta = houseKwh * (housePct * rOn + (1 - housePct) * rOff - flat);

    var setVal = function(id, v, base) {
      document.getElementById(id).innerText = fmtNum(v, 0);
      var diffEl = document.getElementById(id + "Diff");
      if (base === null) { diffEl.innerHTML = '<span style="color:var(--text-muted);">' + fmtNum(onKwh + offKwh, 0) + ' kWh × ' + flat.toFixed(2) + ' ฿</span>'; return; }
      var d = base - v;
      diffEl.innerHTML = d >= 0
        ? '<span style="color:var(--emerald);font-weight:600;">ถูกลง ' + fmtNum(d, 0) + ' ฿</span>'
        : '<span style="color:var(--rose);font-weight:600;">แพงขึ้น ' + fmtNum(-d, 0) + ' ฿</span>';
    };
    setVal("touEvFlat", evFlat, null);
    setVal("touEvAsIs", evAsIs, evFlat);
    setVal("touEvOff", evOff, evFlat);

    var verdict = function(label, evSaving) {
      var net = evSaving - houseDelta - service;
      var good = net > 0;
      var payback = good && meter > 0 ? Math.ceil(meter / net) : null;
      return '<div style="padding:12px 14px;border-radius:var(--radius-md);background:var(--surface-subtle);border-left:3px solid ' + (good ? "var(--emerald)" : "var(--rose)") + ';">' +
        '<div style="font-size:11.5px;color:var(--text-muted);">' + label + '</div>' +
        '<div style="margin-top:4px;font-size:15px;font-weight:700;color:' + (good ? "var(--emerald)" : "var(--rose)") + ';">' +
          (good ? "คุ้ม · ประหยัด " : "ไม่คุ้ม · จ่ายเพิ่ม ") + '<span class="mono">' + fmtNum(Math.abs(net), 0) + '</span> ฿/เดือน</div>' +
        '<div style="font-size:11.5px;color:var(--text-muted);margin-top:4px;line-height:1.6;">' +
          'ค่าชาร์จรถ ' + (evSaving >= 0 ? "−" : "+") + fmtNum(Math.abs(evSaving), 0) + ' · ไฟบ้าน ' + (houseDelta >= 0 ? "+" : "−") + fmtNum(Math.abs(houseDelta), 0) + ' · ค่าบริการ +' + fmtNum(service, 0) + ' ฿' +
          (good ? '<br>ปีละประมาณ <strong class="mono">' + fmtNum(net * 12, 0) + '</strong> ฿' + (payback !== null ? ' · คืนทุนค่ามิเตอร์ใน ~' + payback + ' เดือน' : '') : '') +
        '</div></div>';
    };
    document.getElementById("touVerdict").innerHTML =
      verdict("ถ้าชาร์จเวลาเดิม", evFlat - evAsIs) +
      verdict("ถ้าย้ายไปชาร์จ Off-Peak ทั้งหมด (22:00-09:00 หรือเสาร์-อาทิตย์)", evFlat - evOff);
  }

  function bindTouCalc() {
    if (!document.getElementById("touCalc")) return;
    var persist = {
      touRateOn: "ev_rate_onpeak",
      touRateOff: "ev_rate_offpeak",
      touHouseKwh: "ev_tou_house_kwh",
      touHousePct: "ev_tou_house_onpeak_pct",
      touService: "ev_tou_service_delta",
      touMeter: "ev_tou_meter_cost"
    };
    document.querySelectorAll(".tou-input").forEach(function(el) {
      el.oninput = function() {
        var v = parseFloat(el.value);
        if (!isNaN(v)) {
          if (el.id === "touRateOn") state.rateOnPeak = v;
          if (el.id === "touRateOff") state.rateOffPeak = v;
          try { localStorage.setItem(persist[el.id], String(v)); } catch (e) {}
        }
        updateTouCalc();
      };
    });
    updateTouCalc();
  }

  function formatThaiDate(iso) {
    if (!iso) return "-";
    var p = iso.split("-");
    if (p.length < 3) return iso;
    var d = parseInt(p[2], 10);
    var m = parseInt(p[1], 10) - 1;
    var y = (parseInt(p[0], 10) + 543) % 100;
    return d + " " + (thaiMonthNamesShort[m] || p[1]) + " " + (y < 10 ? "0" + y : y);
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

    var csvContent = String.fromCharCode(0xFEFF) + csvRows.map(function(e) { return e.join(","); }).join(String.fromCharCode(13, 10));
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

      var chargeChartHtml = "";
      if (chargeData.length > 0) {
        var chartData = chargeData.slice().reverse();
        var maxCost = Math.max.apply(Math, chartData.map(function(d) { return d.totCost; }).concat([100]));
        var cBarW = 44;
        var cGap = 36;
        var cTopMargin = 48;
        var cMaxBarH = 100;
        var cTotalW = Math.max(380, chartData.length * (cBarW + cGap) + 50);
        var cBaseY = cTopMargin + cMaxBarH;
        var cSvgH = cBaseY + 38;

        var cBars = chartData.map(function(d, i) {
          var totH = Math.max(6, Math.round((d.totCost / maxCost) * cMaxBarH));
          var acH = d.totCost > 0 ? Math.round((d.acCost / d.totCost) * totH) : 0;
          var dcH = totH - acH;
          var x = 32 + i * (cBarW + cGap);
          var yTot = cBaseY - totH;
          var yAc = cBaseY - acH;
          var yDc = yTot;
          var monthLabel = isMonthly ? formatThaiMonthShort(d.period) : (d.period + ' (พ.ศ. ' + (parseInt(d.period,10) + 543) + ')');

          var rects = '';
          if (acH > 0 && dcH > 0) {
            rects = '<rect x="' + x + '" y="' + yDc + '" width="' + cBarW + '" height="' + dcH + '" rx="5" fill="url(#dcGradient)" />' +
                    '<rect x="' + x + '" y="' + yAc + '" width="' + cBarW + '" height="' + acH + '" rx="5" fill="url(#acGradient)" />';
          } else if (dcH > 0) {
            rects = '<rect x="' + x + '" y="' + yDc + '" width="' + cBarW + '" height="' + dcH + '" rx="5" fill="url(#dcGradient)" />';
          } else {
            rects = '<rect x="' + x + '" y="' + yTot + '" width="' + cBarW + '" height="' + totH + '" rx="5" fill="url(#acGradient)" />';
          }

          return '<g class="bar-group">' +
            rects +
            '<text x="' + (x + cBarW/2) + '" y="' + (yTot - 18) + '" font-size="12" font-family="JetBrains Mono" fill="var(--primary)" text-anchor="middle" font-weight="700">' + fmtNum(d.totCost, 0) + ' <tspan font-size="9.5" fill="var(--text-muted)">฿</tspan></text>' +
            '<text x="' + (x + cBarW/2) + '" y="' + (yTot - 4) + '" font-size="10" font-family="JetBrains Mono" fill="var(--text-secondary)" text-anchor="middle">' + fmtNum(d.totKwh, 0) + ' kWh</text>' +
            '<text x="' + (x + cBarW/2) + '" y="' + (cBaseY + 22) + '" font-size="11" font-family="Anuphan" fill="var(--text-muted)" text-anchor="middle" font-weight="500">' + monthLabel + '</text>' +
            '</g>';
        }).join("");

        chargeChartHtml = '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 20px;margin-bottom:20px;box-shadow:var(--shadow-sm);">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">' +
            '<div>' +
              '<div style="font-size:14px;font-weight:700;color:var(--text-main);display:flex;align-items:center;gap:7px;">' +
                '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>' +
                'กราฟแท่งเปรียบเทียบค่าชาร์จไฟ' + (isMonthly ? 'รายเดือน' : 'รายปี') + ' (Charging Cost Breakdown)' +
              '</div>' +
              '<div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">แสดงยอดเงินค่าชาร์จสุทธิแยกสัดส่วนระหว่าง AC ชาร์จบ้าน กับ DC ชาร์จเร็ว</div>' +
            '</div>' +
            '<div style="display:flex;gap:14px;font-size:12px;color:var(--text-secondary);align-items:center;background:var(--surface-subtle);padding:6px 12px;border-radius:999px;border:1px solid var(--border);">' +
              '<span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:3px;background:linear-gradient(135deg, #38BDF8, #0284C7);display:inline-block;"></span> <span style="font-weight:500;">AC บ้าน</span></span>' +
              '<span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:3px;background:linear-gradient(135deg, #818CF8, #6366F1);display:inline-block;"></span> <span style="font-weight:500;">DC ตู้ด่วน</span></span>' +
            '</div>' +
          '</div>' +
          '<div style="overflow-x:auto;padding-bottom:6px;">' +
            '<svg width="' + cTotalW + '" height="' + cSvgH + '" viewBox="0 0 ' + cTotalW + ' ' + cSvgH + '">' +
              '<defs>' +
                '<linearGradient id="acGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0284C7"/></linearGradient>' +
                '<linearGradient id="dcGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#818CF8"/><stop offset="100%" stop-color="#6366F1"/></linearGradient>' +
              '</defs>' +
              '<line x1="16" y1="' + (cBaseY + 4) + '" x2="' + (cTotalW - 16) + '" y2="' + (cBaseY + 4) + '" stroke="var(--border)" stroke-width="1" />' +
              cBars +
            '</svg>' +
          '</div>' +
        '</div>';
      }

      reportContentHtml = periodPills +
        chargeChartHtml +
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

      var tripChartHtml = "";
      if (tripData.length > 0 && tripPeriod !== "daily") {
        var chartTrips = tripData.slice().reverse();
        var maxKm = Math.max.apply(Math, chartTrips.map(function(d) { return d.km; }).concat([10]));
        var tTopMargin = 48;
        var tMaxBarH = 100;
        var tBarW = 44;
        var tGap = 36;
        var tTotalW = Math.max(380, chartTrips.length * (tBarW + tGap) + 50);
        var tBaseY = tTopMargin + tMaxBarH;
        var tSvgH = tBaseY + 38;

        var tBars = chartTrips.map(function(d, i) {
          var h = Math.max(6, Math.round((d.km / maxKm) * tMaxBarH));
          var x = 32 + i * (tBarW + tGap);
          var y = tBaseY - h;
          var label = (tripPeriod === "monthly") ? formatThaiMonthShort(d.period) : d.label;

          return '<g class="bar-group">' +
            '<rect x="' + x + '" y="' + y + '" width="' + tBarW + '" height="' + h + '" rx="5" fill="url(#tripGradient)" />' +
            '<text x="' + (x + tBarW/2) + '" y="' + (y - 18) + '" font-size="12" font-family="JetBrains Mono" fill="var(--primary)" text-anchor="middle" font-weight="700">' + fmtNum(d.km, 0) + ' <tspan font-size="9.5" fill="var(--text-muted)">km</tspan></text>' +
            '<text x="' + (x + tBarW/2) + '" y="' + (y - 4) + '" font-size="10" font-family="JetBrains Mono" fill="var(--emerald)" text-anchor="middle">+' + fmtNum(d.savings, 0) + ' ฿ ประหยัด</text>' +
            '<text x="' + (x + tBarW/2) + '" y="' + (tBaseY + 22) + '" font-size="11" font-family="Anuphan" fill="var(--text-muted)" text-anchor="middle" font-weight="500">' + label + '</text>' +
            '</g>';
        }).join("");

        tripChartHtml = '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 20px;margin-bottom:20px;box-shadow:var(--shadow-sm);">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">' +
            '<div>' +
              '<div style="font-size:14px;font-weight:700;color:var(--text-main);display:flex;align-items:center;gap:7px;">' +
                '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>' +
                'กราฟแท่งระยะทางเดินทาง' + (tripPeriod === "monthly" ? "รายเดือน" : "รายปี") + ' (Distance & Cost Savings)' +
              '</div>' +
              '<div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">แสดงระยะทางรวมที่วิ่ง (กม.) พร้อมยอดเงินประหยัดเมื่อเทียบกับรถใช้น้ำมัน</div>' +
            '</div>' +
          '</div>' +
          '<div style="overflow-x:auto;padding-bottom:6px;">' +
            '<svg width="' + tTotalW + '" height="' + tSvgH + '" viewBox="0 0 ' + tTotalW + ' ' + tSvgH + '">' +
              '<defs>' +
                '<linearGradient id="tripGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2DD4BF"/><stop offset="100%" stop-color="#0D9488"/></linearGradient>' +
              '</defs>' +
              '<line x1="16" y1="' + (tBaseY + 4) + '" x2="' + (tTotalW - 16) + '" y2="' + (tBaseY + 4) + '" stroke="var(--border)" stroke-width="1" />' +
              tBars +
            '</svg>' +
          '</div>' +
        '</div>';
      }

      reportContentHtml = periodPills +
        tripChartHtml +
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

    return '<div style="display:flex;flex-direction:column;gap:20px;">' + generateExportCard() + '<div class="card">' +
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
    '</div></div>';
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
          '<h4 style="font-size:14.5px;font-weight:700;color:var(--text-main);margin-bottom:12px;display:flex;align-items:center;gap:8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> ธีมการแสดงผล (Display Theme)</h4>' +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
            '<button type="button" class="btn ' + (state.theme === 'light' ? 'btn-primary' : 'btn-secondary') + '" id="btnSetThemeLight" style="display:inline-flex;align-items:center;gap:8px;">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' +
              'โหมดสว่าง (Light Mode - ค่าเริ่มต้น)' +
            '</button>' +
            '<button type="button" class="btn ' + (state.theme === 'dark' ? 'btn-primary' : 'btn-secondary') + '" id="btnSetThemeDark" style="display:inline-flex;align-items:center;gap:8px;">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>' +
              'โหมดมืด (Dark Mode)' +
            '</button>' +
          '</div>' +
          '<div style="font-size:12px;color:var(--text-muted);margin-top:8px;">ธีมสีฟ้า ขาว สไตล์ Clean Minimal EV Tech และโทน Midnight Obsidian สบายตาสำหรับเวลากลางคืน</div>' +
        '</div>' +
        '<div style="border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px;">' +
          '<h4 style="font-size:14.5px;font-weight:700;color:var(--text-main);margin-bottom:12px;display:flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> กำหนดค่าอัตราค่าไฟฟ้าพื้นฐาน (Electricity Unit Rates)</h4>' +
          '<div class="form-grid">' +
            '<div class="form-group"><label>อัตราค่าไฟฟ้าปกติ / พื้นฐาน (฿/kWh)</label><input type="number" step="0.01" class="form-control mono" id="cfgUnitRate" value="' + state.unitRate + '" required><span class="form-hint">ใช้เป็นอัตราอ้างอิงในการคำนวณค่าไฟต่อหน่วย (Default: 4.90 หรือ 4.20)</span></div>' +
            '<div class="form-group"><label>อัตราช่วง On-Peak (฿/kWh)</label><input type="number" step="0.01" class="form-control mono" id="cfgRateOnPeak" value="' + state.rateOnPeak + '"><span class="form-hint">เช่น อัตราค่าไฟ TOU ช่วง 09:00 - 22:00 น.</span></div>' +
            '<div class="form-group"><label>อัตราช่วง Off-Peak (฿/kWh)</label><input type="number" step="0.01" class="form-control mono" id="cfgRateOffPeak" value="' + state.rateOffPeak + '"><span class="form-hint">เช่น อัตราค่าไฟ TOU ช่วง 22:00 - 09:00 น. หรือวันหยุด</span></div>' +
          '</div>' +
        '</div>' +
        '<div style="border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px;">' +
          '<h4 style="font-size:14.5px;font-weight:700;color:var(--text-main);margin-bottom:12px;display:flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="18" height="12" rx="2"></rect><line x1="23" y1="11" x2="23" y2="13"></line></svg> ข้อมูลรถคันที่เลือก: ' + escHtml(state.vehicleName) + '</h4>' +
          '<div style="font-size:12px;color:var(--text-muted);margin:-4px 0 12px;">บันทึกลงแท็บ Vehicles ใน Google Sheets · เพิ่มหรือสลับรถได้ที่หน้า <a href="#" data-nav="vehicles" style="color:var(--primary);">โปรไฟล์รถยนต์</a></div>' +
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
          '<h4 style="font-size:14.5px;font-weight:700;color:var(--text-main);margin-bottom:12px;display:flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> ค่าเปรียบเทียบน้ำมันเบนซิน (Petrol Benchmark for Savings)</h4>' +
          '<div class="form-grid">' +
            '<div class="form-group"><label>ชื่อผู้ขับหลัก</label><input type="text" class="form-control" id="cfgDefaultDriver" value="' + escHtml(state.defaultDriver) + '" placeholder="เช่น ชื่อ LINE ของคุณ"><span class="form-hint">ใช้แทนรายการที่ไม่มีชื่อผู้ขับ และเป็นค่าเริ่มต้นในฟอร์ม</span></div>' +
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
    bindTouCalc();
    bindFleetEvents();

    var rangeSlider = document.getElementById("rangeSocSlider");
    if (rangeSlider) {
      rangeSlider.oninput = function() {
        var soc = parseInt(rangeSlider.value, 10);
        var label = document.getElementById("rangeSocValue");
        if (label) label.innerText = soc + "%";
        document.querySelectorAll(".range-from-soc").forEach(function(el) {
          var kmpp = parseFloat(el.getAttribute("data-kmpp")) || 0;
          el.innerText = Math.max(0, Math.round(kmpp * (soc - 10)));
        });
      };
    }

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
        var rows = getRows();
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
        var capNow = capForSelect("addVehicleSelect");
        var calculatedKwh = (diff / 100) * capNow;
        kwhIn.value = calculatedKwh.toFixed(2);
        var calculatedCost = calculatedKwh * state.unitRate;
        costIn.value = calculatedCost.toFixed(2);

        if (kwhHint) kwhHint.innerText = "คำนวณจาก (" + s1 + " - " + s0 + ")% × " + capNow.toFixed(1) + " kWh";
        if (costHint) costHint.innerText = "คำนวณจาก " + calculatedKwh.toFixed(2) + " kWh × " + state.unitRate.toFixed(2) + " ฿/kWh";
      };

      s0In.oninput = recalc;
      s1In.oninput = recalc;
      var addVehicleSel = document.getElementById("addVehicleSelect");
      if (addVehicleSel) addVehicleSel.onchange = recalc;
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
          note: formData.get("note"),
          vehicle: formData.get("vehicle"),
          driver: formData.get("driver"),
          purpose: formData.get("purpose")
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
          var tripCap = capForSelect("tripVehicleSelect");
          kwh = (socDiff / 100) * tripCap;
          kwhIn.value = kwh.toFixed(2);
          if (kwhHint) kwhHint.innerText = "คำนวณจาก (" + s0 + " - " + s1 + ")% × " + tripCap.toFixed(1) + " kWh";
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
      var tripVehicleSel = document.getElementById("tripVehicleSelect");
      if (tripVehicleSel) tripVehicleSel.onchange = function() { recalcTrip("soc"); };

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
          note: formData.get("note"),
          vehicle: formData.get("vehicle"),
          driver: formData.get("driver"),
          purpose: formData.get("purpose")
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
        var onPeak = parseFloat(document.getElementById("cfgRateOnPeak").value) || 6.60;
        var offPeak = parseFloat(document.getElementById("cfgRateOffPeak").value) || 3.25;
        var petRate = parseFloat(document.getElementById("cfgPetrolRate").value) || 38.5;
        var petKmL = parseFloat(document.getElementById("cfgPetrolKmL").value) || 16.0;
        var vName = document.getElementById("cfgVehicleName").value.trim() || "XPENG G6 STD";
        var vPlate = document.getElementById("cfgVehiclePlate").value.trim();
        var focusV = getVehicleById(focusVehicleId());
        var vehicleChanged = !focusV || focusV.name !== vName || (focusV.plate || "") !== vPlate || Number(focusV.batteryKwh) !== cap;

        state.defaultDriver = document.getElementById("cfgDefaultDriver").value.trim();
        try { localStorage.setItem("ev_default_driver", state.defaultDriver); } catch (e) {}
        state.unitRate = rate;
        state.rateOnPeak = onPeak;
        state.rateOffPeak = offPeak;
        state.petrolRate = petRate;
        state.petrolKmPerL = petKmL;

        localStorage.setItem("ev_unit_rate", rate.toString());
        localStorage.setItem("ev_rate_onpeak", onPeak.toString());
        localStorage.setItem("ev_rate_offpeak", offPeak.toString());
        localStorage.setItem("ev_petrol_rate", petRate.toString());
        localStorage.setItem("ev_petrol_km_l", petKmL.toString());

        if (!vehicleChanged) {
          showToast("บันทึกการตั้งค่าสำเร็จ!", "success");
          renderView();
          return;
        }
        saveVehicleProfile({ id: focusV ? focusV.id : "", name: vName, plate: vPlate, batteryKwh: cap })
          .then(function() {
            showToast("บันทึกการตั้งค่าและข้อมูลรถลง Google Sheets แล้ว", "success");
            renderView();
          })
          .catch(function(err) {
            showToast("บันทึกข้อมูลรถไม่สำเร็จ: " + err.message, "error");
          });
      };

      var btnSetLight = document.getElementById("btnSetThemeLight");
      if (btnSetLight) {
        btnSetLight.onclick = function() {
          setTheme("light");
          renderView();
        };
      }
      var btnSetDark = document.getElementById("btnSetThemeDark");
      if (btnSetDark) {
        btnSetDark.onclick = function() {
          setTheme("dark");
          renderView();
        };
      }

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

          state.unitRate = (window.__INITIAL_PAYLOAD__.data && window.__INITIAL_PAYLOAD__.data.meta && window.__INITIAL_PAYLOAD__.data.meta.rate) || 4.90;
          state.rateOnPeak = 6.60;
          state.rateOffPeak = 3.25;
          state.petrolRate = 38.5;
          state.petrolKmPerL = 16.0;

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
            fleetFormFields("edit", record) +
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
              '<div class="form-group"><label>ระยะเวลา (นาที)</label><input type="number" class="form-control" name="durationMin" value="' + (record.min || 0) + '"></div>' +
            '</div>' +
            '<div class="form-grid">' +
              '<div class="form-group"><label>เลขไมล์เริ่มต้น</label><input type="number" step="0.1" class="form-control" name="odoStart" value="' + (record.odoStart || '') + '"></div>' +
              '<div class="form-group"><label>เลขไมล์สิ้นสุด (Odometer)</label><input type="number" step="0.1" class="form-control" name="odoEnd" value="' + (record.odoEnd || '') + '"></div>' +
            '</div>' +
            '<div class="form-group"><label>อัตราสิ้นเปลือง (kWh/100km หรือ Wh/km)</label><input type="number" step="0.1" class="form-control" name="avgConsumption" value="' + (record.cons || '') + '"></div>' +
            '<div class="form-group"><label>หมายเหตุ / สถานีชาร์จ</label><input type="text" class="form-control" name="note" value="' + escHtml(record.note || '') + '"></div>' +
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
        durationMin: fd.get("durationMin"),
        odoStart: fd.get("odoStart"),
        odoEnd: fd.get("odoEnd"),
        avgConsumption: fd.get("avgConsumption"),
        note: fd.get("note"),
        vehicle: fd.get("vehicle"),
        driver: fd.get("driver"),
        purpose: fd.get("purpose")
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

  document.addEventListener("change", function(e) {
    if (e.target && e.target.id === "vehicleSwitcher") setActiveVehicle(e.target.value);
  });

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
      var rows = getRows();
      exportCurrentReportToCsv(rows);
      return;
    }
  });

  var btnMobileMenu = document.getElementById("btnOpenMobileMenu");
  var btnBottomMenu = document.getElementById("btnBottomMenu");
  var sidebar = document.getElementById("appSidebar");
  var drawerBackdrop = document.getElementById("drawerBackdrop");

  function openDrawer() {
    if (sidebar && drawerBackdrop) {
      sidebar.classList.add("open");
      drawerBackdrop.classList.add("show");
    }
  }

  function closeDrawer() {
    if (sidebar && drawerBackdrop) {
      sidebar.classList.remove("open");
      drawerBackdrop.classList.remove("show");
    }
  }

  if (btnMobileMenu) btnMobileMenu.onclick = openDrawer;
  if (btnBottomMenu) btnBottomMenu.onclick = openDrawer;
  if (drawerBackdrop) drawerBackdrop.onclick = closeDrawer;

  document.addEventListener("click", function(e) {
    if (e.target.closest(".nav-link") && window.innerWidth <= 900) {
      closeDrawer();
    }
  });

  var btnTheme = document.getElementById("btnThemeToggle");
  if (btnTheme) btnTheme.onclick = toggleTheme;

  var btnSbTheme = document.getElementById("btnSidebarThemeToggle");
  if (btnSbTheme) btnSbTheme.onclick = toggleTheme;

  window.onpopstate = function() {
    var p = window.location.pathname.startsWith("/") ? window.location.pathname.substring(1) : window.location.pathname;
    state.activeView = p || "dashboard";
    renderView();
  };

  updateThemeUI(state.theme);
  renderView();
})();
</script>
</body>
</html>
`;
}
