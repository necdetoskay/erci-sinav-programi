"use client";

interface UserStatusBadgeProps {
  status: "ACTIVE" | "INACTIVE";
}

export default function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const statusConfig = {
    ACTIVE: {
      text: "Aktif",
      className: "bg-green-100 text-green-800",
    },
    INACTIVE: {
      text: "Pasif",
      className: "bg-red-100 text-red-800",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.className}`}
    >
      {config.text}
    </span>
  );
} 