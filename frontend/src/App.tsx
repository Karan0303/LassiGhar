import React, { useEffect, useState, useContext, createContext } from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";

type User = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

type Product = {
  _id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  imageUrl?: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

type Order = {
  _id: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
};

const api = axios.create({
  baseURL: "/api"
});

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );

  useEffect(() => {
    if (!token) return;
    api
      .get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setUser(res.data.user))
      .catch(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
      });
  }, [token]);

  const login = async (email: string, password: string) => {
    // allow shorthand 'admin' username for convenience
    const normalizedEmail =
      email.trim().toLowerCase() === "admin"
        ? "admin@lassighar.com"
        : email.trim();

    const res = await api.post("/auth/login", {
      email: normalizedEmail,
      password
    });
    const { token: t, user: u } = res.data;
    setToken(t);
    localStorage.setItem("token", t);
    setUser(u);
  };

  const register = async (name: string, email: string, password: string) => {
    await api.post("/auth/register", { name, email, password });
    await login(email, password);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  const value: AuthContextValue = { user, token, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="h-8 w-8 rounded-full bg-gradient-to-tr from-lassi-yellow to-lassi-pink inline-flex items-center justify-center text-slate-950 font-bold shadow-md shadow-lassi-pink/40"
            >
              LG
            </motion.span>
            <div>
              <p className="font-semibold tracking-tight">Lassi Ghar</p>
              <p className="text-xs text-slate-400">
                Smart Beverage Ordering & AI Chatbot
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="hover:text-lassi-yellow transition-colors">
              Home
            </Link>
            <Link to="/menu" className="hover:text-lassi-yellow transition-colors">
              Menu
            </Link>
            {user && (
              <Link
                to="/orders"
                className="hover:text-lassi-yellow transition-colors"
              >
                My Orders
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="hover:text-lassi-yellow transition-colors"
              >
                Admin
              </Link>
            )}
            {user ? (
              <>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Hello, {user.name} ({user.role})
                </span>
                <button
                  onClick={logout}
                  className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:border-lassi-yellow hover:text-lassi-yellow transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="text-xs px-3 py-1 rounded-full border border-lassi-yellow text-lassi-yellow hover:bg-lassi-yellow hover:text-slate-950 transition-colors"
              >
                Login / Register
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<CustomerHome />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/orders"
            element={user ? <OrdersPage /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/admin"
            element={
              user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/auth" replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <ChatbotWidget />
    </div>
  );
}

function CustomerHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const res = await api.get<Product[]>("/products", {
        params: { search: search || undefined, category: category || undefined }
      });
      setProducts(res.data);
      setLoading(false);
    };
    fetchProducts();
  }, [search, category]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product._id === product._id);
      if (existing) {
        return prev.map((c) =>
          c.product._id === product._id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const placeOrder = async () => {
    if (!token) {
      navigate("/auth");
      return;
    }
    if (!cart.length) return;
    setPlacingOrder(true);
    try {
      await api.post(
        "/orders",
        {
          items: cart.map((item) => ({
            product: item.product._id,
            quantity: item.quantity
          })),
          totalAmount: total
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart([]);
      alert("Order placed successfully!");
    } catch (err) {
      alert("Failed to place order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              placeholder="Search beverages (e.g., Mango, Classic, Strawberry)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/70"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/70"
          >
            <option value="">All Categories</option>
            <option value="Classic">Classic Lassi</option>
            <option value="Flavored">Flavored Lassi</option>
            <option value="Seasonal">Seasonal Specials</option>
            <option value="Special">Special Combos</option>
            <option value="Combo">Snacks & Combos</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Loading beverages…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-slate-400">
            No beverages found. Try changing your search or filters.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <article
                key={p._id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-2"
              >
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="rounded-lg h-32 w-full object-cover mb-2"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{p.name}</h3>
                  <p className="text-xs text-lassi-yellow mb-1">{p.category}</p>
                  {p.description && (
                    <p className="text-xs text-slate-400 line-clamp-3">
                      {p.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold text-lassi-yellow">
                    ₹{p.price.toFixed(0)}
                  </span>
                  <button
                    onClick={() => addToCart(p)}
                    className="text-xs px-3 py-1 rounded-full bg-lassi-yellow text-slate-950 font-medium hover:bg-yellow-300 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 h-fit sticky top-24">
        <h2 className="font-semibold mb-2 text-sm">Your Cart</h2>
        {cart.length === 0 ? (
          <p className="text-xs text-slate-400">
            Your cart is empty. Add some refreshing Lassi to get started.
          </p>
        ) : (
          <>
            <ul className="space-y-2 mb-3 max-h-64 overflow-y-auto pr-1">
              {cart.map((item) => (
                <li
                  key={item.product._id}
                  className="flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-slate-400">
                      {item.quantity} × ₹{item.product.price.toFixed(0)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ₹{(item.product.price * item.quantity).toFixed(0)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between text-sm border-t border-slate-800 pt-2 mb-3">
              <span className="text-slate-300">Total</span>
              <span className="font-semibold text-lassi-yellow">
                ₹{total.toFixed(0)}
              </span>
            </div>
            <button
              onClick={placeOrder}
              disabled={placingOrder}
              className="w-full text-sm px-3 py-2 rounded-lg bg-gradient-to-r from-lassi-yellow to-lassi-pink text-slate-950 font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {placingOrder ? "Placing Order…" : "Place Order"}
            </button>
            {!token && (
              <p className="mt-2 text-[11px] text-slate-400">
                You will be asked to login or register before confirming your first
                order.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-5">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-xs font-semibold tracking-[0.2em] uppercase text-lassi-yellow"
          >
            GLS UNIVERSITY · CAPSTONE PROJECT
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight"
          >
            Beverage selling website
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-lassi-yellow via-lassi-pink to-lassi-cream">
              with AI powered Lassi chatbot.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-sm text-slate-300 max-w-xl"
          >
            Built for <span className="font-semibold">Lassi Ghar</span>, this
            project showcases a modern beverage ordering platform where
            customers can discover flavours, get smart recommendations and place
            orders – all assisted by an AI chatbot.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap gap-3 items-center"
          >
            <button
              onClick={() => navigate("/menu")}
              className="px-4 py-2.5 rounded-full bg-gradient-to-r from-lassi-yellow to-lassi-pink text-slate-950 text-sm font-semibold shadow-lg shadow-lassi-pink/40 hover:opacity-90 transition"
            >
              View Menu & Order
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2.5 rounded-full border border-slate-700 text-sm text-slate-200 hover:border-lassi-yellow hover:text-lassi-yellow transition"
            >
              Login / Admin Panel
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="flex flex-wrap gap-4 text-[11px] text-slate-400"
          >
            <div>
              <p className="font-semibold text-slate-200">Tech stack</p>
              <p>React · TypeScript · Tailwind · Node.js · Express · MongoDB</p>
            </div>
            <div>
              <p className="font-semibold text-slate-200">Key modules</p>
              <p>Online ordering · AI chatbot · Admin dashboard</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, type: "spring" }}
          className="relative"
        >
          <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-lassi-pink/30 blur-3xl" />
          <div className="absolute -bottom-8 -right-6 h-32 w-32 rounded-full bg-lassi-yellow/20 blur-3xl" />

          <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950/90 p-3 shadow-2xl shadow-lassi-pink/20">
            <div className="grid gap-3">
              <div className="rounded-2xl overflow-hidden border border-slate-800/70">
                <img
                  src="https://images.pexels.com/photos/4109998/pexels-photo-4109998.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Lassi and beverages"
                  className="h-44 w-full object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-3 space-y-1">
                  <p className="text-[11px] text-slate-400">AI Chatbot</p>
                  <p className="font-semibold">“Suggest me a summer drink.”</p>
                  <p className="text-[11px] text-slate-400">
                    Chatbot recommends Mango & Classic Lassi with quick buttons
                    to order.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-3 space-y-1">
                  <p className="text-[11px] text-slate-400">Live ordering</p>
                  <p className="font-semibold">Cart + Checkout</p>
                  <p className="text-[11px] text-slate-400">
                    Real-time cart, total and order tracking aligned with your
                    UML diagrams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features strip */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="grid md:grid-cols-3 gap-4 text-sm"
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
          <p className="text-xs text-lassi-yellow font-semibold">01 · Smart menu</p>
          <p className="font-semibold">Beverage catalogue</p>
          <p className="text-xs text-slate-400">
            Category-wise menu for Classic, Flavoured, Seasonal and Combo
            lassis, mapped directly to MongoDB products.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
          <p className="text-xs text-lassi-yellow font-semibold">02 · AI assistant</p>
          <p className="font-semibold">Chatbot ordering</p>
          <p className="text-xs text-slate-400">
            WhatsApp-style quick buttons to reorder last drink, browse menu and
            even place the order from chat.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
          <p className="text-xs text-lassi-yellow font-semibold">03 · Admin tools</p>
          <p className="font-semibold">Franchise dashboard</p>
          <p className="text-xs text-slate-400">
            Admin can add beverages, manage orders and monitor the system –
            matching the BCA capstone documentation.
          </p>
        </div>
      </motion.section>

      {/* How it works */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 md:p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-lassi-yellow font-semibold uppercase tracking-[0.2em]">
              How the system works
            </p>
            <p className="text-sm text-slate-300">
              End-to-end flow from React frontend to Node.js backend and
              MongoDB, with AI-style chatbot in the middle.
            </p>
          </div>
          <button
            onClick={() => navigate("/menu")}
            className="text-xs px-3 py-1.5 rounded-full border border-slate-700 hover:border-lassi-yellow hover:text-lassi-yellow transition"
          >
            Skip to live demo
          </button>
        </div>
        <div className="grid md:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <p className="font-semibold">1 · Customer</p>
            <p className="text-slate-400">
              Opens the website, browses the animated home, and taps into the
              menu or chatbot.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold">2 · React frontend</p>
            <p className="text-slate-400">
              Handles UI, cart and chatbot widget, then calls REST APIs on the
              backend.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold">3 · Node.js backend</p>
            <p className="text-slate-400">
              Express routes manage authentication, products, orders and
              chatbot flows.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold">4 · MongoDB</p>
            <p className="text-slate-400">
              Persists users, beverages, orders and chat logs – ready to be
              shown in your report diagrams.
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate("/");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto rounded-xl border border-slate-800 bg-slate-900/70 p-6">
      <h1 className="font-semibold mb-1 text-lg">
        {mode === "login" ? "Welcome back" : "Create your Lassi Ghar account"}
      </h1>
      <p className="text-xs text-slate-400 mb-4">
        Login as customer, or use the default admin:
        <br />
        <span className="font-mono text-[11px]">
          admin@lassighar.com / admin
        </span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        {mode === "register" && (
          <div>
            <label className="block mb-1 text-xs text-slate-300">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/70"
            />
          </div>
        )}
        <div>
          <label className="block mb-1 text-xs text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/70"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs text-slate-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/70"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 text-sm px-3 py-2 rounded-lg bg-gradient-to-r from-lassi-yellow to-lassi-pink text-slate-950 font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? "Please wait…" : mode === "login" ? "Login" : "Register"}
        </button>
      </form>
      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-3 text-[11px] text-slate-400 hover:text-lassi-yellow transition-colors"
      >
        {mode === "login"
          ? "New here? Create an account"
          : "Already have an account? Login"}
      </button>
    </div>
  );
}

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    api
      .get<Order[]>("/orders/my", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]));
  }, [token]);

  return (
    <div>
      <h1 className="font-semibold mb-3 text-lg">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-400">
          You have not placed any orders yet.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <article
              key={o._id}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  Order #{o._id.slice(-6).toUpperCase()}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(o.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-lassi-yellow">
                  ₹{o.totalAmount.toFixed(0)}
                </p>
                <p className="text-xs text-slate-400">
                  {o.orderStatus} · {o.paymentStatus}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  const token = localStorage.getItem("token");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(120);
  const [category, setCategory] = useState("Classic");

  useEffect(() => {
    if (!token) return;
    api
      .get<Product[]>("/products")
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]));
    api
      .get<Order[]>("/orders", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]));
  }, [token]);

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const res = await api.post(
      "/products",
      { name, price, category, available: true },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setProducts((prev) => [res.data, ...prev]);
    setName("");
    setPrice(120);
    setCategory("Classic");
  };

  const updateOrderStatus = async (id: string, orderStatus: string) => {
    if (!token) return;
    const res = await api.patch(
      `/orders/${id}/status`,
      { orderStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setOrders((prev) => prev.map((o) => (o._id === id ? res.data : o)));
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1.3fr,1.7fr]">
      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="font-semibold mb-3 text-sm">Add Beverage</h2>
        <form onSubmit={addProduct} className="space-y-3 text-sm">
          <div>
            <label className="block mb-1 text-xs text-slate-300">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/70"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block mb-1 text-xs text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/70"
              >
                <option value="Classic">Classic</option>
                <option value="Flavored">Flavored</option>
                <option value="Seasonal">Seasonal</option>
                <option value="Special">Special</option>
                <option value="Combo">Combo</option>
              </select>
            </div>
            <div className="w-32">
              <label className="block mb-1 text-xs text-slate-300">Price</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/70"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full mt-1 text-sm px-3 py-2 rounded-lg bg-gradient-to-r from-lassi-yellow to-lassi-pink text-slate-950 font-semibold hover:opacity-90 transition"
          >
            Save Beverage
          </button>
        </form>
        <h3 className="font-semibold mt-5 mb-2 text-sm">Existing Beverages</h3>
        <div className="space-y-1 text-xs max-h-52 overflow-y-auto pr-1">
          {products.map((p) => (
            <div
              key={p._id}
              className="flex justify-between items-center border-b border-slate-800/80 py-1"
            >
              <span>
                {p.name}{" "}
                <span className="text-slate-500">({p.category})</span>
              </span>
              <span className="font-semibold text-lassi-yellow">
                ₹{p.price.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="font-semibold mb-3 text-sm">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-xs text-slate-400">
            No orders have been placed yet.
          </p>
        ) : (
          <div className="space-y-3 text-xs max-h-[460px] overflow-y-auto pr-1">
            {orders.map((o) => (
              <article
                key={o._id}
                className="border border-slate-800 rounded-lg p-3"
              >
                <div className="flex justify-between mb-1">
                  <p className="font-medium">
                    #{o._id.slice(-6).toUpperCase()}
                  </p>
                  <p className="font-semibold text-lassi-yellow">
                    ₹{o.totalAmount.toFixed(0)}
                  </p>
                </div>
                <p className="text-slate-400 mb-2">
                  Placed: {new Date(o.createdAt).toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Status:</span>
                  <select
                    value={o.orderStatus}
                    onChange={(e) =>
                      updateOrderStatus(o._id, e.target.value)
                    }
                    className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-lassi-yellow/70"
                  >
                    <option value="Processing">Processing</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ChatbotWidget() {
  const token = localStorage.getItem("token");
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [chatCart, setChatCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [messages, setMessages] = useState<
    {
      sender: "user" | "bot";
      text: string;
      options?: { label: string; action: string; payload?: any }[];
    }[]
  >([
    {
      sender: "bot",
      text: "Hi! I’m your Lassi Ghar assistant. Tap an option below to get started.",
      options: [
        { label: "Start / Menu", action: "START", payload: {} },
        { label: "Browse Menu", action: "BROWSE_CATEGORIES", payload: {} },
        { label: "Drink Suggestions", action: "SUGGESTIONS", payload: {} }
      ]
    }
  ]);
  const [sending, setSending] = useState(false);

  const sendToBot = async (body: any, userEcho?: string) => {
    if (userEcho) {
      setMessages((prev) => [...prev, { sender: "user", text: userEcho }]);
    }

    setSending(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await api.post("/chatbot", body, { headers });

      const reply = res.data.reply as string;
      const options = (res.data.options as any[]) || undefined;
      const data = res.data.data || {};

      // apply cart adds (server tells what to add)
      if (data?.cartAdd?.productId) {
        const { productId, quantity } = data.cartAdd;
        setChatCart((prev) => {
          const existing = prev.find((c) => c.productId === productId);
          if (existing) {
            return prev.map((c) =>
              c.productId === productId
                ? { ...c, quantity: c.quantity + Number(quantity || 1) }
                : c
            );
          }
          return [...prev, { productId, quantity: Number(quantity || 1) }];
        });
      }

      // clear chat-cart after order placement
      if (data?.orderCreated) {
        setChatCart([]);
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: reply,
          options
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I could not reach the chatbot service. Please try again."
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    await sendToBot({ message: text }, text);
  };

  const onOptionClick = async (opt: { label: string; action: string; payload?: any }) => {
    // For order placement, include current chat-cart in payload
    const payload = { ...(opt.payload || {}) };
    if (opt.action === "PLACE_ORDER") {
      payload.cart = chatCart;
    }
    await sendToBot({ action: opt.action, payload }, opt.label);
  };

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <button
        onClick={() => setOpen((v) => !v)}
        className="mb-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-lassi-yellow to-lassi-pink text-slate-950 px-4 py-2 text-xs font-semibold shadow-lg shadow-lassi-pink/30"
      >
        AI Chatbot
      </button>
      {open && (
        <div className="w-80 h-96 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur shadow-2xl flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold">Lassi Ghar AI Assistant</p>
              <p className="text-[11px] text-slate-400">
                Ask for drink suggestions or order help.
              </p>
            </div>
          </div>
          <div className="flex-1 px-3 py-2 space-y-2 text-xs overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="max-w-[80%]">
                  <div
                    className={`rounded-xl px-3 py-2 ${
                      m.sender === "user"
                        ? "bg-lassi-yellow text-slate-950"
                        : "bg-slate-800 text-slate-100"
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.sender === "bot" && m.options && m.options.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.options.slice(0, 10).map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => onOptionClick(opt)}
                          disabled={sending}
                          className="text-[11px] px-2.5 py-1 rounded-full border border-slate-700 bg-slate-950 hover:border-lassi-yellow hover:text-lassi-yellow transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-slate-800 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your question…"
              className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-lassi-yellow/70"
            />
            <button
              onClick={sendMessage}
              disabled={sending}
              className="text-xs px-3 py-1.5 rounded-lg bg-lassi-yellow text-slate-950 font-semibold hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}

