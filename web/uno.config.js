import {
  defineConfig,
  transformerVariantGroup,
  presetTypography,
  presetIcons
} from "unocss";
import { presetWind3 } from "@unocss/preset-wind3";
import transformerDirectives from "@unocss/transformer-directives";

export default defineConfig({
  presets: [
    presetWind3(),
    presetTypography(),
    presetIcons({ scale: 1.2, warn: true })
  ],
  theme: {
    colors: {
      black: "#1F2329",
      primary: "#3E7EFF",
      primaryActive: "#2E6BE6",
      primaryLight: "#EBF2FF",
      primaryBorder: "#D8E5FF",
      danger: "#FA4141",
      dangerActive: "#DD3636",
      success: "#36D18E",
      split: "#E7E7E7",
      grayDark: "#5D616B",
      grayMedium: "#8F959E",
      grayLight: "#F4F6F8",
      edge: "#E1E5EB",
      warning: "#FEAC00",
      control: "#C9CFD8",
      controlActive: "#E0E4E8"
    }
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
