/**
 * Renders a JSON-LD structured-data block. The payload is serialised with
 * JSON.stringify and any "<" character is escaped to its unicode form so
 * review text (or any other string) can never break out of the script tag.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
