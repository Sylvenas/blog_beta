import Head from "next/head";
import MoreStories from "../components/more-stories";
import HeroPost from "../components/hero-post";
import Layout from "../components/layout";
import { getAllPosts } from "../lib/api";
import { HOME_OG_IMAGE_URL } from "../lib/constants";
import Post from "../interfaces/post";

type Props = {
  allPosts: Post[];
};

export default function Index({ allPosts }: Props) {
  const heroPost = allPosts[0];
  const morePosts = allPosts.slice(1);
  return (
    <>
      <Layout>
        <Head>
          <title>Little Forest - Blog</title>
          <meta
            name="description"
            content="Little Forest - Personal tech blog sharing frontend development, functional programming, and technical insights"
          />
          <meta property="og:title" content="Little Forest - Blog" />
          <meta
            property="og:description"
            content="Personal tech blog sharing frontend development, functional programming, and technical insights"
          />
          <meta property="og:image" content={HOME_OG_IMAGE_URL} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://sylvenas.vercel.app" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Little Forest - Blog" />
          <meta
            name="twitter:description"
            content="Personal tech blog sharing frontend development, functional programming, and technical insights"
          />
          <meta name="twitter:image" content={HOME_OG_IMAGE_URL} />
        </Head>
        <HeroPost
          title={heroPost.title}
          date={heroPost.date}
          slug={heroPost.slug}
          excerpt={heroPost.excerpt}
        />
        <MoreStories posts={morePosts} />
      </Layout>
    </>
  );
}

export const getStaticProps = async () => {
  const allPosts = getAllPosts([
    "slug",
    "title",
    "date",
    "categories",
    "excerpt",
    "content",
  ]);
  return {
    props: { allPosts },
  };
};
