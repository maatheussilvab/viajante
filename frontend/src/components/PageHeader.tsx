import React from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center mb-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-lg text-muted-foreground">{description}</p>
      </div>
      {children && (
        <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}