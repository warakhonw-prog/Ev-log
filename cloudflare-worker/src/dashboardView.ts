import { DashboardPayload } from "./dashboardData";

export function renderDashboardHtml(
  payload: DashboardPayload,
  initialTab: "overview" | "charging" | "manage" = "overview"
): string {
  const payloadJson = JSON.stringify(payload);

  return `<!DOCTYPE html>
<html lang="th">
<head>
<base target="_top">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>รายงานการใช้พลังงานและค่าใช้จ่ายการชาร์จไฟ EV</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>
:root{
  --bg3:#F0F6FA;--card:#FFFFFF;--ink3:#0F172A;--mut3:#64748B;--line3:#E2E8F0;
  --line2:#CBD5E1;
  --sky:#0284C7;--sky2:#38BDF8;--skydark:#0369A1;--skysoft:#E0F2FE;--skypale:#F0F9FF;
  --grn:var(--sky);--grn2:var(--sky2);--grndark:var(--skydark);--grnsoft:var(--skysoft);
  --ylw:#F59E0B;--ylwsoft:#FEF3C7;--slate:#4F46E5;--slatesoft:#EEF2FF;
  --red:#EF4444;--amb:#EA580C;--ambsoft:#FFEDD5;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--bg3);color:var(--ink3);font-family:"Anuphan","Segoe UI",system-ui,sans-serif;
     font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased}
#app{container-type:inline-size}

/* Top App Bar & Navigation Tabs */
.topbar{background:#FFFFFF;border-bottom:1px solid var(--line3);padding:14px 20px;position:sticky;top:0;z-index:20;box-shadow:0 1px 3px rgba(0,0,0,0.03)}
.topbar-inner{max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:10px}
.brand-icon{font-size:22px;line-height:1;background:var(--skysoft);color:var(--sky);padding:6px 10px;border-radius:10px}
.brand-text h1{margin:0;font-size:17px;font-weight:700;color:var(--ink3);letter-spacing:-.01em}
.brand-text p{margin:0;font-size:12px;color:var(--mut3);font-family:"JetBrains Mono",monospace}

.tabnav{display:flex;gap:6px;background:var(--bg3);border:1px solid var(--line3);border-radius:12px;padding:4px}
.tab-btn{font:inherit;font-size:13.5px;font-weight:500;border:0;background:transparent;color:var(--mut3);
  padding:8px 18px;border-radius:9px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:all .15s ease}
.tab-btn:hover{color:var(--ink3)}
.tab-btn[aria-selected="true"]{background:var(--ink3);color:#FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.12)}
.tab-btn.chg-tab[aria-selected="true"]{background:linear-gradient(135deg,#0284C7,#38BDF8);color:#FFFFFF}
.tab-btn:focus-visible{outline:2px solid var(--sky);outline-offset:2px}

/* Head Controls Section */
.head{background:var(--card);border-bottom:1px solid var(--line3);padding:16px 20px 0}
.head-inner{max-width:1200px;margin:0 auto}
.headtop{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}
.headtop h2{margin:0;font-size:18px;font-weight:600;letter-spacing:-.01em}
.headtop p{margin:2px 0 0;font-size:12.5px;color:var(--mut3);font-family:"JetBrains Mono",monospace}
.picker{display:flex;align-items:center;gap:8px}
.picker label{font-size:12.5px;color:var(--mut3)}
input[type="date"]{font:inherit;font-size:13px;font-family:"JetBrains Mono",monospace;color:var(--ink3);
  background:var(--bg3);border:1px solid var(--line3);border-radius:10px;padding:7px 11px}
input[type="date"]:focus-visible{outline:2px solid var(--grn);outline-offset:2px}

/* Mode Buttons */
.modes{display:flex;gap:4px;background:var(--bg3);border-radius:12px;padding:4px;margin-top:14px;
  border:1px solid var(--line3);width:fit-content;max-width:100%;overflow-x:auto}
.modes button{font:inherit;font-size:13px;font-weight:500;border:0;background:transparent;color:var(--mut3);
  padding:7px 16px;border-radius:8px;cursor:pointer;white-space:nowrap;transition:all .15s ease}
.modes button:hover{color:var(--ink3)}
.modes button[aria-pressed="true"]{background:var(--ink3);color:#fff;font-weight:600}
.modes.chg-modes button[aria-pressed="true"]{background:var(--grn);color:#fff}
.modes button:focus-visible{outline:2px solid var(--grn);outline-offset:2px}

/* Navigation Carousel */
.daybar{display:flex;align-items:center;gap:8px;padding:12px 0}
.nav{flex:none;width:34px;height:34px;border-radius:11px;border:1px solid var(--line3);background:var(--card);
  color:var(--ink3);font-size:16px;font-weight:600;cursor:pointer;display:grid;place-items:center;line-height:1}
.nav:hover:not(:disabled){background:var(--grnsoft);border-color:var(--grn);color:var(--grn)}
.nav:disabled{opacity:.35;cursor:default}
.nav:focus-visible{outline:2px solid var(--grn);outline-offset:2px}
.days{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin;flex:1}
.day{flex:none;border:1px solid var(--line3);background:var(--card);border-radius:13px;padding:8px 14px;
  cursor:pointer;font:inherit;text-align:center;color:var(--mut3);line-height:1.35;min-width:86px;transition:border-color .15s ease}
.day .dw{font-size:11px;letter-spacing:.04em}
.day .dd{font-size:15px;font-weight:600;color:var(--ink3);font-family:"JetBrains Mono",monospace}
.day .dv{font-size:11px;font-family:"JetBrains Mono",monospace}
.day:hover{border-color:var(--grn);color:var(--grn)}
.day[aria-pressed="true"]{background:var(--ink3);border-color:var(--ink3);color:rgba(255,255,255,.75)}
.day[aria-pressed="true"] .dd{color:#fff}
.day[aria-pressed="true"].chg-chip{background:var(--grndark);border-color:var(--grndark)}
.day:focus-visible{outline:2px solid var(--grn);outline-offset:2px}

/* Main Container */
.body{padding:20px;max-width:1200px;margin:0 auto}
.daytitle{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:baseline;margin-bottom:16px}
.daytitle h3{margin:0;font-size:21px;font-weight:700;letter-spacing:-.01em;color:var(--ink3)}
.daytitle .sub{font-size:13px;color:var(--mut3);font-family:"JetBrains Mono",monospace}
.delta{font-size:12.5px;font-family:"JetBrains Mono",monospace;border-radius:999px;padding:3px 11px;
  background:var(--grnsoft);color:var(--grn);white-space:nowrap}
.delta.up{background:#FBEAE7;color:var(--red)}
.delta.flat{background:var(--line3);color:var(--mut3)}

/* Bento Grid */
.bento{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.c{background:var(--card);border:1px solid var(--line3);border-radius:18px;padding:18px;
  display:flex;flex-direction:column;gap:10px;box-shadow:0 1px 3px rgba(0,0,0,0.02)}
.c .cap{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--mut3);font-weight:600}

/* Hero Cards */
.hero{grid-column:span 2;grid-row:span 2;background:linear-gradient(145deg, #0369A1 0%, #0284C7 60%, #38BDF8 100%);
  color:#fff;border-color:transparent;justify-content:space-between;position:relative;overflow:hidden}
.hero::after{content:"";position:absolute;top:-40px;right:-40px;width:140px;height:140px;background:rgba(255,255,255,0.06);border-radius:50%;pointer-events:none}
.hero .cap{color:rgba(255,255,255,.8)}
.hero .note{font-size:12.5px;color:rgba(255,255,255,.85);line-height:1.6;
  border-top:1px solid rgba(255,255,255,.2);padding-top:12px}
.hsplit{display:flex;flex-direction:column;gap:14px;flex:1;justify-content:center}
.hitem{display:flex;flex-direction:column;gap:2px}
.hitem+.hitem{border-top:1px solid rgba(255,255,255,.18);padding-top:13px}
.hl{font-size:13px;color:rgba(255,255,255,.85);display:flex;align-items:center;gap:6px}
.hv{font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums;
  font-size:clamp(30px,7cqw,40px);font-weight:600;letter-spacing:-.035em;line-height:1.15}
.hv small{font-size:.44em;font-weight:400;opacity:.8;margin-right:4px}
.hs{font-size:12.5px;color:rgba(255,255,255,.78);font-family:"JetBrains Mono",monospace}

/* Stats Card */
.stat .v{font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums;font-size:30px;
  font-weight:600;letter-spacing:-.03em;line-height:1.15}
.stat .v i{font-style:normal;font-size:14px;color:var(--mut3);margin-left:4px;font-weight:400}
.foot{font-size:12.5px;color:var(--mut3);line-height:1.5}

/* Battery Card */
.batt{grid-column:span 2}
.battrow{display:flex;align-items:center;gap:12px}
.cell3{flex:1;height:44px;border-radius:10px;background:var(--line3);position:relative;overflow:hidden}
.cell3 .lv{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,var(--grn),var(--grn2));
  border-radius:10px;transition:width .5s cubic-bezier(.4,0,.2,1)}
.cell3 .txt{position:absolute;inset:0;display:flex;align-items:center;padding:0 14px;
  font-family:"JetBrains Mono",monospace;font-size:15px;color:#fff;font-weight:600}
.arrow{color:var(--mut3);font-size:13px;white-space:nowrap;font-family:"JetBrains Mono",monospace}

/* Bar Chart Card */
.strip{grid-column:span 4}
.bars{display:flex;gap:4px;align-items:flex-end;height:110px;margin-top:4px}
.bcol{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;height:100%;
  background:transparent;border:0;padding:0;cursor:pointer;font:inherit;border-radius:4px}
.bcol:disabled{cursor:default}
.bcol span{display:block;width:100%;border-radius:4px 4px 0 0;transition:height .35s ease}
.bcol .btrip{background:var(--slate)}
.bcol .bchg{background:var(--grn)}
.bcol .bchg-home{background:var(--grn);border-radius:4px 4px 0 0}
.bcol .bchg-dc{background:var(--amb);border-radius:4px 4px 0 0}
.bcol .bchg-dc + .bchg-home{border-radius:0}
.bcol .bnone{background:var(--line3);height:3px;border-radius:2px}
.bcol:hover:not(:disabled) .btrip{background:#55679180}
.bcol:hover:not(:disabled) .bchg,.bcol:hover:not(:disabled) .bchg-home{background:var(--grn2)}
.bcol:hover:not(:disabled) .bchg-dc{background:#C97A1E}
.bcol:focus-visible{outline:2px solid var(--grn);outline-offset:2px}
.blabels{display:flex;gap:4px;margin-top:8px}
.blabels span{flex:1;min-width:0;text-align:center;font-size:11px;color:var(--mut3);
  font-family:"JetBrains Mono",monospace;overflow:hidden;white-space:nowrap}

/* Table Card */
.tbl-card{grid-column:span 4;padding:0;overflow:hidden}
.tbl-card header{display:flex;justify-content:space-between;align-items:center;gap:10px;
  padding:16px 20px;border-bottom:1px solid var(--line3);background:#FFFFFF}
.tbl-card header b{font-size:15px;font-weight:600}
.tbl-card header span{font-size:12.5px;color:var(--mut3);font-family:"JetBrains Mono",monospace}
.tbl-wrap{overflow-x:auto}
.tbl{width:100%;border-collapse:collapse;text-align:left;font-size:13.5px}
.tbl th{padding:10px 16px;background:var(--bg3);color:var(--mut3);font-weight:600;
  font-size:12px;letter-spacing:.03em;border-bottom:1px solid var(--line3);white-space:nowrap}
.tbl th.r,.tbl td.r{text-align:right}
.tbl td{padding:12px 16px;border-bottom:1px solid var(--line3);color:var(--ink3);white-space:nowrap}
.tbl tr:hover td{background:var(--grnsoft)}
.tbl .mono{font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums}
.tbl .tfoot td{background:var(--bg3);font-weight:600;border-top:2px solid var(--line3);border-bottom:0}

/* Lists & History */
.list{grid-column:span 4;padding:0;overflow:hidden}
.list header,.hist header{display:flex;justify-content:space-between;align-items:center;gap:10px;
  padding:15px 20px;border-bottom:1px solid var(--line3)}
.list header b,.hist header b{font-size:15px;font-weight:600}
.list header span,.hist header span{font-size:12.5px;color:var(--mut3);font-family:"JetBrains Mono",monospace}
.li{display:grid;grid-template-columns:auto 1fr auto auto;gap:12px;align-items:center;
  padding:12px 20px;border-bottom:1px solid var(--line3)}
.li:last-child{border-bottom:0}
.ic{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;font-size:16px;
  background:var(--slatesoft);color:var(--slate)}
.ic.chg{background:var(--grnsoft);color:var(--grn)}
.ic.dc{background:var(--ambsoft);color:var(--amb)}
.li .t1{font-size:14px;font-weight:500}
.li .t2{font-size:12px;color:var(--mut3);font-family:"JetBrains Mono",monospace}
.li .kw{font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums;font-size:13px;color:var(--mut3);text-align:right}
.li .th{font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums;font-size:14.5px;font-weight:600;text-align:right;min-width:75px}
.badge-tag{font-size:11px;font-weight:600;border-radius:6px;padding:2px 7px;display:inline-block;margin-right:6px}
.badge-home{background:var(--grnsoft);color:var(--grn)}
.badge-dc{background:var(--ambsoft);color:var(--amb)}

/* Charging Type Filter Pills */
.chg-type-bar{display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap}
.chg-type-lbl{font-size:12px;font-weight:600;color:var(--mut3);text-transform:uppercase;letter-spacing:.04em}
.chg-type-pills{display:inline-flex;gap:4px;background:var(--bg3);padding:3px;border-radius:10px;border:1px solid var(--line3)}
.chg-pill{font:inherit;font-size:12.5px;font-weight:500;padding:5px 12px;border:0;background:transparent;color:var(--mut3);border-radius:7px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .15s ease}
.chg-pill:hover{color:var(--ink3)}
.chg-pill[aria-pressed="true"]{background:var(--card);color:var(--ink3);box-shadow:0 1px 3px rgba(0,0,0,0.06);font-weight:600}
.chg-pill[aria-pressed="true"].home{color:var(--grn)}
.chg-pill[aria-pressed="true"].dc{color:var(--amb)}
.chg-pill .chg-count{font-size:11px;padding:1px 6px;border-radius:10px;background:var(--line3);color:var(--mut3);font-family:"JetBrains Mono",monospace;font-weight:600}
.chg-pill[aria-pressed="true"] .chg-count{background:var(--line2);color:var(--ink3)}
.chg-pill[aria-pressed="true"].home .chg-count{background:var(--grnsoft);color:var(--grn)}
.chg-pill[aria-pressed="true"].dc .chg-count{background:var(--ambsoft);color:var(--amb)}

.more{padding:12px 20px;text-align:center;font-size:13px;color:var(--mut3);border-top:1px solid var(--line3)}
.empty{grid-column:span 4;background:var(--card);border:1px dashed var(--line3);border-radius:18px;
  padding:40px 20px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center}
.empty .em{font-size:32px}
.empty b{font-size:16px;font-weight:600}
.empty p{margin:0;color:var(--mut3);font-size:13.5px;max-width:48ch}
.empty button{font:inherit;font-size:13.5px;font-weight:500;border:0;background:var(--ink3);color:#fff;
  border-radius:10px;padding:9px 20px;cursor:pointer;margin-top:6px}
.empty button:focus-visible{outline:2px solid var(--grn);outline-offset:2px}

.hist{grid-column:span 4;padding:0;overflow:hidden}
.hrow{display:grid;grid-template-columns:140px 1fr 130px 90px;gap:14px;align-items:center;width:100%;
  padding:13px 20px;border:0;border-bottom:1px solid var(--line3);background:transparent;
  font:inherit;text-align:left;cursor:pointer;color:var(--ink3)}
.hrow:last-of-type{border-bottom:0}
.hrow:hover{background:var(--grnsoft)}
.hrow[aria-pressed="true"]{background:var(--grnsoft);box-shadow:inset 3px 0 0 var(--grn)}
.hrow:focus-visible{outline:2px solid var(--grn);outline-offset:-2px}
.hrow .d1{font-size:14px;font-weight:600}
.hrow .d2{font-size:12px;color:var(--mut3);font-family:"JetBrains Mono",monospace}
.hbar{display:flex;flex-direction:column;gap:4px}
.hbar i{display:block;height:6px;border-radius:3px;background:var(--line3);min-width:3px;transition:width .4s ease}
.hbar .a{background:var(--slate)}
.hbar .b{background:var(--grn)}
.hrow .m1{font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums;font-size:13px;color:var(--mut3);text-align:right}
.hrow .m2{font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums;font-size:13.5px;font-weight:600;text-align:right;line-height:1.5}
.hrow .m2 .mt{color:var(--slate)}
.hrow .m2 .mc{color:var(--grn)}
.hrow .m2 em{font-style:normal;opacity:.5;font-size:11px;margin-right:3px}

.sumrow{display:flex;flex-wrap:wrap;gap:8px 24px;padding:14px 20px;background:var(--bg3);
  border-top:1px solid var(--line3);font-size:13px;color:var(--mut3)}
.sumrow b{color:var(--ink3);font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums;font-weight:600}
.legend3{display:flex;flex-wrap:wrap;gap:18px;padding:0 20px 14px;font-size:12px;color:var(--mut3)}
.legend3 i{width:10px;height:10px;border-radius:3px;display:inline-block;vertical-align:-1px;margin-right:6px}

.socc{grid-column:span 4}
svg.sochart{width:100%;height:150px;display:block}

.thin{grid-column:span 4;background:var(--ylwsoft);border:1px solid #F0DFAE;color:#7A5B12;border-radius:14px;
  padding:12px 16px;font-size:13px;line-height:1.6}
.thin b{font-weight:600}
.srcbar{padding:14px 20px 24px;font-size:12.5px;color:var(--mut3);display:flex;flex-wrap:wrap;gap:8px 20px;
  font-family:"JetBrains Mono",monospace;max-width:1200px;margin:0 auto}
.srcbar a{color:var(--grn);text-decoration:none;font-weight:500}
.srcbar a:hover{text-decoration:underline}
.fail{margin:24px auto;max-width:600px;background:var(--card);border:1px solid #F0C9C4;border-radius:16px;padding:24px;color:var(--red)}
.fail b{display:block;font-size:16px;margin-bottom:6px}
.fail code{background:#FBEAE7;padding:2px 6px;border-radius:5px;font-size:12.5px;color:#8A2F26}

@container (max-width:900px){
  .bento{grid-template-columns:repeat(2,1fr)}
  .list,.hist,.socc,.empty,.strip,.thin,.tbl-card{grid-column:span 2}
  .hrow{grid-template-columns:120px 1fr 115px 80px;gap:12px}
}
@container (max-width:620px){
  .topbar{padding:12px 14px}
  .head{padding:14px 14px 0}
  .body{padding:14px}
  .bento{grid-template-columns:1fr}
  .hero,.batt,.list,.hist,.socc,.empty,.strip,.thin,.tbl-card{grid-column:span 1}
  .hero{grid-row:auto}
  .li{grid-template-columns:auto 1fr auto;gap:10px;padding:12px 14px}
  .li .kw{display:none}
  .hrow{grid-template-columns:1fr auto;gap:6px 12px;padding:12px 14px}
  .hrow .hbar{grid-column:1/-1;grid-row:2}
  .hrow .m1{display:none}
  .tbl th,.tbl td{padding:10px 12px;font-size:12.5px}
  .list header,.hist header,.sumrow,.legend3,.srcbar,.tbl-card header{padding-left:14px;padding-right:14px}
  .picker label{display:none}
  .headtop h2{font-size:16.5px}
  .bars{height:85px}
  .tab-btn{padding:7px 12px;font-size:12.5px}
  .modes button{padding:6px 12px;font-size:12.5px}
  .chg-pill{padding:5px 8px;font-size:11.5px}
  .form-row{grid-template-columns:1fr !important}
  .table-tools{flex-direction:column;align-items:stretch !important}
}
@media (prefers-reduced-motion: reduce){*{transition-duration:.01ms !important;animation-duration:.01ms !important}}

/* ==========================================================
   CRUD MANAGEMENT VIEW (UI/UX PRO MAX STYLING)
   ========================================================== */
.manage-grid{display:grid;grid-template-columns:1fr;gap:20px;max-width:1200px;margin:0 auto}
.form-card{background:var(--card);border:1px solid var(--line3);border-radius:18px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,0.03)}
.form-card h3{margin:0 0 6px;font-size:17.5px;font-weight:700;color:var(--ink3)}
.form-card p{margin:0 0 18px;font-size:13px;color:var(--mut3)}
.form-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:14px}
.fg{display:flex;flex-direction:column;gap:6px}
.fg label{font-size:12.5px;font-weight:600;color:var(--ink3);display:flex;align-items:center;justify-content:space-between}
.fg label span{font-size:11px;font-weight:normal;color:var(--mut3)}
.fg input,.fg select,.fg textarea{font:inherit;font-size:13.5px;padding:9px 13px;border-radius:10px;border:1px solid var(--line3);background:var(--bg3);color:var(--ink3);transition:border-color .15s,box-shadow .15s}
.fg input:focus,.fg select:focus,.fg textarea:focus{outline:none;border-color:var(--sky);box-shadow:0 0 0 3px rgba(2,132,199,0.15);background:#fff}
.fg-full{grid-column:1/-1}
.calc-badge{display:inline-block;padding:2px 8px;border-radius:6px;background:var(--skysoft);color:var(--sky);font-family:"JetBrains Mono",monospace;font-size:11.5px;font-weight:600}

.btn-primary{background:linear-gradient(135deg,var(--sky),#0ea5e9);color:#fff;border:0;padding:11px 24px;border-radius:10px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;box-shadow:0 2px 6px rgba(2,132,199,0.25);transition:all .15s ease}
.btn-primary:hover:not(:disabled){background:var(--skydark);transform:translateY(-1px);box-shadow:0 4px 10px rgba(2,132,199,0.35)}
.btn-primary:disabled{opacity:.6;cursor:not-allowed}
.btn-sec{background:var(--bg3);color:var(--ink3);border:1px solid var(--line3);padding:10px 20px;border-radius:10px;font:inherit;font-size:13.5px;font-weight:500;cursor:pointer;min-height:44px;transition:all .15s}
.btn-sec:hover{background:var(--line3)}
.btn-danger{background:#EF4444;color:#fff;border:0;padding:11px 22px;border-radius:10px;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;min-height:44px;transition:all .15s}
.btn-danger:hover{background:#DC2626}
.btn-row{display:flex;align-items:center;gap:12px;margin-top:20px;flex-wrap:wrap}

.kind-toggle{display:inline-flex;background:var(--bg3);padding:4px;border-radius:12px;border:1px solid var(--line3);margin-bottom:18px}
.kind-btn{font:inherit;font-size:13px;font-weight:500;padding:7px 18px;border:0;background:transparent;color:var(--mut3);border-radius:9px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .15s}
.kind-btn:hover{color:var(--ink3)}
.kind-btn[aria-selected="true"]{background:var(--card);color:var(--ink3);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
.kind-btn.trip[aria-selected="true"]{color:var(--slate)}
.kind-btn.chg[aria-selected="true"]{color:var(--sky)}

.table-tools{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:14px 20px;background:#fff;border-bottom:1px solid var(--line3);flex-wrap:wrap}
.search-box{flex:1;min-width:220px;position:relative}
.search-box input{width:100%;font:inherit;font-size:13px;padding:9px 12px 9px 34px;border-radius:10px;border:1px solid var(--line3);background:var(--bg3);color:var(--ink3)}
.search-box input:focus{outline:none;border-color:var(--sky);background:#fff}
.search-box span.search-ic{position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--mut3);pointer-events:none}

.act-btn{font:inherit;font-size:12px;font-weight:600;padding:6px 12px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:all .15s;min-height:32px}
.act-edit{background:var(--skysoft);color:var(--sky);border:1px solid #BAE6FD}
.act-edit:hover{background:#BAE6FD}
.act-del{background:#FEE2E2;color:#DC2626;border:1px solid #FECACA}
.act-del:hover{background:#FECACA}

/* Modal Dialogs */
.modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.55);backdrop-filter:blur(4px);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px}
.modal-box{background:#fff;border-radius:20px;max-width:640px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);border:1px solid var(--line3);display:flex;flex-direction:column}
.modal-box.danger-box{max-width:440px}
.modal-head{display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid var(--line3)}
.modal-head h4{margin:0;font-size:16.5px;font-weight:700;color:var(--ink3)}
.modal-close{background:transparent;border:0;font-size:24px;color:var(--mut3);cursor:pointer;padding:0 6px;line-height:1}
.modal-close:hover{color:var(--ink3)}
.modal-body{padding:22px 24px;display:flex;flex-direction:column;gap:14px}
.modal-foot{padding:14px 24px;background:var(--bg3);border-top:1px solid var(--line3);display:flex;justify-content:flex-end;gap:10px}

/* Floating Toast */
.toast-wrap{position:fixed;top:20px;right:20px;z-index:1100;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast-msg{pointer-events:auto;display:inline-flex;align-items:center;gap:10px;padding:12px 20px;border-radius:12px;font-size:13.5px;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.12);animation:toastIn .25s cubic-bezier(.4,0,.2,1)}
.toast-msg.success{background:#F0FDF4;color:#15803D;border:1px solid #BBF7D0}
.toast-msg.error{background:#FEF2F2;color:#DC2626;border:1px solid #FECACA}
.toast-msg.info{background:var(--skysoft);color:var(--sky);border:1px solid #BAE6FD}
@keyframes toastIn{from{opacity:0;transform:translateY(-10px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
</style>
</head>
<body>
<div id="app"></div>

<script>
const PAYLOAD = ${payloadJson};
const INITIAL_TAB = "${initialTab}";

const app = document.getElementById('app');

if (!PAYLOAD.ok) {
  app.innerHTML = '<div class="fail"><b>อ่านข้อมูลจากสเปรดชีตไม่สำเร็จ</b>' +
    '<p>' + esc(PAYLOAD.error) + '</p>' +
    '<p>ตรวจว่าสเปรดชีตแชร์สิทธิ์ Viewer/Editor ให้กับ Service Account แล้วหรือไม่</p></div>';
} else {
  start(PAYLOAD.data);
}

function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

function start(DATA){
let ROWS = DATA.rows, META = DATA.meta;
if (!ROWS || ROWS.length === 0) {
  app.innerHTML = '<div class="fail"><b>ยังไม่มีข้อมูลในระบบ</b><p>กรุณาส่งภาพหน้าจอเพื่อเริ่มบันทึกข้อมูล</p></div>';
  return;
}
let PICK_MIN = (parseInt(ROWS[0].iso.slice(0,4),10)-2)+'-01-01';
let PICK_MAX = (parseInt(ROWS[ROWS.length-1].iso.slice(0,4),10)+2)+'-12-31';

const pad=x=>String(x).padStart(2,'0');
const TH_M =['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const TH_MF=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const TH_W =['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
const TH_WS=['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
const dOf=iso=>new Date(iso+'T00:00:00');
const toIso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const addDays=(iso,k)=>{const d=dOf(iso);d.setDate(d.getDate()+k);return toIso(d);};
const mondayOf=iso=>{const d=dOf(iso);d.setDate(d.getDate()-((d.getDay()+6)%7));return toIso(d);};
const fmtShort=iso=>{const d=dOf(iso);return d.getDate()+' '+TH_M[d.getMonth()];};
const fmtLong=iso=>{const d=dOf(iso);return 'วัน'+TH_W[d.getDay()]+'ที่ '+d.getDate()+' '+TH_M[d.getMonth()]+' '+d.getFullYear();};
const daysInMonth=(y,m)=>new Date(y,m+1,0).getDate();

/* Helper Math & Formatting */
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const n=(v,d=1)=>{
  const num = typeof v === 'number' ? v : parseFloat(v);
  return (isNaN(num) || num == null) ? '0.0' : num.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
};
const hm=m=>{
  if(!m || m<=0) return '0 น.';
  const h=Math.floor(m/60), rem=Math.round(m%60);
  return h>0 ? (h+' ชม. '+(rem>0?rem+' น.':'')) : (rem+' นาที');
};

const inRange=(from,to)=>ROWS.filter(r=>r.iso>=from&&r.iso<=to);
function agg(rows){
  const trips=rows.filter(r=>r.kind==='trip'), chgs=rows.filter(r=>r.kind==='charge');
  const km=sum(trips,r=>r.km);
  return {
    rows, trips:trips.length, charges:chgs.length, km,
    min:sum(trips,r=>r.min),
    used:sum(trips,r=>r.kwh), added:sum(chgs,r=>r.kwh),
    net:sum(rows,r=>r.net), grid:sum(rows,r=>r.grid),
    netTrip:sum(trips,r=>r.net), gridTrip:sum(trips,r=>r.grid),
    netChg:sum(chgs,r=>r.net), gridChg:sum(chgs,r=>r.grid),
    cons:km?sum(trips,r=>r.cons*r.km)/km:0, perKm:km?sum(trips,r=>r.net)/km:0,
    s0:rows.length?rows[0].s0:null, s1:rows.length?rows[rows.length-1].s1:null,
    chgMin:sum(chgs,r=>r.min), days:new Set(rows.map(r=>r.iso)).size
  };
}

let LAST_ISO=ROWS[ROWS.length-1].iso;
let TOTAL=agg(ROWS);

// All Charging Rows
let CHARGE_ROWS = ROWS.filter(r=>r.kind==='charge');
let LAST_CHARGE_ISO = CHARGE_ROWS.length ? CHARGE_ROWS[CHARGE_ROWS.length-1].iso : LAST_ISO;

/* Application State */
const urlParams = new URLSearchParams(window.location.search);
let currentTab = (urlParams.get('tab') === 'charging' || INITIAL_TAB === 'charging')
  ? 'charging'
  : (urlParams.get('tab') === 'manage' || INITIAL_TAB === 'manage')
  ? 'manage'
  : 'overview';

// Manage CRUD State
let mgmtKind = 'trip'; // 'trip' | 'charge'
let mgmtChargeType = 'home'; // 'home' | 'dc'
let mgmtFilter = 'all'; // 'all' | 'trip' | 'charge'
let mgmtSearch = '';
let editTargetRow = null;
let deleteTargetRow = null;

// Overview State
let ovMode = 'day';
let ovAnchor = LAST_ISO;

// Charging Report State (รายสัปดาห์ / รายเดือน / รายปี / ทั้งหมด)
let chgMode = 'month'; // 'week' | 'month' | 'year' | 'all'
let chgAnchor = LAST_CHARGE_ISO;
let chgTypeFilter = urlParams.get('type') || 'all'; // 'all' | 'home' | 'dc'

function range(anchor,mode){
  const d=dOf(anchor), y=d.getFullYear(), m=d.getMonth();
  if(mode==='day')   return {from:anchor,to:anchor};
  if(mode==='week'){ const f=mondayOf(anchor); return {from:f,to:addDays(f,6)}; }
  if(mode==='month') return {from:y+'-'+pad(m+1)+'-01', to:y+'-'+pad(m+1)+'-'+pad(daysInMonth(y,m))};
  if(mode==='year')  return {from:y+'-01-01', to:y+'-12-31'};
  return {from:ROWS[0].iso, to:LAST_ISO}; // 'all'
}

const keyOf=(a,m)=>range(a,m).from;
function shiftAnchor(anchor,mode,k){
  const d=dOf(anchor);
  if(mode==='day')   return addDays(anchor,k);
  if(mode==='week')  return addDays(anchor,k*7);
  if(mode==='month') return toIso(new Date(d.getFullYear(),d.getMonth()+k,1));
  if(mode==='year')  return toIso(new Date(d.getFullYear()+k,d.getMonth(),1));
  return anchor;
}
function titleOf(anchor,mode){
  const r=range(anchor,mode), d=dOf(anchor);
  if(mode==='day')   return fmtLong(anchor);
  if(mode==='week')  return 'สัปดาห์ '+fmtShort(r.from)+' – '+fmtShort(r.to)+' '+dOf(r.to).getFullYear();
  if(mode==='month') return TH_MF[d.getMonth()]+' '+d.getFullYear();
  if(mode==='year')  return 'ปี '+d.getFullYear();
  return 'ประวัติการชาร์จไฟทั้งหมด';
}
function chipOf(anchor,mode){
  const r=range(anchor,mode), d=dOf(anchor);
  if(mode==='day')   return {top:TH_WS[d.getDay()], mid:String(d.getDate())};
  if(mode==='week')  return {top:'สัปดาห์', mid:dOf(r.from).getDate()+'–'+dOf(r.to).getDate()+' '+TH_M[dOf(r.to).getMonth()]};
  if(mode==='month') return {top:String(d.getFullYear()), mid:TH_M[d.getMonth()]};
  return {top:'ปี', mid:String(d.getFullYear())};
}

const aggOf=(a,m)=>{const r=range(a,m);return agg(inRange(r.from,r.to));};
function bucketsOf(mode, filterCharge=false){
  const source = filterCharge ? CHARGE_ROWS : ROWS;
  const s=new Set();
  source.forEach(r=>s.add(range(r.iso,mode).from));
  return [...s].sort();
}

/* ==========================================================
   TOP BAR (Brand & Tab Switcher)
   ========================================================== */
function topBarHtml(){
  const odo = (META.odoStart!=null&&META.odoEnd!=null)
    ? 'ไมล์ '+n(META.odoStart,0)+' → '+n(META.odoEnd,0)+' กม.' : 'EV Dashboard';
  return '<div class="topbar"><div class="topbar-inner">'+
    '<div class="brand">'+
      '<span class="brand-icon">⚡</span>'+
      '<div class="brand-text">'+
        '<h1>'+esc(META.vehicle)+'</h1>'+
        '<p>'+odo+' · อัตราค่าไฟ '+n(META.rate,2)+' ฿/kWh</p>'+
      '</div>'+
    '</div>'+
    '<div class="tabnav" role="tablist">'+
      '<button type="button" class="tab-btn" data-tab="overview" aria-selected="'+(currentTab==='overview')+'" role="tab">'+
        '<span>📊</span> ภาพรวมการใช้งาน'+
      '</button>'+
      '<button type="button" class="tab-btn chg-tab" data-tab="charging" aria-selected="'+(currentTab==='charging')+'" role="tab">'+
        '<span>⚡</span> รายงานการชาร์จไฟ'+
      '</button>'+
      '<button type="button" class="tab-btn mgmt-tab" data-tab="manage" aria-selected="'+(currentTab==='manage')+'" role="tab">'+
        '<span>📝</span> จัดการข้อมูล'+
      '</button>'+
    '</div>'+
  '</div></div>';
}

function srcBarHtml(){
  return '<div class="srcbar"><span>ข้อมูลสดจาก Google Sheets</span><span>อัปเดต '+esc(META.fetched)+'</span>'+
    (META.rate?'<span>อัตราค่าไฟเฉลี่ย '+n(META.rate,2)+' ฿/kWh</span>':'')+
    '<a href="'+esc(META.sheetUrl)+'" target="_blank" rel="noopener">เปิด Google Sheet</a></div>';
}

/* ==========================================================
   VIEW 1: OVERVIEW DASHBOARD (Trip & Charge Combined)
   ========================================================== */
const OV_MODES=[{k:'day',t:'รายวัน'},{k:'week',t:'รายสัปดาห์'},{k:'month',t:'รายเดือน'},{k:'year',t:'รายปี'}];

function deltaChipOv(){
  const cur=aggOf(ovAnchor,ovMode), prev=aggOf(shiftAnchor(ovAnchor,ovMode,-1),ovMode);
  const unit={day:'วันก่อนหน้า',week:'สัปดาห์ก่อน',month:'เดือนก่อน',year:'ปีก่อน'}[ovMode];
  if(!cur.trips) return '<span class="delta flat">ไม่มีการเดินทางในช่วงนี้</span>';
  if(!prev.rows.length) return '<span class="delta flat">ไม่มีข้อมูล'+unit+'</span>';
  if(prev.netTrip===0) return '<span class="delta flat">'+unit+'ไม่มีการเดินทาง</span>';
  const p=(cur.netTrip-prev.netTrip)/prev.netTrip*100;
  if(Math.abs(p)<0.5) return '<span class="delta flat">ค่าเดินทางเท่ากับ'+unit+'</span>';
  return '<span class="delta'+(p>0?' up':'')+'">'+(p>0?'▲':'▼')+' '+n(Math.abs(p),0)+'% ค่าเดินทางเทียบ'+unit+'</span>';
}

function subBucketsOv(){
  const r=range(ovAnchor,ovMode), d=dOf(ovAnchor), out=[];
  if(ovMode==='year'){
    const y=d.getFullYear();
    for(let m=0;m<12;m++){const from=y+'-'+pad(m+1)+'-01', to=y+'-'+pad(m+1)+'-'+pad(daysInMonth(y,m));
      out.push({label:TH_M[m].replace('.',''),from,to,jumpMode:'month',jump:from,a:agg(inRange(from,to))});}
    return {items:out,cap:'ค่าไฟรายเดือนในปีนี้ · กดแท่งเพื่อดูรายเดือน'};
  }
  if(ovMode==='month'){
    const y=d.getFullYear(), m=d.getMonth(), dim=daysInMonth(y,m);
    for(let i=1;i<=dim;i++){const iso=y+'-'+pad(m+1)+'-'+pad(i);
      out.push({label:(i===1||i%5===0)?String(i):'',from:iso,to:iso,jumpMode:'day',jump:iso,a:agg(inRange(iso,iso))});}
    return {items:out,cap:'ค่าไฟรายวันในเดือนนี้ · กดแท่งเพื่อดูรายวัน'};
  }
  if(ovMode==='week'){
    for(let i=0;i<7;i++){const iso=addDays(r.from,i);
      out.push({label:TH_WS[dOf(iso).getDay()],from:iso,to:iso,jumpMode:'day',jump:iso,a:agg(inRange(iso,iso))});}
    return {items:out,cap:'ค่าไฟรายวันในสัปดาห์นี้ · กดแท่งเพื่อดูรายวัน'};
  }
  return null;
}

function stripCardOv(){
  const s=subBucketsOv(); if(!s) return '';
  const max=Math.max(...s.items.map(x=>Math.max(x.a.netTrip,x.a.netChg)),0.0001);
  return '<div class="c strip"><div class="cap">'+s.cap+'</div><div class="bars">'+
   s.items.map(x=>{
     const has=x.a.rows.length>0;
     const hT=has&&x.a.netTrip?Math.max(x.a.netTrip/max*100,2):0;
     const hC=has&&x.a.netChg ?Math.max(x.a.netChg /max*100,2):0;
     const t=has?(x.label||fmtShort(x.from))+' · เดินทาง ฿'+n(x.a.netTrip,2)+' · ชาร์จ ฿'+n(x.a.netChg,2):'ไม่มีข้อมูล';
     return '<button type="button" class="bcol" '+(has?'data-jump="'+x.jumpMode+':'+x.jump+'"':'disabled')+
       ' title="'+t+'">'+
       (hC?'<span class="bchg" style="height:'+hC.toFixed(1)+'%"></span>':'')+
       (hT?'<span class="btrip" style="height:'+hT.toFixed(1)+'%"></span>':'')+
       (has?'':'<span class="bnone"></span>')+'</button>';
   }).join('')+'</div><div class="blabels">'+s.items.map(x=>'<span>'+(x.label||'')+'</span>').join('')+'</div>'+
    '<div class="legend3" style="padding:8px 0 0"><span><i style="background:var(--slate)"></i>ค่าเดินทาง</span>'+
    '<span><i style="background:var(--sky)"></i>ค่าชาร์จ</span><span><i style="background:var(--line3)"></i>ไม่มีข้อมูล</span></div></div>';
}

function socChartOv(){
  const r=range(ovAnchor,ovMode);
  const pts=[{l:'เริ่มต้น',v:ROWS[0].s0,iso:ROWS[0].iso}]
    .concat(ROWS.map(x=>({l:fmtShort(x.iso)+' '+x.time,v:x.s1,iso:x.iso})));
  const W=720,H=150,PT=12,PB=20,PL=28,PR=8,lo=Math.max(0,Math.min(...pts.map(p=>p.v))-10),hi=105;
  const X=i=>PL+i*(W-PL-PR)/Math.max(pts.length-1,1), Y=v=>PT+(hi-v)*(H-PT-PB)/(hi-lo);
  const line=pts.map((p,i)=>X(i).toFixed(1)+','+Y(p.v).toFixed(1)).join(' ');
  const area=PL+','+Y(lo).toFixed(1)+' '+line+' '+X(pts.length-1).toFixed(1)+','+Y(lo).toFixed(1);
  const ticks=[Math.ceil(lo/20)*20,60,80,100].filter((v,i,a)=>v>=lo&&v<=100&&a.indexOf(v)===i);
  const grid=ticks.map(v=>'<line x1="'+PL+'" x2="'+(W-PR)+'" y1="'+Y(v).toFixed(1)+'" y2="'+Y(v).toFixed(1)+'" stroke="var(--line3)"/>'+
    '<text x="'+(PL-6)+'" y="'+(Y(v)+3.5).toFixed(1)+'" fill="var(--mut3)" font-size="9" font-family="JetBrains Mono, monospace" text-anchor="end">'+v+'</text>').join('');
  const dots=pts.map((p,i)=>{const on=p.iso>=r.from&&p.iso<=r.to;
    return '<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(p.v).toFixed(1)+'" r="'+(on?4:2)+'" fill="'+(on?'var(--ylw)':'var(--sky)')+'"><title>'+esc(p.l)+' — '+p.v+'%</title></circle>';}).join('');
  return '<div class="c socc"><div class="cap">ระดับแบตเตอรี่ตลอดข้อมูล · จุดสีเหลืองคือช่วงที่เลือก</div>'+
    '<svg class="sochart" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" role="img" aria-label="กราฟระดับแบตเตอรี่ตลอดช่วงข้อมูล">'+
    '<defs><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38BDF8" stop-opacity=".35"/><stop offset="100%" stop-color="#38BDF8" stop-opacity="0"/></linearGradient></defs>'+
    grid+'<polygon points="'+area+'" fill="url(#gs)"/>'+
    '<polyline points="'+line+'" fill="none" stroke="#0284C7" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>'+
    dots+'</svg></div>';
}

function historyOv(){
  const list=bucketsOf(ovMode), cur=keyOf(ovAnchor,ovMode);
  const maxg=Math.max(...list.map(a=>{const x=aggOf(a,ovMode);return Math.max(x.netTrip,x.netChg);}),0.0001);
  const unit={day:'วัน',week:'สัปดาห์',month:'เดือน',year:'ปี'}[ovMode];
  return '<div class="c hist"><header><b>ย้อนหลังราย'+unit+'</b><span>'+list.length+' '+unit+'ที่มีข้อมูล</span></header>'+
  list.map(a=>{
    const d=aggOf(a,ovMode), on=a===cur;
    const sub = ovMode==='day'
      ? TH_WS[dOf(a).getDay()]+' · '+(d.trips?d.trips+' เที่ยว':'ชาร์จอย่างเดียว')
      : d.days+' วันที่มีข้อมูล · '+d.trips+' เที่ยว · ชาร์จ '+d.charges+' ครั้ง';
    return '<button type="button" class="hrow" data-go="'+a+'" aria-pressed="'+on+'">'+
      '<span><span class="d1">'+(ovMode==='day'?fmtShort(a):titleOf(a,ovMode).replace('สัปดาห์ ',''))+'</span><br><span class="d2">'+sub+'</span></span>'+
      '<span class="hbar"><i class="a" style="width:'+(d.netTrip/maxg*100).toFixed(1)+'%"></i><i class="b" style="width:'+(d.netChg/maxg*100).toFixed(1)+'%"></i></span>'+
      '<span class="m1">'+(d.km?n(d.km)+' กม.':'—')+' · ใช้ '+n(d.used,2)+' kWh</span>'+
      '<span class="m2"><span class="mt"><em>🚗</em>฿'+n(d.netTrip,2)+'</span><br><span class="mc"><em>⚡</em>฿'+n(d.netChg,2)+'</span></span></button>';
  }).join('')+
  '<div class="legend3"><span><i style="background:var(--slate)"></i>🚗 ค่าเดินทาง (มูลค่าพลังงานที่ใช้)</span><span><i style="background:var(--sky)"></i>⚡ ค่าชาร์จ (เงินที่จ่ายจริง)</span></div>'+
  '<div class="sumrow"><span>ค่าชาร์จรวม <b>฿'+n(TOTAL.netChg,2)+'</b></span>'+
  '<span>หน้ามิเตอร์ <b>฿'+n(TOTAL.gridChg,2)+'</b></span>'+
  '<span>ค่าเดินทางรวม <b>฿'+n(TOTAL.netTrip,2)+'</b></span>'+
  '<span>ระยะทาง <b>'+n(TOTAL.km)+' กม.</b></span></div></div>';
}

function itemListOv(d){
  if(!d.rows.length) return '';
  const show=d.rows.slice(0,10), rest=d.rows.length-show.length;
  return '<div class="c list"><header><b>รายการในช่วงนี้</b><span>'+d.rows.length+' รายการ</span></header>'+
  show.map(r=>{
    const c=r.kind==='charge';
    const isDc = c && (r.note.toLowerCase().includes('dc') || r.note.includes('PEA'));
    return '<div class="li"><span class="ic'+(c?(isDc?' dc':' chg'):'')+'">'+(c?'⚡':'🚗')+'</span>'+
      '<span><span class="t1">'+esc(r.note)+'</span><br><span class="t2">'+
        fmtShort(r.iso)+' '+esc(c?(r.time+(r.min>0?' ('+hm(r.min)+')':'')):r.time+' · '+n(r.km)+' กม. · '+n(r.cons)+' kWh/100')+' · '+r.s0+'→'+r.s1+'%</span></span>'+
      '<span class="kw">'+(c?'+':'')+n(r.kwh,2)+' kWh</span>'+
      '<span class="th" style="color:'+(c?'var(--grn)':'var(--slate)')+'">฿'+n(r.net,2)+'</span></div>';
  }).join('')+(rest>0?'<div class="more">และอีก '+rest+' รายการในช่วงนี้</div>':'')+'</div>';
}

function renderOverviewHtml(){
  const r=range(ovAnchor,ovMode), d=aggOf(ovAnchor,ovMode);
  const buckets=bucketsOf(ovMode), cur=keyOf(ovAnchor,ovMode);
  const prevA=shiftAnchor(ovAnchor,ovMode,-1), nextA=shiftAnchor(ovAnchor,ovMode,1);
  const unitTxt={day:'วันนี้',week:'สัปดาห์นี้',month:'เดือนนี้',year:'ปีนี้'}[ovMode];

  const head='<div class="head"><div class="head-inner">'+
    '<div class="headtop">'+
      '<div><h2>ภาพรวมการเดินทาง & พลังงาน</h2><p>ข้อมูล '+fmtShort(META.from)+' – '+fmtShort(META.to)+' '+dOf(META.to).getFullYear()+'</p></div>'+
      '<div class="picker"><label for="dp">ไปที่วันที่</label>'+
      '<input type="date" id="dp" value="'+ovAnchor+'" min="'+PICK_MIN+'" max="'+PICK_MAX+'"></div>'+
    '</div>'+
    '<div class="modes" role="group" aria-label="เลือกช่วงเวลา">'+
      OV_MODES.map(m=>'<button type="button" data-mode="'+m.k+'" aria-pressed="'+(m.k===ovMode)+'">'+m.t+'</button>').join('')+
    '</div>'+
    '<div class="daybar">'+
      '<button type="button" class="nav" data-step="-1" aria-label="ช่วงก่อนหน้า"'+(prevA<PICK_MIN?' disabled':'')+'>‹</button>'+
      '<div class="days">'+buckets.map(a=>{
        const c=chipOf(a,ovMode), x=aggOf(a,ovMode);
        return '<button type="button" class="day" data-go="'+a+'" aria-pressed="'+(a===cur)+'">'+
          '<span class="dw">'+c.top+'</span><br><span class="dd">'+c.mid+'</span><br><span class="dv">'+(x.trips?'🚗':'⚡')+'฿'+n(x.trips?x.netTrip:x.netChg,0)+'</span></button>';
      }).join('')+'</div>'+
      '<button type="button" class="nav" data-step="1" aria-label="ช่วงถัดไป"'+(nextA>PICK_MAX?' disabled':'')+'>›</button>'+
    '</div></div></div>';

  if(!d.rows.length){
    return topBarHtml()+head+'<div class="body">'+
      '<div class="daytitle"><h3>'+titleOf(ovAnchor,ovMode)+'</h3><span class="sub">'+r.from+' – '+r.to+'</span></div>'+
      '<div class="bento"><div class="empty"><span class="em">🔌</span><b>ไม่มีข้อมูลใน'+unitTxt+'</b>'+
      '<p>ไม่พบรายการเดินทางหรือการชาร์จในช่วงที่เลือก ข้อมูลมีตั้งแต่ '+fmtShort(META.from)+' ถึง '+fmtShort(META.to)+'</p>'+
      '<button type="button" data-go="'+keyOf(LAST_ISO,ovMode)+'">ไปที่ช่วงล่าสุดที่มีข้อมูล</button></div>'+
      historyOv()+'</div></div>'+srcBarHtml();
  }

  const consCard = d.km
    ? '<div class="c stat"><div class="cap">อัตราสิ้นเปลือง</div><div class="v">'+n(d.cons)+'<i>kWh/100</i></div><div class="foot">฿'+n(d.perKm,2)+' ต่อกิโลเมตร</div></div>'
    : '<div class="c stat"><div class="cap">เวลาที่ใช้ชาร์จ</div><div class="v">'+(d.chgMin?n(d.chgMin/60,1):'0')+'<i>ชม.</i></div><div class="foot">ชาร์จ '+d.charges+' ครั้ง ในช่วงนี้</div></div>';
  const kmCard='<div class="c stat"><div class="cap">ระยะทาง</div><div class="v">'+n(d.km)+'<i>กม.</i></div>'+
    '<div class="foot">'+(d.km?d.trips+' เที่ยว · '+hm(d.min):'ไม่มีการเดินทางในช่วงนี้')+'</div></div>';
  const spanDays=Math.round((dOf(r.to)-dOf(r.from))/86400000)+1;
  const notice=(ovMode!=='day'&&d.days<spanDays)
    ? '<div class="thin">ช่วงนี้ยาว <b>'+spanDays+' วัน</b> แต่มีข้อมูลจริงเพียง <b>'+d.days+' วัน</b> — คำนวณจากวันที่มีข้อมูลเท่านั้น</div>' : '';
  const lowBatt=(r.from<=LAST_ISO&&r.to>=LAST_ISO&&d.s1<70)
    ? ' · แบตเหลือ '+d.s1+'% ควรวางแผนชาร์จรอบถัดไป' : '';

  return topBarHtml()+head+'<div class="body">'+
    '<div class="daytitle"><h3>'+titleOf(ovAnchor,ovMode)+'</h3>'+deltaChipOv()+'<span class="sub">'+r.from+' – '+r.to+'</span></div>'+
    '<div class="bento">'+
    '<div class="c hero"><div class="cap">ค่าใช้จ่ายใน'+unitTxt+' · แยกประเภท</div>'+
      '<div class="hsplit">'+
        '<div class="hitem"><span class="hl">🚗 ค่าเดินทาง</span>'+
          '<span class="hv"><small>฿</small>'+n(d.netTrip,2)+'</span>'+
          '<span class="hs">'+(d.km?'ใช้ '+n(d.used,2)+' kWh · ฿'+n(d.perKm,2)+'/กม.':'ไม่มีการเดินทาง')+'</span></div>'+
        '<div class="hitem"><span class="hl">⚡ ค่าชาร์จ</span>'+
          '<span class="hv"><small>฿</small>'+n(d.netChg,2)+'</span>'+
          '<span class="hs">'+(d.charges?'เข้า '+n(d.added,2)+' kWh · หน้ามิเตอร์ ฿'+n(d.gridChg,2):'ไม่มีการชาร์จ')+'</span></div>'+
      '</div>'+
      '<div class="note">ค่าชาร์จคือเงินที่จ่ายจริง ส่วนค่าเดินทางคือมูลค่าพลังงานที่ดึงจากแบตมาใช้ (kWh × '+n(META.rate,2)+' ฿) — เป็นคนละก้อน ไม่ควรนำมาบวกกัน</div></div>'+
    kmCard+consCard+
    '<div class="c batt"><div class="cap">แบตเตอรี่ ต้นช่วง → ปลายช่วง</div>'+
      '<div class="battrow"><div class="cell3"><div class="lv" style="width:'+d.s1+'%"></div><div class="txt">'+d.s1+'%</div></div>'+
      '<span class="arrow">← จาก '+d.s0+'%</span></div>'+
      '<div class="foot">ชาร์จเข้า '+n(d.added,2)+' kWh · ใช้ไป '+n(d.used,2)+' kWh'+lowBatt+'</div></div>'+
    notice+stripCardOv()+itemListOv(d)+historyOv()+socChartOv()+
    '</div></div>'+srcBarHtml();
}

/* ==========================================================
   VIEW 2: DEDICATED CHARGING EXPENSE REPORT (Week/Month/Year)
   ========================================================== */
const CHG_MODES=[
  {k:'week', t:'รายสัปดาห์ (Weekly)'},
  {k:'month',t:'รายเดือน (Monthly)'},
  {k:'year', t:'รายปี (Yearly)'},
  {k:'all',  t:'ทั้งหมด (All Time)'}
];

function isDcCharge(r){
  const n = ((r && r.note) || '').toLowerCase();
  return n.includes('dc') ||
         n.includes('pea') ||
         n.includes('ptt') ||
         n.includes('elex') ||
         n.includes('mea') ||
         n.includes('station') ||
         n.includes('สถานี') ||
         n.includes('ตู้') ||
         n.includes('evme') ||
         n.includes('plug') ||
         n.includes('altervim') ||
         n.includes('shell') ||
         n.includes('supercharger');
}

function aggCharging(rows, typeFilter = chgTypeFilter){
  const allChgs = rows.filter(r=>r.kind==='charge');
  const dcChgs = allChgs.filter(r=>isDcCharge(r));
  const homeChgs = allChgs.filter(r=>!isDcCharge(r));

  let chgs = allChgs;
  if(typeFilter === 'home') chgs = homeChgs;
  else if(typeFilter === 'dc') chgs = dcChgs;

  const count = chgs.length;
  const kwh = sum(chgs, r=>r.kwh);
  const net = sum(chgs, r=>r.net);
  const grid = sum(chgs, r=>r.grid);
  const min = sum(chgs, r=>r.min);
  const lossThb = Math.max(0, grid - net);
  const lossPct = grid > 0 ? (lossThb / grid * 100) : 0;
  const avgCostSession = count ? (net / count) : 0;
  const avgGridSession = count ? (grid / count) : 0;
  const avgKwhSession  = count ? (kwh / count) : 0;
  const avgRatePerKwh  = kwh > 0 ? (net / kwh) : (META.rate || 4.90);
  const avgDuration    = count ? (min / count) : 0;
  const avgS0 = count ? Math.round(sum(chgs, r=>r.s0) / count) : 0;
  const avgS1 = count ? Math.round(sum(chgs, r=>r.s1) / count) : 0;

  return {
    chgs, count, kwh, net, grid, min, lossThb, lossPct,
    avgCostSession, avgGridSession, avgKwhSession, avgRatePerKwh, avgDuration,
    avgS0, avgS1,
    totalAvailableCount: allChgs.length,
    dcCount: dcChgs.length, dcKwh: sum(dcChgs, r=>r.kwh), dcNet: sum(dcChgs, r=>r.net),
    homeCount: homeChgs.length, homeKwh: sum(homeChgs, r=>r.kwh), homeNet: sum(homeChgs, r=>r.net)
  };
}

function chargingSubBuckets(){
  if(chgMode === 'all') return null;
  const r = range(chgAnchor, chgMode);
  const d = dOf(chgAnchor);
  const out = [];
  const filterDesc = chgTypeFilter==='home' ? ' (ชาร์จบ้าน AC)' : chgTypeFilter==='dc' ? ' (สถานีชาร์จ DC)' : '';

  if(chgMode === 'year'){
    const y = d.getFullYear();
    for(let m=0; m<12; m++){
      const from = y+'-'+pad(m+1)+'-01', to = y+'-'+pad(m+1)+'-'+pad(daysInMonth(y,m));
      out.push({
        label: TH_M[m].replace('.',''),
        periodName: TH_MF[m]+' '+y,
        from, to, jumpMode:'month', jump:from,
        a: aggCharging(inRange(from, to))
      });
    }
    return { items: out, cap: 'ค่าชาร์จไฟรายเดือนในปี '+y+filterDesc+' · กดแท่งเพื่อเจาะลึกรายเดือน' };
  }

  if(chgMode === 'month'){
    // Segment month by weeks
    const y = d.getFullYear(), m = d.getMonth();
    const dim = daysInMonth(y, m);
    // Break month into week segments (1-7, 8-14, 15-21, 22-end)
    const weeks = [
      { start: 1, end: 7, label: 'สัปดาห์ 1 (1-7)' },
      { start: 8, end: 14, label: 'สัปดาห์ 2 (8-14)' },
      { start: 15, end: 21, label: 'สัปดาห์ 3 (15-21)' },
      { start: 22, end: dim, label: 'สัปดาห์ 4-5 (22-'+dim+')' }
    ];
    weeks.forEach((w, idx)=>{
      const from = y+'-'+pad(m+1)+'-'+pad(w.start);
      const to = y+'-'+pad(m+1)+'-'+pad(w.end);
      out.push({
        label: 'สัปดาห์ '+(idx+1),
        periodName: w.label+' '+TH_M[m],
        from, to, jumpMode:'week', jump:from,
        a: aggCharging(inRange(from, to))
      });
    });
    return { items: out, cap: 'ค่าชาร์จไฟแยกรายสัปดาห์ในเดือน'+TH_MF[m]+filterDesc+' · กดเพื่อดูรายละเอียด' };
  }

  if(chgMode === 'week'){
    for(let i=0; i<7; i++){
      const iso = addDays(r.from, i);
      out.push({
        label: TH_WS[dOf(iso).getDay()],
        periodName: fmtLong(iso),
        from: iso, to: iso, jumpMode:'week', jump:r.from,
        a: aggCharging(inRange(iso, iso))
      });
    }
    return { items: out, cap: 'ค่าชาร์จไฟรายวันในสัปดาห์นี้ ('+fmtShort(r.from)+' - '+fmtShort(r.to)+')'+filterDesc };
  }

  return null;
}

function chargingStripCard(){
  const s = chargingSubBuckets();
  if(!s) return '';
  const max = Math.max(...s.items.map(x=>Math.max(x.a.net, x.a.grid)), 0.0001);

  return '<div class="c strip"><div class="cap">'+s.cap+'</div><div class="bars">'+
   s.items.map(x=>{
     const has = x.a.count > 0;
     const hNet = has ? Math.max(x.a.net / max * 100, 3) : 0;
     const hHome = has ? (x.a.homeNet / max * 100) : 0;
     const hDc = has ? (x.a.dcNet / max * 100) : 0;
     const t = has ? (x.periodName+' · ชาร์จ '+x.a.count+' ครั้ง (บ้าน '+x.a.homeCount+', สถานี '+x.a.dcCount+') · เข้า '+n(x.a.kwh,2)+' kWh · สุทธิ ฿'+n(x.a.net,2)+' · มิเตอร์ ฿'+n(x.a.grid,2)) : (x.periodName+' · ไม่มีการชาร์จ');
     
     let barInner = '<span class="bnone"></span>';
     if(has){
       if(chgTypeFilter === 'home'){
         barInner = '<span class="bchg-home" style="height:'+hNet.toFixed(1)+'%"></span>';
       } else if(chgTypeFilter === 'dc'){
         barInner = '<span class="bchg-dc" style="height:'+hNet.toFixed(1)+'%"></span>';
       } else {
         // All types: stacked bar (DC top, Home bottom)
         barInner = (hDc > 0 ? '<span class="bchg-dc" style="height:'+hDc.toFixed(1)+'%"></span>' : '') +
                    (hHome > 0 ? '<span class="bchg-home" style="height:'+hHome.toFixed(1)+'%"></span>' : '');
       }
     }

     return '<button type="button" class="bcol" '+(has?'data-chgjump="'+x.jumpMode+':'+x.jump+'"':'disabled')+' title="'+t+'">'+
       barInner +
       '</button>';
   }).join('')+'</div><div class="blabels">'+s.items.map(x=>'<span>'+(x.label||'')+'</span>').join('')+'</div>'+
   '<div class="legend3" style="padding:8px 0 0">'+
     (chgTypeFilter === 'all'
       ? '<span><i style="background:var(--grn)"></i>ชาร์จบ้าน (Home AC ฿)</span><span><i style="background:var(--amb)"></i>ชาร์จสถานี (Public DC ฿)</span>'
       : chgTypeFilter === 'home'
       ? '<span><i style="background:var(--grn)"></i>ชาร์จบ้าน (Home AC ฿)</span>'
       : '<span><i style="background:var(--amb)"></i>ชาร์จสถานี (Public DC ฿)</span>'
     )+
     '<span><i style="background:var(--line3)"></i>ไม่มีการชาร์จ</span>'+
   '</div></div>';
}

function chargingBreakdownTable(curAgg){
  const s = chargingSubBuckets();
  let rowsHtml = '';
  let title = '';
  const filterTag = chgTypeFilter==='home' ? ' (ชาร์จบ้าน AC)' : chgTypeFilter==='dc' ? ' (สถานีชาร์จ DC)' : '';

  if(chgMode === 'year'){
    title = 'สรุปค่าใช้จ่ายการชาร์จรายเดือน (ประจำปี '+dOf(chgAnchor).getFullYear()+')' + filterTag;
    rowsHtml = (s ? s.items : []).map(x=>{
      const has = x.a.count > 0;
      return '<tr>'+
        '<td><b>'+x.periodName+'</b></td>'+
        '<td class="r mono">'+(has ? x.a.count+' ครั้ง' : '<span style="color:var(--mut3)">—</span>')+'</td>'+
        '<td class="r mono">'+(has ? hm(x.a.min) : '—')+'</td>'+
        '<td class="r mono">'+(has ? n(x.a.kwh,2)+' kWh' : '—')+'</td>'+
        '<td class="r mono" style="color:var(--grn);font-weight:600">'+(has ? '฿'+n(x.a.net,2) : '—')+'</td>'+
        '<td class="r mono">'+(has ? '฿'+n(x.a.grid,2) : '—')+'</td>'+
        '<td class="r mono">'+(has ? '฿'+n(x.a.avgRatePerKwh,2) : '—')+'</td>'+
      '</tr>';
    }).join('');
  } else if(chgMode === 'month'){
    title = 'สรุปค่าใช้จ่ายการชาร์จรายสัปดาห์ (ประจำเดือน'+TH_MF[dOf(chgAnchor).getMonth()]+')' + filterTag;
    rowsHtml = (s ? s.items : []).map(x=>{
      const has = x.a.count > 0;
      return '<tr>'+
        '<td><b>'+x.periodName+'</b></td>'+
        '<td class="r mono">'+(has ? x.a.count+' ครั้ง' : '<span style="color:var(--mut3)">—</span>')+'</td>'+
        '<td class="r mono">'+(has ? hm(x.a.min) : '—')+'</td>'+
        '<td class="r mono">'+(has ? n(x.a.kwh,2)+' kWh' : '—')+'</td>'+
        '<td class="r mono" style="color:var(--grn);font-weight:600">'+(has ? '฿'+n(x.a.net,2) : '—')+'</td>'+
        '<td class="r mono">'+(has ? '฿'+n(x.a.grid,2) : '—')+'</td>'+
        '<td class="r mono">'+(has ? '฿'+n(x.a.avgRatePerKwh,2) : '—')+'</td>'+
      '</tr>';
    }).join('');
  } else if(chgMode === 'week'){
    title = 'สรุปค่าใช้จ่ายการชาร์จรายวัน (ประจำสัปดาห์นี้)' + filterTag;
    rowsHtml = (s ? s.items : []).map(x=>{
      const has = x.a.count > 0;
      return '<tr>'+
        '<td><b>'+x.periodName+'</b></td>'+
        '<td class="r mono">'+(has ? x.a.count+' ครั้ง' : '<span style="color:var(--mut3)">—</span>')+'</td>'+
        '<td class="r mono">'+(has ? hm(x.a.min) : '—')+'</td>'+
        '<td class="r mono">'+(has ? n(x.a.kwh,2)+' kWh' : '—')+'</td>'+
        '<td class="r mono" style="color:var(--grn);font-weight:600">'+(has ? '฿'+n(x.a.net,2) : '—')+'</td>'+
        '<td class="r mono">'+(has ? '฿'+n(x.a.grid,2) : '—')+'</td>'+
        '<td class="r mono">'+(has ? '฿'+n(x.a.avgRatePerKwh,2) : '—')+'</td>'+
      '</tr>';
    }).join('');
  } else {
    // All time mode: group by year/month
    title = 'สรุปค่าใช้จ่ายการชาร์จแยกตามเดือน (ทั้งหมด)' + filterTag;
    const monthBuckets = bucketsOf('month', true);
    rowsHtml = monthBuckets.map(b=>{
      const a = aggCharging(inRange(b, range(b,'month').to));
      const d = dOf(b);
      return '<tr>'+
        '<td><b>'+TH_MF[d.getMonth()]+' '+d.getFullYear()+'</b></td>'+
        '<td class="r mono">'+(a.count>0?a.count+' ครั้ง':'<span style="color:var(--mut3)">—</span>')+'</td>'+
        '<td class="r mono">'+(a.count>0?hm(a.min):'—')+'</td>'+
        '<td class="r mono">'+(a.count>0?n(a.kwh,2)+' kWh':'—')+'</td>'+
        '<td class="r mono" style="color:var(--grn);font-weight:600">'+(a.count>0?'฿'+n(a.net,2):'—')+'</td>'+
        '<td class="r mono">'+(a.count>0?'฿'+n(a.grid,2):'—')+'</td>'+
        '<td class="r mono">'+(a.count>0?'฿'+n(a.avgRatePerKwh,2):'—')+'</td>'+
      '</tr>';
    }).join('');
  }

  const footHtml = '<tr class="tfoot">'+
    '<td><b>รวมทั้งหมดในช่วงนี้</b></td>'+
    '<td class="r mono"><b>'+curAgg.count+' ครั้ง</b></td>'+
    '<td class="r mono"><b>'+hm(curAgg.min)+'</b></td>'+
    '<td class="r mono"><b>'+n(curAgg.kwh,2)+' kWh</b></td>'+
    '<td class="r mono" style="color:var(--grn)"><b>฿'+n(curAgg.net,2)+'</b></td>'+
    '<td class="r mono"><b>฿'+n(curAgg.grid,2)+'</b></td>'+
    '<td class="r mono"><b>฿'+n(curAgg.avgRatePerKwh,2)+'</b></td>'+
  '</tr>';

  return '<div class="c tbl-card">'+
    '<header><b>'+title+'</b><span>รวม '+curAgg.count+' ครั้ง</span></header>'+
    '<div class="tbl-wrap"><table class="tbl">'+
      '<thead><tr>'+
        '<th>ช่วงเวลา</th>'+
        '<th class="r">จำนวนครั้ง</th>'+
        '<th class="r">เวลาชาร์จ</th>'+
        '<th class="r">พลังงาน (kWh)</th>'+
        '<th class="r">ค่าชาร์จสุทธิ (฿)</th>'+
        '<th class="r">ค่าไฟมิเตอร์ (฿)</th>'+
        '<th class="r">เฉลี่ย ฿/kWh</th>'+
      '</tr></thead>'+
      '<tbody>'+rowsHtml+'</tbody>'+
      '<tfoot>'+footHtml+'</tfoot>'+
    '</table></div></div>';
}

function chargingSessionsList(curAgg){
  if(!curAgg.chgs.length) return '';
  const filterTag = chgTypeFilter==='home' ? ' (เฉพาะชาร์จบ้าน)' : chgTypeFilter==='dc' ? ' (เฉพาะสถานี DC)' : '';
  return '<div class="c list"><header><b>ประวัติรายการชาร์จไฟในช่วงนี้'+filterTag+'</b><span>'+curAgg.chgs.length+' รายการ</span></header>'+
  curAgg.chgs.map(r=>{
    const isDc = isDcCharge(r);
    const badge = isDc
      ? '<span class="badge-tag badge-dc">⚡ DC Fast Charge</span>'
      : '<span class="badge-tag badge-home">🏠 Home AC</span>';
    const timeTxt = r.time + (r.min > 0 ? ' ('+hm(r.min)+')' : '');

    return '<div class="li">'+
      '<span class="ic '+(isDc?'dc':'chg')+'">⚡</span>'+
      '<span>'+
        '<span class="t1">'+badge+esc(r.note || (isDc ? 'สถานีชาร์จสาธารณะ' : 'ชาร์จที่บ้าน'))+'</span><br>'+
        '<span class="t2">'+fmtShort(r.iso)+' '+esc(timeTxt)+' · แบตเตอรี่ '+r.s0+'% → '+r.s1+'% (+'+(r.s1-r.s0)+'%)</span>'+
      '</span>'+
      '<span class="kw">+'+n(r.kwh,2)+' kWh</span>'+
      '<span class="th" style="color:var(--grn)">฿'+n(r.net,2)+
        (r.grid>r.net?'<br><small style="font-size:11px;color:var(--mut3);font-weight:normal">มิเตอร์ ฿'+n(r.grid,2)+'</small>':'')+
      '</span>'+
    '</div>';
  }).join('')+'</div>';
}

function renderChargingHtml(){
  const r = range(chgAnchor, chgMode);
  const rawRowsInPeriod = chgMode==='all' ? CHARGE_ROWS : inRange(r.from, r.to);

  // Compute total counts for filter pill badges
  const allPeriodAgg = aggCharging(rawRowsInPeriod, 'all');
  const totalCount = allPeriodAgg.count;
  const homeCount = allPeriodAgg.homeCount;
  const dcCount = allPeriodAgg.dcCount;

  // Compute curAgg based on current chgTypeFilter
  const curAgg = aggCharging(rawRowsInPeriod, chgTypeFilter);

  const buckets = bucketsOf(chgMode, true);
  const cur = keyOf(chgAnchor, chgMode);
  const prevA = shiftAnchor(chgAnchor, chgMode, -1);
  const nextA = shiftAnchor(chgAnchor, chgMode, 1);
  const unitTxt = {week:'สัปดาห์นี้',month:'เดือนนี้',year:'ปีนี้',all:'ทั้งหมด'}[chgMode];

  // Filter Pill Controls
  const filterPillsHtml = '<div class="chg-type-bar">'+
    '<span class="chg-type-lbl">ประเภทการชาร์จ:</span>'+
    '<div class="chg-type-pills" role="group" aria-label="กรองประเภทการชาร์จ">'+
      '<button type="button" class="chg-pill" data-chgtype="all" aria-pressed="'+(chgTypeFilter==='all')+'">'+
        '⚡ ทั้งหมด <span class="chg-count">'+totalCount+'</span>'+
      '</button>'+
      '<button type="button" class="chg-pill home" data-chgtype="home" aria-pressed="'+(chgTypeFilter==='home')+'">'+
        '🏠 ชาร์จบ้าน AC <span class="chg-count">'+homeCount+'</span>'+
      '</button>'+
      '<button type="button" class="chg-pill dc" data-chgtype="dc" aria-pressed="'+(chgTypeFilter==='dc')+'">'+
        '⚡ ชาร์จสถานี DC <span class="chg-count">'+dcCount+'</span>'+
      '</button>'+
    '</div>'+
  '</div>';

  const head = '<div class="head"><div class="head-inner">'+
    '<div class="headtop">'+
      '<div><h2>⚡ รายงานค่าใช้จ่ายการชาร์จไฟ EV</h2><p>สรุปค่าใช้จ่ายและพลังงานที่ชาร์จเข้าแบตเตอรี่อย่างละเอียด</p></div>'+
      (chgMode!=='all' ? '<div class="picker"><label for="chg_dp">ไปที่วันที่</label><input type="date" id="chg_dp" value="'+chgAnchor+'" min="'+PICK_MIN+'" max="'+PICK_MAX+'"></div>' : '')+
    '</div>'+
    '<div class="modes chg-modes" role="group" aria-label="เลือกโหมดรายงาน">'+
      CHG_MODES.map(m=>'<button type="button" data-chgmode="'+m.k+'" aria-pressed="'+(m.k===chgMode)+'">'+m.t+'</button>').join('')+
    '</div>'+
    filterPillsHtml+
    (chgMode!=='all' ? (
      '<div class="daybar">'+
        '<button type="button" class="nav" data-chgstep="-1" aria-label="ช่วงก่อนหน้า"'+(prevA<PICK_MIN?' disabled':'')+'>‹</button>'+
        '<div class="days">'+buckets.map(a=>{
          const c = chipOf(a, chgMode);
          const x = aggCharging(inRange(range(a, chgMode).from, range(a, chgMode).to));
          return '<button type="button" class="day chg-chip" data-chggo="'+a+'" aria-pressed="'+(a===cur)+'">'+
            '<span class="dw">'+c.top+'</span><br><span class="dd">'+c.mid+'</span><br><span class="dv">⚡฿'+n(x.net,0)+'</span></button>';
        }).join('')+'</div>'+
        '<button type="button" class="nav" data-chgstep="1" aria-label="ช่วงถัดไป"'+(nextA>PICK_MAX?' disabled':'')+'>›</button>'+
      '</div>'
    ) : '')+
  '</div></div>';

  if(!curAgg.count){
    const filterDesc = chgTypeFilter==='home'?'ที่บ้าน (Home AC)':chgTypeFilter==='dc'?'ที่สถานี (Public DC)':'';
    return topBarHtml()+head+'<div class="body">'+
      '<div class="daytitle"><h3>'+(chgMode==='all'?'ประวัติการชาร์จไฟทั้งหมด':titleOf(chgAnchor, chgMode))+'</h3><span class="sub">'+(chgMode==='all'?'ทุกรายการที่บันทึกไว้':r.from+' – '+r.to)+'</span></div>'+
      '<div class="bento">'+
        '<div class="empty">'+
          '<span class="em">⚡</span>'+
          '<b>ไม่มีรายการชาร์จไฟ'+filterDesc+'ใน'+unitTxt+'</b>'+
          '<p>ไม่พบรายการชาร์จตามตัวกรองนี้ในช่วงเวลาดังกล่าว คุณสามารถเลือกตัวกรองอื่นหรือเปลี่ยนช่วงเวลาได้ครับ</p>'+
          (chgTypeFilter!=='all' ? '<button type="button" data-chgtype="all">แสดงการชาร์จทุกประเภท ('+totalCount+' ครั้ง)</button>' : '<button type="button" data-chggo="'+keyOf(LAST_CHARGE_ISO, chgMode)+'">ไปที่ช่วงล่าสุดที่มีการชาร์จไฟ</button>')+
        '</div>'+
        chargingBreakdownTable(curAgg)+
      '</div>'+
    '</div>'+srcBarHtml();
  }

  // Bento Cards for Charging
  let heroCap = 'ค่าชาร์จไฟใน'+unitTxt+' · รวม Loss';
  let heroNote = 'ค่าชาร์จสุทธิคำนวณจากความจุแบตเตอรี่ที่เพิ่มขึ้นจริง ส่วนค่ามิเตอร์รวม Loss จากการแปลงไฟ (AC ~10%, DC ตามอัตราสถานี)';
  if(chgTypeFilter === 'home'){
    heroCap = 'ค่าชาร์จไฟบ้าน (Home AC) ใน'+unitTxt+' · รวม Loss แปลงไฟ ~10%';
    heroNote = 'คำนวณจากหน่วยไฟเข้าแบตเตอรี่จริง เทียบกับมิเตอร์ไฟฟ้าบ้าน (TOU/กฟภ./กฟน.)';
  } else if(chgTypeFilter === 'dc'){
    heroCap = 'ค่าชาร์จสถานีสาธารณะ (Public DC) ใน'+unitTxt;
    heroNote = 'บันทึกตามใบเสร็จจริงจากตู้ชาร์จสถานี (PEA Volta, PTT EV Station, EleX ฯลฯ)';
  }

  const heroCard = '<div class="c hero">'+
    '<div class="cap">'+heroCap+'</div>'+
    '<div class="hsplit">'+
      '<div class="hitem">'+
        '<span class="hl">⚡ ค่าชาร์จสุทธิ (Net)</span>'+
        '<span class="hv"><small>฿</small>'+n(curAgg.net,2)+'</span>'+
        '<span class="hs">พลังงานเข้าแบตเตอรี่จริง '+n(curAgg.kwh,2)+' kWh</span>'+
      '</div>'+
      '<div class="hitem">'+
        '<span class="hl">🔌 ค่าไฟหน้ามิเตอร์ (Grid)</span>'+
        '<span class="hv"><small>฿</small>'+n(curAgg.grid,2)+'</span>'+
        '<span class="hs">ส่วนต่าง Loss ~'+n(curAgg.lossPct,1)+'% (฿'+n(curAgg.lossThb,2)+')</span>'+
      '</div>'+
    '</div>'+
    '<div class="note">'+heroNote+'</div>'+
  '</div>';

  const kwhCard = '<div class="c stat">'+
    '<div class="cap">พลังงานชาร์จเข้า</div>'+
    '<div class="v">'+n(curAgg.kwh,2)+'<i>kWh</i></div>'+
    '<div class="foot">ชาร์จ '+(chgTypeFilter==='home'?'บ้าน ':chgTypeFilter==='dc'?'สถานี ':'')+'ทั้งหมด '+curAgg.count+' ครั้ง · เฉลี่ย '+n(curAgg.avgKwhSession,2)+' kWh/ครั้ง</div>'+
  '</div>';

  const costAvgCard = '<div class="c stat">'+
    '<div class="cap">ค่าใช้จ่ายเฉลี่ย</div>'+
    '<div class="v">฿'+n(curAgg.avgCostSession,2)+'<i>/ครั้ง</i></div>'+
    '<div class="foot">อัตราเฉลี่ย ฿'+n(curAgg.avgRatePerKwh,2)+' ต่อ kWh ที่ชาร์จเข้า</div>'+
  '</div>';

  const timeCard = '<div class="c stat">'+
    '<div class="cap">เวลารวมที่ใช้ชาร์จ</div>'+
    '<div class="v">'+(curAgg.min>0?hm(curAgg.min):'—')+'</div>'+
    '<div class="foot">'+(curAgg.avgDuration>0?'เฉลี่ย '+hm(curAgg.avgDuration)+' ต่อครั้ง':'บันทึกเฉพาะหน่วยไฟ')+'</div>'+
  '</div>';

  const typeCard = '<div class="c stat">'+
    '<div class="cap">สัดส่วนประเภทการชาร์จ</div>'+
    '<div class="v">'+allPeriodAgg.homeCount+'<i>AC</i> · '+allPeriodAgg.dcCount+'<i>DC</i></div>'+
    '<div class="foot">ชาร์จบ้าน ฿'+n(allPeriodAgg.homeNet,2)+' · สถานี DC ฿'+n(allPeriodAgg.dcNet,2)+'</div>'+
  '</div>';

  const battCard = '<div class="c batt">'+
    '<div class="cap">พฤติกรรมการชาร์จแบตเตอรี่ (เฉลี่ย)</div>'+
    '<div class="battrow">'+
      '<div class="cell3">'+
        '<div class="lv" style="width:'+curAgg.avgS1+'%"></div>'+
        '<div class="txt">'+curAgg.avgS1+'% (เต็มรอบ)</div>'+
      '</div>'+
      '<span class="arrow">← เริ่มชาร์จเฉลี่ยที่ '+curAgg.avgS0+'%</span>'+
    '</div>'+
    '<div class="foot">เพิ่มขึ้นเฉลี่ย +'+(curAgg.avgS1-curAgg.avgS0)+'% ต่อครั้ง ('+n(curAgg.avgKwhSession,2)+' kWh)</div>'+
  '</div>';

  return topBarHtml()+head+'<div class="body">'+
    '<div class="daytitle"><h3>'+(chgMode==='all'?'ประวัติการชาร์จไฟทั้งหมด':titleOf(chgAnchor, chgMode))+'</h3>'+
      '<span class="sub">'+(chgMode==='all'?'ทุกรายการที่บันทึกไว้':r.from+' – '+r.to)+'</span>'+
    '</div>'+
    '<div class="bento">'+
      heroCard+kwhCard+costAvgCard+timeCard+typeCard+battCard+
      chargingStripCard()+
      chargingBreakdownTable(curAgg)+
      chargingSessionsList(curAgg)+
    '</div>'+
  '</div>'+srcBarHtml();
}

/* ==========================================================
   VIEW 3: MANAGE CRUD VIEW (Record, Edit, Delete)
   ========================================================== */
function renderManageHtml(){
  const todayIso = toIso(new Date());
  const nowTime = pad(new Date().getHours()) + ':' + pad(new Date().getMinutes());

  // Filter rows
  let filtered = ROWS.slice().reverse();
  if(mgmtFilter === 'trip') filtered = filtered.filter(r=>r.kind==='trip');
  else if(mgmtFilter === 'charge') filtered = filtered.filter(r=>r.kind==='charge');

  if(mgmtSearch.trim()){
    const q = mgmtSearch.trim().toLowerCase();
    filtered = filtered.filter(r =>
      (r.iso && r.iso.includes(q)) ||
      (r.time && r.time.includes(q)) ||
      (r.note && r.note.toLowerCase().includes(q)) ||
      (r.km && String(r.km).includes(q)) ||
      (r.kwh && String(r.kwh).includes(q)) ||
      (r.net && String(r.net).includes(q))
    );
  }

  // Row counts for filter pills
  const allCount = ROWS.length;
  const tripCount = ROWS.filter(r=>r.kind==='trip').length;
  const chargeCount = ROWS.filter(r=>r.kind==='charge').length;

  const tableRowsHtml = filtered.length ? filtered.map(r => {
    const isTrip = r.kind === 'trip';
    const kindBadge = isTrip
      ? '<span class="badge-tag" style="background:#EEF2FF;color:#4F46E5;">🚗 เดินทาง</span>'
      : (r.grid > r.net * 1.15 || (r.note && (r.note.includes('DC')||r.note.includes('สถานี'))))
      ? '<span class="badge-tag badge-dc">⚡ สถานี (DC)</span>'
      : '<span class="badge-tag badge-home">⚡ บ้าน (AC)</span>';

    const mainMetric = isTrip
      ? (n(r.km,1)+' กม. · '+n(r.cons,1)+' Wh/km')
      : (n(r.kwh,2)+' kWh ('+r.s0+'% → '+r.s1+'%)');

    const perKm = (isTrip && r.km > 0) ? (r.net / r.km) : 0;
    const costText = isTrip
      ? ('฿'+n(r.net,2)+' <span style="font-size:11px;color:var(--mut3);">(฿'+n(perKm,2)+'/กม.)</span>')
      : ('฿'+n(r.net,2)+' <span style="font-size:11px;color:var(--mut3);">(มิเตอร์ ฿'+n(r.grid,2)+')</span>');

    return '<tr data-rowid="'+r.sheetRowIndex+'">'+
      '<td class="mono" style="font-weight:600;">'+r.iso+' <span style="font-weight:400;color:var(--mut3);font-size:12px;">'+(r.time||'')+'</span></td>'+
      '<td>'+kindBadge+'</td>'+
      '<td class="mono">'+mainMetric+'</td>'+
      '<td class="mono r">'+costText+'</td>'+
      '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;" title="'+esc(r.note||'')+'">'+esc(r.note||'—')+'</td>'+
      '<td class="r">'+
        '<button type="button" class="act-btn act-edit" data-editrow="'+r.sheetRowIndex+'" title="แก้ไขรายการนี้">✏️ แก้ไข</button> '+
        '<button type="button" class="act-btn act-del" data-delrow="'+r.sheetRowIndex+'" title="ลบรายการนี้">🗑️ ลบ</button>'+
      '</td>'+
    '</tr>';
  }).join('') : '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--mut3);">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</td></tr>';

  // Record Form HTML
  const isTrip = mgmtKind === 'trip';
  const formHtml = '<div class="form-card">'+
    '<h3>บันทึกข้อมูลการใช้งานรถ EV</h3>'+
    '<p>เลือกประเภทและกรอกข้อมูล ระบบจะคำนวณระยะทาง พลังงาน และค่าใช้จ่ายสุทธิ/หน้ามิเตอร์ให้อัตโนมัติ</p>'+
    '<div class="kind-toggle">'+
      '<button type="button" class="kind-btn trip" data-mgmtkind="trip" aria-selected="'+isTrip+'">🚗 บันทึกการเดินทาง (Trip)</button>'+
      '<button type="button" class="kind-btn chg" data-mgmtkind="charge" aria-selected="'+!isTrip+'">⚡ บันทึกการชาร์จ (Charge)</button>'+
    '</div>'+
    '<form id="newRecordForm" onsubmit="return false;">'+
      '<div class="form-row">'+
        '<div class="fg">'+
          '<label>วันที่ (Date) <span>*</span></label>'+
          '<input type="date" name="date" required value="'+todayIso+'">'+
        '</div>'+
        '<div class="fg">'+
          '<label>เวลา (Time)</label>'+
          '<input type="time" name="time" value="'+nowTime+'">'+
        '</div>'+
        (!isTrip ? 
        '<div class="fg">'+
          '<label>ประเภทการชาร์จ</label>'+
          '<select name="chargeType" id="mgmtChargeTypeSelect">'+
            '<option value="home" '+(mgmtChargeType==='home'?'selected':'')+'>🏠 ชาร์จไฟบ้าน (Home AC ~10% loss)</option>'+
            '<option value="dc" '+(mgmtChargeType==='dc'?'selected':'')+'>⚡ ชาร์จตู้สถานี (Public DC)</option>'+
          '</select>'+
        '</div>' : '')+
      '</div>'+
      (isTrip ? 
      '<div class="form-row">'+
        '<div class="fg">'+
          '<label>ไมล์เริ่มต้น (กม.)</label>'+
          '<input type="number" step="0.1" name="odoStart" id="formOdoStart" placeholder="เช่น 12450">'+
        '</div>'+
        '<div class="fg">'+
          '<label>ไมล์สิ้นสุด (กม.)</label>'+
          '<input type="number" step="0.1" name="odoEnd" id="formOdoEnd" placeholder="เช่น 12510">'+
        '</div>'+
        '<div class="fg">'+
          '<label>ระยะทาง (Distance km) <span class="calc-badge" id="calcKmBadge">คำนวณให้อัตโนมัติ</span></label>'+
          '<input type="number" step="0.1" name="distanceKm" id="formDistanceKm" placeholder="0.0">'+
        '</div>'+
      '</div>'+
      '<div class="form-row">'+
        '<div class="fg">'+
          '<label>ระยะเวลาเดินทาง (นาที)</label>'+
          '<input type="number" step="1" name="durationMin" id="formDurationMin" placeholder="เช่น 45">'+
        '</div>'+
        '<div class="fg">'+
          '<label>อัตราสิ้นเปลือง (Wh/km)</label>'+
          '<input type="number" step="0.1" name="avgConsumption" id="formAvgCons" placeholder="เช่น 138">'+
        '</div>'+
        '<div class="fg">'+
          '<label>พลังงานที่ใช้ (kWh) <span class="calc-badge" id="calcKwhBadge">คำนวณให้อัตโนมัติ</span></label>'+
          '<input type="number" step="0.01" name="energyKwh" id="formEnergyKwh" placeholder="0.00">'+
        '</div>'+
      '</div>'+
      '<div class="form-row">'+
        '<div class="fg">'+
          '<label>SoC เริ่มต้น (%)</label>'+
          '<input type="number" step="1" min="0" max="100" name="socStart" id="formSocStart" placeholder="เช่น 80">'+
        '</div>'+
        '<div class="fg">'+
          '<label>SoC สิ้นสุด (%)</label>'+
          '<input type="number" step="1" min="0" max="100" name="socEnd" id="formSocEnd" placeholder="เช่น 65">'+
        '</div>'+
        '<div class="fg">'+
          '<label>ค่าใช้จ่ายสุทธิ (บาท) <span class="calc-badge">คำนวณให้อัตโนมัติ</span></label>'+
          '<input type="number" step="0.01" name="costNetThb" id="formCostNet" placeholder="0.00">'+
        '</div>'+
      '</div>'
      : 
      '<div class="form-row">'+
        '<div class="fg">'+
          '<label>SoC เริ่มชาร์จ (%) <span>*</span></label>'+
          '<input type="number" step="1" min="0" max="100" name="socStart" id="formSocStart" required placeholder="เช่น 20">'+
        '</div>'+
        '<div class="fg">'+
          '<label>SoC เมื่อชาร์จเสร็จ (%) <span>*</span></label>'+
          '<input type="number" step="1" min="0" max="100" name="socEnd" id="formSocEnd" required placeholder="เช่น 85">'+
        '</div>'+
        '<div class="fg">'+
          '<label>พลังงานชาร์จเข้า (kWh) <span class="calc-badge" id="calcKwhBadge">คำนวณให้อัตโนมัติ</span></label>'+
          '<input type="number" step="0.01" name="energyKwh" id="formEnergyKwh" placeholder="0.00">'+
        '</div>'+
      '</div>'+
      '<div class="form-row">'+
        '<div class="fg">'+
          '<label>เวลาที่ใช้ชาร์จ (นาที)</label>'+
          '<input type="number" step="1" name="durationMin" id="formDurationMin" placeholder="เช่น 60">'+
        '</div>'+
        '<div class="fg">'+
          '<label>ค่าชาร์จสุทธิ (Net THB) <span class="calc-badge" id="calcCostBadge">คำนวณให้อัตโนมัติ</span></label>'+
          '<input type="number" step="0.01" name="costNetThb" id="formCostNet" placeholder="0.00">'+
        '</div>'+
        '<div class="fg">'+
          '<label>ค่าไฟหน้ามิเตอร์ (Grid THB) <span class="calc-badge" id="calcGridBadge">รวม Loss</span></label>'+
          '<input type="number" step="0.01" name="costGridThb" id="formCostGrid" placeholder="0.00">'+
        '</div>'+
      '</div>'
      )+
      '<div class="form-row">'+
        '<div class="fg fg-full">'+
          '<label>หมายเหตุ (Note)</label>'+
          '<input type="text" name="note" id="formNote" placeholder="เช่น ชาร์จบ้านรอบดึก TOU หรือ สถานี PTT อยุธยา">'+
        '</div>'+
      '</div>'+
      '<div class="btn-row">'+
        '<button type="submit" class="btn-primary" id="btnSubmitNew">'+
          '<span>💾</span> บันทึกลง Google Sheet'+
        '</button>'+
        '<button type="reset" class="btn-sec" id="btnResetForm">ล้างฟอร์ม</button>'+
      '</div>'+
    '</form>'+
  '</div>';

  // Table Card HTML
  const tableHtml = '<div class="c tbl-card">'+
    '<header>'+
      '<div>'+
        '<b>รายการข้อมูลทั้งหมด ('+filtered.length+' รายการ)</b>'+
        '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">'+
          '<button type="button" class="chg-pill" data-mgmtfilter="all" aria-pressed="'+(mgmtFilter==='all')+'">ทั้งหมด <span class="chg-count">'+allCount+'</span></button>'+
          '<button type="button" class="chg-pill" data-mgmtfilter="trip" aria-pressed="'+(mgmtFilter==='trip')+'">🚗 เดินทาง <span class="chg-count">'+tripCount+'</span></button>'+
          '<button type="button" class="chg-pill" data-mgmtfilter="charge" aria-pressed="'+(mgmtFilter==='charge')+'">⚡ ชาร์จไฟ <span class="chg-count">'+chargeCount+'</span></button>'+
        '</div>'+
      '</div>'+
      '<span>แถวสเปรดชีต A:M</span>'+
    '</header>'+
    '<div class="table-tools">'+
      '<div class="search-box">'+
        '<span class="search-ic">🔍</span>'+
        '<input type="text" id="mgmtSearchInput" placeholder="ค้นหาตามวันที่, หมายเหตุ, ระยะทาง, ค่าใช้จ่าย..." value="'+esc(mgmtSearch)+'">'+
      '</div>'+
      '<div style="font-size:12.5px;color:var(--mut3);font-family:JetBrains Mono,monospace;">'+
        'แสดง '+filtered.length+' จากทั้งหมด '+allCount+' รายการ'+
      '</div>'+
    '</div>'+
    '<div class="tbl-wrap">'+
      '<table class="tbl">'+
        '<thead>'+
          '<tr>'+
            '<th>วันที่และเวลา</th>'+
            '<th>ประเภท</th>'+
            '<th>รายละเอียด (ระยะทาง / พลังงาน)</th>'+
            '<th class="r">ค่าใช้จ่ายสุทธิ</th>'+
            '<th>หมายเหตุ</th>'+
            '<th class="r" style="min-width:130px;">การจัดการ</th>'+
          '</tr>'+
        '</thead>'+
        '<tbody>'+tableRowsHtml+'</tbody>'+
      '</table>'+
    '</div>'+
  '</div>';

  // Modals & Toast Wrappers
  const editModalHtml = renderEditModalHtml();
  const deleteModalHtml = renderDeleteModalHtml();
  const toastHtml = '<div id="toastWrap" class="toast-wrap"></div>';

  return topBarHtml()+
    '<div class="body">'+
      '<div class="daytitle">'+
        '<h3>จัดการข้อมูลการใช้งานและค่าชาร์จ</h3>'+
        '<span class="sub">บันทึกใหม่, แก้ไข หรือลบแถวข้อมูลใน Google Sheets ได้แบบเรียลไทม์</span>'+
      '</div>'+
      '<div class="manage-grid">'+
        formHtml+
        tableHtml+
      '</div>'+
    '</div>'+
    editModalHtml+
    deleteModalHtml+
    toastHtml+
    srcBarHtml();
}

function renderEditModalHtml(){
  if(!editTargetRow) return '<div id="editModalOverlay" style="display:none;"></div>';
  const r = editTargetRow;
  const isTrip = r.kind === 'trip';

  return '<div id="editModalOverlay" class="modal-overlay">'+
    '<div class="modal-box">'+
      '<div class="modal-head">'+
        '<h4>✏️ แก้ไขข้อมูล (แถวสเปรดชีตที่ '+r.sheetRowIndex+')</h4>'+
        '<button type="button" class="modal-close" id="btnEditModalClose">&times;</button>'+
      '</div>'+
      '<form id="editRecordForm" onsubmit="return false;">'+
        '<div class="modal-body">'+
          '<input type="hidden" name="sheetRowIndex" value="'+r.sheetRowIndex+'">'+
          '<div class="form-row">'+
            '<div class="fg">'+
              '<label>วันที่ (Date) <span>*</span></label>'+
              '<input type="date" name="date" required value="'+(r.iso||'')+'">'+
            '</div>'+
            '<div class="fg">'+
              '<label>เวลา (Time)</label>'+
              '<input type="time" name="time" value="'+(r.time||'')+'">'+
            '</div>'+
          '</div>'+
          (isTrip ? 
          '<div class="form-row">'+
            '<div class="fg">'+
              '<label>ไมล์เริ่มต้น (กม.)</label>'+
              '<input type="number" step="0.1" name="odoStart" id="editOdoStart" value="'+(r.odoStart||'')+'">'+
            '</div>'+
            '<div class="fg">'+
              '<label>ไมล์สิ้นสุด (กม.)</label>'+
              '<input type="number" step="0.1" name="odoEnd" id="editOdoEnd" value="'+(r.odoEnd||'')+'">'+
            '</div>'+
            '<div class="fg">'+
              '<label>ระยะทาง (กม.)</label>'+
              '<input type="number" step="0.1" name="distanceKm" id="editDistanceKm" value="'+(r.km||0)+'">'+
            '</div>'+
          '</div>'+
          '<div class="form-row">'+
            '<div class="fg">'+
              '<label>เวลาเดินทาง (นาที)</label>'+
              '<input type="number" step="1" name="durationMin" value="'+(r.min||0)+'">'+
            '</div>'+
            '<div class="fg">'+
              '<label>อัตราสิ้นเปลือง (Wh/km)</label>'+
              '<input type="number" step="0.1" name="avgConsumption" id="editAvgCons" value="'+(r.cons||0)+'">'+
            '</div>'+
            '<div class="fg">'+
              '<label>พลังงาน (kWh)</label>'+
              '<input type="number" step="0.01" name="energyKwh" id="editEnergyKwh" value="'+(r.kwh||0)+'">'+
            '</div>'+
          '</div>'
          : 
          '<div class="form-row">'+
            '<div class="fg">'+
              '<label>SoC เริ่มต้น (%)</label>'+
              '<input type="number" step="1" min="0" max="100" name="socStart" id="editSocStart" value="'+(r.s0||0)+'">'+
            '</div>'+
            '<div class="fg">'+
              '<label>SoC สิ้นสุด (%)</label>'+
              '<input type="number" step="1" min="0" max="100" name="socEnd" id="editSocEnd" value="'+(r.s1||0)+'">'+
            '</div>'+
            '<div class="fg">'+
              '<label>พลังงานชาร์จเข้า (kWh)</label>'+
              '<input type="number" step="0.01" name="energyKwh" id="editEnergyKwh" value="'+(r.kwh||0)+'">'+
            '</div>'+
          '</div>'+
          '<div class="form-row">'+
            '<div class="fg">'+
              '<label>เวลาที่ใช้ชาร์จ (นาที)</label>'+
              '<input type="number" step="1" name="durationMin" value="'+(r.min||0)+'">'+
            '</div>'+
            '<div class="fg">'+
              '<label>ค่าชาร์จสุทธิ (Net THB)</label>'+
              '<input type="number" step="0.01" name="costNetThb" id="editCostNet" value="'+(r.net||0)+'">'+
            '</div>'+
            '<div class="fg">'+
              '<label>ค่าไฟมิเตอร์ (Grid THB)</label>'+
              '<input type="number" step="0.01" name="costGridThb" id="editCostGrid" value="'+(r.grid||0)+'">'+
            '</div>'+
          '</div>'
          )+
          (isTrip ? 
          '<div class="form-row">'+
            '<div class="fg">'+
              '<label>SoC เริ่มต้น (%)</label>'+
              '<input type="number" step="1" min="0" max="100" name="socStart" value="'+(r.s0||0)+'">'+
            '</div>'+
            '<div class="fg">'+
              '<label>SoC สิ้นสุด (%)</label>'+
              '<input type="number" step="1" min="0" max="100" name="socEnd" value="'+(r.s1||0)+'">'+
            '</div>'+
            '<div class="fg">'+
              '<label>ค่าใช้จ่ายสุทธิ (Net THB)</label>'+
              '<input type="number" step="0.01" name="costNetThb" value="'+(r.net||0)+'">'+
            '</div>'+
          '</div>' : '')+
          '<div class="form-row">'+
            '<div class="fg fg-full">'+
              '<label>หมายเหตุ (Note)</label>'+
              '<input type="text" name="note" value="'+esc(r.note||'')+'">'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="modal-foot">'+
          '<button type="button" class="btn-sec" id="btnEditCancel">ยกเลิก</button>'+
          '<button type="submit" class="btn-primary" id="btnEditSubmit">บันทึกการแก้ไข</button>'+
        '</div>'+
      '</form>'+
    '</div>'+
  '</div>';
}

function renderDeleteModalHtml(){
  if(!deleteTargetRow) return '<div id="deleteModalOverlay" style="display:none;"></div>';
  const r = deleteTargetRow;
  const isTrip = r.kind === 'trip';

  return '<div id="deleteModalOverlay" class="modal-overlay">'+
    '<div class="modal-box danger-box">'+
      '<div class="modal-head" style="border-bottom-color:#FECACA;background:#FEF2F2;">'+
        '<h4 style="color:#DC2626;">⚠️ ยืนยันการลบข้อมูล</h4>'+
        '<button type="button" class="modal-close" id="btnDeleteModalClose">&times;</button>'+
      '</div>'+
      '<div class="modal-body">'+
        '<p style="margin:0;font-size:14px;line-height:1.6;color:var(--ink3);">'+
          'คุณแน่ใจหรือไม่ว่าต้องการลบแถวข้อมูลสเปรดชีตที่ <b>'+r.sheetRowIndex+'</b>?'+
        '</p>'+
        '<div style="background:var(--bg3);border:1px solid var(--line3);border-radius:10px;padding:12px 14px;font-size:13px;font-family:JetBrains Mono,monospace;">'+
          '<div><b>วันที่:</b> '+r.iso+' '+(r.time||'')+'</div>'+
          '<div><b>ประเภท:</b> '+(isTrip?'🚗 เดินทาง':'⚡ ชาร์จไฟ')+'</div>'+
          '<div><b>รายละเอียด:</b> '+(isTrip?r.km+' กม.':r.kwh+' kWh')+' · ฿'+n(r.net,2)+'</div>'+
          (r.note?'<div style="color:var(--mut3);"><b>Note:</b> '+esc(r.note)+'</div>':'')+
        '</div>'+
        '<p style="margin:0;font-size:12.5px;color:#DC2626;">'+
          '* การลบนี้จะลบแถวออกจาก Google Sheets โดยตรงและไม่สามารถกู้คืนได้'+
        '</p>'+
      '</div>'+
      '<div class="modal-foot">'+
        '<button type="button" class="btn-sec" id="btnDeleteCancel">ยกเลิก</button>'+
        '<button type="button" class="btn-danger" id="btnDeleteConfirm">ยืนยันลบข้อมูล</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}

function showToast(msg, type='success'){
  const wrap = document.getElementById('toastWrap');
  if(!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast-msg ' + type;
  const icon = type==='success'?'✅':type==='error'?'❌':'ℹ️';
  el.innerHTML = '<span>'+icon+'</span><span>'+esc(msg)+'</span>';
  wrap.appendChild(el);
  setTimeout(()=>{
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    el.style.transition = 'all .3s ease';
    setTimeout(()=>el.remove(), 300);
  }, 4000);
}

/* ==========================================================
   REFETCH & RE-RENDER SYSTEM
   ========================================================== */
let isSubmitting = false;

async function refreshDataAndRender(){
  try {
    const res = await fetch('/api/data');
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if(json.ok && json.data){
      ROWS = json.data.rows;
      META = json.data.meta;
      CHARGE_ROWS = ROWS.filter(r=>r.kind==='charge');
      LAST_ISO = ROWS.length ? ROWS[ROWS.length-1].iso : toIso(new Date());
      LAST_CHARGE_ISO = CHARGE_ROWS.length ? CHARGE_ROWS[CHARGE_ROWS.length-1].iso : LAST_ISO;
      TOTAL = agg(ROWS);
      PICK_MIN = (parseInt(ROWS[0].iso.slice(0,4),10)-2)+'-01-01';
      PICK_MAX = (parseInt(ROWS[ROWS.length-1].iso.slice(0,4),10)+2)+'-12-31';
      render();
    }
  } catch(err){
    console.error('refreshData error:', err);
    showToast('ดึงข้อมูลล่าสุดไม่สำเร็จ: ' + err.message, 'error');
  }
}

/* ==========================================================
   RENDER & EVENT BINDINGS
   ========================================================== */
function render(){
  if(currentTab === 'charging'){
    app.innerHTML = renderChargingHtml();
  } else if(currentTab === 'manage'){
    app.innerHTML = renderManageHtml();
  } else {
    app.innerHTML = renderOverviewHtml();
  }
  bindEvents();
}

function updateUrlTab(tab){
  const u = new URL(window.location.href);
  u.searchParams.set('tab', tab);
  window.history.replaceState({}, '', u.toString());
}

function bindEvents(){
  // Top Tab Switcher
  app.querySelectorAll('[data-tab]').forEach(b=>{
    b.onclick = ()=>{
      currentTab = b.dataset.tab;
      updateUrlTab(currentTab);
      render();
    };
  });

  // Overview Bindings
  app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{ovMode=b.dataset.mode;render();});
  app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{ovAnchor=b.dataset.go;render();});
  app.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{const p=b.dataset.jump.split(':');ovMode=p[0];ovAnchor=p[1];render();});
  app.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{
    const t=shiftAnchor(ovAnchor,ovMode,+b.dataset.step);
    if(t<PICK_MIN||t>PICK_MAX) return;
    ovAnchor=t; render();
  });
  const dp=app.querySelector('#dp');
  if(dp) dp.onchange=()=>{ if(dp.value){ovAnchor=dp.value;render();} };

  // Charging Report Bindings
  app.querySelectorAll('[data-chgmode]').forEach(b=>b.onclick=()=>{chgMode=b.dataset.chgmode;render();});
  app.querySelectorAll('[data-chgtype]').forEach(b=>b.onclick=()=>{chgTypeFilter=b.dataset.chgtype;render();});
  app.querySelectorAll('[data-chggo]').forEach(b=>b.onclick=()=>{chgAnchor=b.dataset.chggo;render();});
  app.querySelectorAll('[data-chgjump]').forEach(b=>b.onclick=()=>{const p=b.dataset.chgjump.split(':');chgMode=p[0];chgAnchor=p[1];render();});
  app.querySelectorAll('[data-chgstep]').forEach(b=>b.onclick=()=>{
    const t=shiftAnchor(chgAnchor,chgMode,+b.dataset.chgstep);
    if(t<PICK_MIN||t>PICK_MAX) return;
    chgAnchor=t; render();
  });
  const chgDp=app.querySelector('#chg_dp');
  if(chgDp) chgDp.onchange=()=>{ if(chgDp.value){chgAnchor=chgDp.value;render();} };

  // ========================================================
  // Management View (CRUD) Bindings
  // ========================================================
  if(currentTab === 'manage'){
    // Toggle Record Kind
    app.querySelectorAll('[data-mgmtkind]').forEach(b=>{
      b.onclick = ()=>{
        mgmtKind = b.dataset.mgmtkind;
        render();
      };
    });

    // Toggle Filter Table
    app.querySelectorAll('[data-mgmtfilter]').forEach(b=>{
      b.onclick = ()=>{
        mgmtFilter = b.dataset.mgmtfilter;
        render();
      };
    });

    // Search Input
    const sInput = app.querySelector('#mgmtSearchInput');
    if(sInput){
      sInput.oninput = (e)=>{
        mgmtSearch = e.target.value;
        // Debounce or instant render table body
        render();
        // keep focus & cursor at end
        const nextInput = app.querySelector('#mgmtSearchInput');
        if(nextInput){
          nextInput.focus();
          nextInput.setSelectionRange(mgmtSearch.length, mgmtSearch.length);
        }
      };
    }

    // Charge Type Select in Form
    const chgTypeSel = app.querySelector('#mgmtChargeTypeSelect');
    if(chgTypeSel){
      chgTypeSel.onchange = ()=>{
        mgmtChargeType = chgTypeSel.value;
        recalcNewForm();
      };
    }

    // Live Auto-Calculators for New Record Form
    const fOdoS = app.querySelector('#formOdoStart');
    const fOdoE = app.querySelector('#formOdoEnd');
    const fDist = app.querySelector('#formDistanceKm');
    const fCons = app.querySelector('#formAvgCons');
    const fKwh = app.querySelector('#formEnergyKwh');
    const fSocS = app.querySelector('#formSocStart');
    const fSocE = app.querySelector('#formSocEnd');
    const fCostNet = app.querySelector('#formCostNet');
    const fCostGrid = app.querySelector('#formCostGrid');

    function recalcNewForm(){
      const rate = META.rate || 4.90;
      const batteryCapacity = 66.0; // XPENG G6 Standard Range 66 kWh

      if(mgmtKind === 'trip'){
        const s = parseFloat(fOdoS?.value || '0');
        const e = parseFloat(fOdoE?.value || '0');
        if(s > 0 && e > s && fDist){
          fDist.value = (e - s).toFixed(1);
        }
        const dist = parseFloat(fDist?.value || '0');
        const cons = parseFloat(fCons?.value || '0');
        if(dist > 0 && cons > 0 && fKwh){
          const calcKwh = (dist * cons) / 1000;
          fKwh.value = calcKwh.toFixed(2);
          if(fCostNet) fCostNet.value = (calcKwh * rate).toFixed(2);
        }
      } else {
        // Charge Kind
        const s0 = parseFloat(fSocS?.value || '0');
        const s1 = parseFloat(fSocE?.value || '0');
        if(s1 > s0 && fKwh){
          const diffPct = (s1 - s0) / 100;
          const kwhAdded = batteryCapacity * diffPct;
          fKwh.value = kwhAdded.toFixed(2);

          const isHome = mgmtChargeType === 'home';
          const net = kwhAdded * rate;
          if(fCostNet) fCostNet.value = net.toFixed(2);
          if(fCostGrid){
            // Home AC adds ~10% loss
            const grid = isHome ? (net * 1.10) : net;
            fCostGrid.value = grid.toFixed(2);
          }
        }
      }
    }

    [fOdoS, fOdoE, fDist, fCons, fSocS, fSocE].forEach(inp => {
      if(inp) inp.oninput = recalcNewForm;
    });

    // Form Submit: POST /api/records
    const newForm = app.querySelector('#newRecordForm');
    if(newForm){
      newForm.onsubmit = async (e)=>{
        e.preventDefault();
        if(isSubmitting) return;

        const fd = new FormData(newForm);
        const payload = {
          date: fd.get('date'),
          time: fd.get('time') || '',
          odoStart: fd.get('odoStart') || '',
          odoEnd: fd.get('odoEnd') || '',
          distanceKm: fd.get('distanceKm') || 0,
          durationMin: fd.get('durationMin') || 0,
          avgConsumption: fd.get('avgConsumption') || 0,
          socStart: fd.get('socStart') || 0,
          socEnd: fd.get('socEnd') || 0,
          energyKwh: fd.get('energyKwh') || 0,
          costNetThb: fd.get('costNetThb') || 0,
          costGridThb: fd.get('costGridThb') || fd.get('costNetThb') || 0,
          note: fd.get('note') || '',
        };

        const submitBtn = app.querySelector('#btnSubmitNew');
        if(submitBtn){
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>⏳</span> กำลังบันทึก...';
        }
        isSubmitting = true;

        try {
          const res = await fetch('/api/records', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
          });
          const json = await res.json();
          if(!res.ok || !json.ok) throw new Error(json.error || 'Failed to save');

          showToast('บันทึกข้อมูลเรียบร้อยแล้ว!', 'success');
          newForm.reset();
          await refreshDataAndRender();
        } catch(err){
          console.error(err);
          showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
        } finally {
          isSubmitting = false;
          if(submitBtn){
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>💾</span> บันทึกลง Google Sheet';
          }
        }
      };
    }

    // Row Actions: Edit & Delete buttons
    app.querySelectorAll('[data-editrow]').forEach(btn => {
      btn.onclick = ()=>{
        const rIdx = parseInt(btn.dataset.editrow, 10);
        const row = ROWS.find(r => r.sheetRowIndex === rIdx);
        if(row){
          editTargetRow = Object.assign({}, row);
          render();
        }
      };
    });

    app.querySelectorAll('[data-delrow]').forEach(btn => {
      btn.onclick = ()=>{
        const rIdx = parseInt(btn.dataset.delrow, 10);
        const row = ROWS.find(r => r.sheetRowIndex === rIdx);
        if(row){
          deleteTargetRow = row;
          render();
        }
      };
    });

    // Edit Modal Events
    const editClose = app.querySelector('#btnEditModalClose');
    const editCancel = app.querySelector('#btnEditCancel');
    const closeEditModal = ()=>{ editTargetRow = null; render(); };
    if(editClose) editClose.onclick = closeEditModal;
    if(editCancel) editCancel.onclick = closeEditModal;

    const editForm = app.querySelector('#editRecordForm');
    if(editForm){
      editForm.onsubmit = async (e)=>{
        e.preventDefault();
        if(isSubmitting) return;

        const fd = new FormData(editForm);
        const payload = {
          sheetRowIndex: fd.get('sheetRowIndex'),
          date: fd.get('date'),
          time: fd.get('time') || '',
          odoStart: fd.get('odoStart') || '',
          odoEnd: fd.get('odoEnd') || '',
          distanceKm: fd.get('distanceKm') || 0,
          durationMin: fd.get('durationMin') || 0,
          avgConsumption: fd.get('avgConsumption') || 0,
          socStart: fd.get('socStart') || 0,
          socEnd: fd.get('socEnd') || 0,
          energyKwh: fd.get('energyKwh') || 0,
          costNetThb: fd.get('costNetThb') || 0,
          costGridThb: fd.get('costGridThb') || fd.get('costNetThb') || 0,
          note: fd.get('note') || '',
        };

        const submitBtn = app.querySelector('#btnEditSubmit');
        if(submitBtn){
          submitBtn.disabled = true;
          submitBtn.innerText = 'กำลังบันทึก...';
        }
        isSubmitting = true;

        try {
          const res = await fetch('/api/records', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
          });
          const json = await res.json();
          if(!res.ok || !json.ok) throw new Error(json.error || 'Failed to update');

          showToast('แก้ไขข้อมูลแถว '+payload.sheetRowIndex+' สำเร็จ!', 'success');
          editTargetRow = null;
          await refreshDataAndRender();
        } catch(err){
          console.error(err);
          showToast('แก้ไขไม่สำเร็จ: ' + err.message, 'error');
        } finally {
          isSubmitting = false;
          if(submitBtn){
            submitBtn.disabled = false;
            submitBtn.innerText = 'บันทึกการแก้ไข';
          }
        }
      };
    }

    // Delete Modal Events
    const delClose = app.querySelector('#btnDeleteModalClose');
    const delCancel = app.querySelector('#btnDeleteCancel');
    const delConfirm = app.querySelector('#btnDeleteConfirm');
    const closeDelModal = ()=>{ deleteTargetRow = null; render(); };
    if(delClose) delClose.onclick = closeDelModal;
    if(delCancel) delCancel.onclick = closeDelModal;

    if(delConfirm && deleteTargetRow){
      delConfirm.onclick = async ()=>{
        if(isSubmitting) return;
        delConfirm.disabled = true;
        delConfirm.innerText = 'กำลังลบ...';
        isSubmitting = true;

        const rowIndex = deleteTargetRow.sheetRowIndex;
        try {
          const res = await fetch('/api/records', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ sheetRowIndex: rowIndex })
          });
          const json = await res.json();
          if(!res.ok || !json.ok) throw new Error(json.error || 'Failed to delete');

          showToast('ลบแถวที่ '+rowIndex+' เรียบร้อยแล้ว!', 'success');
          deleteTargetRow = null;
          await refreshDataAndRender();
        } catch(err){
          console.error(err);
          showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        } finally {
          isSubmitting = false;
          if(delConfirm){
            delConfirm.disabled = false;
            delConfirm.innerText = 'ยืนยันลบข้อมูล';
          }
        }
      };
    }
  }
}

render();
}
</script>
</body>
</html>
`;
}
