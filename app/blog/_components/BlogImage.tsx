import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
};

export function BlogImage({
  src,
  alt,
  caption,
  width = 1200,
  height = 675,
  priority = false,
  className = "",
}: Props) {
  return (
    <figure className={`my-8 ${className}`.trim()}>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 720px"
          className="h-auto w-full object-cover"
        />
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-sm text-zinc-500">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
