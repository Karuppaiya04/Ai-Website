const express = require("express");
const router = express.Router();
const { authMiddleware, roleRequired } = require("../middleware/auth");
const { getDb } = require("../config/firebase");

// Create food item (Manager only)
router.post(
  "/menu",
  authMiddleware,
  roleRequired("manager"),
  async (req, res) => {
    try {
      const { name, category, price, imageUrl, inStock } = req.body;

      let db;
      try {
        db = getDb();
      } catch (dbError) {
        console.error("Firebase error:", dbError.message);
        return res.status(500).json({ message: "Database connection error" });
      }

      const foodItemsRef = db.collection("foodItems");

      const itemData = {
        name,
        category,
        price,
        imageUrl,
        inStock: inStock || 9999,
        createdAt: new Date().toISOString(),
      };

      try {
        const itemDoc = await foodItemsRef.add(itemData);
        res.json({ id: itemDoc.id, ...itemData });
      } catch (dbError) {
        console.error("Firebase write error:", dbError.message);
        return res
          .status(500)
          .json({ message: "Could not add item to database" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// List menu (manager)
router.get(
  "/menu",
  authMiddleware,
  roleRequired("manager"),
  async (req, res) => {
    try {
      const db = getDb();
      const foodItemsRef = db.collection("foodItems");
      const snapshot = await foodItemsRef.get();

      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });

      res.json(items);
    } catch (err) {
      console.error("Manager menu error:", err.message);
      res.status(500).json({ message: "Could not fetch menu items" });
    }
  }
);

// Public menu endpoint (no auth required - for QR scan customers)
router.get("/menu/public", async (req, res) => {
  try {
    const db = getDb();
    const foodItemsRef = db.collection("foodItems");
    const snapshot = await foodItemsRef.get();

    const items = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });

    res.json(items);
  } catch (err) {
    console.error("Public menu error:", err.message);
    // Return empty array if database not available
    res.json([]);
  }
});

// Update & delete endpoints would go here (left as exercise)

// Delete a menu item (Manager only)
router.delete(
  "/menu/:id",
  authMiddleware,
  roleRequired("manager"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const db = getDb();
      const foodItemsRef = db.collection("foodItems");

      try {
        await foodItemsRef.doc(id).delete();
        return res.json({ message: "Item deleted" });
      } catch (dbError) {
        console.error("Firebase delete error:", dbError.message);
        return res.status(500).json({ message: "Could not delete item" });
      }
    } catch (err) {
      console.error("Delete menu item error:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
