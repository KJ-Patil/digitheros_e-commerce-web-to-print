"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Table, TableRow, TableCell } from "@/components/ui/table";
import { IconUser, IconShield } from "@/components/ui/icons";

interface CustomerRecord {
  id: string;
  email: string;
  full_name: string;
  company_name: string | null;
  phone: string | null;
  role: "customer" | "admin";
  created_at: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    fullName: "",
    email: "",
    companyName: "",
    phone: "",
    role: "customer" as "customer" | "admin",
  });
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const fetchCustomers = () => {
    setIsLoading(true);
    fetch(`/api/admin/customers?search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.customers)) {
          setCustomers(data.customers);
        }
      })
      .catch((err) => console.error("Customer fetch error:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg(null);

    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create customer");

      setSubmitMsg("✓ Customer registered successfully.");
      setIsModalOpen(false);
      setNewCustomer({
        fullName: "",
        email: "",
        companyName: "",
        phone: "",
        role: "customer",
      });
      fetchCustomers();
    } catch (err: unknown) {
      setSubmitMsg(err instanceof Error ? err.message : "Error creating customer");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252E38] pb-6">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400">
            Account Management
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Customer Directory &amp; Accounts
          </h1>
          <p className="text-xs text-[#8E9CA9] mt-1">
            Manage registered trade clients, verify company details, and monitor customer account security.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-[#0B0E11] font-bold border-amber-600"
          >
            + Register New Client
          </Button>
        </div>
      </div>

      {submitMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded text-emerald-300 text-xs font-mono">
          {submitMsg}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141A20] border border-[#252E38] rounded-lg p-4">
          <div className="text-[11px] font-mono text-[#8E9CA9] uppercase">Total Accounts</div>
          <div className="text-2xl font-extrabold text-white mt-1">{customers.length}</div>
        </div>
        <div className="bg-[#141A20] border border-[#252E38] rounded-lg p-4">
          <div className="text-[11px] font-mono text-[#8E9CA9] uppercase">Trade Customers</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {customers.filter((c) => c.role === "customer").length}
          </div>
        </div>
        <div className="bg-[#141A20] border border-[#252E38] rounded-lg p-4">
          <div className="text-[11px] font-mono text-[#8E9CA9] uppercase">Staff Administrators</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            {customers.filter((c) => c.role === "admin").length}
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-[#141A20] border border-[#252E38] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by name, email, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0B0E11] border border-[#252E38] rounded px-3 py-1.5 text-xs text-white placeholder-[#5A6775] focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="text-xs font-mono text-[#8E9CA9]">
            Showing {customers.length} accounts
          </div>
        </div>

        <div className="overflow-x-auto border border-[#252E38] rounded">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0B0E11] text-[#8E9CA9] uppercase text-[10px] border-b border-[#252E38]">
              <tr>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Company / Brand</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Role</th>
                <th className="p-3">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E252D] text-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#8E9CA9]">
                    Loading customer directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#8E9CA9]">
                    No accounts found matching search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#1A222B] transition-colors">
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#202933] text-amber-400 flex items-center justify-center text-[10px] font-bold">
                        {c.full_name?.slice(0, 1) || "U"}
                      </span>
                      {c.full_name}
                    </td>
                    <td className="p-3 text-[#A0ACB9]">{c.email}</td>
                    <td className="p-3 text-[#CBD5E1]">{c.company_name || "—"}</td>
                    <td className="p-3 text-[#A0ACB9]">{c.phone || "—"}</td>
                    <td className="p-3">
                      <Badge variant={c.role === "admin" ? "danger" : "info"} size="sm">
                        {c.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3 text-[#708090]">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "Active"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141A20] border border-[#2D3844] rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#252E38] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Register New Customer Account
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8E9CA9] hover:text-white font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.fullName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })}
                  placeholder="e.g. David Ross"
                  className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white placeholder-[#5A6775]"
                />
              </div>

              <div>
                <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="e.g. david@rossprint.co.uk"
                  className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white placeholder-[#5A6775]"
                />
              </div>

              <div>
                <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={newCustomer.companyName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, companyName: e.target.value })}
                  placeholder="e.g. Ross Signage Ltd"
                  className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white placeholder-[#5A6775]"
                />
              </div>

              <div>
                <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="+44 7700 900555"
                  className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white placeholder-[#5A6775]"
                />
              </div>

              <div>
                <label className="block text-[#A0ACB9] font-mono text-[10px] uppercase mb-1">
                  Assigned Role
                </label>
                <select
                  value={newCustomer.role}
                  onChange={(e) => setNewCustomer({ ...newCustomer, role: e.target.value as "customer" | "admin" })}
                  className="w-full bg-[#0B0E11] border border-[#252E38] rounded p-2 text-white"
                >
                  <option value="customer">Trade Customer (customer)</option>
                  <option value="admin">Factory Staff (admin)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full justify-center bg-amber-500 hover:bg-amber-600 text-[#0B0E11] font-bold"
                >
                  Save &amp; Activate Client Account
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
