import { createFileRoute } from "@tanstack/react-router";
import { PolkaApp } from "@/components/polka/PolkaApp";

const title = "Polka.trade — Kenya's Prediction Market";
const description =
  "Trade on the probability of real events: Kenyan politics, sports, crypto, business and more. A prediction market, not a sportsbook. 18+.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  return <PolkaApp />;
}
