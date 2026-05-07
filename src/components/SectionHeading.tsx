interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-xs uppercase tracking-[0.45em] text-cyan/80">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-ice sm:text-4xl">{title}</h2>
      {description ? <p className="text-sm leading-7 text-mist sm:text-base">{description}</p> : null}
    </div>
  );
}
