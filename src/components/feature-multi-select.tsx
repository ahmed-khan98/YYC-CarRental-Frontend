import Select, { type MultiValue, type StylesConfig } from "react-select";

type FeatureOption = {
  value: string;
  label: string;
};

function toOptions(names: string[]): FeatureOption[] {
  return names.map((name) => ({ value: name, label: name }));
}

const styles: StylesConfig<FeatureOption, true> = {
  menuPortal: (base) => ({
    ...base,
    zIndex: 150,
    pointerEvents: "auto",
  }),
};

export function FeatureMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select features",
  emptyMessage = "No features yet. Add them in Features first.",
  disabled,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}) {
  return (
    <Select
      isMulti
      isDisabled={disabled}
      options={toOptions(options)}
      value={toOptions(value)}
      onChange={(next: MultiValue<FeatureOption>) => {
        onChange(next.map((option) => option.value));
      }}
      placeholder={placeholder}
      noOptionsMessage={() => emptyMessage}
      closeMenuOnSelect={false}
      menuPortalTarget={typeof document === "undefined" ? undefined : document.body}
      menuPosition="fixed"
      styles={styles}
      theme={(theme) => ({
        ...theme,
        colors: {
          ...theme.colors,
          primary: "var(--primary)",
          primary25: "color-mix(in oklab, var(--primary) 14%, white)",
          primary50: "color-mix(in oklab, var(--primary) 28%, white)",
          primary75: "color-mix(in oklab, var(--primary) 55%, white)",
        },
      })}
    />
  );
}
