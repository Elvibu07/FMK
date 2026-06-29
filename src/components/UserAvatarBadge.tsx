import React from 'react';
import { useFirebaseProfile } from '../hooks/useFirebaseProfile';

interface UserAvatarBadgeProps {
  /** Override name shown (falls back to Firebase displayName) */
  name?: string;
  /** Role label shown below the name */
  roleLabel: string;
  /** Accent color class for the role badge, e.g. 'bg-red-700' */
  badgeColor?: string;
  /** Size of the avatar circle. Defaults to 'md' */
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-8 h-8 text-base',
  md: 'w-12 h-12 text-2xl',
  lg: 'w-16 h-16 text-3xl',
};

/**
 * Shows the logged-in user's Firebase photo and display name.
 * Automatically updates when the user changes their avatar.
 */
export default function UserAvatarBadge({ name, roleLabel, badgeColor = 'bg-stone-700', size = 'md' }: UserAvatarBadgeProps) {
  const { photoURL, displayName } = useFirebaseProfile();
  const shownName = name || displayName || 'Usuario';

  return (
    <div className="flex items-center gap-3">
      {/* Avatar circle */}
      <div className={`${sizeMap[size]} rounded-full border-2 border-white/20 bg-stone-200 dark:bg-stone-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md`}>
        {photoURL ? (
          <img src={photoURL} alt={shownName} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-stone-500 dark:text-stone-300" style={{ fontSize: size === 'sm' ? '16px' : size === 'lg' ? '30px' : '22px' }}>
            person
          </span>
        )}
      </div>

      {/* Name + role */}
      <div className="flex flex-col min-w-0">
        <span className="font-black text-stone-900 dark:text-white leading-tight truncate" title={shownName}>
          {shownName}
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-white mt-0.5 self-start ${badgeColor}`}>
          {roleLabel}
        </span>
      </div>
    </div>
  );
}
