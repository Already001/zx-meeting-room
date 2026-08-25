import {
  defineConfig,
  transformerVariantGroup,
  presetTypography,
  presetIcons
} from "unocss";
import { presetWind3 } from "@unocss/preset-wind3";
import transformerDirectives from "@unocss/transformer-directives";

const fontSans =
  '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif';

export default defineConfig({
  presets: [
    presetWind3(),
    presetTypography(),
    presetIcons({ scale: 1.2, warn: true })
  ],
  theme: {
    fontFamily: {
      sans: fontSans
    },
    colors: {
      black: "#1F2329",
      ink: "#1F2329",
      primary: "#3E7EFF",
      primaryActive: "#2E6BE6",
      primaryLight: "#EBF2FF",
      primaryBorder: "#D8E5FF",
      onPrimary: "#FFFFFF",
      danger: "#FA4141",
      dangerActive: "#DD3636",
      success: "#36D18E",
      successLight: "#EAFAF3",
      split: "#E7E7E7",
      divider: "#E7E7E7",
      grayDark: "#5D616B",
      grayMedium: "#8F959E",
      grayLight: "#F4F6F8",
      edge: "#E1E5EB",
      hairline: "#E1E5EB",
      warning: "#FEAC00",
      warningLight: "#FEF6E5",
      overdue: "#FF950A",
      control: "#C9CFD8",
      controlActive: "#E0E4E8",
      canvas: "#FFFFFF",
      canvasSoft: "#F4F6F8",
      mute: "#8F959E",
      disabled: "#C9CFD8"
    },
    boxShadow: {
      light: "0 0 4px 0 rgba(0, 0, 0, 0.1)",
      heavy: "0 0 10px rgba(0, 0, 0, 0.3)",
      split: "0 -1px 0 0 #F4F6F8"
    }
  },
  shortcuts: {
    "zx-card":
      "bg-canvas text-black border border-edge rounded-8px p-20px shadow-none",
    "zx-page": "min-h-full bg-grayLight text-14px text-black leading-20px"
  },
  rules: [
    ["gutter-stable", { "scrollbar-gutter": "stable" }],
    ["drag-area", { "app-region": "drag" }],
    ["no-drag-area", { "app-region": "no-drag" }],
    [
      "bg-layout-gradient",
      { background: "linear-gradient(180deg, #EBF2FF 0%, #F5F8FF 100%)" }
    ]
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  safelist: [
    ...Array.from({ length: 24 }, (_, i) => `grid-cols-${i + 1}`),
    ...Array.from({ length: 24 }, (_, i) => `col-span-${i + 1}`)
  ]
});
