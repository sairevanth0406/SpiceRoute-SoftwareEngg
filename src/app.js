import React, { useState, useEffect } from 'react';
import { fetchMenu } from './fetchMenu';

function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu()
      .then((data) => {
        setMenuItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <h2>Loading Menu from Sanity...</h2>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🌶️ Spice Route Menu</h1>
      <p>Real data coming from Sanity Studio</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {menuItems.map((item) => (
          <div
            key={item._id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              width: "280px",
              borderRadius: "8px",
            }}
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "8px" }}
              />
            )}
            <h3>{item.name}</h3>
            <p><strong>₹{item.price}</strong></p>
            <p>🔥 {item.calories} Calories</p>
            <p style={{ fontSize: "14px" }}>{item.description}</p>
            <button style={{ marginTop: "10px", padding: "8px 15px" }}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && <p>No menu items found. Add some in Sanity Studio.</p>}
    </div>
  );
}

export default App;