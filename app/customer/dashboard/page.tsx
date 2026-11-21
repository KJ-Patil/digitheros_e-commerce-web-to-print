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
  const { user, updateProfile, updatePassword } = useAuth();
  const currentCustomerId = user?.id || "00000000-0000-0000-0000-000000000001";

  const [orders, setOrders] = useState<StoredOrder[]>(() => getOrders(currentCustomerId));
  const [savedDesignsList, setSavedDesignsList] = useState<SavedDesignTemplate[]>(() => getSavedDesigns(currentCustomerId));
  const [proofs, setProofs] = useState<OrderProofState[]>(Object.values(INITIAL_PROOF_STORE));

  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderStageFilter, setOrderStageFilter] = useState("ALL");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<StoredOrder | null>(null);

  const [reorderStatus, setReorderStatus] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<OrderInvoice | null>(null);

  // Sync cloud saved designs
  useEffect(() => {
    fetch(`/api/designs?customerId=${currentCustomerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.designs) && data.designs.length > 0) {
          setSavedDesignsList(data.designs);
        }
      })
      .catch(() => {});
  }, [currentCustomerId]);

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm("Are you sure you want to delete this saved design?")) return;
    try {
      const res = await fetch(`/api/designs/${designId}`, { method: "DELETE" });
      if (res.ok) {
        setSavedDesignsList((prev) => prev.filter((d) => d.id !== designId));
        setReorderStatus("✓ Saved design template removed successfully.");
        setTimeout(() => setReorderStatus(null), 4000);
      }
    } catch {
      alert("Failed to delete design");
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !orderSearchTerm ||
      o.orderNumber.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      o.productName.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      o.specsSummary.toLowerCase().includes(orderSearchTerm.toLowerCase());

    const matchesStage = orderStageFilter === "ALL" || o.stage === orderStageFilter;

    return matchesSearch && matchesStage;
  });

  // Profile management state
  const [profileName, setProfileName] = useState(user?.full_name || "");
  const [profileCompany, setProfileCompany] = useState(user?.company_name || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passMsg, setPassMsg] = useState<string | null>(null);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.full_name || "");
      setProfileCompany(user.company_name || "");
      setProfilePhone(user.phone || "");
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg(null);
    const res = await updateProfile({
      fullName: profileName,
      companyName: profileCompany,
      phone: profilePhone,
    });
    setIsUpdatingProfile(false);
    if (res.success) {
      setProfileMsg("✓ Customer profile details updated successfully!");
      setTimeout(() => setProfileMsg(null), 4000);
    } else {
      setProfileMsg("⚠️ " + (res.error || "Profile update failed."));
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPassMsg("⚠️ Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPassMsg("⚠️ Passwords do not match.");
      return;
    }
    setIsUpdatingPass(true);
    setPassMsg(null);
    const res = await updatePassword(newPassword);
    setIsUpdatingPass(false);
    if (res.success) {
      setPassMsg("✓ Account password updated successfully!");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setPassMsg(null), 4000);
    } else {
      setPassMsg("⚠️ " + (res.error || "Password update failed."));
    }
  };

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
          <div className="text-2xl font-extrabold text-[#13171C] mt-1">{savedDesignsList.length} Ready</div>
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
              Saved Designs &amp; 1-Click Repeat
            </h2>
          </div>
          <span className="text-xs font-mono text-[#768391]">Re-order or customize in Web-to-Print studio</span>
        </div>

        {savedDesignsList.length === 0 ? (
          <div className="p-6 bg-white border border-[#DCDAD0] rounded text-center text-xs font-mono text-[#7E8B99]">
            No saved vector designs yet. Create one in the{" "}
            <Link href="/designer" className="underline text-[#E65A28] font-bold">
              Designer Studio
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {savedDesignsList.map((design) => (
              <Card key={design.id} className="flex flex-col justify-between">
                <div>
                  <div className="h-28 bg-[#EAE8E0] rounded border border-[#D5D3C8] mb-3 flex flex-col items-center justify-center text-xs font-mono text-[#576472]">
                    <span className="font-bold text-sm text-[#13171C] text-center px-2">{design.name}</span>
                    <span className="text-[10px] text-[#7C8894] mt-1">
                      {design.divisionName} • {design.widthMm}x{design.heightMm}mm
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#13171C]">{design.name}</h4>
                  <p className="text-xs text-[#636F7B] mt-0.5">
                    Default Run: {design.defaultQuantity.toLocaleString()} units • Last: {design.lastOrderedDate}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#ECEBE4] space-y-2">
                  <div className="flex items-center justify-between">
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
                  <div className="flex items-center justify-between pt-1">
                    <Link
                      href={`/designer?designId=${design.id}&product=${design.productSlug}&w=${design.widthMm}&h=${design.heightMm}`}
                    >
                      <span className="text-xs font-mono font-medium text-[#E65A28] hover:underline cursor-pointer">
                        ✏️ Edit in Canvas
                      </span>
                    </Link>
                    <button
                      onClick={() => handleDeleteDesign(design.id)}
                      className="text-[11px] font-mono text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Module: Order History & Xero Invoices */}
      <section id="orders" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#E65A28]"></span>
            <h2 className="text-base font-bold text-[#13171C] tracking-tight">
              Order History &amp; Invoice Archive
            </h2>
          </div>
          <span className="text-xs font-mono text-[#768391]">
            Xero-compatible invoice breakdown • 20% UK VAT
          </span>
        </div>

        {/* Order Search & Filtering Toolbar */}
        <div className="bg-white p-3 rounded border border-[#DCDAD0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by order #, product, specs..."
              value={orderSearchTerm}
              onChange={(e) => setOrderSearchTerm(e.target.value)}
              className="w-full p-2 border border-[#CBD5E1] rounded text-[#13171C] focus:outline-none focus:border-[#E65A28]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[#64748B] text-[11px] uppercase">Stage:</span>
            <select
              value={orderStageFilter}
              onChange={(e) => setOrderStageFilter(e.target.value)}
              className="p-1.5 border border-[#CBD5E1] rounded bg-white text-[#13171C]"
            >
              <option value="ALL">All Stages ({orders.length})</option>
              <option value="QUOTE">Quote</option>
              <option value="ORDER">Order Placed</option>
              <option value="ARTWORK">Artwork Preflight</option>
              <option value="PROOF">Proof Review</option>
              <option value="PRODUCTION">In Production</option>
              <option value="COMPLETED">Completed</option>
            </select>
            {(orderSearchTerm || orderStageFilter !== "ALL") && (
              <button
                onClick={() => {
                  setOrderSearchTerm("");
                  setOrderStageFilter("ALL");
                }}
                className="text-xs text-[#E65A28] underline ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-8 bg-white border border-[#DCDAD0] rounded text-center text-xs font-mono text-[#7E8B99]">
            No orders match your search filters.
          </div>
        ) : (
          <Table headers={["Order #", "Date", "Items / Division", "Qty", "Total (inc. VAT)", "Pipeline Stage", "Actions"]}>
            {filteredOrders.map((order) => (
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
                <TableCell className="space-x-1.5 whitespace-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrderDetails(order)}
                  >
                    Details
                  </Button>
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
        )}
      </section>

      {/* Account & Profile Settings Section */}
      <section id="profile" className="space-y-4 pt-4 border-t border-[#DCDAD0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#E65A28]"></span>
            <h2 className="text-base font-bold text-[#13171C] tracking-tight">
              Customer Account &amp; Profile Settings
            </h2>
          </div>
          <span className="text-xs font-mono text-[#768391]">
            Protected by Supabase Row-Level Security
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Details */}
          <Card className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#13171C]">Contact &amp; Trade Details</h3>
              <p className="text-xs text-[#5D6B7A] mt-0.5">
                Update the official name, company trade name, and dispatch phone for your orders.
              </p>
            </div>

            {profileMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs font-mono">
                {profileMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#4B5663] font-mono text-[10px] uppercase font-bold mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-white border border-[#CFCECB] rounded p-2 text-sm text-[#13171C] focus:border-[#E65A28] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#4B5663] font-mono text-[10px] uppercase font-bold mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={profileCompany}
                  onChange={(e) => setProfileCompany(e.target.value)}
                  placeholder="e.g. Peak Coffee Roasters"
                  className="w-full bg-white border border-[#CFCECB] rounded p-2 text-sm text-[#13171C] focus:border-[#E65A28] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#4B5663] font-mono text-[10px] uppercase font-bold mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+44 7700 900123"
                  className="w-full bg-white border border-[#CFCECB] rounded p-2 text-sm text-[#13171C] focus:border-[#E65A28] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <Button variant="primary" type="submit" size="sm" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? "Saving Details..." : "Save Profile Details"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Security & Password */}
          <Card className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#13171C]">Account Security &amp; Password</h3>
              <p className="text-xs text-[#5D6B7A] mt-0.5">
                Update your authentication password or review registered account credentials.
              </p>
            </div>

            <div className="p-3 bg-[#FAF9F5] border border-[#E2E1D9] rounded text-[11px] font-mono text-[#556372] space-y-1">
              <div>
                <span className="text-[#8B98A6]">Registered Email:</span>{" "}
                <strong className="text-[#13171C]">{user?.email || "customer@digitalheroes.demo"}</strong>
              </div>
              <div>
                <span className="text-[#8B98A6]">Account Role:</span>{" "}
                <span className="text-emerald-700 font-bold uppercase">{user?.role || "CUSTOMER"}</span>
              </div>
            </div>

            {passMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs font-mono">
                {passMsg}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#4B5663] font-mono text-[10px] uppercase font-bold mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white border border-[#CFCECB] rounded p-2 text-sm text-[#13171C] focus:border-[#E65A28] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#4B5663] font-mono text-[10px] uppercase font-bold mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full bg-white border border-[#CFCECB] rounded p-2 text-sm text-[#13171C] focus:border-[#E65A28] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <Button variant="outline" type="submit" size="sm" disabled={isUpdatingPass}>
                  {isUpdatingPass ? "Updating Password..." : "Change Account Password"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
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
                Generated by Digital Heroes Internal Invoice Engine (PDF 1.4 compliant).
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(
                      `/api/invoices/${selectedInvoice.orderId}/pdf?userId=${currentCustomerId}`,
                      "_blank"
                    );
                  }}
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

      {/* Complete Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#DCDAD0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#ECEBE4] pb-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E65A28]">
                  Order Specifications &amp; Tracking
                </span>
                <h3 className="text-xl font-extrabold text-[#13171C] mt-0.5">
                  {selectedOrderDetails.orderNumber}
                </h3>
                <span className="text-xs font-mono text-[#7A8795]">
                  Placed {selectedOrderDetails.createdAt.replace("T", " ").slice(0, 16)} UTC
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={selectedOrderDetails.stage}>{selectedOrderDetails.stage}</Badge>
                <Badge variant="neutral">{selectedOrderDetails.status}</Badge>
              </div>
            </div>

            {/* Product & Technical Specs */}
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3.5 bg-[#FAF9F5] rounded border border-[#ECEBE4] space-y-1.5">
                <div className="text-sm font-bold text-[#13171C]">
                  {selectedOrderDetails.productName} ({selectedOrderDetails.divisionName})
                </div>
                <div className="text-[#596674]">{selectedOrderDetails.specsSummary}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#ECEBE4] text-[11px]">
                  <div>
                    <span className="text-[#8896A4] block">DIMENSIONS</span>
                    <span className="font-bold text-[#13171C]">
                      {selectedOrderDetails.dimensions.widthMm} × {selectedOrderDetails.dimensions.heightMm} mm
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8896A4] block">QUANTITY</span>
                    <span className="font-bold text-[#13171C]">
                      {selectedOrderDetails.quantity.toLocaleString()} units
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8896A4] block">PROOF VERSION</span>
                    <span className="font-bold text-[#E65A28]">
                      {selectedOrderDetails.proofVersion} ({selectedOrderDetails.isProofApproved ? "Approved" : "Pending Sign-off"})
                    </span>
                  </div>
                </div>
              </div>

              {/* Substrate & Finish Options */}
              <div className="p-3 bg-[#FAF9F5] rounded border border-[#ECEBE4] grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-[#8896A4] block">SUBSTRATE</span>
                  <span className="font-semibold text-[#13171C]">
                    {selectedOrderDetails.selectedParameters.material?.name || "Standard Substrate"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8896A4] block">FINISH</span>
                  <span className="font-semibold text-[#13171C]">
                    {selectedOrderDetails.selectedParameters.finish?.name || "Standard"}
                  </span>
                </div>
                <div>
                  <span className="text-[#8896A4] block">CUT TYPE</span>
                  <span className="font-semibold text-[#13171C]">
                    {selectedOrderDetails.selectedParameters.cutType?.name || "Standard Trim"}
                  </span>
                </div>
              </div>

              {/* Delivery Tracking Section */}
              {selectedOrderDetails.deliveryTracking && (
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                      <span>📦</span> Delivery Tracking (Simulated Mode)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      SIMULATED • {selectedOrderDetails.deliveryTracking.dispatchStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Courier (Simulated)</span>
                      <span className="font-bold text-[#0F172A]">
                        {selectedOrderDetails.deliveryTracking.courierName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Tracking Number</span>
                      <a
                        href={selectedOrderDetails.deliveryTracking.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono font-bold text-blue-700 hover:underline break-all"
                      >
                        {selectedOrderDetails.deliveryTracking.trackingNumber} ↗
                      </a>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">Estimated Delivery</span>
                      <span className="font-medium text-[#0F172A]">
                        {selectedOrderDetails.deliveryTracking.estimatedDelivery || "2 business days"}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#556987] font-mono pt-1 border-t border-blue-100">
                    ℹ️ Simulated courier tracking generated for internal development &amp; demonstration.
                  </div>
                </div>
              )}

              {/* Shipping & Payment Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-[#FAF9F5] rounded border border-[#ECEBE4]">
                  <span className="text-[#8896A4] uppercase font-bold text-[10px] block">DELIVERY ADDRESS</span>
                  <div className="font-bold text-[#13171C] mt-1">{selectedOrderDetails.shippingAddress.recipientName}</div>
                  {selectedOrderDetails.shippingAddress.companyName && (
                    <div className="text-[#596674]">{selectedOrderDetails.shippingAddress.companyName}</div>
                  )}
                  <div className="text-[#596674]">{selectedOrderDetails.shippingAddress.addressLine1}</div>
                  <div className="text-[#596674]">
                    {selectedOrderDetails.shippingAddress.city}, {selectedOrderDetails.shippingAddress.postcode}
                  </div>
                  <div className="text-[#596674]">{selectedOrderDetails.shippingAddress.country}</div>
                </div>

                <div className="p-3 bg-[#FAF9F5] rounded border border-[#ECEBE4]">
                  <span className="text-[#8896A4] uppercase font-bold text-[10px] block">PAYMENT AUDIT</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold uppercase text-[11px]">PAID (SIMULATED / DEMO GATEWAY)</span>
                    <span className="text-[10px] text-[#7A8795]">
                      ({selectedOrderDetails.paymentDetails.cardBrand?.toUpperCase() || "VISA"} •••• {selectedOrderDetails.paymentDetails.cardLast4 || "4242"})
                    </span>
                  </div>
                  <div className="text-[10px] text-[#7A8795] mt-1 break-all">
                    TxID: {selectedOrderDetails.paymentDetails.transactionId || selectedOrderDetails.paymentDetails.sessionId}
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#ECEBE4] flex justify-between font-bold text-[#13171C]">
                    <span>Total Paid (inc. VAT):</span>
                    <span className="text-[#E65A28]">
                      £{(selectedOrderDetails.pricing.totalCents / 100).toFixed(2)} GBP
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-[#ECEBE4]">
              <div className="text-xs font-mono text-[#5B6877]">
                <a
                  href="#proofs"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="underline text-[#E65A28] hover:text-[#c4491c] font-bold"
                >
                  Review Proof Sign-off &rarr;
                </a>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const id = selectedOrderDetails.id;
                    setSelectedOrderDetails(null);
                    handleViewInvoice(id);
                  }}
                >
                  <IconDownload className="w-3.5 h-3.5 mr-1" /> View Invoice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isReordering}
                  onClick={() => {
                    const id = selectedOrderDetails.id;
                    setSelectedOrderDetails(null);
                    handleReorder(id, false);
                  }}
                >
                  1-Click Repeat
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedOrderDetails(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
