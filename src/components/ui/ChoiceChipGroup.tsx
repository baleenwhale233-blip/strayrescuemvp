import { Text, View } from "@tarojs/components";
import { AppIcon, type IconName } from "../AppIcon";
import { cx } from "./classNames";
import "./ui.scss";

export type ChoiceChipOption<T extends string = string> = {
  disabled?: boolean;
  label: string;
  leading?: string;
  leadingIconName?: IconName;
  value: T;
};

type ChoiceChipGroupProps<T extends string = string> = {
  className?: string;
  onChange: (value: T) => void;
  options: Array<ChoiceChipOption<T>>;
  value: T;
};

export function ChoiceChipGroup<T extends string = string>({
  className,
  onChange,
  options,
  value,
}: ChoiceChipGroupProps<T>) {
  return (
    <View className={cx("ui-choice-chip-group", className)}>
      {options.map((option) => {
        const active = option.value === value;

        return (
          <View
            key={option.value}
            className={cx(
              "ui-choice-chip",
              active && "ui-choice-chip--active",
              option.disabled && "ui-choice-chip--disabled",
            )}
            onTap={option.disabled ? undefined : () => onChange(option.value)}
          >
            {option.leadingIconName ? (
              <AppIcon
                className="ui-choice-chip__leading-icon"
                name={option.leadingIconName}
                size={14}
                variant={active ? "brand" : "muted"}
              />
            ) : option.leading ? (
              <Text className="ui-choice-chip__leading">{option.leading}</Text>
            ) : null}
            <Text className="ui-choice-chip__label">{option.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
