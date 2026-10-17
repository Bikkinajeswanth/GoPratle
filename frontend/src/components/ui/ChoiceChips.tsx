"use client";

type Option = { value: string; label: string };

type ChoiceChipsProps = {
  name: string;
  options: readonly Option[];
  invalid?: boolean;
} & (
  | { multiple: true; value: string[]; onChange: (value: string[]) => void }
  | { multiple?: false; value: string; onChange: (value: string) => void }
);

/** Pill-style checkbox (multiple) or radio (single) group. */
export function ChoiceChips(props: ChoiceChipsProps) {
  const { name, options, invalid } = props;
  const isSelected = (v: string) => (props.multiple ? props.value.includes(v) : props.value === v);

  const toggle = (v: string) => {
    if (props.multiple) {
      props.onChange(props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    } else {
      props.onChange(v);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const selected = isSelected(o.value);
        return (
          <label
            key={o.value}
            className={[
              "group inline-flex cursor-pointer select-none items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition",
              "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100",
              selected
                ? "border-brand-500 bg-brand-50 text-brand-800"
                : invalid
                  ? "border-rose-300 bg-white text-slate-700 hover:border-rose-400"
                  : "border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/40",
            ].join(" ")}
          >
            <input
              type={props.multiple ? "checkbox" : "radio"}
              name={name}
              value={o.value}
              checked={selected}
              onChange={() => toggle(o.value)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={[
                "grid size-4 place-items-center border transition",
                props.multiple ? "rounded" : "rounded-full",
                selected ? "border-brand-600 bg-brand-600 text-white" : "border-slate-400 bg-white",
              ].join(" ")}
            >
              {selected && (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3">
                  <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            {o.label}
          </label>
        );
      })}
    </div>
  );
}
