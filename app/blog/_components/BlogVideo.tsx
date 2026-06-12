type FileVideoProps = {
  type?: "file";
  src: string;
  poster?: string;
  title: string;
};

type YoutubeVideoProps = {
  type: "youtube";
  embedId: string;
  title: string;
};

type VimeoVideoProps = {
  type: "vimeo";
  embedId: string;
  title: string;
};

type Props = FileVideoProps | YoutubeVideoProps | VimeoVideoProps;

function embedSrc(props: YoutubeVideoProps | VimeoVideoProps): string {
  if (props.type === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${props.embedId}`;
  }
  return `https://player.vimeo.com/video/${props.embedId}`;
}

export function BlogVideo(props: Props) {
  const title = props.title;

  if (props.type === "youtube" || props.type === "vimeo") {
    return (
      <figure className="my-8">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 shadow-sm">
          <div className="relative aspect-video w-full">
            <iframe
              src={embedSrc(props)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </div>
        <figcaption className="mt-2 text-center text-sm text-zinc-500">{title}</figcaption>
      </figure>
    );
  }

  return (
    <figure className="my-8">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 shadow-sm">
        <video
          controls
          playsInline
          preload="metadata"
          poster={props.poster}
          title={title}
          className="aspect-video w-full bg-black"
        >
          <source src={props.src} />
          Your browser does not support embedded video.
        </video>
      </div>
      <figcaption className="mt-2 text-center text-sm text-zinc-500">{title}</figcaption>
    </figure>
  );
}
