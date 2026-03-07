import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp,
  color = "teal",
  className 
}) {
  const colorClasses = {
    teal: "from-teal-500 to-teal-600",
    orange: "from-orange-400 to-orange-500",
    purple: "from-purple-500 to-purple-600",
    blue: "from-blue-500 to-blue-600",
    pink: "from-pink-500 to-pink-600",
  };

  const iconBgClasses = {
    teal: "bg-teal-100 text-teal-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
    blue: "bg-blue-100 text-blue-600",
    pink: "bg-pink-100 text-pink-600",
  };

  return (
    <Card className={cn(
      "relative overflow-hidden border-0 bg-white hover:shadow-lg transition-all duration-300",
      className
    )}>
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full bg-gradient-to-b",
        colorClasses[color]
      )} />
      
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className={cn(
                "text-sm font-medium",
                trendUp ? "text-green-600" : "text-red-500"
              )}>
                {trendUp ? "↑" : "↓"} {trend}
              </p>
            )}
          </div>
          
          {Icon && (
            <div className={cn("p-3 rounded-xl", iconBgClasses[color])}>
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}