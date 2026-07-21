import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import type { Cart } from "../types";
import { formatCurrency } from "../utils";

export function CartPage() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const cartQuery = useQuery({ queryKey: ["cart"], queryFn: () => api<{ cart: Cart }>("/market/cart", {}, token ?? undefined) });
  const updateItem = useMutation({ mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) => api("/market/cart/items", { method: "POST", body: JSON.stringify({ productId, quantity }) }, token ?? undefined), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["cart"] }); } });
  const removeItem = useMutation({ mutationFn: (productId: string) => api(`/market/cart/items/${productId}`, { method: "DELETE" }, token ?? undefined), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["cart"] }); } });

  const cart = cartQuery.data?.cart;

  return (
    <div className="container page-stack">
      <section className="panel">
        <span className="eyebrow">Cart</span>
        <h1>Review MLBB marketplace items</h1>
        <p className="kicker">Checkout creates a mock escrow order. It does not process a real payment.</p>
      </section>
      <section className="panel">
        {cart?.items.length ? cart.items.map((item) => (
          <div key={item.productId} className="card" style={{ marginBottom: "0.75rem" }}>
            <div className="three-grid" style={{ alignItems: "center" }}>
              <div>
                <strong>{item.title}</strong>
                <div className="kicker">{item.game}</div>
              </div>
              <div className="helper-row">
                <button className="buttonGhost" onClick={() => updateItem.mutate({ productId: item.productId, quantity: Math.max(1, item.quantity - 1) })}>-</button>
                <span>{item.quantity}</span>
                <button className="buttonGhost" onClick={() => updateItem.mutate({ productId: item.productId, quantity: item.quantity + 1 })}>+</button>
              </div>
              <div className="helper-row" style={{ justifyContent: "space-between" }}>
                <strong>{formatCurrency(item.price * item.quantity)}</strong>
                <button className="buttonDanger" onClick={() => removeItem.mutate(item.productId)}>Remove</button>
              </div>
            </div>
          </div>
        )) : <div className="empty">Your cart is empty.</div>}
      </section>
      <section className="panel helper-row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="kicker">Subtotal</div>
          <strong style={{ fontSize: "2rem" }}>{formatCurrency(cart?.subtotal ?? 0)}</strong>
        </div>
        <Link className="button" to="/checkout">Mock escrow checkout</Link>
      </section>
    </div>
  );
}
