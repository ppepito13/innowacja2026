import React from 'react';
import type { IconType } from 'react-icons';

interface IconProps {
  icon: IconType;
  size?: number;
  className?: string;
}

const Icon = ({ icon, size = 16, className }: IconProps) =>
  (icon as (props: { size: number; className?: string }) => React.ReactElement)({
    size,
    className,
  });

export default Icon;
