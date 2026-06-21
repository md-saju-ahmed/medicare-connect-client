import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const SectionTitle = ({
  title,
  description,
  align = "center",
  action,
  className,
}) => {
  const isCenter = align === "center";

  return (
    <div
      className={cn(
        "mb-10 flex gap-4",
        isCenter
          ? "flex-col items-center text-center"
          : "items-end justify-between",
        className,
      )}
    >
      <div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Button
          variant="ghost"
          className="hidden sm:flex gap-2 text-primary hover:text-primary"
        >
          {action}
          <ArrowRight size={18} />
        </Button>
      )}
    </div>
  );
};

export default SectionTitle;
