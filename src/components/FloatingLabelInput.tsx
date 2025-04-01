import { useState } from "react";
import { TextInput } from "@mantine/core";
import classes from "./FloatingLabelInput.module.css";

interface Props {
  label: string;
  placeholder: string;
  setItem: (item: string) => void;
  required?: boolean;
}
export function FloatingLabelInput({ label, placeholder, setItem }: Props) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const floating = value.trim().length !== 0 || focused || undefined;

  return (
    <TextInput
      label={label}
      placeholder={placeholder}
      required
      classNames={classes}
      value={value}
      onChange={(event) => {
        const newValue = event.currentTarget.value;
        setValue(newValue);
        setItem(newValue);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      mt="xl"
      autoComplete="nope"
      data-floating={floating}
      labelProps={{ "data-floating": floating }}
    />
  );
}
