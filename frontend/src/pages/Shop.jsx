import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { categories } from "../data/mockData";
import api from "../lib/api";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get("category") || "all";
  const searchTerm = params.get("search") || "";
  const [searchInput, setSearchInput] = useState(searchTerm);
  const [sort, setSort] = useState("featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Keep the search box in sync if the URL changes from elsewhere (e.g. the navbar)
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (activeCategory !== "all") qs.set("category", activeCategory);
    if (searchTerm) qs.set("search", searchTerm);
    if (sort !== "featured") qs.set("sort", sort);
    if (minPrice) qs.set("minPrice", minPrice);
    if (maxPrice) qs.set("maxPrice", maxPrice);
    if (inStockOnly) qs.set("inStock", "true");
    qs.set("limit", "60");
    api
      .get(`/products?${qs.toString()}`)
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [activeCategory, searchTerm, sort, minPrice, maxPrice, inStockOnly]);

  const filtered = useMemo(() => products, [products]);

  const setCategory = (id) => {
    if (id === "all") {
      params.delete("category");
      setParams(params);
    } else {
      params.set("category", id);
      setParams(params);
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (searchInput.trim()) next.set("search", searchInput.trim());
    else next.delete("search");
    setParams(next);
  };

  const clearSearch = () => {
    const next = new URLSearchParams(params);
    next.delete("search");
    setParams(next);
  };

  const clearFilters = () => {
    setSort("featured");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    const next = new URLSearchParams(params);
    next.delete("category");
    next.delete("search");
    setParams(next);
  };

  const hasActiveFilters =
    activeCategory !== "all" ||
    searchTerm ||
    minPrice ||
    maxPrice ||
    inStockOnly ||
    sort !== "featured";

  return (
    <div className="px-5 md:px-10 py-10">
      <div className="mb-8">
        <p className="eyebrow text-muted mb-2">Catalog</p>
        <h1 className="font-display text-3xl">Shop the collection</h1>
      </div>

      {/* In-page search, in addition to the navbar search */}
      <form
        onSubmit={submitSearch}
        className="flex items-center gap-2 mb-6 max-w-lg"
      >
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search products..."
          className="flex-1 px-4 py-2.5 border border-line text-sm outline-none focus-visible:border-ink"
        />
        <button type="submit" className="px-5 py-2.5 bg-ink text-bg text-sm">
          Search
        </button>
      </form>

      {searchTerm && (
        <div className="mb-6 flex items-center gap-2 text-sm">
          <span className="text-muted">
            Showing results for{" "}
            <span className="text-ink font-medium">"{searchTerm}"</span>
          </span>
          <button
            onClick={clearSearch}
            className="eyebrow underline text-muted hover:text-ink"
          >
            Clear
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-6 mb-8 pb-4 border-b border-line">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`eyebrow px-3 py-1.5 border rounded-full ${activeCategory === "all" ? "bg-ink text-bg border-ink" : "border-line"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`eyebrow px-3 py-1.5 border rounded-full ${activeCategory === c.id ? "bg-ink text-bg border-ink" : "border-line"}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Price range filter */}
          <div className="flex items-center gap-1.5 text-sm">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-20 px-2 py-1.5 border border-line text-sm outline-none"
            />
            <span className="text-muted">–</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-20 px-2 py-1.5 border border-line text-sm outline-none"
            />
          </div>

          {/* In-stock filter */}
          <label className="flex items-center gap-1.5 text-sm eyebrow text-muted">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            In stock only
          </label>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-bg border border-line text-sm px-3 py-1.5"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to high</option>
            <option value="price-desc">Price: High to low</option>
            <option value="rating">Top rated</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="eyebrow underline text-muted hover:text-ink"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {!loading && (
        <p className="text-xs text-muted mb-4">
          {total} result{total === 1 ? "" : "s"}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {loading && (
        <p className="text-muted text-sm py-20 text-center">
          Loading products…
        </p>
      )}
      {!loading && filtered.length === 0 && (
        <p className="text-muted text-sm py-20 text-center">
          No products match {searchTerm ? `"${searchTerm}"` : "these filters"}.
        </p>
      )}
    </div>
  );
}
