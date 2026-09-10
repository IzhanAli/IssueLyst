/**
 * Product screenshot, replacing `next/image`.
 *
 * The optimiser Next provided is done ahead of time instead: `npm run
 * images` writes an AVIF and a WebP next to each PNG, and the browser picks
 * the first format it understands. Width and height are always set so the
 * layout reserves the right box and the page doesn't shift as shots load.
 */
export function Shot({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
  priority?: boolean;
}) {
  const base = src.replace(/\.png$/, "");
  return (
    <picture style={{ display: "block" }}>
      <source srcSet={`${base}.avif`} type="image/avif" />
      <source srcSet={`${base}.webp`} type="image/webp" />
      <img
        className={className}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
      />
    </picture>
  );
}
