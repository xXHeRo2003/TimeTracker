import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../theme/colors';

const iconDefaults = {
  size: 24,
  color: colors.textSecondary
};

export const TimerIcon = ({ size = iconDefaults.size, color = iconDefaults.color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 3h4"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Path
      d="M9 6h6"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Circle
      cx={12}
      cy={13}
      r={7}
      stroke={color}
      strokeWidth={1.5}
    />
    <Path
      d="M12 9.5V13l2.5 1.75"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const HistoryIcon = ({ size = iconDefaults.size, color = iconDefaults.color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 18h14"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Rect
      x={5.75}
      y={11}
      width={2.5}
      height={6}
      rx={1.25}
      fill={color}
    />
    <Rect
      x={10.75}
      y={7}
      width={2.5}
      height={10}
      rx={1.25}
      fill={color}
    />
    <Rect
      x={15.75}
      y={9}
      width={2.5}
      height={8}
      rx={1.25}
      fill={color}
    />
  </Svg>
);

export const SettingsIcon = ({ size = iconDefaults.size, color = iconDefaults.color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 8h14"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Path
      d="M5 12h14"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Path
      d="M5 16h14"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Circle
      cx={15.5}
      cy={8}
      r={2}
      fill={colors.surface}
      stroke={color}
      strokeWidth={1.5}
    />
    <Circle
      cx={8.5}
      cy={12}
      r={2}
      fill={colors.surface}
      stroke={color}
      strokeWidth={1.5}
    />
    <Circle
      cx={13}
      cy={16}
      r={2}
      fill={colors.surface}
      stroke={color}
      strokeWidth={1.5}
    />
  </Svg>
);

