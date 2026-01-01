
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
};

export const CardSkeleton = () => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-6 rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-4 mt-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <Skeleton className="h-48 w-full rounded-3xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center space-x-4 p-4 border-b border-gray-100">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/4" />
    </div>
    <Skeleton className="h-8 w-20" />
  </div>
);
