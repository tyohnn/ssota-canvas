import Link from 'next/link';
import { type SanityDocument } from 'next-sanity';
import { client } from '@/sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{_id, title, slug, publishedAt, image}`;

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

export default async function BlogPage() {
  const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY, {}, options);

  return (
    <div className="container mx-auto min-h-screen max-w-4xl px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Team Blog</h1>
      <ul className="flex flex-col gap-y-6">
        {posts.map(post => {
          const imageUrl = post.image
            ? urlFor(post.image)?.width(800).height(450).url()
            : null;

          return (
            <li key={post._id}>
              <Link
                href={`/team/blog/${post.slug.current}`}
                className="block group"
              >
                <article className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  {imageUrl && (
                    <div className="mb-4 aspect-video overflow-hidden rounded-lg">
                      <img
                        src={imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        width="800"
                        height="450"
                      />
                    </div>
                  )}
                  <h2 className="text-2xl font-semibold mb-2 group-hover:underline">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(post.publishedAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </article>
              </Link>
            </li>
          );
        })}
      </ul>
      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No posts published yet.</p>
        </div>
      )}
    </div>
  );
}
