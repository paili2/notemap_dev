"use client";

import * as React from "react";

type Props = React.SVGProps<SVGSVGElement>;

export default function GridTilesIcon(props: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      width="22"
      height="22"
      aria-hidden="true"
      {...props}
    >
      <g fill="currentColor" transform="translate(32 32)">
        <path
          d="M0 -12 L12 0 L0 12 L-12 0 Z"
          transform="translate(-12,-12) rotate(45)"
        />
        <path
          d="M0 -12 L12 0 L0 12 L-12 0 Z"
          transform="translate(12,-12) rotate(45)"
        />
        <path
          d="M0 -12 L12 0 L0 12 L-12 0 Z"
          transform="translate(-12,12) rotate(45)"
        />
        <path
          d="M0 -12 L12 0 L0 12 L-12 0 Z"
          transform="translate(12,12) rotate(45)"
        />
      </g>
    </svg>
  );
}
