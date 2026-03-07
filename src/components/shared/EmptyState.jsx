import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel,
  onAction,
  className 
}) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-6 text-center",
      className
    )}>
      {Icon && (
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-teal-400" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-teal-600 hover:bg-teal-700 text-white">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}