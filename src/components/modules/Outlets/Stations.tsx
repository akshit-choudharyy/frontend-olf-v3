import { useState, useEffect } from "react";
import {
  Search,
  Train,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { olfService } from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const Stations = () => {
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<any>("");
  const [filteredStations, setFilteredStations] = useState<any>([]);
  const [sortOrder, setSortOrder] = useState<any>("asc");
  const [currentPage, setCurrentPage] = useState<any>(1);
  const [stationsPerPage, setStationsPerPage] = useState<any>(60);
  const pageSizeOptions = [15, 30, 45, 60, 100];

  const navigate = useNavigate();

  // Fetch stations data
  const { isPending, error, data } = useQuery({
    queryKey: ["stationss"],
    queryFn: () =>
      olfService.get("/stations").then((res) => {
        if (res.data.status !== 1) {
          throw new Error("Unexpected response status");
        }
        return res.data.data;
      }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: "always",
    refetchOnWindowFocus: false,
  });

  // Fetch global stats for the header tiles
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () =>
      olfService.get("/restraunt-stats").then((res) => {
        if (res.data.status !== 1) {
          throw new Error("Unexpected response status");
        }
        return res.data.data.rows[0];
      }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: "always",
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!data || !data.rows) {
      setFilteredStations([]);
      return;
    }

    // 1. Filter valid stations (Logic from new file)
    let processedStations = data.rows.filter(
      (station: any) => station.station_name && station.station_code,
    );

    // 2. Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      processedStations = processedStations.filter(
        (station: any) =>
          String(station.station_name).toLowerCase().includes(query) ||
          String(station.station_code).toLowerCase().includes(query),
      );
    }

    // 3. Apply sorting by station_code
    processedStations.sort((a: any, b: any) => {
      const codeA = String(a.station_code || "");
      const codeB = String(b.station_code || "");
      return sortOrder === "asc"
        ? codeA.localeCompare(codeB)
        : codeB.localeCompare(codeA);
    });

    setFilteredStations(processedStations);
    setCurrentPage(1);
  }, [data, searchQuery, sortOrder]);

  const handleStationClick = (station: any) => {
    setSelectedStation(station);
    // Navigating via station_code as per your API response/new file
    navigate({ to: `/outlet/${station.station_code}` });
  };

  const toggleSortOrder = () =>
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  const totalPages = Math.ceil(filteredStations.length / stationsPerPage);

  const handlePageChange = (newPage: any) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  if (isPending)
    return (
      <div className="p-10 text-center animate-pulse text-green-600">
        Loading Stations...
      </div>
    );
  if (error)
    return (
      <div className="p-10 text-center text-red-500">
        Error: {error.message}
      </div>
    );

  return (
    <div
      className="mx-auto px-2 bg-green-50 rounded-xl shadow-md overflow-hidden"
      style={{ maxWidth: "90vw", width: "100%" }}
    >
      {/* Back Button */}
      <Button
        className="m-2 bg-green-400"
        onClick={() => window.history.back()}
      >
        <ArrowLeft />
      </Button>

      {/* Header & Search */}
      <div className="bg-gradient-to-r from-green-800 to-green-700 p-3">
        <div className="flex flex-wrap items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center">
            <Train className="mr-2 h-4 w-4" />
          </h2>

          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <Search className="h-3 w-3 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-7 pr-2 py-1 border border-transparent rounded-md bg-white bg-opacity-20 text-white placeholder-gray-300 focus:outline-none focus:bg-white focus:text-gray-900 text-xs"
              placeholder="Search station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Global Info Tiles */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div className="bg-white bg-opacity-10 rounded-md p-2 backdrop-blur-sm text-black">
            <p className="text-[10px] font-medium">Total Outlets</p>
            <p className="text-sm font-bold">{stats?.total_outlets || 0}</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-md p-2 backdrop-blur-sm text-black">
            <p className="text-[10px] font-medium">Active</p>
            <p className="text-sm font-bold">{stats?.active_outlets || 0}</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-md p-2 backdrop-blur-sm text-black">
            <p className="text-[10px] font-medium">Inactive</p>
            <p className="text-sm font-bold">{stats?.inactive_outlets || 0}</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-md p-2 backdrop-blur-sm text-black">
            <p className="text-[10px] font-medium">Closed</p>
            <p className="text-sm font-bold">{stats?.closed_outlets || 0}</p>
          </div>
        </div>
      </div>

      {/* Sorting / Pagination Info */}
      <div className="px-4 pt-3 pb-2 flex flex-wrap justify-between items-center border-b border-green-100">
        <div className="text-xs text-gray-600 font-medium flex items-center">
          <span className="mr-4">
            {filteredStations.length} stations found
          </span>
          <div className="flex items-center">
            <label htmlFor="stationsPerPage" className="text-xs text-gray-500 mr-2">
              Show:
            </label>
            <select
              id="stationsPerPage"
              value={stationsPerPage}
              onChange={(e) => {
                setStationsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-0.5 text-xs bg-white text-gray-700"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={toggleSortOrder}
          className="flex items-center px-2 py-1 bg-green-100 rounded text-xs text-green-700"
        >
          <ArrowUpDown className="h-3 w-3 mr-1" />
          {sortOrder === "asc" ? "A to Z" : "Z to A"}
        </button>
      </div>

      {/* Stations Grid */}
      <div className="p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredStations
            .slice(
              (currentPage - 1) * stationsPerPage,
              currentPage * stationsPerPage,
            )
            .map((station: any) => (
              <div
                key={station.station_id}
                onClick={() => handleStationClick(station)}
                className={`p-2 rounded-lg cursor-pointer transition-all border ${
                  selectedStation?.station_id === station.station_id
                    ? "bg-green-600 text-white border-green-700 shadow-md"
                    : "bg-white hover:bg-green-50 border-gray-200"
                }`}
              >
                {/* Station Info Row */}
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm">
                    {(station.station_code || "").toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      selectedStation?.station_id === station.station_id
                        ? "bg-white text-green-700"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {/* Convert string "13" to number */}
                    {Number(station.outlet_count || 0)}
                  </span>
                </div>
                <div
                  className={`text-[10px] truncate mb-2 ${selectedStation?.station_id === station.station_id ? "text-green-100" : "text-gray-500"}`}
                >
                  {station.station_name}
                </div>

                {/* Breakdown Row (Note: These fields aren't in your main API response, so they will default to 0) */}
                <div className="mt-1.5 pt-1.5 border-t border-gray-100 grid grid-cols-3 gap-1 text-center">
                  <div className="flex flex-col">
                    <span
                      className={`font-bold text-[11px] ${selectedStation?.station_id === station.station_id ? "text-white" : "text-green-600"}`}
                    >
                      {station.active_outlets || 0}
                    </span>
                    <span className="text-[8px] text-gray-400">Active</span>
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`font-bold text-[11px] ${selectedStation?.station_id === station.station_id ? "text-white" : "text-orange-500"}`}
                    >
                      {station.inactive_outlets || 0}
                    </span>
                    <span className="text-[8px] text-gray-400">Inactive</span>
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`font-bold text-[11px] ${selectedStation?.station_id === station.station_id ? "text-white" : "text-red-500"}`}
                    >
                      {station.closed_outlets || 0}
                    </span>
                    <span className="text-[8px] text-gray-400">Closed</span>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6 px-2 text-xs text-gray-500">
          <div>
            Showing {filteredStations.length > 0 ? Math.min((currentPage - 1) * stationsPerPage + 1, filteredStations.length) : 0} to {Math.min(currentPage * stationsPerPage, filteredStations.length)} of {filteredStations.length} stations
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`px-1.5 py-0.5 rounded text-xs ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-green-600 hover:bg-green-50"
              }`}
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 border rounded disabled:opacity-20"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center space-x-1">
              {[...Array(Math.min(5, totalPages || 1))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-6 h-6 flex items-center justify-center rounded text-xs ${
                      currentPage === pageNum
                        ? "bg-green-700 text-white"
                        : "hover:bg-green-50 text-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 border rounded disabled:opacity-20"
            >
              <ChevronRight size={16} />
            </button>
            
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-1.5 py-0.5 rounded text-xs ${
                currentPage === totalPages || totalPages === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-green-600 hover:bg-green-50"
              }`}
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stations;
