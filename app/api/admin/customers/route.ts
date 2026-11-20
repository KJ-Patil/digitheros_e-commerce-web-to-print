import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DEMO_USERS } from "@/lib/auth/server-auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase();

    // 1. Try querying live Supabase profiles table
    let profiles: any[] = [];
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, company_name, phone, role, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        profiles = data;
      }
    }

    // 2. Fallback / Merge with demo users if empty or offline
    if (profiles.length === 0) {
      profiles = Object.values(DEMO_USERS).map((u) => ({
        ...u,
        phone: u.phone || "+44 7700 900123",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    }

    // Filter if search query exists
    if (search) {
      profiles = profiles.filter(
        (p) =>
          p.full_name?.toLowerCase().includes(search) ||
          p.email?.toLowerCase().includes(search) ||
          p.company_name?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      customers: profiles,
      count: profiles.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch customers";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, fullName, companyName, phone, role = "customer" } = body;

    if (!email || !fullName) {
      return NextResponse.json(
        { success: false, error: "Email and Full Name are required" },
        { status: 400 }
      );
    }

    const newId = "c" + Math.random().toString(16).substring(2, 9) + "-0000-0000-0000-" + Date.now().toString(16).padStart(12, "0");

    // Upsert into Supabase profiles
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.from("profiles").upsert({
        id: newId,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        company_name: companyName ? companyName.trim() : null,
        phone: phone ? phone.trim() : null,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("Supabase customer create error:", error.message);
      }
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: newId,
        email,
        full_name: fullName,
        company_name: companyName,
        phone,
        role,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create customer";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
