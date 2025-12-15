import { PortableText, type SanityDocument } from 'next-sanity';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';
import { client } from '@/sanity/client';
import Link from 'next/link';

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await client.fetch<SanityDocument>(
    POST_QUERY,
    { slug },
    options
  );

  if (!post) {
    return (
      <div className="container mx-auto min-h-screen max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Link href="/team/blog" className="text-primary hover:underline">
          ← Back to posts
        </Link>
      </div>
    );
  }

  const postImageUrl = post.image
    ? urlFor(post.image)?.width(1200).height(675).url()
    : null;

  return (
    <article className="container mx-auto min-h-screen max-w-4xl px-4 py-8 flex flex-col gap-6">
      <Link
        href="/team/blog"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        ← Back to posts
      </Link>

      {postImageUrl && (
        <div className="aspect-video overflow-hidden rounded-xl">
          <img
            src={postImageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
            width="1200"
            height="675"
          />
        </div>
      )}

      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">{post.title}</h1>
        <p className="text-sm text-muted-foreground">
          Published:{' '}
          {new Date(post.publishedAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        {Array.isArray(post.body) && <PortableText value={post.body} />}
      </div>
    </article>
  );
}
