import twitterIcon from "../assets/images/twitter.svg";
import redditIcon from "../assets/images/reddit.svg";
import githubIcon from "../assets/images/github2.svg";

const PREFIX = "http://sylvenas.github.io/posts/";

const platforms = [
  {
    name: "Twitter",
    backgroundColor: "#55acee",
    platformPrefix: "https://twitter.com/intent/tweet?text=",
    icon: twitterIcon.src,
  },
  {
    name: "Reddit",
    backgroundColor: "#0976b4",
    platformPrefix: "https://www.reddit.com/submit?url=",
    icon: redditIcon.src,
  },
  {
    name: "GitHub",
    backgroundColor: "#0976b4",
    fixedLink: "https://github.com/Sylvenas/blog_beta/pulls",
    icon: githubIcon.src,
  },
];

const Footer = ({ slug }: { slug: string }) => {
  return (
    <footer className="max-w-4xl mx-auto pt-12 pb-30">
      <div className="border-t-1 border-[#e9e1e1] dark:border-[#414141] pl-4 md:pl-0">
        <p className="mb-5">COMMENT ON:</p>
        <ul className="m-0 p-0">
          {platforms.map((platform) => (
            <li
              key={platform.name}
              className="inline-block h-9 w-12 mr-2 border-1 border-solid border-[#e9e1e1] dark:border-[#414141] rounded-[3px] cursor-pointer"
            >
              <a
                className="share inline-block h-full w-full flex items-center justify-center"
                target="_blank"
                href={
                  platform.platformPrefix
                    ? `${platform.platformPrefix}${encodeURIComponent(
                        PREFIX + slug
                      )}`
                    : platform.fixedLink
                }
              >
                <img
                  src={platform.icon}
                  alt={platform.name}
                  className="h-5 w-5"
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
