import { useMemo, useState } from "react";
import { ArrowRight, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import { foodTags, foods, type Food, type FoodTag } from "../food";

const filters = ["All", ...foodTags] as const;
type Filter = (typeof filters)[number];

function App() {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);

  const visibleFoods = useMemo(() => foods.filter((food) => {
    const matchesFilter = filter === "All" || food.tags.includes(filter as FoodTag);
    const searchable = `${food.name} ${food.description} ${food.tags.join(" ")}`.toLowerCase();
    return matchesFilter && searchable.includes(query.toLowerCase());
  }), [filter, query]);

  const cartItems = foods.filter((food) => cart[food.id]);
  const cartCount = Object.values(cart).reduce((sum, amount) => sum + amount, 0);
  const total = cartItems.reduce((sum, food) => sum + food.price * cart[food.id], 0);

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
          <div className="section-heading"><div><p className="eyebrow">21 things worth sharing</p><h2>Our menu</h2></div><label className="search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search menu" aria-label="Search menu" /></label></div>
          <div className="filters d-flex flex-wrap">{filters.map((tag) => <button className={`btn ${filter === tag ? "active" : "btn-light"}`} key={tag} onClick={() => setFilter(tag)}>{tag}</button>)}</div>
          <div className="food-grid">{visibleFoods.map((food) => <article className="food-card" key={food.id}><div className="food-image"><img src={`/images/${food.image}`} alt={food.name} loading="lazy" /><button className="add-button" onClick={() => add(food)} aria-label={`Add ${food.name}`}><Plus size={18} /></button></div><div className="food-info"><div className="food-title"><h3>{food.name}</h3><span>${food.price.toFixed(2)}</span></div><p>{food.description}</p><div className="tags">{food.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div></div></article>)}</div>
          {visibleFoods.length === 0 && <p className="empty">No dishes match that search.</p>}
        </section>

        <section className="story" id="story"><p className="eyebrow">A little about us</p><h2>Food tastes better<br /><em>when shared.</em></h2><p>Gather is a neighborhood kitchen built around one simple idea: a meal can turn a day around. We source close, cook with care, and always leave room for dessert.</p></section>
        <footer id="visit"><span>nebraska table</span><p>Open daily · 11am — 10pm</p><p>14 Orchard Street · Lincoln, Nebraska</p></footer>
      </main>

      {cartOpen && <div className="overlay" onClick={() => setCartOpen(false)}><aside className="cart" onClick={(event) => event.stopPropagation()}><div className="cart-head"><div><p className="eyebrow">Your order</p><h2>In the bag</h2></div><button onClick={() => setCartOpen(false)} aria-label="Close order"><X /></button></div>{cartItems.length === 0 ? <div className="cart-empty"><ShoppingBag size={34} /><p>Your bag is empty.</p><button onClick={() => setCartOpen(false)}>Browse menu</button></div> : <><div className="cart-items">{cartItems.map((food) => <div className="cart-item" key={food.id}><img src={`/images/${food.image}`} alt="" /><div><h3>{food.name}</h3><p>${food.price.toFixed(2)}</p><div className="quantity"><button onClick={() => remove(food)} aria-label={`Remove one ${food.name}`}><Minus size={13} /></button><span>{cart[food.id]}</span><button onClick={() => add(food)} aria-label={`Add one ${food.name}`}><Plus size={13} /></button></div></div></div>)}</div><div className="cart-total"><span>Total</span><strong>${total.toFixed(2)}</strong></div><button className="checkout">Checkout <ArrowRight size={17} /></button></>}</aside></div>}
    </div>
  );
}

export default App;
