import React, { useState, useEffect } from "react";
import axios from "../config/axios";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Manager() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("menu");
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "",
    imageUrl: "",
  });
  const [qrTable, setQrTable] = useState("");

  useEffect(() => {
    loadMenu();
    loadOrders();
  }, []);

  const loadMenu = async () => {
    try {
      const res = await axios.get("/manager/menu");
      setMenuItems(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await axios.get("/orders");
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const addMenuItem = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/manager/menu", {
        ...newItem,
        price: parseFloat(newItem.price),
      });
      console.log("Item added successfully:", response.data);
      setNewItem({ name: "", price: "", category: "", imageUrl: "" });
      loadMenu();
      alert("Item added successfully!");
    } catch (e) {
      console.error("Failed to add item:", e);
      const errorMsg =
        e.response?.data?.message || e.message || "Failed to add item";
      alert(`Failed to add item: ${errorMsg}`);
    }
  };

  const deleteMenuItem = async (id) => {
    if (!confirm("Delete this menu item? This cannot be undone.")) return;
    try {
      await axios.delete(`/manager/menu/${id}`);
      // refresh list
      loadMenu();
      alert("Item deleted");
    } catch (e) {
      console.error("Failed to delete item:", e);
      const errorMsg =
        e.response?.data?.message || e.message || "Failed to delete item";
      alert(`Failed to delete item: ${errorMsg}`);
    }
  };

  const generateQR = () => {
    if (!qrTable) return;
    // QR code will encode the URL to table scan page with table number
    const url = `${window.location.origin}/table/${qrTable}`;
    return <QRCodeSVG value={url} size={256} level="H" />;
  };

  const analyticsData = orders.reduce((acc, order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    const existing = acc.find((d) => d.date === date);
    const total = order.items.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
    if (existing) {
      existing.revenue += total;
    } else {
      acc.push({ date, revenue: total });
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="gradient-ocean text-white p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-lg">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          </div>
          <button
            onClick={logout}
            className="bg-white bg-opacity-20 backdrop-blur-lg hover:bg-opacity-30 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover-lift"
          >
            🚪 Logout
          </button>
        </div>
      </header>

      <nav className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex space-x-2 p-4 overflow-x-auto">
          {[
            { key: "menu", icon: "🍽️", label: "Menu" },
            { key: "orders", icon: "📋", label: "Orders" },
            { key: "qr", icon: "📱", label: "QR Code" },
            { key: "analytics", icon: "📊", label: "Analytics" },
          ].map((tab, index) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap animate-fadeIn delay-${
                index * 100
              } ${
                activeTab === tab.key
                  ? "gradient-primary text-white shadow-lg transform scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover-lift"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto">
        {activeTab === "menu" && (
          <div className="animate-fadeIn">
            <div className="flex items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                Menu Management
              </h2>
            </div>
            <form
              onSubmit={addMenuItem}
              className="card-elevated p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-scaleIn"
            >
              <input
                placeholder="Dish Name"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                className="input-modern"
                required
              />
              <input
                placeholder="Price (₹)"
                type="number"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: e.target.value })
                }
                className="input-modern"
                required
              />
              <select
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value })
                }
                className="input-modern"
                required
              >
                <option value="">Select Category</option>
                <option value="veg">🥗 Veg</option>
                <option value="non-veg">🍗 Non-Veg</option>
                <option value="appetizer">🥟 Appetizer</option>
                <option value="dessert">🍰 Dessert</option>
                <option value="drinks">🥤 Drinks</option>
              </select>
              <input
                placeholder="Image URL"
                value={newItem.imageUrl}
                onChange={(e) =>
                  setNewItem({ ...newItem, imageUrl: e.target.value })
                }
                className="input-modern"
              />
              <button
                type="submit"
                className="md:col-span-2 gradient-success text-white py-4 rounded-xl font-bold text-lg hover-lift hover-glow transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                ➕ Add Menu Item
              </button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`card-elevated p-6 hover-scale animate-fadeIn delay-${
                    (index % 3) * 100
                  } relative`}
                >
                  {/* Delete button */}
                  <button
                    onClick={() => deleteMenuItem(item.id)}
                    className="absolute top-3 right-3 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded-full text-sm font-semibold"
                    title="Delete item"
                  >
                    🗑️
                  </button>

                  {item.imageUrl && (
                    <div className="relative overflow-hidden rounded-xl mb-4">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
                      />
                      <div className="absolute top-3 right-3 bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-gray-800">
                        ₹{item.price}
                      </div>
                    </div>
                  )}
                  <h3 className="font-bold text-xl text-gray-800 mb-2">
                    {item.name}
                  </h3>
                  <span className="inline-block bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                    {item.category}
                  </span>
                  {!item.imageUrl && (
                    <p className="text-2xl font-bold text-blue-600 mt-3">
                      ₹{item.price}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="animate-fadeIn">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              All Orders
            </h2>
            <div className="space-y-4">
              {orders.map((order, index) => (
                <div
                  key={order._id}
                  className={`card-elevated p-6 animate-slideInRight delay-${
                    (index % 5) * 100
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Table {order.tableNumber}</p>
                      <p className="text-sm text-gray-600">
                        Status: {order.status}
                      </p>
                      <p className="text-sm">
                        Payment: {order.payment.method}{" "}
                        {order.payment.paid ? "(Paid)" : "(Pending)"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-2">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="text-sm">
                        {item.qty}x {item.name} - ₹{item.price * item.qty}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "qr" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Generate QR Codes for Tables
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tableNum) => (
                <div
                  key={tableNum}
                  className="bg-white p-6 rounded-lg shadow-lg text-center"
                >
                  <h3 className="text-xl font-bold mb-3">Table {tableNum}</h3>
                  <div className="flex justify-center mb-4">
                    <QRCodeSVG
                      value={
                        window.location.hostname === "localhost"
                          ? `http://10.205.196.96:3000/table/${tableNum}`
                          : `${window.location.origin}/table/${tableNum}`
                      }
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Scan to Order</p>
                  <a
                    href={`/table/${tableNum}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Open Table {tableNum} →
                  </a>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                Instructions:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Print these QR codes and place them on each table</li>
                <li>• Customers scan the QR code to open the menu</li>
                <li>• Orders appear automatically in Chef and Waiter panels</li>
                <li>• No login required for customers!</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Revenue Analytics</h2>
            <div className="bg-white p-6 rounded shadow">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
