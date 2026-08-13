"use client";

import { FormEvent, useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  slug: string;
  variety: string;
  tagline: string;
  description: string;
  shortDesc: string;
  pricePerKg: string | number;
  stockKg: string | number;
  isAvailable: boolean;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  async function loadProducts() {
    try {
      setLoading(true);

      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new Error("Failed to load products");
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const product = {
      slug: formData.get("slug"),
      name: formData.get("name"),
      variety: formData.get("variety"),
      tagline: formData.get("tagline"),
      description: formData.get("description"),
      shortDesc: formData.get("shortDesc"),
      pricePerKg: Number(formData.get("pricePerKg")),
      stockKg: Number(formData.get("stockKg")),
      images: [],
    };

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create product.");
        return;
      }

      setMessage(`Product "${data.name}" created successfully.`);

      form.reset();

      await loadProducts();
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingProduct) {
      return;
    }

    setMessage("");
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const updatedProduct = {
      id: editingProduct.id,
      slug: formData.get("slug"),
      name: formData.get("name"),
      variety: formData.get("variety"),
      tagline: formData.get("tagline"),
      description: formData.get("description"),
      shortDesc: formData.get("shortDesc"),
      pricePerKg: Number(formData.get("pricePerKg")),
      stockKg: Number(formData.get("stockKg")),
      isAvailable: formData.get("isAvailable") === "true",
      images: [],
    };

    try {
      const response = await fetch("/api/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProduct),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update product.");
        return;
      }

      setMessage(`Product "${data.name}" updated successfully.`);

      setEditingProduct(null);

      await loadProducts();
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    }
  }

  function startEditing(product: Product) {
    setMessage("");
    setError("");
    setEditingProduct(product);
  }

    async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: product.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete product.");
        return;
      }

      setMessage(data.message || "Product deleted successfully.");

      if (editingProduct?.id === product.id) {
        setEditingProduct(null);
      }

      await loadProducts();
    } catch (error) {
      console.error(error);
      setError("Something went wrong while deleting the product.");
    }
  }

  function cancelEditing() {
    setEditingProduct(null);
    setMessage("");
    setError("");
  }

  return (
    <main>
      <h1>Product Management</h1>

      {message && <p>{message}</p>}

      {error && <p>{error}</p>}

      <section>
        <h2>Create Product</h2>

        <form onSubmit={handleCreate}>
          <input
            name="name"
            placeholder="Product name"
            required
          />

          <input
            name="slug"
            placeholder="Slug"
            required
          />

          <select name="variety" required defaultValue="">
            <option value="" disabled>
              Select variety
            </option>

            <option value="ROYAL_DELICIOUS">
              Royal Delicious
            </option>

            <option value="RED_DELICIOUS">
              Red Delicious
            </option>

            <option value="GOLDEN_DELICIOUS">
              Golden Delicious
            </option>

            <option value="DARK_BARON">
              Dark Baron
            </option>

            <option value="FUJI">
              Fuji
            </option>

            <option value="GRANNY_SMITH">
              Granny Smith
            </option>
          </select>

          <input
            name="tagline"
            placeholder="Tagline"
            required
          />

          <textarea
            name="shortDesc"
            placeholder="Short description"
            required
          />

          <textarea
            name="description"
            placeholder="Full description"
            required
          />

          <input
            name="pricePerKg"
            type="number"
            step="0.01"
            placeholder="Price per kg"
            required
          />

          <input
            name="stockKg"
            type="number"
            step="0.01"
            placeholder="Stock in kg"
            required
          />

          <button type="submit">
            Create Product
          </button>
        </form>
      </section>

      <section>
        <h2>Products</h2>

        {loading && <p>Loading products...</p>}

        {!loading && products.length === 0 && (
          <p>No products found.</p>
        )}

        {!loading && products.length > 0 && (
          <div>
            {products.map((product) => (
              <article key={product.id}>
                <h3>{product.name}</h3>

                <p>
                  Product ID: {product.id}
                </p>

                <p>
                  Variety: {product.variety}
                </p>

                <p>
                  Price: ₹{product.pricePerKg}/kg
                </p>

                <p>
                  Stock: {product.stockKg} kg
                </p>

                <p>
                  Status:{" "}
                  {product.isAvailable
                    ? "Available"
                    : "Unavailable"}
                </p>

                <button
                  type="button"
                  onClick={() => startEditing(product)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product)}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {editingProduct && (
        <section>
          <h2>Edit Product</h2>

          <p>
            Editing: <strong>{editingProduct.name}</strong>
            {" — ID: "}
            {editingProduct.id}
          </p>

          <form onSubmit={handleUpdate}>
            <input
              name="name"
              defaultValue={editingProduct.name}
              placeholder="Product name"
              required
            />

            <input
              name="slug"
              defaultValue={editingProduct.slug}
              placeholder="Slug"
              required
            />

            <select
              name="variety"
              defaultValue={editingProduct.variety}
              required
            >
              <option value="ROYAL_DELICIOUS">
                Royal Delicious
              </option>

              <option value="RED_DELICIOUS">
                Red Delicious
              </option>

              <option value="GOLDEN_DELICIOUS">
                Golden Delicious
              </option>

              <option value="DARK_BARON">
                Dark Baron
              </option>

              <option value="FUJI">
                Fuji
              </option>

              <option value="GRANNY_SMITH">
                Granny Smith
              </option>
            </select>

            <input
              name="tagline"
              defaultValue={editingProduct.tagline}
              placeholder="Tagline"
              required
            />

            <textarea
              name="shortDesc"
              defaultValue={editingProduct.shortDesc}
              placeholder="Short description"
              required
            />

            <textarea
              name="description"
              defaultValue={editingProduct.description}
              placeholder="Full description"
              required
            />

            <input
              name="pricePerKg"
              type="number"
              step="0.01"
              defaultValue={editingProduct.pricePerKg}
              placeholder="Price per kg"
              required
            />

            <input
              name="stockKg"
              type="number"
              step="0.01"
              defaultValue={editingProduct.stockKg}
              placeholder="Stock in kg"
              required
            />

            <select
              name="isAvailable"
              defaultValue={
                editingProduct.isAvailable
                  ? "true"
                  : "false"
              }
            >
              <option value="true">
                Available
              </option>

              <option value="false">
                Unavailable
              </option>
            </select>

            <button type="submit">
              Save Changes
            </button>

            <button
              type="button"
              onClick={cancelEditing}
            >
              Cancel
            </button>
          </form>
        </section>
      )}
    </main>
  );
}