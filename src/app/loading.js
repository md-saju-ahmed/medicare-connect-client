export default function Loading() {
  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-background/60
        backdrop-blur-md
        animate-in fade-in
      "
    >
      <div
        className="
          h-10 w-10
          rounded-full
          border-[3px]
          border-primary/20
          border-t-primary
          animate-spin
        "
      />
    </div>
  );
}
