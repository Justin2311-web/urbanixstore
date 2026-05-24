"use client";

type ConfirmSubmitButtonProps = {
  className?: string;
  confirmMessage: string;
  children: React.ReactNode;
};

export function ConfirmSubmitButton({
  children,
  className,
  confirmMessage,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {children}
    </button>
  );
}
