export const BookingCard = ({ booking }) => {
  const safe = booking || {
    title: "Sample Booking",
    location: "Entoto Venue",
    date: "Jan 1, 2025",
    status: "Confirmed",
    price: 99,
    image: "https://source.unsplash.com/400x300/?camping",
  };

  return (
    <div
      className="
        flex items-center justify-between
        bg-white border rounded-xl p-5
        transition-all duration-200
        hover:bg-emerald-600 hover:text-white hover:border-emerald-600
        group
        animate-fade-up
      "
    >
      
      <div className="flex gap-4">
        <img
          src={safe.image}
          alt={safe.title}
          className="w-20 h-20 rounded-lg object-cover"
        />

        <div>
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-lg">{safe.title}</h4>

            <span
              className="
                text-xs px-3 py-1 rounded-full font-medium
                bg-green-100 text-green-600
                group-hover:bg-white/20 group-hover:text-white
              "
            >
              {safe.status}
            </span>
          </div>

          <p className="text-gray-500 group-hover:text-white/90">
            {safe.location}
          </p>

          <p className="text-sm text-gray-400 group-hover:text-white/80 mt-1">
            {safe.date}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-xl font-bold">${safe.price}</p>
        <button className="text-emerald-600 group-hover:text-white text-sm font-medium mt-2">
          View Details
        </button>
      </div>
    </div>
  );
}
