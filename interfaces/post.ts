import type Author from "./author";

export type Anchor = { id: string; title: string; level: number };

type PostType = {
  slug: string;
  title: string;
  date: number;
  coverImage: string;
  author: Author;
  excerpt: string;
  content: string;
  anchors: Anchor[];
  ogImage?: {
    url: string;
  };
};

export default PostType;
