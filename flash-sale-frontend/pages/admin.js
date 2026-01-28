import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// 1️⃣ SERVER-SIDE RENDERING (Satisfies SEO & No-JS Requirement)
export async function getServerSideProps() {
  try {
    const [ordersRes, statsRes] = await Promise.all([
      fetch("http://localhost:3001/api/admin/orders"),
      fetch("http://localhost:3001/api/admin/stats"),
    ]);

    const initialOrders = await ordersRes.json();
    const initialStats = await statsRes.json();

    return {
      props: {
        initialOrders: Array.isArray(initialOrders) ? initialOrders : [],
        initialStats: initialStats || { totalRevenue: 0, totalUnitsSold: 0, productStock: [] },
      },
    };
  } catch (err) {
    return {
      props: { initialOrders: [], initialStats: null },
    };
  }
}

export default function Admin({ initialOrders, initialStats }) {
  // 1. Hooks MUST be at the top level
  const [orders, setOrders] = useState(initialOrders);
  const [stats, setStats] = useState(initialStats);
  const [mounted, setMounted] = useState(false);

  // 2. Define the refresh logic in the component body (not inside a hook)
  const refreshDashboard = async () => {
    try {
      console.log("🔄 New order detected: Syncing with server...");
      const [ordersRes, statsRes] = await Promise.all([
        fetch("http://localhost:3001/api/admin/orders"),
        fetch("http://localhost:3001/api/admin/stats"),
      ]);

      const freshOrders = await ordersRes.json();
      const freshStats = await statsRes.json();

      setOrders(freshOrders);
      setStats(freshStats);
    } catch (err) {
      console.error("❌ Failed to sync dashboard:", err);
    }
  };

  // 3. Single useEffect for Socket connection
  useEffect(() => {
    setMounted(true); // Prevents hydration mismatch
    const socket = io("http://localhost:3001");

    socket.on("newOrder", (order) => {
      refreshDashboard(); // Trigger the API refresh
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []); // Dependencies empty so it runs once on mount

  // 4. Hydration Safety & Fallbacks
  if (!mounted) return null; 
  if (!stats) return <div style={styles.loader}>DATA_UNAVAILABLE</div>;
  return (
    <div style={styles.wrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@300;400;600;800&display=swap');
        body { background: #fcfcfc; margin: 0; color: #000; overflow-x: hidden; }
        .row-hover:hover { background: #f8f8f8 !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
      `}</style>

      <nav style={styles.nav}>
        <div style={styles.logoGroup}>
          <span style={styles.logo}>CORE.SYSTEM</span>
          <span style={styles.breadcrumb}>/ DASHBOARD / OVERVIEW</span>
        </div>
        <div style={styles.statusBox}>
          <span style={styles.dot}></span>
          LIVE_SYNC_ACTIVE
        </div>
      </nav>
<main style={styles.container}>
  {/* 1 & 2: TOTALS SECTION */}
  <div style={styles.statsGrid}>
    <div style={styles.statCard}>
      <span style={styles.statLabel}>TOTAL_REVENUE</span>
      <h2 style={styles.statValue}>${stats.totalRevenue.toLocaleString()}</h2>
    </div>
    <div style={styles.statCard}>
      <span style={styles.statLabel}>UNITS_SOLD</span>
      <h2 style={styles.statValue}>{stats.totalUnitsSold}</h2>
    </div>
  </div>

  <div style={styles.mainGrid}>
    {/* 3: TOP 3 PRODUCTS SECTION */}
    <section style={styles.topSellers}>
      <h3 style={styles.sectionHeader}>TOP_3_PERFORMERS</h3>
      <div style={styles.listWrapper}>
        {stats.topProducts?.map((p, index) => (
          <div key={p._id} style={styles.productRow}>
            <span style={styles.rank}>0{index + 1}</span>
            <span style={styles.name}>{p.details.name}</span>
            <span style={styles.qty}>{p.count} SOLD</span>
          </div>
        ))}
      </div>
    </section>

    {/* 4: REVENUE BY DAY SECTION */}
    <section>
      <h3 style={styles.sectionHeader}>REVENUE_HISTORY (7D)</h3>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>DATE</th>
              <th style={styles.th}>DAILY_TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {stats.revenueByDay?.map((day) => (
              <tr key={day._id} style={styles.tr}>
                <td style={styles.td}>{day._id}</td>
              <td style={{ ...styles.td, fontWeight: '700' }}>
  +${(day.dailyRevenue || 0).toLocaleString()}
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  </div>
</main>
    </div>
  );
}

const styles = {
  wrapper: { fontFamily: "'Inter', sans-serif", minHeight: "100vh", paddingBottom: "80px" },
  loader: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", letterSpacing: "4px" },
  nav: { padding: "30px 60px", borderBottom: "1px solid #efefef", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff" },
  logoGroup: { display: "flex", alignItems: "baseline", gap: "10px" },
  logo: { fontWeight: "900", fontSize: "16px", letterSpacing: "-0.5px" },
  breadcrumb: { fontSize: "11px", color: "#ccc", fontWeight: "600" },
  statusBox: { fontSize: "10px", fontWeight: "800", color: "#000", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #000", padding: "4px 12px" },
  dot: { width: "6px", height: "6px", backgroundColor: "#00ff41", borderRadius: "50%" },
  container: { maxWidth: "1200px", margin: "60px auto", padding: "0 40px" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "60px" },
  statCard: { border: "1px solid #000", padding: "40px" },
  statLabel: { fontSize: "11px", fontWeight: "800", color: "#999", letterSpacing: "1px" },
  statValue: { fontSize: "42px", fontWeight: "900", margin: "10px 0", letterSpacing: "-2px" },
  statFooter: { fontSize: "10px", color: "#ccc", fontWeight: "600" },
  mainGrid: { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "60px" },
  sectionHeader: { fontSize: "11px", fontWeight: "900", marginBottom: "20px", color: "#000", letterSpacing: "1.5px" },
  tableWrapper: { borderTop: "2px solid #000", maxHeight: "450px", overflowY: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  theadSticky: { position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, boxShadow: "0 1px 0 #000" },
  th: { padding: "15px 10px", fontSize: "10px", color: "#999", textAlign: "left" },
  tr: { borderBottom: "1px solid #efefef" },
  td: { padding: "18px 10px", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace" },
  badgeSuccess: { background: "#000", color: "#fff", padding: "3px 8px", fontSize: "9px", fontWeight: "700" },
  badgeFail: { color: "#ff4d4d", border: "1px solid #ff4d4d", padding: "2px 8px", fontSize: "9px", fontWeight: "700" },
  inventoryGrid: { display: "flex", flexDirection: "column", gap: "12px" },
  stockItem: { border: "1px solid #eee", padding: "15px", background: "#fff" },
  stockInfo: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  productName: { fontSize: "11px", fontWeight: "700" },
  stockLow: { color: "#ff4d4d", fontSize: "9px", fontWeight: "900" },
  stockOk: { color: "#000", fontSize: "9px", fontWeight: "700" },
  miniBarBg: { height: "2px", background: "#f0f0f0" },
  miniBarFill: { height: "100%", transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" },
  topSellers: {
    backgroundColor: '#000',
    color: '#fff',
    padding: '30px',
    border: '1px solid #000',
  },
  productRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px 0',
    borderBottom: '1px solid #333',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
  },
  rank: { color: '#00ff41', fontWeight: 'bold', marginRight: '15px' },
  name: { flex: 1, textTransform: 'uppercase' },
  qty: { fontWeight: 'bold' },
};