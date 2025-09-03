import { useRouter } from "next/router";
import ErrorPage from "next/error";
import Container from "../../components/container";
import PostAnchor from "../../components/post-anchor";
import PostBody from "../../components/post-body";
import PostHeader from "../../components/post-header";
import Layout from "../../components/layout";
import { getPostBySlug, getAllPosts } from "../../lib/api";
import { HOME_OG_IMAGE_URL } from "../../lib/constants";
import PostTitle from "../../components/post-title";
import Head from "next/head";
import markdownToHtml from "../../lib/markdownToHtml";
import type PostType from "../../interfaces/post";

type Props = {
  post: PostType;
  morePosts: PostType[];
  preview?: boolean;
};

export default function Post({ post }: Props) {
  const router = useRouter();
  const title = `${post.title} | Little Forest`;
  const description = post.excerpt || `Little Forest - ${post.title}`;
  const url = `https://sylvenas.vercel.app/posts/${post.slug}`;
  const ogImage = (post as any).ogImage?.url || HOME_OG_IMAGE_URL;

  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />;
  }
  return (
    <Layout>
      {router.isFallback ? (
        <PostTitle>Loading…</PostTitle>
      ) : (
        <>
          <Head>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:type" content="article" />
            <meta property="og:url" content={url} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />
          </Head>
          <article>
            <PostHeader
              key={post.title}
              title={post.title}
              date={post.date}
              excerpt={post.excerpt}
            />
            <Container>
              <div className="flex items-start">
                <PostBody content={post.content} slug={post.slug} />
                <PostAnchor anchors={post.anchors} />
              </div>
            </Container>
          </article>
        </>
      )}
    </Layout>
  );
}

type Params = {
  params: {
    slug: string;
  };
};

export async function getStaticProps({ params }: Params) {
  const post = getPostBySlug(params.slug, [
    "title",
    "date",
    "slug",
    "author",
    "content",
    "ogImage",
    "excerpt",
  ]);
  const contentAndAnchor = await markdownToHtml(post.content || "");

  return {
    props: {
      post: {
        ...post,
        ...contentAndAnchor,
      },
    },
  };
}

export async function getStaticPaths() {
  const posts = getAllPosts(["slug"]);

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.slug,
        },
      };
    }),
    fallback: false,
  };
}
