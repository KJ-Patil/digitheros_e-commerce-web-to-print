"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form";
import { PublicNav } from "@/components/navigation/public-nav";
import { PublicFooter } from "@/components/navigation/public-footer";

export default function ForgotPasswordPage() {
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const res = await resetPassword(email);
    setIsSubmitting(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setError(res.error || "Failed to send reset instructions. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EE]">
      <PublicNav />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
            Account Recovery
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#13171C] mt-1">
            Reset Your Password
          </h1>
          <p className="text-xs text-[#5C6977] mt-2">
            Enter your registered email address and we will send you a secure link to reset your account password.
          </p>
        </div>

        <Card className="shadow-sm">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-xl">
                ✓
              </div>
              <h3 className="text-sm font-bold text-[#13171C]">Reset Email Sent</h3>
              <p className="text-xs text-[#5D6B7A] mt-2 mb-6">
                If an account exists for <strong className="text-[#13171C]">{email}</strong>, you will receive password reset instructions shortly.
              </p>
              <Link href="/login">
                <Button variant="outline" size="sm" className="w-full justify-center">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-900 text-xs font-mono">
                  ⚠️ {error}
                </div>
              )}

              <div>
                <Label htmlFor="reset-email" required>Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="e.g. customer@digitalheroes.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button
                variant="primary"
                type="submit"
                size="md"
                className="w-full justify-center"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? "Sending Link..." : "Send Reset Link →"}
              </Button>

              <div className="text-center pt-2">
                <Link href="/login" className="text-xs font-mono text-[#6A7785] hover:text-[#13171C] underline">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}
