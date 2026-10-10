import { notFound } from "next/navigation";

// /en/<one segment> that isn't a real English page (e.g. /en/x). Without this
// route, Next matched it as the Arabic /[category]/[slug] (category "en") and
// rendered the Arabic 404 and banner. Real pages (/en/about, /en/c/…, …) are
// static segments and still win. The 404 is English: see not-found.tsx here.
export default function EnglishUnknownPage(): never {
  notFound();
}
