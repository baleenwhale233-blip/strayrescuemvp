import { Image } from "@tarojs/components";
import cameraDefault24 from "../assets/icons/camera-default-24.png";
import chevronRightMuted16 from "../assets/icons/chevron-right-muted-16.png";
import circleCheckBrand24 from "../assets/icons/circle-check-brand-24.png";
import fileTextDefault24 from "../assets/icons/file-text-default-24.png";
import handCoinsDefault24 from "../assets/icons/hand-coins-default-24.png";
import plusCircleInverse24 from "../assets/icons/plus-circle-inverse-24.png";
import sparklesDefault24 from "../assets/icons/sparkles-default-24.png";

type IconName =
  | "camera"
  | "fileText"
  | "handCoins"
  | "sparkles"
  | "chevronRight"
  | "circleCheck"
  | "plusCircle"
  | "compass"
  | "briefcase"
  | "user";

type IconVariant = "default" | "muted" | "brand" | "inverse";

const iconMap: Record<IconName, Partial<Record<IconVariant, string>>> = {
  camera: {
    default: cameraDefault24,
  },
  fileText: {
    default: fileTextDefault24,
  },
  handCoins: {
    default: handCoinsDefault24,
  },
  sparkles: {
    default: sparklesDefault24,
  },
  chevronRight: {
    muted: chevronRightMuted16,
  },
  circleCheck: {
    brand: circleCheckBrand24,
  },
  plusCircle: {
    inverse: plusCircleInverse24,
  },
  compass: {},
  briefcase: {},
  user: {},
};

type AppIconProps = {
  name: IconName;
  size?: 16 | 24;
  variant?: IconVariant;
};

export function AppIcon({ name, size = 16, variant = "default" }: AppIconProps) {
  const source = iconMap[name][variant] || iconMap[name].default;

  if (!source) {
    return null;
  }

  return (
    <Image
      src={source}
      mode="aspectFit"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  );
}
