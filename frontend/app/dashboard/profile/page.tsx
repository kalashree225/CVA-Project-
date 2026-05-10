"use client";

import { useAuthStore } from "@/lib/store/auth";

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        User Profile
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Profile Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User ID
            </label>
            <p className="text-gray-900 dark:text-white">{user?.id || "N/A"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <p className="text-gray-900 dark:text-white">{user?.email || "N/A"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <p className="text-gray-900 dark:text-white">{user?.full_name || "N/A"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <p className="text-gray-900 dark:text-white capitalize">{user?.role || "N/A"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <p className="text-gray-900 dark:text-white">
              {user?.is_active ? "Active" : "Inactive"}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organization ID
            </label>
            <p className="text-gray-900 dark:text-white">{user?.organization_id || "N/A"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Member Since
            </label>
            <p className="text-gray-900 dark:text-white">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Account Actions
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Profile management features will be implemented in a future update. This will include:
        </p>
        <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
          <li>Update profile information</li>
          <li>Change password</li>
          <li>Manage API keys</li>
          <li>Delete account</li>
        </ul>
      </div>
    </div>
  );
}
