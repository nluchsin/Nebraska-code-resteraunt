import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import { z } from "zod";
import { foodTags, foods, type Food } from "../food";

const filters = ["All", ...foodTags] as const;
type Filter = (typeof filters)[number];
const filterSchema = z.enum(filters);
const querySchema = z.string().trim().max(100).catch("");

function filtersFromUrl(): Filter[] {
  const value = new URLSearchParams(window.location.search).get("tag");
  if (!value) return ["All"];
  const parsed = value.split(",").map((tag) => filterSchema.safeParse(tag.trim())).filter((result) => result.success).map((result) => result.data);
  const unique = [...new Set(parsed)];
  return unique.length && !unique.includes("All") ? unique : ["All"];
}

function queryFromUrl(): string {
  return querySchema.parse(new URLSearchParams(window.location.search).get("q") ?? "");
}

function App() {
  const [selectedTags, setSelectedTags] = useState<Filter[]>(filtersFromUrl);
  const [query, setQuery] = useState(queryFromUrl);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  const visibleFoods = useMemo(() => foods.filter((food) => {
    const matchesFilter = selectedTags.includes("All") || food.tags.some((tag) => selectedTags.includes(tag));
    const searchable = `${food.name} ${food.description} ${food.tags.join(" ")}`.toLowerCase();
    const searchTerms = query.split(",").map((term) => term.trim().toLowerCase()).filter(Boolean);
    const matchesSearch = searchTerms.length === 0 || searchTerms.some((term) => searchable.includes(term));
    return matchesFilter && matchesSearch;
  }), [selectedTags, query]);

  const cartItems = foods.filter((food) => cart[food.id]);
  const cartCount = Object.values(cart).reduce((sum, amount) => sum + amount, 0);
  const total = cartItems.reduce((sum, food) => sum + food.price * cart[food.id], 0);

  useEffect(() => {
    const syncUrlState = () => {
      setSelectedTags(filtersFromUrl());
      setQuery(queryFromUrl());
    };
    window.addEventListener("popstate", syncUrlState);
    return () => window.removeEventListener("popstate", syncUrlState);
  }, []);

  const updateFilter = (nextFilter: Filter) => {
    const nextTags = nextFilter === "All"
      ? ["All"] as Filter[]
      : selectedTags.includes(nextFilter)
        ? selectedTags.filter((tag) => tag !== nextFilter)
        : [...selectedTags.filter((tag) => tag !== "All"), nextFilter];
    const normalizedTags = (nextTags.length ? nextTags : ["All"]) as Filter[];
    setSelectedTags(normalizedTags);
    const params = new URLSearchParams(window.location.search);
    if (normalizedTags.includes("All")) params.delete("tag");
    else params.set("tag", normalizedTags.join(","));
    const queryString = params.toString();
    window.history.pushState({}, "", `${window.location.pathname}${queryString ? `?${queryString}` : ""}`);
  };

  const updateQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    const params = new URLSearchParams(window.location.search);
    const validQuery = querySchema.parse(nextQuery);
    if (validQuery) params.set("q", validQuery);
    else params.delete("q");
    const queryString = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${queryString ? `?${queryString}` : ""}`);
  };

  const browseMenu = () => {
    setCartOpen(false);
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  };

  const add = (food: Food) => setCart((current) => ({ ...current, [food.id]: (current[food.id] ?? 0) + 1 }));
  const remove = (food: Food) => setCart((current) => {
    const next = { ...current };
    if ((next[food.id] ?? 0) > 1) next[food.id] -= 1;
    else delete next[food.id];
    return next;
  });

  return (
    <div className="app">
      <header className="topbar container">
        <a className="brand" href="#top"><span className="brand-mark">N</span><span>nebraska table</span></a>
        <nav><a href="#menu">Menu</a><a href="#story">Our story</a><a href="#visit">Visit us</a></nav>
        <button className="cart-button" onClick={() => setCartOpen(true)} aria-label="Open order"><ShoppingBag size={18} /><span>Order</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
      </header>

      <main id="top">
        <section className="hero landing-hero">
          <img className="landing-photo" src="/images/nebraska-sandhills.jpg" alt="Nebraska Sandhills landscape" />
          <div className="landing-overlay" />
          <div className="hero-copy">
            <p className="eyebrow">Nebraska · Since 2018</p>
            <h1>Nebraska<br /><em>Table</em></h1>
            <p className="hero-text">Seasonal food, open skies, and a table ready for you.</p>
            <a className="primary-link" href="#menu">See the menu <ArrowRight size={17} /></a>
          </div>
          <blockquote className="cather-quote">“There was nothing but land; not a country at all, but the material out of which countries are made.”<cite>— Willa Cather, <i>My Ántonia</i></cite></blockquote>
          <p className="photo-credit">Sand Hills of Nebraska · NASA/METI/AIST/Japan Space Systems · Public domain</p>
        </section>

        <section className="menu-section" id="menu">
          <div className="section-heading"><div><p className="eyebrow">21 things worth sharing</p><h2>Our menu</h2></div><label className="search"><Search size={17} /><input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Search menu" aria-label="Search menu" /></label></div>
          <div className="filters d-flex flex-wrap">{filters.map((tag) => <button className={`btn ${selectedTags.includes(tag) ? "active" : "btn-light"}`} key={tag} onClick={() => updateFilter(tag)}>{tag}</button>)}</div>
          <div className="food-grid">{visibleFoods.map((food) => <article className="food-card" key={food.id} onClick={() => setSelectedFood(food)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedFood(food); }} role="button" tabIndex={0} aria-label={`View ${food.name}`}><div className="food-image"><img src={`/images/${food.image}`} alt={food.name} loading="lazy" /><div className="item-quantity" onClick={(event) => event.stopPropagation()}><button className="quantity-button" disabled={!cart[food.id]} onClick={() => remove(food)} aria-label={`Remove one ${food.name}`}><Minus size={16} /></button><span className="quantity-value">{cart[food.id] ?? 0}</span><button className="quantity-button add-button" onClick={() => add(food)} aria-label={`Add ${food.name}`}><Plus size={18} /></button></div></div><div className="food-info"><div className="food-title"><h3>{food.name}</h3><span>${food.price.toFixed(2)}</span></div><p>{food.description}</p><div className="tags">{food.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div></div></article>)}</div>
          {visibleFoods.length === 0 && <p className="empty">No dishes match that search.</p>}
        </section>

        <section className="story" id="story"><p className="eyebrow">A little about us</p><h2>Food tastes better<br /><em>when shared.</em></h2><p>Gather is a neighborhood kitchen built around one simple idea: a meal can turn a day around. We source close, cook with care, and always leave room for dessert.</p></section>
        <footer id="visit"><span>nebraska table</span><p>Open daily · 11am — 10pm</p><p>14 Orchard Street · Lincoln, Nebraska</p></footer>
      </main>

      {cartOpen && <div className="overlay" onClick={() => setCartOpen(false)}><aside className="cart" onClick={(event) => event.stopPropagation()}><div className="cart-head"><div><p className="eyebrow">Your order</p><h2>In the bag</h2></div><button onClick={() => setCartOpen(false)} aria-label="Close order"><X /></button></div>{cartItems.length === 0 ? <div className="cart-empty"><ShoppingBag size={34} /><p>Your bag is empty.</p><button onClick={browseMenu}>Browse menu</button></div> : <><div className="cart-items">{cartItems.map((food) => <div className="cart-item" key={food.id}><img src={`/images/${food.image}`} alt="" /><div><h3>{food.name}</h3><p>${food.price.toFixed(2)}</p><div className="quantity"><button onClick={() => remove(food)} aria-label={`Remove one ${food.name}`}><Minus size={13} /></button><span>{cart[food.id]}</span><button onClick={() => add(food)} aria-label={`Add one ${food.name}`}><Plus size={13} /></button></div></div></div>)}</div><div className="cart-total"><span>Total</span><strong>${total.toFixed(2)}</strong></div><button className="checkout">Checkout <ArrowRight size={17} /></button></>}</aside></div>}
      {selectedFood && <div className="food-detail-overlay" onClick={() => setSelectedFood(null)}><article className="food-detail" onClick={(event) => event.stopPropagation()}><button className="food-detail-close" onClick={() => setSelectedFood(null)} aria-label="Close item"><X /></button><img src={`/images/${selectedFood.image}`} alt={selectedFood.name} /><div className="food-detail-copy"><p className="eyebrow">{selectedFood.tags.join(" · ")}</p><h2>{selectedFood.name}</h2><p className="food-detail-description">{selectedFood.description}</p><div className="food-detail-footer"><strong>${selectedFood.price.toFixed(2)}</strong><div className="item-quantity detail-quantity"><button className="quantity-button" disabled={!cart[selectedFood.id]} onClick={() => remove(selectedFood)} aria-label={`Remove one ${selectedFood.name}`}><Minus size={17} /></button><span className="quantity-value">{cart[selectedFood.id] ?? 0}</span><button className="quantity-button add-button" onClick={() => add(selectedFood)} aria-label={`Add ${selectedFood.name}`}><Plus size={18} /></button></div></div></div></article></div>}
    </div>
  );
}

export default App;
