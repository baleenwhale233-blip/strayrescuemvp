import { View } from "@tarojs/components";
import { AppIcon } from "../../../components/AppIcon";
import { ListEntry } from "../../../components/ui";
import type { ProfileMenuItem } from "../types";
import "./ProfileMenuList.scss";

export function ProfileMenuList({
  items,
  onItemTap,
}: {
  items: ProfileMenuItem[];
  onItemTap: (key: ProfileMenuItem["key"]) => void;
}) {
  return (
    <View className="profile-page__menu">
      {items.map((item) => (
        <ListEntry
          key={item.key}
          className="profile-page__menu-item"
          leading={
            <View className="profile-page__menu-icon-wrap">
              <AppIcon
                className="profile-page__menu-icon"
                name={item.iconName}
                size={20}
                variant="brand"
              />
            </View>
          }
          onTap={() => onItemTap(item.key)}
          title={item.label}
          trailing={
            <AppIcon
              className="profile-page__chevron"
              name="chevronRight"
              size={12}
              variant="muted"
            />
          }
        />
      ))}
    </View>
  );
}
