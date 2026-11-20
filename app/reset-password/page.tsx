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

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, isLoading } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const res = await updatePassword(password);
    setIsSubmitting(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setError(res.error || "Failed to update password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EE]">
      <PublicNav />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E65A28]">
            Security
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#13171C] mt-1">
            Choose New Password
          </h1>
          <p className="text-xs text-[#5C6977] mt-2">
            Please enter your new secure password below.
          </p>
        </div>

        <Card className="shadow-sm">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-xl">
                ✓
              </div>
              <h3 className="text-sm font-bold text-[#13171C]">Password Updated!</h3>
              <p className="text-xs text-[#5D6B7A] mt-2 mb-4">
                Your password has been changed successfully. Redirecting you to sign in...
              </p>
              <Link href="/login">
                <Button variant="primary" size="sm" className="w-full justify-center">
                  Proceed to Sign In
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
                <Label htmlFor="new-password" required>New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirm-password" required>Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {isSubmitting ? "Updating Password..." : "Update Password →"}
              </Button>
            </form>
          )}
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}
