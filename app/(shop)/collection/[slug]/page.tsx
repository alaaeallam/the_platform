import { redirect } from "next/navigation";

function normalizeSlug(slug: string) {
  return decodeURIComponent(slug)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

type CollectionPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const normalizedSlug = normalizeSlug(slug);

  redirect(`/browse?category=${encodeURIComponent(normalizedSlug)}`);
}
