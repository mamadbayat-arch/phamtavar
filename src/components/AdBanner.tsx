import React, { useState, useEffect } from 'react';
import { Megaphone, ExternalLink, X, Sparkles } from 'lucide-react';
import { AdConfig } from '../types';

interface AdBannerProps {
  onOpenAdminPanel?: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({ onOpenAdminPanel }) => {
  const [ad, setAd] = useState<AdConfig | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/ads')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.ads && data.ads.active) {
          setAd(data.ads);
        }
      })
      .catch(() => {});
  }, []);

  if (!ad || !ad.active || isDismissed) {
    return null;
  }

  return (
    <div className="relative z-20 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md animate-in slide-in-from-top duration-300">
      <div className="max-w-4xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-1 rounded-lg bg-white/20 flex-shrink-0">
            <Megaphone className="w-3.5 h-3.5 text-white" />
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
            {ad.badge && (
              <span className="px-2 py-0.5 rounded-full bg-white text-emerald-800 text-[10px] font-black uppercase tracking-wider flex-shrink-0">
                {ad.badge}
              </span>
            )}
            <strong className="font-bold truncate text-white">{ad.title}</strong>
            <span className="text-emerald-100 hidden sm:inline truncate text-[11px]">
              {ad.description}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {ad.ctaUrl && (
            <a
              href={ad.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-emerald-800 hover:bg-emerald-50 text-[11px] font-bold shadow-xs transition-colors"
            >
              <span>{ad.ctaText || 'مشاهده'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-emerald-200 hover:text-white rounded-md hover:bg-white/10 transition-colors"
            title="بستن اعلان"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
