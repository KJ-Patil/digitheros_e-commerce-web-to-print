"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableRow, TableCell } from "@/components/ui/table";
import {
  IconDownload,
} from "@/components/ui/icons";
import { ProofReviewCard } from "@/components/proofs/proof-review-card";
import { INITIAL_PROOF_STORE, OrderProofState } from "@/lib/proofs/proof-engine";
import {
  getOrders,
  getSavedDesigns,
  type StoredOrder,
  type SavedDesignTemplate,
  type OrderInvoice,
} from "@/lib/orders/order-store";
import { useAuth } from "@/lib/auth/auth-context";

interface InAppNotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  referenceId: string;
  actionUrl: string;
  readAt: string | null;
  createdAt: string;
}

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const currentCustomerId = user?.id || "00000000-0000-0000-0000-000000000001";

  const [orders, setOrders] = useState<StoredOrder[]>(() => getOrders(currentCustomerId));
  const [savedDesigns] = useState<SavedDesignTemplate[]>(() => getSavedDesigns(currentCustomerId));
  const [proofs, setProofs] = useState<OrderProofState[]>(Object.values(INITIAL_PROOF_STORE));

  const [reorderStatus, setReorderStatus] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<OrderInvoice | null>(null);

  // Module 10: Lifecycle Alerts & In-App Notifications State
  const [notifications, setNotifications] = useState<InAppNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteFormData, setQuoteFormData] = useState({
    divisionSlug: "laser-cutting",
    divisionName: "Laser-Cut Work",
    productName: "Custom Laser-Cut Signage",
    widthMm: 450,
    heightMm: 300,
    quantity: 10,
    notes: "Requires 4 corner drill holes for wall mounting standoffs.",
  });

  const refreshNotifications = () => {
    fetch(`/api/notifications?userId=${currentCustomerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/notifications?userId=${currentCustomerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [currentCustomerId]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentCustomerId }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Non-blocking
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentCustomerId }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch {
      // Non-blocking
    }
  };

  // Submit Bespoke Quote Request (Triggers QUOTE_SUBMITTED alert)
  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingQuote(true);
    try {
      const res = await fetch("/api/quotes/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: user?.full_name || "Alex Miller",
          customerEmail: user?.email || "customer@digitalheroes.demo",
          companyName: user?.company_name || "Peak Coffee Roasters",
          divisionSlug: quoteFormData.divisionSlug,
          divisionName: quoteFormData.divisionName,
          productSlug: "custom-fabrication",
          productName: quoteFormData.productName,
          widthMm: quoteFormData.widthMm,
          heightMm: quoteFormData.heightMm,
          quantity: quoteFormData.quantity,
          notes: quoteFormData.notes,
          estimatedPriceCents: 24000,
          userId: currentCustomerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit quote request");

      setIsQuoteModalOpen(false);
      setReorderStatus(
        `✓ Bespoke quote request ${data.quote.quoteNumber} logged! Prepress SLA active (2h response). Email confirmation dispatched.`
      );
      setTimeout(() => setReorderStatus(null), 8000);
      refreshNotifications();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Quote submission failed");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // 1-Click Reorder Handler (Server Authoritative)
  const handleReorder = async (sourceId: string, isDesign: boolean = false) => {
    setIsReordering(true);
    try {
      const currentUser = user
        ? {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
          }
        : {
            id: "00000000-0000-0000-0000-000000000001",
            email: "customer@digitalheroes.demo",
            fullName: "Alex Miller",
            role: "customer",
          };

      const res = await fetch("/api/orders/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceOrderId: !isDesign ? sourceId : undefined,
          designId: isDesign ? sourceId : undefined,
          user: currentUser,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "1-Click reorder failed");

      // Update local orders list immediately
      setOrders((prev) => [data.order, ...prev]);

      // If proof slot was queued, add to active proofs
      const newProofState: OrderProofState = {
        orderId: data.order.id,
        orderNumber: data.order.orderNumber,
        customerId: currentUser.id,
        customerName: currentUser.fullName,
        productName: data.order.productName,
        dimensions: `${data.order.dimensions.widthMm} x ${data.order.dimensions.heightMm} mm (3mm Bleed)`,
        currentVersion: 1,
        isUnlockedForProduction: false,
        revisions: [
          {
            id: `pr-${data.order.orderNumber.replace(/[^a-zA-Z0-9]/g, "")}-1`,
            orderId: data.order.id,
            orderNumber: data.order.orderNumber,
            versionNumber: 1,
            status: "PENDING",
            previewUrl: `/proofs/${data.order.orderNumber}_v1.png`,
            changeNotes: `1-Click Repeat generated from ${sourceId}.`,
            createdAt: new Date().toISOString(),
          },
        ],
      };
      setProofs((prev) => [newProofState, ...prev]);

      setReorderStatus(
        `✓ 1-Click repeat order placed successfully! Order ${data.order.orderNumber} created (£${(data.order.pricing.totalCents / 100).toFixed(2)} inc. VAT). Initial proof v1 queued.`
      );
      setTimeout(() => setReorderStatus(null), 8000);
      refreshNotifications();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Reorder error");
    } finally {
      setIsReordering(false);
    }
  };

  // View Itemized Invoice Modal
  const handleViewInvoice = async (orderId: string) => {
    try {
      const res = await fetch(`/api/invoices/${orderId}?userId=${currentCustomerId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invoice not found");
      setSelectedInvoice(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to load invoice");
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case "ORDER_CONFIRMED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-300">ORDER CONFIRMED</span>;
      case "PROOF_READY_FOR_REVIEW":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-100 text-amber-800 rounded border border-amber-300">PROOF REVIEW</span>;
      case "PROOF_APPROVED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-teal-100 text-teal-800 rounded border border-teal-300">PROOF APPROVED</span>;
      case "JOB_COMPLETED_DISPATCHED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 rounded border border-indigo-300">DISPATCHED</span>;
      case "QUOTE_SUBMITTED":
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sky-100 text-sky-800 rounded border border-sky-300">QUOTE SUBMITTED</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-800 rounded border border-slate-300">{type}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Customer Header & Profile Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCDAD0] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
              Customer Area
            </span>
            <span className="text-xs text-[#8F9BA8]">•</span>
            <span className="text-xs font-mono text-[#576472]">
              Account ID: {user?.id ? user.id.slice(0, 8) : "CUST-0941"}
            </span>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-[11px] font-mono font-bold bg-[#E65A28] text-white rounded-full">
                {unreadCount} new alerts
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#13171C] mt-1">
            My Print Orders & Proofs
          </h1>
          <p className="text-sm text-[#5B6774] mt-1">
            Manage your past jobs, review active proofs, approve revisions, and reorder from saved artwork.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsQuoteModalOpen(true)}
          >
            + Request Custom Quote
          </Button>
          <Link href="/#calculator">
            <Button variant="primary" size="sm">
              + New Configuration
            </Button>
          </Link>
        </div>
      </div>

      {reorderStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs font-mono font-medium flex items-center justify-between shadow-sm">
          <span>{reorderStatus}</span>
          <button onClick={() => setReorderStatus(null)} className="font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Role Security Callout Banner */}
      <div className="p-3 bg-[#EAE9E1] border border-[#D5D4CB] rounded text-xs text-[#374151] flex items-center gap-2">
        <span className="font-mono font-bold text-[#13171C] uppercase">[Security Notice]</span>
        <span>
          Customer role boundaries active. You are viewing strictly your own profile, orders, and proof versions.
          Production print files remain strictly locked until you sign proof approval.
        </span>
      </div>

      {/* Module 10: Lifecycle Alerts & In-App Notifications Feed */}
      <section id="alerts" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#E65A28]"></span>
            <h2 className="text-base font-bold text-[#13171C] tracking-tight">
              Transactional Lifecycle Alerts
            </h2>
            {unreadCount > 0 && (
              <span className="text-xs font-mono font-bold text-[#E65A28] bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
                {unreadCount} Unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-mono text-[#576472] hover:text-[#13171C] underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-4 bg-[#F5F4EE] border border-[#E2E0D8] rounded text-xs text-[#7A8795] font-mono">
            No active transactional alerts.
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 5).map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !notif.readAt
                    ? "bg-[#FFFBF5] border-[#E65A28]/40 shadow-xs"
                    : "bg-[#FAF9F5] border-[#ECEBE4]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getEventBadge(notif.notificationType)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#13171C]">{notif.title}</span>
                      {!notif.readAt && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E65A28]"></span>
                      )}
                    </div>
                    <p className="text-xs text-[#5D6A78] mt-0.5">{notif.message}</p>
                    <span className="text-[10px] font-mono text-[#94A3B8] block mt-1">
                      Ref: {notif.referenceId} &bull; {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Link href={notif.actionUrl}>
                    <Button variant="outline" size="sm" className="text-xs py-1 h-7">
                      View Details &rarr;
                    </Button>
                  </Link>
                  {!notif.readAt && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-[11px] font-mono text-[#788694] hover:text-[#13171C] px-2 py-1"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stats / Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card badge="TOTAL">
          <div className="text-xs font-mono text-[#636F7B] uppercase">Active Orders</div>
          <div className="text-2xl font-extrabold text-[#13171C] mt-1">{orders.length} Jobs</div>
          <div className="text-[11px] text-[#7E8B99] mt-1">Across your account history</div>
        </Card>

        <Card badge="APPROVAL">
          <div className="text-xs font-mono text-[#636F7B] uppercase">Pending Proofs</div>
          <div className="text-2xl font-extrabold text-[#E65A28] mt-1">
            {proofs.filter((p) => !p.isUnlockedForProduction).length} Action
          </div>
          <div className="text-[11px] text-[#7E8B99] mt-1">Requires your review & sign-off</div>
        </Card>

        <Card badge="SAVED">
          <div className="text-xs font-mono text-[#636F7B] uppercase">Saved Templates</div>
          <div className="text-2xl font-extrabold text-[#13171C] mt-1">{savedDesigns.length} Ready</div>
          <div className="text-[11px] text-[#7E8B99] mt-1">Instant 1-click repeat orders</div>
        </Card>

        <Card badge="BILLING">
          <div className="text-xs font-mono text-[#636F7B] uppercase">Total Invoiced</div>
          <div className="text-2xl font-extrabold text-[#13171C] mt-1">
            £{(orders.reduce((sum, o) => sum + o.pricing.totalCents, 0) / 100).toFixed(2)}
          </div>
          <div className="text-[11px] text-[#7E8B99] mt-1">VAT receipts available</div>
        </Card>
      </div>

      {/* Module: Active Proofs & Version State */}
      <section id="proofs" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#E65A28]"></span>
            <h2 className="text-base font-bold text-[#13171C] tracking-tight">
              Active Proofs & Version Status
            </h2>
          </div>
          <span className="text-xs font-mono text-[#768391]">
            Authoritative Server Gate • Revision History v1, v2, v3
          </span>
        </div>

        <div className="space-y-6">
          {proofs.map((proofState) => (
            <ProofReviewCard
              key={proofState.orderId}
              initialState={proofState}
              onStateUpdate={(updated) => {
                setProofs((prev) =>
                  prev.map((p) => (p.orderId === updated.orderId ? updated : p))
                );
              }}
            />
          ))}
        </div>
      </section>

      {/* Module: Saved Designs & 1-Click Reorder */}
      <section id="designs" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#13171C]"></span>
            <h2 className="text-base font-bold text-[#13171C] tracking-tight">
              Saved Designs & 1-Click Repeat
            </h2>
          </div>
          <span className="text-xs font-mono text-[#768391]">Re-order without re-uploading</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {savedDesigns.map((design) => (
            <Card key={design.id}>
              <div className="h-28 bg-[#EAE8E0] rounded border border-[#D5D3C8] mb-3 flex flex-col items-center justify-center text-xs font-mono text-[#576472]">
                <span className="font-bold text-sm text-[#13171C]">{design.name}</span>
                <span className="text-[10px] text-[#7C8894]">
                  {design.divisionName} • {design.widthMm}x{design.heightMm}mm
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#13171C]">{design.name}</h4>
              <p className="text-xs text-[#636F7B] mt-0.5">
                Default Run: {design.defaultQuantity.toLocaleString()} units • Last: {design.lastOrderedDate}
              </p>
              <div className="mt-4 pt-3 border-t border-[#ECEBE4] flex items-center justify-between">
                <span className="text-xs font-mono text-[#7D8A98]">Approved {design.approvedVersion}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isReordering}
                  onClick={() => handleReorder(design.id, true)}
                >
                  {isReordering ? "Processing..." : "1-Click Reorder"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Module: Order History & Xero Invoices */}
      <section id="orders" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#E65A28]"></span>
            <h2 className="text-base font-bold text-[#13171C] tracking-tight">
              Order History & Invoice Archive
            </h2>
          </div>
          <span className="text-xs font-mono text-[#768391]">
            Xero-compatible invoice breakdown • 20% UK VAT
          </span>
        </div>

        <Table headers={["Order #", "Date", "Items / Division", "Qty", "Total (inc. VAT)", "Pipeline Stage", "Actions"]}>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono font-bold text-[#13171C]">
                {order.orderNumber}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {order.createdAt.split("T")[0]}
              </TableCell>
              <TableCell>
                <div className="font-medium text-[#13171C]">{order.productName}</div>
                <div className="text-[11px] text-[#697785]">{order.specsSummary}</div>
              </TableCell>
              <TableCell className="font-mono">{order.quantity.toLocaleString()}</TableCell>
              <TableCell className="font-mono font-bold text-[#13171C]">
                £{(order.pricing.totalCents / 100).toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge variant={order.stage} size="sm">
                  {order.stage}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewInvoice(order.id)}
                >
                  <IconDownload className="w-3.5 h-3.5 mr-1" /> Invoice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isReordering}
                  onClick={() => handleReorder(order.id, false)}
                >
                  Reorder
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </section>

      {/* Bespoke Quote Request Modal */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#DCDAD0]">
            <div className="flex items-start justify-between border-b border-[#ECEBE4] pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E65A28]">
                  Custom Trade Inquiry
                </span>
                <h3 className="text-lg font-extrabold text-[#13171C]">
                  Request Bespoke Fabrication Quote
                </h3>
              </div>
              <button
                onClick={() => setIsQuoteModalOpen(false)}
                className="text-[#8C98A6] hover:text-[#13171C] text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#556270] uppercase font-bold text-[10px] mb-1">
                  MANUFACTURING DIVISION
                </label>
                <select
                  value={quoteFormData.divisionSlug}
                  onChange={(e) => {
                    const slug = e.target.value;
                    const name =
                      slug === "laser-cutting"
                        ? "Laser-Cut Work"
                        : slug === "labels"
                        ? "Labels & Stickers"
                        : slug === "trophies"
                        ? "Laser Trophies"
                        : "Custom Fabrication";
                    setQuoteFormData({ ...quoteFormData, divisionSlug: slug, divisionName: name });
                  }}
                  className="w-full p-2 border border-[#CBD5E1] rounded bg-white text-[#13171C]"
                >
                  <option value="laser-cutting">Laser-Cut Work</option>
                  <option value="labels">Labels & Stickers</option>
                  <option value="trophies">Laser Trophies</option>
                  <option value="mtb-boards">MTB Boards</option>
                </select>
              </div>

              <div>
                <label className="block text-[#556270] uppercase font-bold text-[10px] mb-1">
                  PRODUCT / SPECIFICATION TITLE
                </label>
                <input
                  type="text"
                  value={quoteFormData.productName}
                  onChange={(e) => setQuoteFormData({ ...quoteFormData, productName: e.target.value })}
                  required
                  className="w-full p-2 border border-[#CBD5E1] rounded bg-white text-[#13171C]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#556270] uppercase font-bold text-[10px] mb-1">
                    WIDTH (MM)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="2000"
                    value={quoteFormData.widthMm}
                    onChange={(e) => setQuoteFormData({ ...quoteFormData, widthMm: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded bg-white text-[#13171C]"
                  />
                </div>
                <div>
                  <label className="block text-[#556270] uppercase font-bold text-[10px] mb-1">
                    HEIGHT (MM)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="2000"
                    value={quoteFormData.heightMm}
                    onChange={(e) => setQuoteFormData({ ...quoteFormData, heightMm: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded bg-white text-[#13171C]"
                  />
                </div>
                <div>
                  <label className="block text-[#556270] uppercase font-bold text-[10px] mb-1">
                    RUN QUANTITY
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50000"
                    value={quoteFormData.quantity}
                    onChange={(e) => setQuoteFormData({ ...quoteFormData, quantity: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-[#CBD5E1] rounded bg-white text-[#13171C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#556270] uppercase font-bold text-[10px] mb-1">
                  SPECIAL REQUIREMENTS / FINISHING NOTES
                </label>
                <textarea
                  rows={3}
                  value={quoteFormData.notes}
                  onChange={(e) => setQuoteFormData({ ...quoteFormData, notes: e.target.value })}
                  className="w-full p-2 border border-[#CBD5E1] rounded bg-white text-[#13171C]"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
                <strong>Turnaround SLA:</strong> All bespoke trade quote inquiries receive technical prepress verification within 2 UK business hours.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECEBE4]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuoteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingQuote}
                >
                  {isSubmittingQuote ? "Submitting SLA..." : "Submit Quote Inquiry"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Itemized Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#DCDAD0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#ECEBE4] pb-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E65A28]">
                  Commercial Tax Invoice
                </span>
                <h3 className="text-xl font-extrabold text-[#13171C] mt-0.5">
                  Invoice {selectedInvoice.invoiceNumber}
                </h3>
                <span className="text-xs font-mono text-[#7A8795]">
                  Ref: {selectedInvoice.xeroReference}
                </span>
              </div>
              <Badge variant="success">PAID IN FULL</Badge>
            </div>

            {/* Issuer & Bill To */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-[#FAF9F5] rounded border border-[#ECEBE4]">
                <span className="text-[#8997A5] block uppercase font-bold text-[10px]">ISSUER</span>
                <div className="font-bold text-[#13171C] mt-1">Digital Heroes Print Works</div>
                <div className="text-[#596674]">Unit 4, Industrial Parkway</div>
                <div className="text-[#596674]">Sheffield, S3 8HQ, UK</div>
                <div className="text-[#596674] mt-1">VAT Reg: GB 941 2026 88</div>
              </div>

              <div className="p-3 bg-[#FAF9F5] rounded border border-[#ECEBE4]">
                <span className="text-[#8997A5] block uppercase font-bold text-[10px]">BILLED TO</span>
                <div className="font-bold text-[#13171C] mt-1">
                  {selectedInvoice.companyName || selectedInvoice.customerName}
                </div>
                <div className="text-[#596674]">{selectedInvoice.customerName}</div>
                <div className="text-[#596674]">{selectedInvoice.customerEmail}</div>
                <div className="text-[#596674] mt-1">Date: {selectedInvoice.issueDate}</div>
              </div>
            </div>

            {/* Itemized Lines */}
            <div className="border border-[#ECEBE4] rounded overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#FAF9F5] text-[#717F8E] font-mono uppercase text-[10px] border-b border-[#ECEBE4]">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Net Subtotal</th>
                    <th className="p-3 text-right">VAT (20%)</th>
                    <th className="p-3 text-right">Total (GBP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFEA] font-mono">
                  {selectedInvoice.lineItems.map((line, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-[#13171C]">{line.description}</td>
                      <td className="p-3 text-right">{line.quantity.toLocaleString()}</td>
                      <td className="p-3 text-right">£{(line.netCents / 100).toFixed(2)}</td>
                      <td className="p-3 text-right">£{(line.vatCents / 100).toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-[#13171C]">
                        £{(line.grossCents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end text-xs font-mono">
              <div className="w-64 space-y-1.5">
                <div className="flex justify-between text-[#5C6977]">
                  <span>Net Amount:</span>
                  <span>£{(selectedInvoice.subtotalCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#5C6977]">
                  <span>UK VAT (20.0%):</span>
                  <span>£{(selectedInvoice.vatCents / 100).toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-[#13171C] flex justify-between font-extrabold text-sm text-[#13171C]">
                  <span>Total Paid:</span>
                  <span className="text-[#E65A28]">
                    £{(selectedInvoice.totalCents / 100).toFixed(2)} GBP
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#ECEBE4]">
              <span className="text-[11px] font-mono text-[#7D8A98]">
                Electronically generated via Xero Integration API.
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert(`Invoice ${selectedInvoice.invoiceNumber} downloaded as PDF.`)}
                >
                  <IconDownload className="w-3.5 h-3.5 mr-1" /> Download PDF
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedInvoice(null)}
                >
                  Close Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
