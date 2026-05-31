export const colors = {
  brand: {
    primary: "#F76808",
    primaryHover: "#E55E07",
    primarySoft: "#FFF1E8",
    primaryBorder: "#F7C5A7",
    onPrimary: "#FFFFFF",
  },
  neutral: {
    bgCanvas: "#F7F5F4",
    bgPage: "#F5F4F3",
    bgCard: "#FFFFFF",
    bgInput: "#F8FAFC",
    bgSubtle: "#F2F4F7",
    bgMuted: "#EEF1F4",
    borderLight: "#E6EAF0",
    borderDefault: "#D9DFE7",
    borderStrong: "#C7CFD9",
    borderDashed: "#DBE4EF",
    textPrimary: "#1F2A37",
    textSecondary: "#667085",
    textTertiary: "#98A2B3",
    textDisabled: "#B7C0CC",
    bgSegmented: "rgba(226, 232, 240, 0.5)",
    overlayScrim: "rgba(15, 23, 42, 0.32)",
    overlayStrong: "rgba(15, 23, 42, 0.56)",
  },
  semantic: {
    success: "#16A34A",
    successSoft: "#EAF8EE",
    warning: "#F59E0B",
    warningSoft: "#FFF5DB",
    danger: "#E5484D",
    dangerSoft: "#FDECEC",
    info: "#4C7EFF",
    infoSoft: "#EAF1FF",
  },
  status: {
    urgent: { bg: "#FFE6D6", text: "#D9480F" },
    active: { bg: "#FFF1E8", text: "#F76808" },
    progress: { bg: "#EEF4FF", text: "#5272C7" },
    done: { bg: "#EEF1F5", text: "#667085" },
    draft: { bg: "#FFF1E8", text: "#E55E07" },
  },
  ledger: {
    spent: "#F76808",
    balance: "#F7B27A",
    pending: "#D9DFE7",
    track: "#ECEFF3",
  },
} as const;

export const typography = {
  fontFamily: {
    base: '"PingFang SC", -apple-system, BlinkMacSystemFont, sans-serif',
    numeric: '"SF Pro Display", "PingFang SC", sans-serif',
  },
  fontSize: {
    displaySm: 28,
    headingLg: 24,
    headingMd: 20,
    headingSm: 18,
    bodyLg: 16,
    bodyMd: 15,
    bodySm: 14,
    caption: 12,
    micro: 11,
    badgeXs: 10,
    uploadAddCopy: 9,
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    displaySm: 36,
    headingLg: 32,
    headingMd: 28,
    headingSm: 26,
    bodyLg: 24,
    bodyMd: 22,
    bodySm: 20,
    caption: 18,
    bodyRich: 22.75,
    badgeXs: 15,
    uploadAddCopy: 13.5,
  },
} as const;

export const borderWidth = {
  default: 1,
  strong: 2,
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
  circle: 9999,
} as const;

export const shadows = {
  none: "none",
  card: "0 2px 8px rgba(16, 24, 40, 0.06)",
  cardStrong: "0 6px 18px rgba(16, 24, 40, 0.08)",
  cta: "0 8px 20px rgba(247, 104, 8, 0.22)",
  bottomBar: "0 -2px 12px rgba(16, 24, 40, 0.06)",
  textOverlay: "0 1px 2px var(--color-overlay-strong)",
} as const;

export const effects = {
  blur: {
    sm: 6,
  },
} as const;

export const sizes = {
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
  },
  chevron: {
    smWidth: 7.4,
    smHeight: 12,
  },
  avatar: {
    sm: 40,
    md: 56,
    lg: 64,
  },
  button: {
    sm: 36,
    md: 44,
    lg: 56,
    xl: 60,
  },
  choiceChip: {
    sm: 30,
  },
  input: {
    md: 48,
    lg: 56,
    xl: 64,
  },
  moneyInput: {
    lg: 58,
  },
  textarea: {
    sm: 106,
    md: 120,
    lg: 160,
  },
  uploadTile: {
    sm: 80,
    md: 96,
    lg: 120,
  },
  uploadAddIcon: {
    width: 22,
    height: 20,
  },
  uploadCover: {
    minHeight: 262,
  },
  contactQr: {
    card: 280,
    image: 246,
  },
  listEntry: {
    lg: 90,
  },
  animalAvatar: {
    xl: 128,
  },
  ledgerStatus: {
    maxWidth: 132,
  },
  layout: {
    tabbar: 65,
    navbar: 98,
    heroLg: 320,
  },
} as const;

export const layout = {
  pagePaddingX: 16,
  pagePaddingTop: 8,
  pageMaxWidth: 390,
  pageContentMaxWidth: 358,
  bottomActionOffsetMd: 120,
  bottomActionOffsetLg: 140,
  bottomActionOffsetXl: 144,
  bottomActionOffsetCreate: 164,
  sectionGap: 16,
  cardGap: 16,
  formGap: 24,
} as const;

export const componentTokens = {
  button: {
    primary: {
      background: colors.brand.primary,
      color: colors.brand.onPrimary,
      radius: radius.md,
      height: sizes.button.lg,
      shadow: shadows.cta,
    },
    secondary: {
      background: colors.neutral.bgCard,
      color: colors.neutral.textPrimary,
      borderColor: colors.neutral.borderDefault,
      radius: radius.md,
      height: sizes.button.lg,
    },
  },
  card: {
    background: colors.neutral.bgCard,
    borderColor: colors.neutral.borderLight,
    radius: radius.md,
    shadow: shadows.card,
    activeBorderColor: colors.brand.primary,
  },
  chip: {
    background: colors.neutral.bgSubtle,
    color: colors.neutral.textSecondary,
    activeBackground: colors.brand.primarySoft,
    activeColor: colors.brand.primary,
    activeBorderColor: colors.brand.primaryBorder,
    radius: radius.pill,
  },
  progress: {
    track: colors.ledger.track,
    spent: colors.ledger.spent,
    balance: colors.ledger.balance,
    pending: colors.ledger.pending,
    height: 8,
  },
  form: {
    labelColor: colors.neutral.textPrimary,
    descriptionColor: colors.neutral.textSecondary,
    controlBackground: colors.neutral.bgInput,
    controlBorderColor: colors.neutral.borderDefault,
    controlRadius: radius.sm,
    controlMinHeight: sizes.input.md,
    moneyInputPaddingLeftLg: 45,
    textareaPadding: 18,
  },
  bottomActionBar: {
    background: "rgba(255, 255, 255, 0.96)",
    borderColor: colors.neutral.borderLight,
    shadow: shadows.bottomBar,
    paddingX: spacing[4],
    paddingY: spacing[3],
  },
  sheet: {
    background: colors.neutral.bgCard,
    scrim: colors.neutral.overlayScrim,
    radiusTop: 28,
    shadow: "0 -12px 32px rgba(15, 23, 42, 0.12)",
  },
  upload: {
    tileBackground: colors.neutral.bgInput,
    tileBorderColor: colors.neutral.borderDashed,
    tileRadius: radius.md,
    tileSize: sizes.uploadTile.md,
    addIconWidth: sizes.uploadAddIcon.width,
    addIconHeight: sizes.uploadAddIcon.height,
    addCopyFontSize: typography.fontSize.uploadAddCopy,
    addCopyLineHeight: typography.lineHeight.uploadAddCopy,
  },
} as const;

export const cssVar = {
  colorBrandPrimary: "var(--color-brand-primary)",
  colorBgPage: "var(--color-bg-page)",
  colorBgCard: "var(--color-bg-card)",
  colorTextPrimary: "var(--color-text-primary)",
  colorTextSecondary: "var(--color-text-secondary)",
  colorBorderDefault: "var(--color-border-default)",
  radiusMd: "var(--radius-md)",
  shadowCard: "var(--shadow-card)",
} as const;

export const tokens = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  borderWidth,
  effects,
  sizes,
  layout,
  componentTokens,
  cssVar,
} as const;

export type Tokens = typeof tokens;
