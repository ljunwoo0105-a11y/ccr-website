import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import MotionProvider from "@/components/motion/MotionProvider";

/**
 * Public marketing layout — Benchlight. The page is a two-act composition:
 * dark ink bookends (header/hero and contact/footer) around a warm paper
 * middle. MotionProvider gates all animation behind prefers-reduced-motion;
 * the noscript block guarantees content is never stuck at initial opacity.
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
      <div className="flex min-h-screen flex-col bg-ink-950">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </MotionProvider>
  );
}
