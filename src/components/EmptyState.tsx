/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  imageClassName?: string;
  headline: string;
  subtext: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  imageSrc,
  imageAlt,
  imageClassName,
  headline,
  subtext,
  ctaLabel,
  onCtaClick,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-3 sm:p-5 ${className}`}>
      {/* If imageSrc is provided, render the asset directly without the circular wrapper */}
      {imageSrc ? (
        <div className="mb-2.5 flex items-center justify-center">
          <img
            src={imageSrc}
            alt={imageAlt || headline}
            className={imageClassName || "w-32 sm:w-36 md:w-40 max-h-32 sm:max-h-36 h-auto object-contain select-none drop-shadow-xs pointer-events-none"}
            referrerPolicy="no-referrer"
          />
        </div>
      ) : Icon ? (
        /* Circle background tint with 40-44px icon */
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-[#4949E9]/10 text-[#4949E9] mb-2.5 shrink-0 transition-transform">
          {typeof Icon === 'function' ? (
            <Icon className="w-8 h-8 sm:w-9 sm:h-9 text-[#4949E9] stroke-[1.8]" />
          ) : React.isValidElement(Icon) ? (
            Icon
          ) : null}
        </div>
      ) : null}

      {/* Headline */}
      <h3 className="text-sm sm:text-base font-bold text-gray-950 tracking-tight">
        {headline}
      </h3>

      {/* Subtext */}
      <p className="text-xs text-gray-500 max-w-sm mt-0.5 leading-relaxed">
        {subtext}
      </p>

      {/* Optional CTA Button */}
      {ctaLabel && onCtaClick && (
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-3.5 px-4 py-2 bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-morkhe-purple active:scale-[0.98]"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
