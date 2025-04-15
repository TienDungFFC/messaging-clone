"use client";

import Link from "next/link";
import clsx from "clsx";

interface MobileItemProps {
  href: string;
  icon: any;
  active?: boolean;
  label: string;
}

const MobileItem: React.FC<MobileItemProps> = ({
  href,
  icon: Icon,
  active,
  label
}) => {
  return (
    <Link
      href={href}
      className={clsx(`
        group 
        flex 
        gap-x-3 
        text-sm 
        leading-6 
        font-semibold 
        w-full 
        justify-center 
        p-4 
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
      <Icon className="h-6 w-6" />
      <span className="sr-only">{label}</span>
    </Link>
  );
};

export default MobileItem;
