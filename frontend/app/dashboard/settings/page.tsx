"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Organization Settings
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Organization Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organization ID
            </label>
            <p className="text-gray-900 dark:text-white">{user?.organization_id || "N/A"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Role
            </label>
            <p className="text-gray-900 dark:text-white capitalize">{user?.role || "N/A"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <p className="text-gray-900 dark:text-white">{user?.email || "N/A"}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Organization settings will be implemented in a future update. This will include:
        </p>
        <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
          <li>Data retention policies</li>
          <li>User management (for admins)</li>
          <li>API key management</li>
          <li>Billing information</li>
          <li>Notification preferences</li>
        </ul>
      </div>
    </div>
  );
}
