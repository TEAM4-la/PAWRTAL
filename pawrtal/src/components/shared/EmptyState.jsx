import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel,
  onAction,
  className,
  colorScheme = 'orange',
  actionClassName,
}) {
  const isTeal = colorScheme === 'teal';
  const isViolet = colorScheme === 'violet';

  const iconCircleClass = isTeal 
    ? "bg-gradient-to-br from-teal-50 to-teal-100 text-teal-600"
    : isViolet
    ? "bg-gradient-to-br from-violet-50 to-purple-100 text-violet-600"
    : "bg-gradient-to-br from-amber-50 to-orange-100 text-orange-500";

  const btnClass = isTeal
    ? "bg-teal-600 hover:bg-teal-700 text-white"
    : isViolet
    ? "bg-violet-600 hover:bg-violet-700 text-white"
    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm shadow-orange-100";

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-6 text-center",
      className
    )}>
      {Icon && (
        <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6", iconCircleClass)}>
          <Icon className="w-10 h-10" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className={cn(btnClass, actionClassName)}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}