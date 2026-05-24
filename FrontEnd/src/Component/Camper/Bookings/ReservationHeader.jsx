import React from "react";
import { useNavigate } from "react-router-dom";

const ReservationHeader = ({ selectedFilter, setSelectedFilter }) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

        {/* Left */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            My Reservations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all your bookings and reservations
          </p>
        </div>

        
          <div>
            <button
            type="button"
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            onClick={() => navigate("/camper-dashboard/campsite-directory")}
          >
            + New Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationHeader;
