"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Download, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function RegistrationSubmissions() {
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchRegistrations = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get("/api/admin/registrations");
      setRegistrations(data.registrations || []);
    } catch (error) {
      console.error("Could not fetch registrations", error);
      toast.error(
        error?.response?.data?.error || "Could not load registrations."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await axios.get("/api/admin/registrations?export=xlsx", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "registration-submissions.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Could not export registrations", error);
      toast.error(
        error?.response?.data?.error || "Could not export registrations."
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Registration Submissions
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            View recent registrations and export the full list to Excel.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={fetchRegistrations}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export Excel
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Submitted
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Mobile
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Course
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Year
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                College
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Event
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-sm text-gray-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" />
                </td>
              </tr>
            ) : registrations.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-sm text-gray-500">
                  No registrations found yet.
                </td>
              </tr>
            ) : (
              registrations.map((registration) => (
                <tr key={registration._id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {registration.createdAt
                      ? format(new Date(registration.createdAt), "PPpp")
                      : "N/A"}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {registration.name || "N/A"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {registration.email || "N/A"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {registration.extra?.mobile || "N/A"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {registration.extra?.course || "N/A"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {registration.extra?.year || "N/A"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {registration.extra?.college || "N/A"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {registration.extra?.eventTitle || "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
