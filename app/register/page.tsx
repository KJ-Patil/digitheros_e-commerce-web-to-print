"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form";
import { PublicNav } from "@/components/navigation/public-nav";
import { PublicFooter } from "@/components/navigation/public-footer";
import { IconUser, IconShield } from "@/components/ui/icons";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.fullName.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const res = await signUp({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      companyName: formData.companyName || undefined,
      phone: formData.phone || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg("Account created successfully! Redirecting to your customer dashboard...");
      setTimeout(() => {
        router.push("/customer/dashboard");
      }, 1000);
    } else {
      setError(res.error || "Failed to create account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EE]">
      <PublicNav />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
            Customer Portal
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#13171C] mt-1">
            Create Customer Account
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6977] mt-2">
            Register to save custom vector designs, review and sign digital proofs, view VAT invoices, and track live factory print jobs.
          </p>
        </div>

        <Card className="border-t-4 border-t-[#E65A28] shadow-sm">
          {error && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-300 rounded text-rose-900 text-xs font-mono flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs font-mono flex items-center gap-2">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName" required>Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="e.g. Alex Miller"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company / Organization</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="e.g. Peak Coffee Roasters"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. +44 7700 900123"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" required>Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. alex@peakcoffee.co.uk"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password" required>Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" required>Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-[#FAF9F5] border border-[#E2E1D9] rounded text-[11px] text-[#556372] flex items-start gap-2">
              <IconShield className="w-4 h-4 text-[#E65A28] shrink-0 mt-0.5" />
              <span>
                Your customer profile is protected by Supabase Row-Level Security (RLS). Your orders, designs, and proofs are strictly isolated to your verified account.
              </span>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                type="submit"
                size="lg"
                className="w-full justify-center"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? "Creating Account..." : "Complete Registration →"}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E8E7E0] text-center">
            <p className="text-xs text-[#5D6B7A]">
              Already have an account?{" "}
              <Link href="/login" className="text-[#E65A28] font-bold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}
