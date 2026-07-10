import ManualHeader from "@/components/sheet/ManualHeader";
import ManualFooter from "@/components/sheet/ManualFooter";
import IndexRail from "@/components/sheet/IndexRail";
import MotionProvider from "@/components/motion/MotionProvider";

/**
 * Public marketing layout — Manifold. A light engineering-drawing world:
 * bone drafting paper end-to-end, carbon ink rules, safety-orange signal.
 * Every section is a numbered sheet from the shop's field service manual.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionProvider>
      <noscript>
        <style>{`[data-motion]{opacity:1 !important;transform:none !important}`}</style>
      </noscript>
      <div className="mnl-page flex min-h-screen flex-col">
        <a href="#main" className="mnl-skip">
          Skip to content
        </a>
        <ManualHeader />
        <IndexRail />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <ManualFooter />
      </div>
    </MotionProvider>
  );
}
