import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export async function getStaticProps() {
  const res = await fetch('http://localhost:3001/api/products');
  const initialProducts = await res.json();
  return { props: { initialProducts }, revalidate: 60 };
}

export default function FlashSale({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts);
  const [toast, setToast] = useState({ show: false, msg: '', type: '' });

  // 1. WebSocket Hook
  useEffect(() => {
    const socket = io("http://localhost:3001");
    socket.on("stockUpdate", (data) => {
      setProducts(prev => prev.map(p => 
        p._id === data.productId ? { ...p, stock: data.newStock } : p
      ));
    });
    return () => socket.disconnect();
  }, []);

  // 2. Toast Logic
  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: '' }), 3000);
  };

  // 3. Purchase Action
  const handleBuy = async (productId) => {
    try {
      const res = await fetch('http://localhost:3001/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, userId: 'user_01' })
      });
      const data = await res.json();

      if (data.success) {
        showToast("PURCHASE_CONFIRMED", "success");
      } else {
        showToast(data.message || "TRANSACTION_FAILED", "error");
      }
    } catch (err) {
      showToast("NETWORK_ERROR", "error");
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Sleek Toast Notification */}
      {toast.show && (
        <div style={{...styles.toast, backgroundColor: toast.type === 'success' ? '#000' : '#ff4d4d'}}>
          {toast.msg}
        </div>
      )}

      <header style={styles.header}>
        <h1 style={styles.logo}>CORE.STORE / <span style={styles.live}>LIVE_FEED</span></h1>
      </header>

      <div style={styles.grid}>
        {products.map(product => (
          <div key={product._id} style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.productName}>{product.name}</h2>
              <span style={styles.price}>${product.price}</span>
            </div>
            
            <div style={styles.stockContainer}>
              <div style={styles.stockLabel}>STOCK_STATUS:</div>
              <div style={{...styles.stockValue, color: product.stock <= 5 ? '#ff4d4d' : '#000'}}>
                {product.stock > 0 ? `${product.stock} UNITS` : "DEPLETED"}
              </div>
            </div>

            <button 
              onClick={() => handleBuy(product._id)}
              disabled={product.stock <= 0}
              style={{
                ...styles.buyBtn,
                backgroundColor: product.stock <= 0 ? '#eee' : '#000',
                cursor: product.stock <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {product.stock > 0 ? "INITIALIZE_PURCHASE" : "OUT_OF_STOCK"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { backgroundColor: '#fff', minHeight: '100vh', fontFamily: '"JetBrains Mono", monospace', padding: '40px' },
  header: { borderBottom: '2px solid #000', marginBottom: '40px', paddingBottom: '20px' },
  logo: { fontSize: '14px', letterSpacing: '2px', fontWeight: 'bold' },
  live: { color: '#00ff00' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { border: '2px solid #000', padding: '20px', transition: 'transform 0.1s ease' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  productName: { fontSize: '12px', margin: 0, fontWeight: 'bold', maxWidth: '70%' },
  price: { fontSize: '16px', fontWeight: '900' },
  stockContainer: { margin: '20px 0', borderTop: '1px solid #eee', paddingTop: '10px' },
  stockLabel: { fontSize: '9px', color: '#999' },
  stockValue: { fontSize: '11px', fontWeight: 'bold' },
  buyBtn: { 
    width: '100%', border: 'none', color: '#fff', padding: '12px', 
    fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' 
  },
  toast: {
    position: 'fixed', top: '20px', right: '20px', color: '#fff', 
    padding: '12px 24px', fontSize: '10px', fontWeight: 'bold', 
    letterSpacing: '2px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }
};