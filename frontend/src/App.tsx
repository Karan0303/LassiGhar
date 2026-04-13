import React, { useEffect, useState, useContext, createContext, useRef } from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  ShoppingBag, 
  User as UserIcon, 
  LogOut, 
  Plus, 
  Trash2, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  ArrowRight,
  MessageCircle,
  Camera,
  Mail,
  Lock,
  ArrowLeft,
  ChevronRight,
  Star,
  Zap,
  ShieldCheck
} from "lucide-react";
import Aurora from "./components/Aurora";
import SplitText from "./components/SplitText";

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
    const normalizedEmail = email.trim().toLowerCase() === "admin" ? "admin@lassighar.com" : email.trim();
    const res = await api.post("/auth/login", { email: normalizedEmail, password });
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
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-slate-100 font-sans selection:bg-lassi-yellow selection:text-slate-950">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="relative h-10 sm:h-12 w-auto min-w-[40px] px-2 rounded-2xl bg-white overflow-hidden flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <img src="/logo.jpeg" alt="Lassi Ghar Logo" className="h-full w-auto object-contain" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-lassi-yellow transition-colors leading-tight">Lassi Ghar</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium font-mono">EST. 2024 · SMART HUB</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <Link to="/" className="relative text-slate-300 hover:text-white transition-colors group py-1">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-lassi-yellow transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link to="/menu" className="relative text-slate-300 hover:text-white transition-colors group py-1">
              Menu
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-lassi-yellow transition-all duration-300 group-hover:w-full"></span>
            </Link>
            {user && user.role === "customer" && (
              <Link to="/orders" className="relative text-slate-300 hover:text-white transition-colors group py-1">
                Orders
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-lassi-yellow transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}
            {user?.role === "admin" && (
              <Link to="/admin" className="relative text-slate-300 hover:text-white transition-colors group py-1">
                Admin Panel
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-lassi-yellow transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                  <p className="text-[10px] text-lassi-yellow uppercase tracking-tighter opacity-80">{user.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 transition-all active:scale-95"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-2 text-xs px-5 py-2.5 rounded-xl bg-gradient-to-r from-lassi-yellow to-lassi-pink text-slate-950 font-bold hover:shadow-lg hover:shadow-lassi-pink/20 transition-all active:scale-95"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
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

      <footer className="border-t border-white/5 bg-black/60 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-auto px-2 rounded-lg bg-white overflow-hidden flex items-center justify-center">
                <img src="/logo.jpeg" alt="Lassi Ghar" className="h-full w-auto object-contain" />
              </div>
              <span className="font-bold text-xl text-white">Lassi Ghar</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Handcrafting the finest lassis and beverages since 2024. Focused on purity, tradition, and innovation.
            </p>
            <div className="flex gap-4">
              {['Facebook', 'Twitter', 'Instagram'].map(social => (
                <a key={social} href="#" className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-lassi-yellow hover:text-lassi-yellow transition-all">
                  <span className="sr-only">{social}</span>
                  <div className="w-4 h-4 rounded-sm bg-current opacity-20" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Explore</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link to="/" className="hover:text-lassi-yellow transition-colors">Our Story</Link></li>
              <li><Link to="/menu" className="hover:text-lassi-yellow transition-colors">Digital Menu</Link></li>
              <li><Link to="/menu" className="hover:text-lassi-yellow transition-colors">Seasonal Specials</Link></li>
              <li><Link to="/auth" className="hover:text-lassi-yellow transition-colors">Rewards Program</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Support</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-lassi-yellow transition-colors">Order Tracking</a></li>
              <li><a href="#" className="hover:text-lassi-yellow transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-lassi-yellow transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-lassi-yellow transition-colors">Contact Support</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Our Store</h4>
            <div className="text-sm text-slate-400 leading-relaxed space-y-2 mb-4">
              <p>GF 1, Suyog Complex, New CG Rd,</p>
              <p>nr. SAKAR ENGLISH SCHOOL,</p>
              <p>Shrinath Bungalows-I, Nigam Nagar,</p>
              <p>Chandkheda, Ahmedabad, Gujarat 382424</p>
            </div>
            <p className="text-sm font-semibold text-white">support@lassighar.com</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-tighter text-slate-500">
          <p>© 2026 Lassi Ghar Corporation. Project for GLS Capstone.</p>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-white transition-colors">Security</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      <ChatbotWidget />
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <Aurora 
            colorStops={["#fbbf24", "#ec4899", "#fbbf24"]} 
            amplitude={1.2} 
            speed={0.5}
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.2em] font-bold text-lassi-yellow"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lassi-yellow opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-lassi-yellow"></span>
              </span>
              Premium Beverage Hub
            </motion.div>
            
            <div className="space-y-2">
              <SplitText 
                text="Crafting the"
                className="text-4xl sm:text-6xl font-black text-white"
                textAlign="left"
              />
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-lassi-yellow via-lassi-pink to-white"
              >
                Perfect Lassi.
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-lg text-slate-400 max-w-lg leading-relaxed"
            >
              Experience the harmony of traditional flavours and modern convenience. Handcrafted with love, served with a smile.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <button
                onClick={() => navigate("/menu")}
                className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-lassi-yellow to-orange-400 text-slate-950 font-bold transition-all hover:scale-105 hover:shadow-2xl hover:shadow-lassi-yellow/20"
              >
                Browse Menu
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold transition-all hover:bg-white/10"
              >
                Join the Hub
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-8 pt-4 border-t border-white/5 max-w-sm"
            >
              <div>
                <p className="text-2xl font-bold text-white">50+</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Varieties</p>
              </div>
              <div className="h-10 w-px bg-white/5" />
              <div>
                <p className="text-2xl font-bold text-white">10K+</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Happy Souls</p>
              </div>
              <div className="h-10 w-px bg-white/5" />
              <div>
                <p className="text-2xl font-bold text-white">4.9/5</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Rating</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: "spring" }}
            className="hidden lg:block relative"
          >
            <div className="absolute inset-0 bg-lassi-pink/20 blur-[100px] rounded-full animate-pulse" />
            <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden border border-white/10 bg-slate-900/40 p-4 transform hover:rotate-1 transition-transform duration-700">
               <img
                src="/fruitlassi.jfif"
                alt="Premium Lassi"
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-10 left-10 p-6 rounded-3xl bg-black/60 backdrop-blur-md border border-white/10 max-w-[200px]">
                <p className="text-lassi-yellow font-bold text-xl">Best Seller</p>
                <p className="text-white text-sm font-medium">Mango Saffron Infusion</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold text-white">Why Lassi Ghar?</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">We've redefined the beverage experience by combining ancient recipes with future-ready technology.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="h-6 w-6 text-lassi-yellow" />,
              title: "AI Recommendations",
              desc: "Our smart chatbot understands your cravings and suggests the perfect drink based on your mood and weather."
            },
            {
              icon: <Star className="h-6 w-6 text-lassi-pink" />,
              title: "Premium Quality",
              desc: "We use only organic curd, hand-picked fruits, and zero preservatives. Pure goodness in every sip."
            },
            {
              icon: <ShieldCheck className="h-6 w-6 text-emerald-400" />,
              title: "Seamless Ordering",
              desc: "From rapid checkout to real-time tracking, our platform ensures your lassi reaches you fresh and fast."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-lassi-yellow/50 transition-all group"
            >
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats/Image Section */}
      <section className="py-24 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <div className="order-2 md:order-1 relative">
          <div className="aspect-square rounded-full border border-white/5 absolute -inset-10 animate-spin-slow" />
          <img 
            src="https://images.unsplash.com/photo-1546173159-315724a31696?q=80&w=1974&auto=format&fit=crop" 
            className="rounded-[4rem] w-full aspect-square object-cover shadow-2xl relative z-10"
            alt="Process"
          />
        </div>
        <div className="order-1 md:order-2 space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">Tradition Meets<br/>Tomorrow.</h2>
          <p className="text-slate-400 leading-relaxed">
            Our secret recipe has been passed down through generations, now modernized with a digital-first approach. 
            We're not just selling lassi; we're preserving heritage.
          </p>
          <div className="space-y-4 pt-4">
            <div className="flex gap-4 items-start">
              <CheckCircle className="h-6 w-6 text-lassi-yellow flex-shrink-0" />
              <div>
                <h4 className="font-bold text-white">Farm to Glass</h4>
                <p className="text-sm text-slate-500">Sourced directly from local organic farms every morning.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <CheckCircle className="h-6 w-6 text-lassi-yellow flex-shrink-0" />
              <div>
                <h4 className="font-bold text-white">Smart Logistics</h4>
                <p className="text-sm text-slate-500">Delivery optimized for temperature-controlled freshness.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CustomerHome() {
  const { user } = useAuth();
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
      try {
        const res = await api.get<Product[]>("/products", {
          params: { search: search || undefined, category: category || undefined }
        });
        setProducts(res.data);
      } finally {
        setLoading(false);
      }
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

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product._id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const placeOrder = async () => {
    if (!token) { navigate("/auth"); return; }
    if (!cart.length) return;
    setPlacingOrder(true);
    try {
      await api.post("/orders", {
        items: cart.map((item) => ({ product: item.product._id, quantity: item.quantity })),
        totalAmount: total
      }, { headers: { Authorization: `Bearer ${token}` } });
      setCart([]);
      alert("🎉 Order placed successfully!");
    } catch (err) {
      alert("Failed to place order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="pt-10 max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row gap-12">
        <section className="flex-1 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-lassi-yellow transition-colors" />
              <input
                type="text"
                placeholder="Search flavours..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/50 transition-all hover:bg-white/[0.08]"
              />
            </div>
            <div className="flex items-center gap-2 px-1 min-w-[150px]">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/50 transition-all hover:bg-white/[0.08]"
              >
                <option value="">All Categories</option>
                <option value="Classic">Classic Lassi</option>
                <option value="Flavored">Fruit Fusion</option>
                <option value="Seasonal">Seasonal Specials</option>
                <option value="Special">Bestsellers</option>
                <option value="Combo">Combos</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
              <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No beverages matching your criteria.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {products.map((p) => (
                  <motion.article
                    key={p._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group rounded-[2.5rem] border border-white/5 bg-white/5 p-4 flex flex-col gap-4 hover:border-lassi-yellow/30 transition-all hover:bg-white/[0.08] relative overflow-hidden"
                  >
                    <div className="absolute top-4 right-4 z-10">
                       <button className="p-2 rounded-full bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                         <Star className="h-4 w-4 text-lassi-yellow fill-lassi-yellow" />
                       </button>
                    </div>
                    {p.imageUrl ? (
                      <div className="relative h-48 w-full rounded-[2rem] overflow-hidden">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    ) : (
                      <div className="h-48 w-full rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <Package className="h-10 w-10 text-slate-700" />
                      </div>
                    )}
                    <div className="px-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-white text-lg leading-tight">{p.name}</h3>
                          <span className="font-black text-lassi-yellow text-lg">₹{p.price}</span>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">{p.category}</p>
                        {p.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {p.description}
                          </p>
                        )}
                      </div>
                      {user?.role !== "admin" && (
                        <button
                          onClick={() => addToCart(p)}
                          className="w-full mt-6 py-3 rounded-2xl bg-white/10 hover:bg-lassi-yellow hover:text-slate-950 font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
                        >
                          <Plus className="h-3.5 w-3.5 group-hover/btn:rotate-90 transition-transform" />
                          Add to Order
                        </button>
                      )}
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {user?.role !== "admin" && (
          <section className="w-full md:w-96">
            <div className="bg-white/5 rounded-[2.5rem] border border-white/5 p-6 sticky top-24 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-lassi-yellow" />
                  Your Bag
                </h2>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-400">{cart.length} items</span>
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="h-16 w-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto">
                      <ShoppingBag className="h-8 w-8 text-slate-700" />
                  </div>
                  <p className="text-xs text-slate-500">Your bag is feeling light.<br/>Add some flavours to start!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map((item) => (
                      <div key={item.product._id} className="flex gap-4 group">
                        <div className="h-12 w-12 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden border border-white/5">
                          {item.product.imageUrl && <img src={item.product.imageUrl} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate text-white">{item.product.name}</p>
                          <p className="text-[10px] text-slate-500">{item.quantity} x ₹{item.product.price}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">₹{item.product.price * item.quantity}</p>
                          <button 
                            onClick={() => removeFromCart(item.product._id)}
                            className="text-[10px] text-red-500/50 hover:text-red-500 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-6 border-t border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 font-medium font-mono uppercase">Grand Total</span>
                      <span className="text-2xl font-black text-lassi-yellow">₹{total}</span>
                    </div>
                    <button
                      onClick={placeOrder}
                      disabled={placingOrder}
                      className="relative w-full overflow-hidden group py-4 rounded-2xl bg-gradient-to-r from-lassi-yellow to-lassi-pink text-slate-950 font-black shadow-xl shadow-lassi-pink/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {placingOrder ? "Processing..." : "Confirm & Pay"}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "verify" | "reset">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLoginRegister = async (e: React.FormEvent) => {
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setMode("verify");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email, otp });
      setMode("reset");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, otp, newPassword });
      alert("Password reset successful! Please login.");
      setMode("login");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-lassi-pink/5 blur-[120px]" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="rounded-[3rem] border border-white/5 bg-black/40 backdrop-blur-3xl p-8 md:p-12 shadow-2xl">
          <div className="mb-10 text-center">
            <div className="h-16 w-16 rounded-[2rem] bg-gradient-to-br from-lassi-yellow to-lassi-pink flex items-center justify-center text-slate-950 font-black text-2xl mx-auto mb-6 shadow-xl">LG</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {mode === "login" && "Welcome Back"}
              {mode === "register" && "Join the Hub"}
              {mode === "forgot" && "Forgot Password?"}
              {mode === "verify" && "Enter OTP"}
              {mode === "reset" && "Safe & Secure"}
            </h1>
            <p className="text-sm text-slate-500">
              {mode === "login" && "Ready for a refreshing break?"}
              {mode === "register" && "Create your digital pass to Lassi Ghar"}
              {mode === "forgot" && "We'll send code to your registered email"}
              {mode === "verify" && `Check your inbox for verify code`}
              {mode === "reset" && "Setup your strong new password"}
            </p>
          </div>

          {mode === "login" || mode === "register" ? (
            <form onSubmit={handleLoginRegister} className="space-y-5">
              {mode === "register" && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                  <input
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/50 transition-all"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/50 transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/50 transition-all"
                />
              </div>
              
              {mode === "login" && (
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => setMode("forgot")}
                    className="text-xs text-lassi-yellow hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-lassi-yellow to-orange-400 text-slate-950 font-black transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
              >
                {loading ? "Authenticating..." : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
          ) : mode === "forgot" ? (
             <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/50 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-lassi-yellow text-slate-950 font-black transition-all"
                >
                  {loading ? "Sending OTP..." : "Send Verification Code"}
                </button>
                <button type="button" onClick={() => setMode("login")} className="w-full text-slate-400 text-xs flex items-center justify-center gap-2">
                  <ArrowLeft className="h-3 w-3" /> Back to Login
                </button>
             </form>
          ) : mode === "verify" ? (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
               <div className="relative">
                 <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                 <input
                   placeholder="Enter 6-digit OTP"
                   value={otp}
                   onChange={(e) => setOtp(e.target.value)}
                   required
                   maxLength={6}
                   className="w-full rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 py-3.5 text-sm font-bold tracking-[0.5em] text-center outline-none focus:ring-2 focus:ring-lassi-yellow/50 transition-all"
                 />
               </div>
               <button
                 type="submit"
                 disabled={loading}
                 className="w-full py-4 rounded-2xl bg-lassi-yellow text-slate-950 font-black transition-all"
               >
                 {loading ? "Verifying..." : "Verify OTP"}
               </button>
               <p className="text-center text-xs text-slate-500">
                 Didn't get code? <button type="button" onClick={handleForgotPassword} className="text-lassi-yellow">Resend</button>
               </p>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
               <div className="relative">
                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                 <input
                   type="password"
                   placeholder="Enter New Password"
                   value={newPassword}
                   onChange={(e) => setNewPassword(e.target.value)}
                   required
                   className="w-full rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/50 transition-all"
                 />
               </div>
               <button
                 type="submit"
                 disabled={loading}
                 className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black transition-all"
               >
                 {loading ? "Resetting..." : "Update Password"}
               </button>
            </form>
          )}

          {(mode === "login" || mode === "register") && (
            <div className="mt-8 pt-8 border-t border-white/5">
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="w-full text-xs text-slate-400 hover:text-white transition-colors"
              >
                {mode === "login" ? "Don't have an account? Start here" : "Already a member? Sign in instead"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
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
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">My Orders</h1>
          <p className="text-slate-500 text-sm">Track your refreshing moments.</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Package className="h-6 w-6 text-lassi-yellow" />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
          <p className="text-slate-500 italic">No orders yet. Treat yourself today!</p>
          <Link to="/menu" className="inline-block mt-4 text-lassi-yellow text-sm font-bold hover:underline">Go to Menu</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <motion.article
              key={o._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="group rounded-3xl border border-white/5 bg-white/5 p-6 hover:bg-white/[0.08] transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                    {o.orderStatus === 'Completed' ? <CheckCircle className="h-6 w-6 text-emerald-400" /> : <Clock className="h-6 w-6" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-tighter">Order #{o._id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-10">
                <div className="text-right">
                  <p className="text-lg font-black text-white">₹{o.totalAmount}</p>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${o.orderStatus === 'Completed' ? 'bg-emerald-400' : 'bg-lassi-yellow'}`} />
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{o.orderStatus}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-700 group-hover:text-white transition-colors" />
              </div>
            </motion.article>
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
  const [price, setPrice] = useState<string>("120");
  const [category, setCategory] = useState("Classic");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get<Product[]>("/products").then(res => setProducts(res.data));
    api.get<Order[]>("/orders", { headers: { Authorization: `Bearer ${token}` } }).then(res => setOrders(res.data));
  }, [token]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("description", description);
      if (image) formData.append("image", image);

      if (editingId) {
        const res = await api.put(`/products/${editingId}`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
        setProducts((prev) => prev.map(p => p._id === editingId ? res.data : p));
        alert("Beverage updated!");
      } else {
        const res = await api.post("/products", formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
        setProducts((prev) => [res.data, ...prev]);
        alert("Beverage added!");
      }
      setName(""); setPrice("120"); setCategory("Classic"); setDescription(""); setImage(null); setImagePreview(null);
      setEditingId(null);
    } catch (err) {
      alert("Failed to add beverage");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id: string, orderStatus: string) => {
    if (!token) return;
    const res = await api.patch(`/orders/${id}/status`, { orderStatus }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setOrders((prev) => prev.map((o) => (o._id === id ? res.data : o)));
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this beverage?")) return;
    if (!token) return;
    try {
      await api.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      alert("Failed to delete beverage");
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p._id);
    setName(p.name);
    setPrice(String(p.price));
    setCategory(p.category);
    setDescription(p.description || "");
    setImagePreview(p.imageUrl || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="py-12 px-6 max-w-7xl mx-auto grid gap-12 lg:grid-cols-[1fr,1.5fr]">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Inventory Management</h2>
          <p className="text-sm text-slate-500">Add new handcrafted beverages to the menu.</p>
        </div>

        <section className="rounded-[2.5rem] border border-white/5 bg-white/5 p-8">
          <form onSubmit={addProduct} className="space-y-6">
            <div className="space-y-4">
              <div className="group relative h-40 w-full rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden hover:border-lassi-yellow/50 transition-colors cursor-pointer">
                 {imagePreview ? (
                    <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                 ) : (
                    <>
                      <Camera className="h-8 w-8 text-slate-500" />
                      <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">Select Beverage Image</p>
                    </>
                 )}
                 <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-tighter ml-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Mango Mastani"
                  className="w-full rounded-2xl bg-black/40 border border-white/10 px-5 py-3 text-sm focus:ring-2 focus:ring-lassi-yellow/50 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-tighter ml-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-2xl bg-black/40 border border-white/10 px-5 py-3 text-sm focus:ring-2 focus:ring-lassi-yellow/50 outline-none transition-all"
                  >
                    <option value="Classic">Classic</option>
                    <option value="Flavored">Fruit Fusion</option>
                    <option value="Seasonal">Seasonal</option>
                    <option value="Combo">Combo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-tighter ml-1">Price (₹)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full rounded-2xl bg-black/40 border border-white/10 px-5 py-3 text-sm focus:ring-2 focus:ring-lassi-yellow/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-tighter ml-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl bg-black/40 border border-white/10 px-5 py-3 text-sm focus:ring-2 focus:ring-lassi-yellow/50 outline-none transition-all resize-none"
                  placeholder="Tell us about the ingredients and taste..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-lassi-yellow text-slate-950 font-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Please wait..." : editingId ? "Update Beverage" : "Add to Inventory"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setName(""); setPrice("120"); setCategory("Classic"); setDescription(""); setImage(null); setImagePreview(null);
                }}
                className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all mt-2"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </section>

        <section className="space-y-4 pt-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-lassi-yellow" />
            Current Menu ({products.length})
          </h3>
          <div className="grid gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {products.map((p) => (
              <div key={p._id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-slate-800 overflow-hidden border border-white/5">
                      {p.imageUrl && <img src={p.imageUrl} className="w-full h-full object-cover" />}
                   </div>
                   <div>
                      <p className="text-sm font-bold text-white leading-tight">{p.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black">{p.category} · ₹{p.price}</p>
                   </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(p)} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-lassi-yellow hover:text-lassi-yellow transition-all">
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteProduct(p._id)} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-red-500 hover:text-red-500 transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-8">
         <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Active Orders</h2>
              <p className="text-sm text-slate-500">Monitor and update delivery status.</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-lassi-pink" />
            </div>
         </div>

         <div className="grid gap-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {orders.length === 0 ? (
               <div className="p-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                 <p className="text-slate-500 italic">No orders received yet.</p>
               </div>
            ) : (
              orders.map(o => (
                <div key={o._id} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex justify-between items-center group hover:border-white/20 transition-all">
                   <div className="space-y-2">
                      <p className="text-white font-bold text-sm tracking-tight uppercase">Order #{o._id.slice(-8)}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{new Date(o.createdAt).toLocaleString()}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status:</span>
                        <select
                          value={o.orderStatus}
                          onChange={(e) => updateOrderStatus(o._id, e.target.value)}
                          className={`bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-[10px] font-bold uppercase outline-none focus:ring-1 focus:ring-lassi-yellow/50 ${
                            o.orderStatus === 'Completed' ? 'text-emerald-400' : 'text-lassi-yellow'
                          }`}
                        >
                          <option value="Processing">Processing</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xl font-black text-white">₹{o.totalAmount}</p>
                      <p className="text-[10px] text-slate-600 font-mono italic">{o.paymentStatus}</p>
                   </div>
                </div>
              ))
            )}
         </div>
      </div>
    </div>
  );
}

function ChatbotWidget() {
  const token = localStorage.getItem("token");
  const [open, setOpen] = useState(false);
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendToBot = async (body: any, userEcho?: string) => {
    if (userEcho) setMessages((prev) => [...prev, { sender: "user", text: userEcho }]);
    setSending(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await api.post("/chatbot", body, { headers });
      const { reply, options, data = {} } = res.data;

      if (data?.cartAdd?.productId) {
        const { productId, quantity } = data.cartAdd;
        setChatCart((prev) => {
          const existing = prev.find((c) => c.productId === productId);
          if (existing) return prev.map((c) => c.productId === productId ? { ...c, quantity: c.quantity + Number(quantity || 1) } : c);
          return [...prev, { productId, quantity: Number(quantity || 1) }];
        });
      }
      if (data?.orderCreated) setChatCart([]);
      setMessages((prev) => [...prev, { sender: "bot", text: reply, options }]);
    } catch {
      setMessages((prev) => [...prev, { sender: "bot", text: "Something went wrong. Let's try that again?" }]);
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

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
           <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-96 h-[550px] rounded-[2.5rem] border border-white/10 bg-black/80 backdrop-blur-2xl shadow-3xl flex flex-col overflow-hidden"
          >
            <div className="bg-gradient-to-r from-lassi-yellow/20 to-lassi-pink/20 p-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-lassi-yellow to-lassi-pink flex items-center justify-center text-slate-950 font-black shadow-lg">LG</div>
                <div>
                  <h3 className="text-white font-bold leading-none mb-1">AI Assistant</h3>
                  <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" /> Live Support
                  </p>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] space-y-3 ${m.sender === "user" ? "text-right" : "text-left"}`}>
                    <div className={`inline-block px-5 py-3 text-sm rounded-[1.5rem] leading-relaxed ${
                      m.sender === "user" 
                        ? "bg-lassi-yellow text-slate-950 font-bold rounded-tr-none shadow-lg shadow-lassi-yellow/10" 
                        : "bg-white/5 text-slate-200 rounded-tl-none border border-white/10"
                    }`}>
                      {m.text}
                    </div>
                    {m.sender === "bot" && m.options && m.options.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {m.options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => sendToBot({ action: opt.action, payload: { ...(opt.payload || {}), cart: opt.action === "PLACE_ORDER" ? chatCart : undefined } }, opt.label)}
                            disabled={sending}
                            className="text-[10px] px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-lassi-yellow/50 text-slate-300 font-bold uppercase tracking-wider transition-all disabled:opacity-50"
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

            <div className="p-4 border-t border-white/5 bg-black/40">
              <div className="flex items-center gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-lassi-yellow/40 transition-all placeholder:text-slate-600"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="h-11 w-11 rounded-2xl bg-lassi-yellow text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-3xl transition-all duration-500 transform hover:rotate-12 active:scale-90 ${
          open 
            ? "bg-white text-slate-950 rotate-90" 
            : "bg-gradient-to-r from-lassi-yellow to-lassi-pink text-slate-950"
        }`}
      >
        {open ? <XCircle className="h-8 w-8" /> : <MessageCircle className="h-8 w-8" />}
      </button>
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
