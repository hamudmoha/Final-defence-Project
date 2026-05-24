import React from "react";
import { Link } from "react-router-dom";
const AuthFooter = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full py-8 mt-auto font-sans">
      {" "}
      <div className="container mx-auto px-6">
        {" "}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-[13px] font-medium text-slate-500">
          {" "}
          <p>© {currentYear} EthioCampGround. All rights reserved.</p>{" "}
          <div className="hidden md:block w-1 h-1 bg-slate-300 rounded-full" />{" "}
          <div className="flex items-center gap-6">
            {" "}
            <Link
              to="/privacy-terms"
              className="text-blue-600 hover:text-blue-700 hover:underline transition-all"
            >
              Privacy Policy & Terms of Service
            </Link>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </footer>
  );
};
export default AuthFooter;
