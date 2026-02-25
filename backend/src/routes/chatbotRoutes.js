const express = require("express");
const jwt = require("jsonwebtoken");
const ChatLog = require("../models/ChatLog");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret";

/**
 * WhatsApp/Telegram-style chatbot responses.
 * The frontend can send either:
 * - { message: string }  (free text)
 * - { action: string, payload?: object, message?: string } (button flow)
 *
 * Response:
 * - { reply: string, options?: [{ label, action, payload }], data?: object }
 */

async function getOptionalUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    return user || null;
  } catch {
    return null;
  }
}

function option(label, action, payload) {
  return { label, action, payload };
}

function money(n) {
  return `₹${Number(n || 0).toFixed(0)}`;
}

async function getLastOrderForUser(userId) {
  return Order.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .populate("items.product");
}

async function listCategories() {
  const categories = await Product.distinct("category", { available: true });
  return categories.sort();
}

async function listProductsByCategory(category) {
  return Product.find({ category, available: true }).sort({ createdAt: -1 }).limit(12);
}

async function getProductById(id) {
  return Product.findById(id);
}

function inferTextIntent(message) {
  const lower = (message || "").toLowerCase();
  if (lower.includes("menu") || lower.includes("browse") || lower.includes("products")) return "BROWSE";
  if (lower.includes("order again") || lower.includes("reorder") || lower.includes("previous")) return "REORDER";
  if (lower.includes("status") || lower.includes("track")) return "ORDER_STATUS";
  if (lower.includes("recommend") || lower.includes("suggest") || lower.includes("summer") || lower.includes("hot")) return "SUGGEST";
  if (lower.includes("help") || lower.includes("start")) return "START";
  return "START";
}

async function handleAction({ user, action, payload, message }) {
  const act = action || inferTextIntent(message);

  // START / MAIN MENU
  if (act === "START") {
    return {
      reply:
        "Hi! I’m Lassi Ghar Assistant. Choose an option below (like WhatsApp quick buttons).",
      options: [
        option("Browse Menu", "BROWSE_CATEGORIES", {}),
        option("Drink Suggestions", "SUGGESTIONS", {}),
        option("Order Again (from history)", "REORDER_FROM_HISTORY", {}),
        option("Track Order", "TRACK_ORDER_INFO", {})
      ]
    };
  }

  // Suggestions (mock AI)
  if (act === "SUGGESTIONS" || act === "SUGGEST") {
    return {
      reply:
        "Tell me your mood and I’ll suggest drinks. Or pick a quick option:",
      options: [
        option("Refreshing summer drink", "SUGGEST_PRESET", { preset: "summer" }),
        option("Something rich & creamy", "SUGGEST_PRESET", { preset: "creamy" }),
        option("Something fruity", "SUGGEST_PRESET", { preset: "fruity" }),
        option("Back to menu", "START", {})
      ]
    };
  }

  if (act === "SUGGEST_PRESET") {
    const preset = payload?.preset;
    const text =
      preset === "summer"
        ? "For hot summer days, Mango Lassi and Classic Sweet Lassi are perfect choices."
        : preset === "creamy"
          ? "Try Kesar Badam Lassi or Dryfruit Lassi for a rich, creamy taste."
          : "Try Strawberry Lassi or Mango Lassi for a fruity, refreshing taste.";

    return {
      reply: `${text}\n\nWant to browse the menu to add something to your order?`,
      options: [
        option("Browse Menu", "BROWSE_CATEGORIES", {}),
        option("Back", "SUGGESTIONS", {})
      ]
    };
  }

  // Browse categories -> products -> product detail
  if (act === "BROWSE_CATEGORIES" || act === "BROWSE") {
    const categories = await listCategories();
    if (!categories.length) {
      return {
        reply:
          "No products are available yet. Ask the admin to add beverages from the Admin panel.",
        options: [option("Back to menu", "START", {})]
      };
    }
    return {
      reply: "Select a category:",
      options: [
        ...categories.slice(0, 8).map((c) => option(c, "CATEGORY_PRODUCTS", { category: c })),
        option("Back", "START", {})
      ]
    };
  }

  if (act === "CATEGORY_PRODUCTS") {
    const category = payload?.category;
    const products = await listProductsByCategory(category);
    if (!products.length) {
      return {
        reply: `No products found in "${category}".`,
        options: [option("Pick another category", "BROWSE_CATEGORIES", {}), option("Back", "START", {})]
      };
    }

    return {
      reply: `Top items in "${category}":`,
      options: [
        ...products.slice(0, 8).map((p) =>
          option(`${p.name} (${money(p.price)})`, "PRODUCT_DETAIL", { productId: p._id })
        ),
        option("Back", "BROWSE_CATEGORIES", {})
      ]
    };
  }

  if (act === "PRODUCT_DETAIL") {
    const productId = payload?.productId;
    const p = await getProductById(productId);
    if (!p) {
      return { reply: "Product not found.", options: [option("Back", "BROWSE_CATEGORIES", {})] };
    }

    return {
      reply: `${p.name}\nCategory: ${p.category}\nPrice: ${money(p.price)}\n\nWant to add it to your chat-cart?`,
      options: [
        option("Add 1 to chat-cart", "CART_ADD", { productId: p._id, quantity: 1 }),
        option("Add 2 to chat-cart", "CART_ADD", { productId: p._id, quantity: 2 }),
        option("View chat-cart", "CART_VIEW", {}),
        option("Back", "CATEGORY_PRODUCTS", { category: p.category })
      ]
    };
  }

  // Chat-cart is kept in payload.cart on the frontend, but we also support server computed totals
  if (act === "CART_ADD") {
    return {
      reply: "Added to chat-cart. What next?",
      options: [
        option("View chat-cart", "CART_VIEW", {}),
        option("Browse more", "BROWSE_CATEGORIES", {}),
        option("Checkout", "CHECKOUT", {})
      ],
      data: { cartAdd: payload }
    };
  }

  if (act === "CART_VIEW") {
    return {
      reply: "Here are your options for the chat-cart:",
      options: [
        option("Checkout", "CHECKOUT", {}),
        option("Browse more", "BROWSE_CATEGORIES", {}),
        option("Back", "START", {})
      ]
    };
  }

  if (act === "CHECKOUT") {
    if (!user) {
      return {
        reply: "To place an order from chatbot, please login first.",
        options: [option("Back to menu", "START", {})]
      };
    }

    return {
      reply:
        "Ready to place the order. Confirm to create the order from your chat-cart.",
      options: [
        option("Confirm & Place Order", "PLACE_ORDER", {}),
        option("Back", "CART_VIEW", {})
      ]
    };
  }

  if (act === "PLACE_ORDER") {
    if (!user) {
      return {
        reply: "Please login first to place an order.",
        options: [option("Back", "START", {})]
      };
    }

    // Frontend must send payload.cart = [{productId, quantity}]
    const cart = payload?.cart;
    if (!Array.isArray(cart) || cart.length === 0) {
      return {
        reply: "Your chat-cart looks empty. Please add items first.",
        options: [option("Browse Menu", "BROWSE_CATEGORIES", {}), option("Back", "START", {})]
      };
    }

    const productIds = cart.map((c) => c.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const map = new Map(products.map((p) => [String(p._id), p]));

    const items = [];
    let totalAmount = 0;
    for (const c of cart) {
      const p = map.get(String(c.productId));
      if (!p) continue;
      const qty = Math.max(1, Number(c.quantity || 1));
      items.push({ product: p._id, quantity: qty });
      totalAmount += p.price * qty;
    }

    if (!items.length) {
      return {
        reply: "Some items were not found. Please add products again.",
        options: [option("Browse Menu", "BROWSE_CATEGORIES", {})]
      };
    }

    const order = await Order.create({
      user: user._id,
      items,
      totalAmount
    });

    return {
      reply: `Order placed successfully! Order ID: ${String(order._id).slice(-6).toUpperCase()}.\nTotal: ${money(totalAmount)}`,
      options: [
        option("Order Again", "REORDER_FROM_HISTORY", {}),
        option("Browse Menu", "BROWSE_CATEGORIES", {}),
        option("Back to menu", "START", {})
      ],
      data: { orderCreated: true, orderId: order._id }
    };
  }

  // Reorder from history
  if (act === "REORDER_FROM_HISTORY" || act === "REORDER") {
    if (!user) {
      return {
        reply: "Please login to use your order history.",
        options: [option("Back", "START", {})]
      };
    }

    const lastOrder = await getLastOrderForUser(user._id);
    if (!lastOrder) {
      return {
        reply: "No previous orders found. Want to browse the menu?",
        options: [option("Browse Menu", "BROWSE_CATEGORIES", {}), option("Back", "START", {})]
      };
    }

    const summary = (lastOrder.items || [])
      .slice(0, 3)
      .map((it) => `${it.quantity}× ${it.product?.name || "Item"}`)
      .join(", ");

    return {
      reply: `Your last order was: ${summary}.\nDo you want to order it again?`,
      options: [
        option("Yes, reorder last order", "REORDER_LAST_CONFIRM", { orderId: lastOrder._id }),
        option("Browse Menu instead", "BROWSE_CATEGORIES", {}),
        option("Back", "START", {})
      ]
    };
  }

  if (act === "REORDER_LAST_CONFIRM") {
    if (!user) {
      return { reply: "Please login first.", options: [option("Back", "START", {})] };
    }

    const orderId = payload?.orderId;
    const lastOrder = await Order.findById(orderId).populate("items.product");
    if (!lastOrder) {
      return {
        reply: "Could not find that previous order.",
        options: [option("Back", "REORDER_FROM_HISTORY", {})]
      };
    }

    const items = (lastOrder.items || []).map((it) => ({
      product: it.product?._id,
      quantity: it.quantity
    }));
    const totalAmount = lastOrder.totalAmount;

    const newOrder = await Order.create({
      user: user._id,
      items,
      totalAmount
    });

    return {
      reply: `Done! Reordered successfully. New order ID: ${String(newOrder._id).slice(-6).toUpperCase()}. Total: ${money(totalAmount)}`,
      options: [
        option("Browse Menu", "BROWSE_CATEGORIES", {}),
        option("Back to menu", "START", {})
      ],
      data: { orderCreated: true, orderId: newOrder._id }
    };
  }

  if (act === "TRACK_ORDER_INFO" || act === "ORDER_STATUS") {
    return {
      reply:
        "You can track your order in the 'My Orders' page. Order states: Processing → Preparing → Out for Delivery → Completed.",
      options: [option("Back", "START", {})]
    };
  }

  return {
    reply: "I didn’t understand that. Please choose an option:",
    options: [option("Open menu", "START", {})]
  };
}

router.post("/", async (req, res) => {
  try {
    const user = await getOptionalUser(req);
    const { action, payload, message } = req.body || {};

    const botResponse = await handleAction({ user, action, payload, message });

    // keep logging for presentation/audit
    if (message) {
      await ChatLog.create({ message, sender: "user" });
    } else if (action) {
      await ChatLog.create({ message: `ACTION:${action}`, sender: "user" });
    }
    await ChatLog.create({ message: botResponse.reply, sender: "chatbot" });

    res.json(botResponse);
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
