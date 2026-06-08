import { Image } from "@tarojs/components";
import arrowRightInverse from "../assets/lucide/arrowRight-inverse.svg";
import badgeCheckBrand from "../assets/lucide/badgeCheck-brand.svg";
import bookOpenBrand from "../assets/lucide/bookOpen-brand.svg";
import briefcaseDefault from "../assets/lucide/briefcase-default.svg";
import cameraDefault from "../assets/lucide/camera-default.svg";
import cameraInverse from "../assets/lucide/camera-inverse.svg";
import chevronRightBrand from "../assets/lucide/chevronRight-brand.svg";
import chevronRightInverse from "../assets/lucide/chevronRight-inverse.svg";
import chevronRightMuted from "../assets/lucide/chevronRight-muted.svg";
import circleCheckBrand from "../assets/lucide/circleCheck-brand.svg";
import circlePlusInverse from "../assets/lucide/circlePlus-inverse.svg";
import circlePlusMuted from "../assets/lucide/circlePlus-muted.svg";
import clipboardListBrand from "../assets/lucide/clipboardList-brand.svg";
import compassDefault from "../assets/lucide/compass-default.svg";
import contactBookBrand from "../assets/lucide/contactBook-brand.svg";
import copyInverse from "../assets/lucide/copy-inverse.svg";
import copyMuted from "../assets/lucide/copy-muted.svg";
import fileTextDefault from "../assets/lucide/fileText-default.svg";
import handCoinsDefault from "../assets/lucide/handCoins-default.svg";
import handCoinsInfo from "../assets/lucide/handCoins-info.svg";
import handHeartInfo from "../assets/lucide/handHeart-info.svg";
import handHeartSuccess from "../assets/lucide/handHeart-success.svg";
import heartHandshakeBrand from "../assets/lucide/heartHandshake-brand.svg";
import heartHandshakeInverse from "../assets/lucide/heartHandshake-inverse.svg";
import heartHandshakeMuted from "../assets/lucide/heartHandshake-muted.svg";
import historyBrand from "../assets/lucide/history-brand.svg";
import homeBrand from "../assets/lucide/home-brand.svg";
import homeInverse from "../assets/lucide/home-inverse.svg";
import homeMuted from "../assets/lucide/home-muted.svg";
import imagePlusMuted from "../assets/lucide/imagePlus-muted.svg";
import imagesBrand from "../assets/lucide/images-brand.svg";
import infoBrand from "../assets/lucide/info-brand.svg";
import infoMuted from "../assets/lucide/info-muted.svg";
import pencilMuted from "../assets/lucide/pencil-muted.svg";
import qrCodeInverse from "../assets/lucide/qrCode-inverse.svg";
import rainbowBrand from "../assets/lucide/rainbow-brand.svg";
import rainbowInverse from "../assets/lucide/rainbow-inverse.svg";
import rainbowMuted from "../assets/lucide/rainbow-muted.svg";
import receiptTextDanger from "../assets/lucide/receiptText-danger.svg";
import receiptTextDefault from "../assets/lucide/receiptText-default.svg";
import receiptTextInverse from "../assets/lucide/receiptText-inverse.svg";
import searchMuted from "../assets/lucide/search-muted.svg";
import sendInverse from "../assets/lucide/send-inverse.svg";
import shareInverse from "../assets/lucide/share-inverse.svg";
import shareMuted from "../assets/lucide/share-muted.svg";
import sirenBrand from "../assets/lucide/siren-brand.svg";
import sirenInverse from "../assets/lucide/siren-inverse.svg";
import sirenMuted from "../assets/lucide/siren-muted.svg";
import sparklesDefault from "../assets/lucide/sparkles-default.svg";
import stethoscopeBrand from "../assets/lucide/stethoscope-brand.svg";
import stethoscopeInverse from "../assets/lucide/stethoscope-inverse.svg";
import stethoscopeMuted from "../assets/lucide/stethoscope-muted.svg";
import trashInverse from "../assets/lucide/trash-inverse.svg";
import trashMuted from "../assets/lucide/trash-muted.svg";
import trendingUpInfo from "../assets/lucide/trendingUp-info.svg";
import userDefault from "../assets/lucide/user-default.svg";
import walletCardsWarning from "../assets/lucide/walletCards-warning.svg";

export type IconName =
  | "arrowRight"
  | "badgeCheck"
  | "bookOpen"
  | "briefcase"
  | "camera"
  | "chevronRight"
  | "circleCheck"
  | "plusCircle"
  | "circlePlus"
  | "clipboardList"
  | "compass"
  | "contactBook"
  | "copy"
  | "fileText"
  | "handCoins"
  | "handHeart"
  | "heartHandshake"
  | "history"
  | "home"
  | "imagePlus"
  | "images"
  | "info"
  | "pencil"
  | "qrCode"
  | "rainbow"
  | "receiptText"
  | "search"
  | "send"
  | "share"
  | "siren"
  | "sparkles"
  | "stethoscope"
  | "trash"
  | "trendingUp"
  | "user"
  | "walletCards";

export type IconVariant =
  | "default"
  | "muted"
  | "brand"
  | "inverse"
  | "danger"
  | "success"
  | "warning"
  | "info";

const iconMap: Record<IconName, Partial<Record<IconVariant, string>>> = {
  arrowRight: {
    inverse: arrowRightInverse,
  },
  badgeCheck: {
    brand: badgeCheckBrand,
  },
  bookOpen: {
    brand: bookOpenBrand,
  },
  briefcase: {
    default: briefcaseDefault,
  },
  camera: {
    default: cameraDefault,
    inverse: cameraInverse,
  },
  chevronRight: {
    brand: chevronRightBrand,
    inverse: chevronRightInverse,
    muted: chevronRightMuted,
  },
  circleCheck: {
    brand: circleCheckBrand,
  },
  plusCircle: {
    inverse: circlePlusInverse,
    muted: circlePlusMuted,
  },
  circlePlus: {
    inverse: circlePlusInverse,
    muted: circlePlusMuted,
  },
  clipboardList: {
    brand: clipboardListBrand,
  },
  compass: {
    default: compassDefault,
  },
  contactBook: {
    brand: contactBookBrand,
  },
  copy: {
    inverse: copyInverse,
    muted: copyMuted,
  },
  fileText: {
    default: fileTextDefault,
  },
  handCoins: {
    default: handCoinsDefault,
    info: handCoinsInfo,
  },
  handHeart: {
    info: handHeartInfo,
    success: handHeartSuccess,
  },
  heartHandshake: {
    brand: heartHandshakeBrand,
    inverse: heartHandshakeInverse,
    muted: heartHandshakeMuted,
  },
  history: {
    brand: historyBrand,
  },
  home: {
    brand: homeBrand,
    inverse: homeInverse,
    muted: homeMuted,
  },
  imagePlus: {
    muted: imagePlusMuted,
  },
  images: {
    brand: imagesBrand,
  },
  info: {
    brand: infoBrand,
    muted: infoMuted,
  },
  pencil: {
    muted: pencilMuted,
  },
  qrCode: {
    inverse: qrCodeInverse,
  },
  rainbow: {
    brand: rainbowBrand,
    inverse: rainbowInverse,
    muted: rainbowMuted,
  },
  receiptText: {
    danger: receiptTextDanger,
    default: receiptTextDefault,
    inverse: receiptTextInverse,
  },
  search: {
    muted: searchMuted,
  },
  send: {
    inverse: sendInverse,
  },
  share: {
    inverse: shareInverse,
    muted: shareMuted,
  },
  siren: {
    brand: sirenBrand,
    inverse: sirenInverse,
    muted: sirenMuted,
  },
  sparkles: {
    default: sparklesDefault,
  },
  stethoscope: {
    brand: stethoscopeBrand,
    inverse: stethoscopeInverse,
    muted: stethoscopeMuted,
  },
  trash: {
    inverse: trashInverse,
    muted: trashMuted,
  },
  trendingUp: {
    info: trendingUpInfo,
  },
  user: {
    default: userDefault,
  },
  walletCards: {
    warning: walletCardsWarning,
  },
};

type AppIconProps = {
  className?: string;
  name: IconName;
  size?: number;
  variant?: IconVariant;
};

export function AppIcon({ className, name, size = 16, variant = "default" }: AppIconProps) {
  const source = iconMap[name][variant] || iconMap[name].default;

  if (!source) {
    return null;
  }

  return (
    <Image
      className={className}
      src={source}
      mode="aspectFit"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  );
}
