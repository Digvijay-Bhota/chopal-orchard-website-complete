"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  batchCode: string | null;
  quantityKg: string | number;
  unitPrice: string | number;
  totalPrice: string | number;
  product: {
    id: string;
    name: string;
    variety: string;
  };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentId: string | null;
  paymentMethod: string | null;
  subtotal: string | number;
  shippingCost: string | number;
  tax: string | number;
  total: string | number;
  currency: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  shippingPhone: string;
  deliveryDate: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;

  items: OrderItem[];
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CANCELLED"],

  CONFIRMED: [
    "PROCESSING",
    "CANCELLED",
  ],

  PROCESSING: [
    "PACKED",
    "CANCELLED",
  ],

  PACKED: [
    "SHIPPED",
    "CANCELLED",
  ],

  SHIPPED: [
    "OUT_FOR_DELIVERY",
  ],

  OUT_FOR_DELIVERY: [
    "DELIVERED",
  ],

  DELIVERED: [],

  CANCELLED: [],

  REFUNDED: [],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);

  const [savingDelivery, setSavingDelivery] =
    useState(false);

  const [deliveryDate, setDeliveryDate] =
    useState("");

  const [trackingNumber, setTrackingNumber] =
    useState("");

  const [trackingUrl, setTrackingUrl] =
    useState("");

  const [notes, setNotes] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/orders");

      if (!response.ok) {
        throw new Error("Failed to load orders");
      }

      const data = await response.json();

      setOrders(data);
    } catch (error) {
      console.error(error);
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function getCustomerName(order: Order) {
    if (order.guestName) {
      return order.guestName;
    }

    if (order.user) {
      const fullName =
        `${order.user.firstName ?? ""} ${
          order.user.lastName ?? ""
        }`.trim();

      if (fullName) {
        return fullName;
      }

      if (order.user.email) {
        return order.user.email;
      }
    }

    return "Guest";
  }

  function formatMoney(
    amount: string | number,
    currency: string
  ) {
    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount)) {
      return `${currency} 0.00`;
    }

    return `${currency} ${numericAmount.toFixed(2)}`;
  }

  function getAvailableStatuses(
    currentStatus: string,
    paymentStatus: string
  ) {
    const statuses =
      ALLOWED_TRANSITIONS[currentStatus] || [];

    if (
      currentStatus === "PENDING" &&
      paymentStatus !== "COMPLETED"
    ) {
      return ["CANCELLED"];
    }

    return statuses;
  }

  function populateDeliveryFields(order: Order) {
    if (order.deliveryDate) {
      const date = new Date(order.deliveryDate);

      if (!Number.isNaN(date.getTime())) {
        setDeliveryDate(
          date.toISOString().slice(0, 10)
        );
      } else {
        setDeliveryDate("");
      }
    } else {
      setDeliveryDate("");
    }

    setTrackingNumber(
      order.trackingNumber || ""
    );

    setTrackingUrl(
      order.trackingUrl || ""
    );

    setNotes(order.notes || "");
  }

  async function updateOrderStatus(
    orderId: string,
    status: string
  ) {
    try {
      setError("");
      setUpdatingOrderId(orderId);

      const response = await fetch(
        `/api/orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update order status"
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: data.order.status,
                updatedAt:
                  data.order.updatedAt ??
                  order.updatedAt,
              }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((current) =>
          current
            ? {
                ...current,
                status: data.order.status,
                updatedAt:
                  data.order.updatedAt ??
                  current.updatedAt,
              }
            : current
        );
      }
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update order status."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function saveDeliveryInformation() {
    if (!selectedOrder) {
      return;
    }

    try {
      setError("");
      setSavingDelivery(true);

      const response = await fetch(
        `/api/orders/${selectedOrder.id}/delivery`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deliveryDate:
              deliveryDate || null,

            trackingNumber:
              trackingNumber.trim() || null,

            trackingUrl:
              trackingUrl.trim() || null,

            notes:
              notes.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update delivery information"
        );
      }

      const updatedOrder =
        data.order as Order;

      setSelectedOrder(updatedOrder);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === updatedOrder.id
            ? updatedOrder
            : order
        )
      );

      populateDeliveryFields(
        updatedOrder
      );

      setError("");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update delivery information."
      );
    } finally {
      setSavingDelivery(false);
    }
  }

  function viewOrder(order: Order) {
    console.log(
      "VIEW ORDER CLICKED:",
      order
    );

    setSelectedOrder(order);

    populateDeliveryFields(order);

    window.setTimeout(() => {
      document
        .getElementById("order-details")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  function closeOrderDetails() {
    setSelectedOrder(null);

    setDeliveryDate("");
    setTrackingNumber("");
    setTrackingUrl("");
    setNotes("");
  }

  return (
    <main>
      <h1>Order Management</h1>

      {loading && (
        <p>Loading orders...</p>
      )}

      {error && (
        <p
          style={{
            color: "red",
            background: "#fee2e2",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          {error}
        </p>
      )}

      {/* ================================================== */}
      {/* SELECTED ORDER DETAILS */}
      {/* ================================================== */}

      {selectedOrder && (
        <section
          id="order-details"
          style={{
            border: "3px solid #000",
            padding: "24px",
            marginBottom: "30px",
          }}
        >
          <h2>Order Details</h2>

          <h3>
            #{selectedOrder.orderNumber}
          </h3>

          <p>
            Status:{" "}
            <strong>
              {selectedOrder.status}
            </strong>
          </p>

          <p>
            Payment Status:{" "}
            <strong>
              {selectedOrder.paymentStatus}
            </strong>
          </p>

          {selectedOrder.paymentId && (
            <p>
              Payment ID:{" "}
              {selectedOrder.paymentId}
            </p>
          )}

          {selectedOrder.paymentMethod && (
            <p>
              Payment Method:{" "}
              {selectedOrder.paymentMethod}
            </p>
          )}

          {/* ================================================== */}
          {/* STATUS CONTROL */}
          {/* ================================================== */}

          {getAvailableStatuses(
            selectedOrder.status,
            selectedOrder.paymentStatus
          ).length > 0 && (
            <div
              style={{
                marginTop: "20px",
                marginBottom: "20px",
              }}
            >
              <label
                htmlFor="selected-order-status"
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                Update Order Status
              </label>

              <select
                id="selected-order-status"
                value=""
                disabled={
                  updatingOrderId ===
                  selectedOrder.id
                }
                onChange={(event) => {
                  const newStatus =
                    event.target.value;

                  if (!newStatus) {
                    return;
                  }

                  updateOrderStatus(
                    selectedOrder.id,
                    newStatus
                  );
                }}
                style={{
                  padding: "10px",
                  minWidth: "220px",
                  border:
                    "1px solid #999",
                  borderRadius: "6px",
                }}
              >
                <option value="">
                  Select next status...
                </option>

                {getAvailableStatuses(
                  selectedOrder.status,
                  selectedOrder.paymentStatus
                ).map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>

              {updatingOrderId ===
                selectedOrder.id && (
                <p>
                  Updating order...
                </p>
              )}
            </div>
          )}

          {/* ================================================== */}
          {/* CUSTOMER */}
          {/* ================================================== */}

          <h3>Customer</h3>

          <p>
            Name:{" "}
            {getCustomerName(
              selectedOrder
            )}
          </p>

          {selectedOrder.guestEmail && (
            <p>
              Email:{" "}
              {selectedOrder.guestEmail}
            </p>
          )}

          {selectedOrder.guestPhone && (
            <p>
              Phone:{" "}
              {selectedOrder.guestPhone}
            </p>
          )}

          {/* ================================================== */}
          {/* SHIPPING ADDRESS */}
          {/* ================================================== */}

          <h3>Shipping Address</h3>

          <p>
            {selectedOrder.shippingName}
          </p>

          <p>
            {selectedOrder.shippingAddress}
          </p>

          <p>
            {selectedOrder.shippingCity},{" "}
            {selectedOrder.shippingState}{" "}
            {selectedOrder.shippingPincode}
          </p>

          <p>
            Phone:{" "}
            {selectedOrder.shippingPhone}
          </p>

          {/* ================================================== */}
          {/* ORDER ITEMS */}
          {/* ================================================== */}

          <h3>Order Items</h3>

          {selectedOrder.items.length ===
            0 && (
            <p>No items found.</p>
          )}

          {selectedOrder.items.length >
            0 && (
            <div>
              {selectedOrder.items.map(
                (item) => (
                  <article
                    key={item.id}
                    style={{
                      marginBottom:
                        "20px",
                    }}
                  >
                    <h4>
                      {
                        item.product
                          .name
                      }
                    </h4>

                    <p>
                      Variety:{" "}
                      {
                        item.product
                          .variety
                      }
                    </p>

                    <p>
                      Quantity:{" "}
                      {item.quantityKg} kg
                    </p>

                    <p>
                      Unit Price:{" "}
                      {formatMoney(
                        item.unitPrice,
                        selectedOrder.currency ||
                          "INR"
                      )}
                    </p>

                    <p>
                      Total:{" "}
                      {formatMoney(
                        item.totalPrice,
                        selectedOrder.currency ||
                          "INR"
                      )}
                    </p>

                    {item.batchCode && (
                      <p>
                        Batch:{" "}
                        {
                          item.batchCode
                        }
                      </p>
                    )}
                  </article>
                )
              )}
            </div>
          )}

          {/* ================================================== */}
          {/* PAYMENT SUMMARY */}
          {/* ================================================== */}

          <h3>Payment Summary</h3>

          <p>
            Subtotal:{" "}
            {formatMoney(
              selectedOrder.subtotal,
              selectedOrder.currency ||
                "INR"
            )}
          </p>

          <p>
            Shipping:{" "}
            {formatMoney(
              selectedOrder.shippingCost,
              selectedOrder.currency ||
                "INR"
            )}
          </p>

          <p>
            Tax:{" "}
            {formatMoney(
              selectedOrder.tax,
              selectedOrder.currency ||
                "INR"
            )}
          </p>

          <p>
            <strong>
              Total:{" "}
              {formatMoney(
                selectedOrder.total,
                selectedOrder.currency ||
                  "INR"
              )}
            </strong>
          </p>

          {/* ================================================== */}
          {/* DELIVERY INFORMATION EDITOR */}
          {/* ================================================== */}

          <section
            style={{
              marginTop: "30px",
              padding: "20px",
              border:
                "2px solid #ccc",
              borderRadius: "8px",
            }}
          >
            <h3>
              Delivery Information
            </h3>

            <div
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              {/* DELIVERY DATE */}

              <div>
                <label
                  htmlFor="delivery-date"
                  style={{
                    display: "block",
                    fontWeight: "bold",
                    marginBottom:
                      "6px",
                  }}
                >
                  Delivery Date
                </label>

                <input
                  id="delivery-date"
                  type="date"
                  value={deliveryDate}
                  onChange={(event) =>
                    setDeliveryDate(
                      event.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "10px",
                    border:
                      "1px solid #999",
                    borderRadius: "6px",
                  }}
                />
              </div>

              {/* TRACKING NUMBER */}

              <div>
                <label
                  htmlFor="tracking-number"
                  style={{
                    display: "block",
                    fontWeight: "bold",
                    marginBottom:
                      "6px",
                  }}
                >
                  Tracking Number
                </label>

                <input
                  id="tracking-number"
                  type="text"
                  value={trackingNumber}
                  onChange={(event) =>
                    setTrackingNumber(
                      event.target.value
                    )
                  }
                  placeholder="Enter tracking number"
                  style={{
                    width: "100%",
                    maxWidth: "500px",
                    padding: "10px",
                    border:
                      "1px solid #999",
                    borderRadius: "6px",
                  }}
                />
              </div>

              {/* TRACKING URL */}

              <div>
                <label
                  htmlFor="tracking-url"
                  style={{
                    display: "block",
                    fontWeight: "bold",
                    marginBottom:
                      "6px",
                  }}
                >
                  Tracking URL
                </label>

                <input
                  id="tracking-url"
                  type="url"
                  value={trackingUrl}
                  onChange={(event) =>
                    setTrackingUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://tracking.example.com/..."
                  style={{
                    width: "100%",
                    maxWidth: "600px",
                    padding: "10px",
                    border:
                      "1px solid #999",
                    borderRadius: "6px",
                  }}
                />
              </div>

              {/* NOTES */}

              <div>
                <label
                  htmlFor="order-notes"
                  style={{
                    display: "block",
                    fontWeight: "bold",
                    marginBottom:
                      "6px",
                  }}
                >
                  Order Notes
                </label>

                <textarea
                  id="order-notes"
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  placeholder="Add delivery or order notes..."
                  rows={5}
                  style={{
                    width: "100%",
                    maxWidth: "700px",
                    padding: "10px",
                    border:
                      "1px solid #999",
                    borderRadius: "6px",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* SAVE */}

              <div>
                <button
                  type="button"
                  onClick={
                    saveDeliveryInformation
                  }
                  disabled={savingDelivery}
                  style={{
                    padding:
                      "10px 18px",
                    fontWeight: "bold",
                    border: "none",
                    borderRadius: "6px",
                    cursor:
                      savingDelivery
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      savingDelivery
                        ? 0.6
                        : 1,
                  }}
                >
                  {savingDelivery
                    ? "Saving..."
                    : "Save Delivery Information"}
                </button>
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* DELIVERY DISPLAY */}
          {/* ================================================== */}

          <h3>Delivery</h3>

          {selectedOrder.deliveryDate && (
            <p>
              Delivery Date:{" "}
              {new Date(
                selectedOrder.deliveryDate
              ).toLocaleDateString()}
            </p>
          )}

          {selectedOrder.trackingNumber && (
            <p>
              Tracking Number:{" "}
              {
                selectedOrder.trackingNumber
              }
            </p>
          )}

          {selectedOrder.trackingUrl && (
            <p>
              Tracking URL:{" "}
              {selectedOrder.trackingUrl}
            </p>
          )}

          {selectedOrder.notes && (
            <>
              <h3>Notes</h3>
              <p>
                {selectedOrder.notes}
              </p>
            </>
          )}

          <button
            type="button"
            onClick={closeOrderDetails}
          >
            Close Details
          </button>
        </section>
      )}

      {/* ================================================== */}
      {/* EMPTY STATE */}
      {/* ================================================== */}

      {!loading &&
        !error &&
        orders.length === 0 && (
          <p>No orders found.</p>
        )}

      {/* ================================================== */}
      {/* ORDERS LIST */}
      {/* ================================================== */}

      {!loading &&
        orders.length > 0 && (
          <section>
            <h2>Orders</h2>

            {orders.map((order) => {
              const availableStatuses =
                getAvailableStatuses(
                  order.status,
                  order.paymentStatus
                );

              return (
                <article
                  key={order.id}
                  style={{
                    border:
                      "1px solid #ccc",
                    padding: "20px",
                    marginBottom:
                      "16px",
                  }}
                >
                  <h3>
                    Order #
                    {order.orderNumber}
                  </h3>

                  <p>
                    Status:{" "}
                    <strong>
                      {order.status}
                    </strong>
                  </p>

                  <p>
                    Payment:{" "}
                    {order.paymentStatus}
                  </p>

                  <p>
                    Total:{" "}
                    {formatMoney(
                      order.total,
                      order.currency ||
                        "INR"
                    )}
                  </p>

                  <p>
                    Customer:{" "}
                    {getCustomerName(
                      order
                    )}
                  </p>

                  {order.guestEmail && (
                    <p>
                      Email:{" "}
                      {
                        order.guestEmail
                      }
                    </p>
                  )}

                  {order.guestPhone && (
                    <p>
                      Phone:{" "}
                      {
                        order.guestPhone
                      }
                    </p>
                  )}

                  <p>
                    Date:{" "}
                    {new Date(
                      order.createdAt
                    ).toLocaleString()}
                  </p>

                  {/* STATUS DROPDOWN */}

                  {availableStatuses.length >
                    0 && (
                    <div
                      style={{
                        marginTop:
                          "12px",
                        marginBottom:
                          "12px",
                      }}
                    >
                      <label
                        htmlFor={`status-${order.id}`}
                        style={{
                          display:
                            "block",
                          fontWeight:
                            "bold",
                          marginBottom:
                            "6px",
                        }}
                      >
                        Update Status
                      </label>

                      <select
                        id={`status-${order.id}`}
                        value=""
                        disabled={
                          updatingOrderId ===
                          order.id
                        }
                        onChange={(
                          event
                        ) => {
                          const newStatus =
                            event.target
                              .value;

                          if (
                            !newStatus
                          ) {
                            return;
                          }

                          updateOrderStatus(
                            order.id,
                            newStatus
                          );
                        }}
                        style={{
                          padding:
                            "8px",
                          minWidth:
                            "220px",
                          border:
                            "1px solid #999",
                          borderRadius:
                            "6px",
                        }}
                      >
                        <option value="">
                          Select next status...
                        </option>

                        {availableStatuses.map(
                          (status) => (
                            <option
                              key={
                                status
                              }
                              value={
                                status
                              }
                            >
                              {status}
                            </option>
                          )
                        )}
                      </select>

                      {updatingOrderId ===
                        order.id && (
                        <span
                          style={{
                            marginLeft:
                              "10px",
                          }}
                        >
                          Updating...
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      viewOrder(order)
                    }
                  >
                    View Details
                  </button>
                </article>
              );
            })}
          </section>
        )}
    </main>
  );
}