import { Text, TextInput } from 'react-native';

/**
 * Clamp OS font scaling so very large accessibility text sizes still scale up
 * (readability) but cannot blow out fixed layouts (rings, OTP boxes, tab bar,
 * cards). 1.4 keeps a meaningful boost while protecting dense screens.
 *
 * Applied once on import via Text/TextInput defaultProps so every Text in the
 * app inherits the cap without touching each component. Individual screens can
 * still override per-Text when a larger or unscaled value is required.
 */
const MAX_FONT_SCALE = 1.4;

type ScalableComponent = {
  defaultProps?: {
    maxFontSizeMultiplier?: number;
    allowFontScaling?: boolean;
  };
};

function applyScalingDefault(component: ScalableComponent): void {
  component.defaultProps = {
    ...(component.defaultProps ?? {}),
    maxFontSizeMultiplier: MAX_FONT_SCALE,
  };
}

applyScalingDefault(Text as unknown as ScalableComponent);
applyScalingDefault(TextInput as unknown as ScalableComponent);

export { MAX_FONT_SCALE };
