import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { AppIcon } from "./AppIcon";

type NavBarProps = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
};

function getNavMetrics() {
  const systemInfo = Taro.getSystemInfoSync();
  const fallbackStatusBarHeight = systemInfo.statusBarHeight ?? 20;

  try {
    const menuButton = Taro.getMenuButtonBoundingClientRect();
    const navHeight =
      (menuButton.top - fallbackStatusBarHeight) * 2 + menuButton.height;

    return {
      statusBarHeight: fallbackStatusBarHeight,
      navHeight,
      sideWidth: menuButton.width,
    };
  } catch {
    return {
      statusBarHeight: fallbackStatusBarHeight,
      navHeight: 44,
      sideWidth: 88,
    };
  }
}

export function NavBar({ title, showBack = false, onBack }: NavBarProps) {
  const metrics = getNavMetrics();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    Taro.navigateBack();
  };

  return (
    <View
      className="page-nav page-nav--system"
      style={{ paddingTop: `${metrics.statusBarHeight}px` }}
    >
      <View
        className="page-nav__bar"
        style={{ height: `${metrics.navHeight}px` }}
      >
        <View className="page-nav__side" style={{ width: `${metrics.sideWidth}px` }}>
          {showBack ? (
            <View className="page-nav__back" onTap={handleBack}>
              <View className="page-nav__back-icon">
                <AppIcon name="chevronRight" size={16} variant="muted" />
              </View>
            </View>
          ) : (
            <View className="page-nav__placeholder" />
          )}
        </View>
        <Text className="page-nav__title">{title}</Text>
        <View className="page-nav__side" style={{ width: `${metrics.sideWidth}px` }}>
          <View className="page-nav__placeholder" />
        </View>
      </View>
    </View>
  );
}
