import { Star } from "lucide-react";
import Counter from "@/components/motion/Counter";

const numeralClass =
  "tnum font-mono text-[clamp(1.75rem,3vw,2.5rem)] font-medium text-gold-500";

export default function StatsBand({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  return (
    <section
      aria-label="Key stats"
      className="w-full border-y border-ink-700 bg-ink-900"
    >
      <div className="site-container-wide py-10">
        <div className="tick-corners grid grid-cols-2 gap-y-8 text-ink-500 lg:grid-cols-4 lg:divide-x lg:divide-ink-700">
          <div className="px-2 lg:px-8 lg:first:pl-0">
            <p className={numeralClass}>
              <Counter to={rating} decimals={1} />{" "}
              <Star
                aria-hidden="true"
                className="inline h-5 w-5 fill-gold-500 text-gold-500 align-baseline"
              />
            </p>
            <p className="mono-label mt-1 text-[0.6875rem] text-ink-400">
              GOOGLE RATING
            </p>
          </div>

          <div className="px-2 lg:px-8">
            <p className={numeralClass}>
              <Counter to={reviewCount} suffix="+" />
            </p>
            <p className="mono-label mt-1 text-[0.6875rem] text-ink-400">
              GOOGLE REVIEWS
            </p>
          </div>

          <div className="px-2 lg:px-8">
            <p className={numeralClass}>Same day</p>
            <p className="mono-label mt-1 text-[0.6875rem] text-ink-400">
              MOST REPAIRS
            </p>
          </div>

          <div className="px-2 lg:px-8">
            <p className={numeralClass}>12 mo</p>
            <p className="mono-label mt-1 text-[0.6875rem] text-ink-400">
              PARTS WARRANTY AVAILABLE
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
