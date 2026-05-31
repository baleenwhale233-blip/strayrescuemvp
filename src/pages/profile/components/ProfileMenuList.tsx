import { Image, View } from "@tarojs/components";
import { ListEntry } from "../../../components/ui";
import chevronIcon from "../../../assets/rescue-detail/owner/action-chevron.svg";
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
              <Image className="profile-page__menu-icon" mode="aspectFit" src={item.icon} />
            </View>
          }
          onTap={() => onItemTap(item.key)}
          title={item.label}
          trailing={<Image className="profile-page__chevron" mode="aspectFit" src={chevronIcon} />}
        />
      ))}
    </View>
  );
}
