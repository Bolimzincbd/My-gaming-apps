import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import type { Cart } from "../types";
import { formatCurrency } from "../utils";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const cartQuery = useQuery({ queryKey: ["checkout-cart"], queryFn: () => api<{ cart: Cart }>("/market/cart", {}, token ?? undefined) });
  const checkout = useMutation({
    mutationFn: () => api("/market/checkout", { method: "POST", body: JSON.stringify({ paymentMethod: "Mock secure wallet" }) }, token ?? undefined),
    onSuccess: () => navigate("/orders")
  });

  const subtotal = cartQuery.data?.cart.subtotal ?? 0;

  return (
    <div className="container page-stack">
      <section className="panel">
        <span className="eyebrow">Mock escrow checkout</span>
        <h1>Secure funds for demo order</h1>
        <p className="kicker">The platform records pending_payment and escrow_secured for a university workflow demo. No bank, wallet, or real escrow provider is connected.</p>
      </section>

      <section className="two-col">
        <div className="panel page-stack">
          <div className="section-title"><h2>Order items</h2></div>
          {cartQuery.data?.cart.items.length ? cartQuery.data.cart.items.map((item) => (
            <div key={item.productId} className="card helper-row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{item.title}</strong>
                <div className="kicker">{item.game} | Qty {item.quantity}</div>
              </div>
              <strong>{formatCurrency(item.price * item.quantity)}</strong>
            </div>
          )) : <div className="empty">Your cart is empty.</div>}
          <div className="card helper-row" style={{ justifyContent: "space-between" }}>
            <div>
              <strong>Payment rail</strong>
              <div className="kicker">Mock secure wallet</div>
            </div>
            <div>
              <div className="kicker">Total</div>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
          </div>
          <div className="helper-row">
            <button className="button" disabled={!cartQuery.data?.cart.items.length || checkout.isPending} onClick={() => checkout.mutate()}>{checkout.isPending ? "Creating mock escrow..." : "Create mock escrow order"}</button>
            <Link className="buttonGhost" to="/cart">Back to cart</Link>
          </div>
          {checkout.isError && <div className="error-text">{(checkout.error as Error).message}</div>}
        </div>

        <div className="panel">
          <div className="section-title"><h2>Status timeline</h2></div>
          <div className="order-timeline">
            <div className="timeline-item"><strong className="mono">pending_payment</strong><span className="kicker">Checkout begins in the demo system.</span></div>
            <div className="timeline-item"><strong className="mono">escrow_secured</strong><span className="kicker">Mock funds are recorded as secured immediately.</span></div>
            <div className="timeline-item"><strong className="mono">seller_delivering</strong><span className="kicker">Seller starts delivering the MLBB service or digital item.</span></div>
            <div className="timeline-item"><strong className="mono">delivered</strong><span className="kicker">Buyer can confirm delivery or open a dispute.</span></div>
          </div>
        </div>
      </section>
    </div>
  );
}
