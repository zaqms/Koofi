import { HomeLanding } from "@/components/home-landing";
import { JsonLd } from "@/components/json-ld";
import { websiteJsonLd } from "@/lib/structured-data";

export default function Home() {
  return (
    <>
      <JsonLd data={websiteJsonLd("ar")} />
      <HomeLanding language="ar" />
    </>
  );
}
