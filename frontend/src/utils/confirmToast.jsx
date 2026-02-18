import React from "react";
import { toast } from "react-toastify";

export function confirmToast(message) {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    toast.info(
      ({ closeToast }) => (
        <div className="space-y-2">
          <p className="text-sm">{message}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                settle(true);
                closeToast();
              }}
            >
              Yes
            </button>
            <button
              type="button"
              className="px-2 py-1 text-xs rounded bg-gray-600 hover:bg-gray-700 text-white"
              onClick={() => {
                settle(false);
                closeToast();
              }}
            >
              No
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        onClose: () => settle(false),
      }
    );
  });
}
