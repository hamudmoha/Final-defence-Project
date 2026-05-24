import { QrCodeIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";

const statusStyles = {
  Active: "bg-green-100 text-green-700",
  Used: "bg-gray-100 text-gray-600",
  Refund: "bg-yellow-100 text-yellow-700",
};

export default function RecentTicketCard({ ticket }) {
  const safe = ticket || {
    status: "Active",
    title: "Sample Ticket",
    location: "Entoto Natural Park",
    date: "Jan 1, 2025",
    price: 10,
  };

  return (
    <div className="group border rounded-xl p-5 bg-white transition-all duration-200 hover:bg-emerald-600 hover:shadow-lg animate-fade-up">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${
            statusStyles[ticket.status]
          } group-hover:bg-white group-hover:text-emerald-700`}
        >
          {safe.status}
        </span>

        <QrCodeIcon className="w-5 h-5 text-gray-400 group-hover:text-white" />
      </div>

      {/* Content */}
      <h4 className="font-semibold text-lg group-hover:text-white">
        {safe.title}
      </h4>

      <p className="text-gray-500 group-hover:text-emerald-100">
        {safe.location}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-emerald-100">
          <CalendarDaysIcon className="w-4 h-4" />
          {safe.date}
        </div>

        <span className="font-semibold group-hover:text-white">
          ${safe.price.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
