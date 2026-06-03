import React from 'react';
import { Button } from "@/components/ui/button";

interface RibbonButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  tooltip?: string;
}

const RibbonButton: React.FC<RibbonButtonProps> = ({ 
  icon,
  onClick,
  className = "", 
  variant = "ghost",
  tooltip,
}) => {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      className={`px-3 ${className}`}
      title={tooltip}
    >
      {icon}
    </Button>
  );
};

export default RibbonButton;