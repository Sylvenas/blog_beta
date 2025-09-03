import Link from "next/link";
import githubIcon from "../assets/images/github.svg";
import twitterIcon from "../assets/images/twitter.svg";

function Nav() {
  return (
    <nav className="flex items-center justify-between sm:justify-center w-full gap-3 md:gap-24 text-12 sm:text-13 text-white">
      <div className="flex items-center gap-4 md:gap-6">
        <Link as={`/`} href="/" className="cursor-pointer">
          HOME
        </Link>
        <Link as={`/categories`} href="/categories" className="cursor-pointer">
          CATEGORIES
        </Link>
        <Link as={`/resume`} href="/resume" className="cursor-pointer">
          RESUME
        </Link>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <Link
          as="https://github.com/sylvenas"
          href="https://github.com/sylvenas"
          className="cursor-pointer"
          target="_blank"
        >
          <img
            src={githubIcon.src}
            alt="github"
            className="h-5 w-5 flex-shrink-0"
          />
        </Link>
        <Link
          as="https://twitter.com/sylvenas_"
          href="https://twitter.com/sylvenas_"
          className="cursor-pointer"
          target="_blank"
        >
          <img
            src={twitterIcon.src}
            alt="twitter"
            className="h-5 w-5 flex-shrink-0"
          />
        </Link>
      </div>
    </nav>
  );
}

export default Nav;
