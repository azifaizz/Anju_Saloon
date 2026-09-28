import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Save } from 'lucide-react';
import { useEffect } from "react";


const Settings = () => {
  // --- These values are set from the code and are not editable in the UI ---
  const [shopName, setShopName] = useLocalStorage("shopName_flipflex", "Anjus Beauty Saloon");
  const [gstNumberRaw] = useLocalStorage('gstNumber_v3', '33ADFPN7561FL1ZK');
  // Ensure valid fallback even if undefined, null, or empty
  const gstNumber =
    !gstNumberRaw || gstNumberRaw === 'YOUR_GST_NUMBER_HERE'
      ? '33ADFPN7561FL1ZK'
      : gstNumberRaw.toString().trim();



  // --- These values remain editable by the user ---
  const [billMessage, setBillMessage] = useLocalStorage('billMessage', 'Thank You For Your Purchasing');
  const [defaultGst, setDefaultGst] = useLocalStorage('defaultGst', '');

  const handleSave = () => {
    // Note: This only saves the editable fields, as the others cannot be changed.
    toast.success("Settings Saved!");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="space-y-4 max-w-lg">

          {/* --- Non-Editable Shop Name Field --- */}
          <div>
            <label htmlFor="shopName" className="font-medium text-gray-700">Shop Name</label>
            <input
              id="shopName"
              type="text"
              value={shopName}
              readOnly // This makes the input field non-editable
              className="form-input mt-1 bg-gray-100 cursor-not-allowed" // Style to show it's read-only
            />
          </div>

          {/* --- Non-Editable GST Number Field --- */}
          <div>
            <label htmlFor="gstNumber" className="font-medium text-gray-700">GST Number</label>
            <input
              id="gstNumber"
              type="text"
              value={gstNumber}
              readOnly // This makes the input field non-editable
              className="form-input mt-1 bg-gray-100 cursor-not-allowed" // Style to show it's read-only
            />
          </div>

          {/* --- Editable Bill Message Field --- */}
          <div>
            <label htmlFor="billMessage" className="font-medium text-gray-700">Custom Bill Message</label>
            <input
              id="billMessage"
              type="text"
              value={billMessage}
              onChange={e => setBillMessage(e.target.value)}
              className="form-input mt-1"
            />
          </div>

          {/* --- Editable Default GST Field --- */}
          <div>
            <label htmlFor="defaultGst" className="font-medium text-gray-700">Default GST Percentage (%)</label>
            <input
              id="defaultGst"
              type="number"
              value={defaultGst}
              onChange={e => setDefaultGst(e.target.value)}
              className="form-input mt-1"
            />
          </div>

          <div className="pt-2">
            <button onClick={handleSave} className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <Save size={18} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
