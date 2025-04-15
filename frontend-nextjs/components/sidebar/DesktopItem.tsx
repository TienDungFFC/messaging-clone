"use client";

import Link from "next/link";
import clsx from "clsx";

interface DesktopItemProps {
  label: string;
  icon: any;
  href: string;
  active?: boolean;
}

const DesktopItem: React.FC<DesktopItemProps> = ({
  label,
  href,
  icon: Icon,
  active,
}) => {
  return (
    <li>
      <Link
        href={href}
        className={clsx(`
            group 
            flex 
            gap-x-3 
            rounded-md 
            p-3 
            text-sm 
            leading-6 
            font-semibold 
            text-gray-500 
            hover:text-black 
            hover:bg-gray-100
            dark:text-gray-400
            dark:hover:text-white
            dark:hover:bg-gray-800
          `,
            active && 'bg-gray-100 text-black dark:bg-gray-800 dark:text-white'
          )}
      >
        <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </Link>
    </li>
  );
};

export default DesktopItem;
