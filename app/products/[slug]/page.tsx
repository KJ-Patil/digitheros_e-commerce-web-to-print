import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATALOG_DIVISIONS, CatalogProduct } from "@/lib/catalog/products";
import { PublicNav } from "@/components/navigation/public-nav";
import { PublicFooter } from "@/components/navigation/public-footer";
import { ConfiguratorForm } from "@/components/pricing/configurator-form";
import { DemoNotice } from "@/components/ui/demo-notice";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const params: { slug: string }[] = [];
  for (const div of CATALOG_DIVISIONS) {
    for (const prod of div.products) {
      params.push({ slug: prod.slug });
    }
  }
  return params;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  // Search product across all divisions
  let foundProduct: CatalogProduct | undefined;
  for (const div of CATALOG_DIVISIONS) {
    const match = div.products.find((p) => p.slug === slug);
    if (match) {
      foundProduct = match;
      break;
    }
  }

  if (!foundProduct) {
    notFound();
  }

  const product = foundProduct;
  const parentDivision = CATALOG_DIVISIONS.find((d) => d.slug === product.divisionSlug)!;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EE]">
      <DemoNotice
        module={`PRODUCT CONFIGURATOR — ${product.name.toUpperCase()}`}
        note="Server-side price calculation with dynamic volume discount tiers and VAT-inclusive totals."
      />
      <PublicNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono mb-6 text-[#6B7886]">
          <Link href="/" className="hover:text-[#13171C]">
            Storefront
          </Link>
          <span>/</span>
          <Link href={`/divisions/${parentDivision.slug}`} className="hover:text-[#13171C]">
            {parentDivision.name}
          </Link>
          <span>/</span>
          <span className="text-[#13171C] font-bold">{product.name}</span>
        </div>

        {/* Dynamic Configurator Form & Live Blueprint */}
        <ConfiguratorForm product={product} divisionName={parentDivision.name} />
      </main>

      <PublicFooter />
    </div>
  );
}
