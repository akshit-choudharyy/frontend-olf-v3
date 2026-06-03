import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search, Utensils, Train, MapPin, Clock, Coffee, Star, Phone, IndianRupee, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { olfService } from "@/utils/axiosInstance";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from 'react-hot-toast';
import OrderCart from "./OrderCart";
import TrainAutocomplete from "./TrainAutoComplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- IMAGES ---
import vegIcon from "@/assets/images/veg.png"; 
import nonVegIcon from "@/assets/images/non-veg.png";

export default function RailwayFoodOrdering() {
  // For PNR form
  const [pnrNumber, setPnrNumber] = useState<string>("");
  const [pnrStations, setPnrStations] = useState<any[]>([]);
  const [isPnrLoading, setIsPnrLoading] = useState<boolean>(false);
  const [pnrError, setPnrError] = useState<string>("");
  const [selectedPnrStation, setSelectedPnrStation] = useState<string>("");
  const [pnrRestaurants, setPnrRestaurants] = useState<any>([]);
  const [loadingPnrRestaurants, setLoadingPnrRestaurants] = useState<boolean>(false);
  
  // For train details form
  const [trainNumber, setTrainNumber] = useState<string>("");
  const [trainName, setTrainName] = useState<any>(null);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [selectedStationName, setSelectedStationName] = useState<any>(null);
  const [coachNumber, setCoachNumber] = useState<any>(null);
  const [berthNumber, setBerthNumber] = useState<any>(null);
  const [date, setDate] = useState<any>(new Date());
  const [time, setTime] = useState<any>("12:00");
  const [openCalendar, setOpenCalendar] = useState<boolean>(false);
  const [routestations,setroutestations]=useState<any>([]);
  // For restaurants
  const [restaurants, setRestaurants] = useState<any>([]);
  const [searchPerformed, setSearchPerformed] = useState<boolean>(false);
  const [searchingRestaurants, setSearchingRestaurants] = useState<boolean>(false);
  const [selectoutletstationdata,setselectoutletstationdata]=useState<any>(null);
  // For debouncing
  const restaurantsSectionRef = useRef<HTMLDivElement>(null);

function getCurrentTimeInMilliseconds() {
  return Date.now();
}

const handleroute = async(e:any)=>{
  try {
    e.preventDefault();
    if(trainNumber && trainName){
      const res = await olfService.post("/fetch-boarding-stations",{"boardingDate":formatDateToDDMMYYYY(date),"trainNo":trainNumber,"currtime":getCurrentTimeInMilliseconds()});
      setroutestations(res?.data?.resdata?.result);
    }
  } catch (error) {
    console.log(error)
  }
}


const [pnrdetails,setpnrdetails]=useState<any>(null);
 
const formatDateToDDMMYYYY=(dateString: string)=> {
  if(!dateString)
  {
    return null;
  }

  // Create a Date object from the string
  const date = new Date(dateString);
  
  // Get day, month, and year
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  // Pad single digits with leading zero
  const formattedDay = day.toString().padStart(2, '0');
  const formattedMonth = month.toString().padStart(2, '0');
  
  // Return formatted date
  return `${formattedDay}-${formattedMonth}-${year}`;
}

  // Function to handle form submission for PNR search
  const handlePnrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnrNumber || pnrNumber.length < 5) {
      setPnrError("Please enter a valid PNR number");
      return;
    }
    
    setIsPnrLoading(true);
    setPnrError("");
    setPnrStations([]);
    setPnrRestaurants([]);
    setSelectedPnrStation("");
    
    try {
      // Call the API to fetch PNR details
      const response = await olfService.post(`/fetchpnr`,{"pnr":pnrNumber});
      
      // Check if API returned the expected data structure
      if (response?.data?.resdata?.status === "success" && 
          response?.data?.resdata?.result?.stations && 
          Array.isArray(response.data.resdata.result.stations)) {
        
        const stations = response.data.resdata.result.stations;
        setPnrStations(stations);
        setpnrdetails(response?.data?.resdata);
        
        // Auto-select the first station and fetch its restaurants
        if (stations.length > 0) {
          fetchRestaurantsForPnrStation(stations[0].code);
          setselectoutletstationdata(stations[0]);       }
      } else {
        setPnrError("Could not find journey details for this PNR");
      }
    } catch (error) {
      console.error("Error fetching PNR details:", error);
      setPnrError("Failed to fetch journey details. Please try again.");
    } finally {
      setIsPnrLoading(false);
    }
  };
  
  // Function to fetch restaurants for a selected PNR station
const fetchRestaurantsForPnrStation = async (stationCode: string) => {
  if (!stationCode) return;
  
  setSelectedPnrStation(stationCode);
  setLoadingPnrRestaurants(true);
  setPnrRestaurants([]);
  
  try {
    const res = await olfService.get('/restraunts', {
      params: {
        station_code: stationCode
      }
    });
    
    if (res?.data?.data?.rows && Array.isArray(res.data.data.rows)) {
      const allRestaurants = res.data.data.rows;
      const activeRestaurants = allRestaurants.filter(
        (restaurant: any) => restaurant.status === 1
      );
      setPnrRestaurants(activeRestaurants);
    } else {
      setPnrRestaurants([]);
    }
  } catch (error) {
    console.error("Error fetching restaurants for station:", error);
    setPnrRestaurants([]);
  } finally {
    setLoadingPnrRestaurants(false);
  }
};

const fetchEtaForStation = async (stationCode: string) => {
  try {
    const res = await olfService.post("/fetchroutes", {
      boardingDate: formatDateToDDMMYYYY(date),
      trainNo: trainNumber,
      currtime: getCurrentTimeInMilliseconds(),
      boardingStation: stationCode,
    });

    const resultData = res?.data?.resdata?.result;
    const stations = Array.isArray(resultData) ? resultData : resultData?.stations;

    if (stations && stations.length > 0) {
      const arrivalTime = convertUTCToIST(stations[0].arrival);
      setTime(arrivalTime);
    } else {
      setTime("--:--");
    }
  } catch (error) {
    console.error("Error fetching ETA:", error);
    setTime("--:--"); 
  }
};
  
  // Function to handle form submission for train details search
const handleTrainDetailsSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!coachNumber || !berthNumber || !selectedStation) {
    alert("Please make sure you have selected a station and entered a coach and berth number.");
    return;
  }

  setSearchPerformed(true);
  setSearchingRestaurants(true);
  setRestaurants([]);

  try {
    const res = await olfService.get('/restraunts', {
      params: {
        station_code: selectedStation
      }
    });
    
    if (res?.data?.data?.rows && Array.isArray(res.data.data.rows)) {
      const allRestaurants = res.data.data.rows;
      const activeRestaurants = allRestaurants.filter(
        (restaurant: any) => restaurant.status === 1
      );
      setRestaurants(activeRestaurants); 

    } else {
      setRestaurants([]);
    }
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    setRestaurants([]);
  } finally {
    setSearchingRestaurants(false);
  }
};
  const [showCart,setshowCart]=useState<any>(false);
  const [selectedoutletdata,setselectedoutletdata]=useState<any>(null);
  
  const handleMenu = (restaurant:any) => {
    setselectedoutletdata(restaurant);
    setshowCart(true);
  };

function convertUTCToIST(dateTimeString: string): string {
  const dateStr = dateTimeString.replace(' UTC', 'Z');
  const date = new Date(dateStr);
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istDate = new Date(date.getTime() + istOffset);
  const hours = istDate.getUTCHours().toString().padStart(2, '0');
  const minutes = istDate.getUTCMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

const handleStationChange = (value: string) => {
  const selected = routestations?.find(
    (station: any) => station.code === value
  );

  if (selected) {
    setSelectedStation(selected.code);
    setSelectedStationName(selected.name);
    setRestaurants([]);
    setSearchPerformed(false);
    fetchEtaForStation(selected.code);
  }
};

  const getRandomRating = () => (Math.floor(Math.random() * 20) + 30) / 10;

  // Render restaurant card
  const renderRestaurantCard = (restaurant:any) => {
    // Determine which icons to show based on tags
    const tags = restaurant.tags?.toLowerCase() || "";
    const isNonVeg = tags.includes("non-veg") || tags.includes("non veg");
    
    return (
    <Card key={restaurant.id || restaurant.outlet_id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow h-full">
      <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-white">
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
            {/* Removed Icon from Title as requested */}
            <div className="flex items-center">
                <Coffee className="h-5 w-5 mr-2 text-green-700" />
                <span className="truncate max-w-[150px] sm:max-w-none" title={restaurant.name || restaurant.outlet_name}>
                    {restaurant.name || restaurant.outlet_name}
                </span>
            </div>
          </CardTitle>
          <div className="flex items-center bg-white px-2 py-1 rounded-full text-sm shadow-sm border border-gray-100">
            <Star className="h-4 w-4 text-orange-500 mr-1" />
            <span className="font-medium">{restaurant.rating || getRandomRating()}</span>
          </div>
        </div>
        {restaurant?.phone && (
          <CardDescription className="line-clamp-2 mt-1 flex items-center gap-1 text-gray-600">
            <span>
           <Phone size={12}/>
            </span>
            {restaurant?.phone}
          </CardDescription>
        )}
        {restaurant?.min_order_amount && (
          <CardDescription className="line-clamp-2 mt-1  flex items-center gap-2 text-gray-600">
           Minimum order 
            <span className="flex  items-center">
           <IndianRupee size={12}/>
           {restaurant?.min_order_amount}
            </span>
          </CardDescription>
        )}
        
        {/* REPLACED TEXT CHIPS WITH IMAGE ICONS HERE */}
        {restaurant?.tags && (
          <CardDescription className="mt-2 flex items-center gap-2">
            {/* Veg Icon - Always shown if tags exist (most places serve veg) */}
            <img src={vegIcon} alt="Veg" className="w-5 h-5 object-contain" />
            
            {/* Non-Veg Icon - Shown only if tags contain non-veg */}
            {isNonVeg && (
                <img src={nonVegIcon} alt="Non-Veg" className="w-5 h-5 object-contain" />
            )}
          </CardDescription>
        )}

      </CardHeader>
       <Toaster 
              position="top-right"
              reverseOrder={false}
              gutter={8}
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: 'green',
                  },
                },
                error: {
                  duration: 4000,
                  style: {
                    background: 'red',
                  },
                },
              }}
            />
      <CardContent className="pb-2 pt-3">
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-1 text-green-600" />
          <span>Expected delivery Time: <span className="font-medium">
            {restaurant?.order_timing + " min" || ""}
          </span></span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {['Fast Service', 'Veg Options'].map((tag, i) => (
            <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {tag}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-1">
        <Button 
          onClick={() => handleMenu(restaurant)}
          className="w-full bg-orange-500 hover:bg-orange-600 transition-colors"
        >
          <Utensils className="h-4 w-4 mr-2" />
          View Menu
        </Button>
      </CardFooter>
    </Card>
  )};

  // Render no restaurants message
  const renderNoRestaurants = (stationCode: string = "", stationName: string = "") => (
    <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200 h-full">
      <div className="text-green-400 mb-3">
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900">No Food Outlets Available</h3>
      <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
        We couldn't find any food options at {stationName || "this"} station{stationCode ? ` (${stationCode})` : ''}. Please try selecting a different station.
      </p>
    </div>
  );

  const handleoutlets = async(code:any,station:any) => {
    fetchRestaurantsForPnrStation(code);
    setselectoutletstationdata(station);
    setTimeout(() => {
      if (restaurantsSectionRef.current) {
        window.scrollTo({
          top: restaurantsSectionRef.current.offsetTop - 20,
          behavior: 'smooth'
        });
        
        restaurantsSectionRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  }
  
  return (
    <div className="w-full mx-auto bg-green-50 p-4">
    <Button onClick={()=>window.history.back()}><ArrowLeft/></Button>
      {showCart?<OrderCart outletdata={selectedoutletdata}
      setshowCart ={setshowCart}
      trainNumber={trainNumber}
      trainName={trainName}
      selectedStation={selectedStation}
      coachNumber={coachNumber}
      berthNumber={berthNumber}
      pnrdetails ={pnrdetails}
      selectedStationName={selectedStationName}
      date={date}
      time={time}
      pnrNumber ={pnrNumber}
      selectstationdata={selectoutletstationdata}
      
      />
      :
      <Tabs defaultValue="pnr" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 rounded-lg bg-green-100 max-w-md mx-auto">
          <TabsTrigger value="pnr" className="data-[state=active]:bg-green-700 data-[state=active]:text-white rounded-md">
            <Search className="h-4 w-4 mr-2" />
            Search by PNR
          </TabsTrigger>
          <TabsTrigger value="train" className="data-[state=active]:bg-green-700 data-[state=active]:text-white rounded-md">
            <Train className="h-4 w-4 mr-2" />
            Search by Train Details
          </TabsTrigger>
        </TabsList>
        
        {/* PNR Search Form */}
        <TabsContent value="pnr">
          <div className="p-4 max-w-md mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-green-800">Create Food Order</h2>
              <p className="text-sm text-gray-600">Search your journey using PNR number</p>
            </div>
            
            <form onSubmit={handlePnrSubmit} className="space-y-4">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Enter your 10-digit PNR number"
                    value={pnrNumber}
                    onChange={(e) => setPnrNumber(e.target.value)}
                    className="pl-10 pr-4 py-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-orange-500 hover:bg-orange-600 px-6"
                  disabled={isPnrLoading}
                >
                  {isPnrLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
              
              {pnrError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {pnrError}
                  </div>
                </div>
              )}
              
              {!pnrError && !isPnrLoading && pnrStations.length === 0 && (
                <div className="bg-green-100 rounded-lg p-4 text-sm text-green-700">
                  <p className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    You can find your PNR number in your ticket or booking confirmation
                  </p>
                </div>
              )}
            </form>
          </div>
          
          {/* PNR Results - Two Column Layout */}
          {pnrStations.length > 0 && (
            <div className="flex flex-col md:flex-row mt-4" ref={restaurantsSectionRef}>
              {/* Restaurants Column - Left Side */}
              <div className="md:w-2/3 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-800">
                    Available Restaurants
                  </h3>
                  {selectedPnrStation && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {pnrStations.find(s => s.code === selectedPnrStation)?.name} ({selectedPnrStation})
                    </Badge>
                  )}
                </div>
                
                {loadingPnrRestaurants ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="overflow-hidden border border-gray-200">
                        <CardHeader className="pb-2 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                        </CardHeader>
                        <CardContent className="pb-2">
                          <Skeleton className="h-4 w-1/2" />
                        </CardContent>
                        <CardFooter>
                          <Skeleton className="h-9 w-full" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : pnrRestaurants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pnrRestaurants.map((restaurant:any) => 
                      renderRestaurantCard(restaurant)
                    )}
                  </div>
                ) : (
                  renderNoRestaurants(selectedPnrStation, 
                    pnrStations.find(s => s.code === selectedPnrStation)?.name)
                )}
              </div>
              
              {/* Stations Column - Right Side */}
              <div className="md:w-1/3 p-4 border-l border-green-200 bg-white">
                <h3 className="text-lg font-semibold text-green-800 flex items-center mb-4">
                  <Train className="h-5 w-5 mr-2 text-green-600" />
                  Stations in Your Journey
                </h3>
                
                <div className="space-y-3">
                  {pnrStations.map((station) => (
                    <Card 
                      key={station.code} 
                      className={`cursor-pointer hover:shadow-md transition-shadow overflow-hidden border ${selectedPnrStation === station.code ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'}`}
                      onClick={() => handleoutlets(station.code,station)}
                    >
                      <div className="p-4">
                        <div className="flex items-center mb-2">
                          <div className="bg-green-100 rounded-full p-2 mr-3">
                            <MapPin className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{station.name}</h4>
                            <Badge variant="outline" className="mt-1 border-green-300 text-green-700">
                              {station.code}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mt-3 text-center text-sm">
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Arrival</p>
                            <p className="font-medium text-gray-800">{station.arrival}</p>
                            <p className="text-xs text-gray-500">{station.arrDate}</p>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Departure</p>
                            <p className="font-medium text-gray-800">{station.departure}</p>
                            <p className="text-xs text-gray-500">{station.depDate}</p>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Halt</p>
                            <p className="font-medium text-gray-800">{station.halt || "N/A"}</p>
                            <p className="text-xs text-gray-500">Minutes</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Train Details Search Form */}
        <TabsContent value="train">
          <div className="p-4 max-w-md mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-green-800">Search by Train Details</h2>
              <p className="text-sm text-gray-600">Find food options along your journey</p>
            </div>
            
            <form onSubmit={handleTrainDetailsSubmit} className="space-y-4">
              <div className="">
                
                <div className="space-y-2">
                  <label htmlFor="trainNumber" className="text-sm font-medium text-green-700">Train Number</label>
                  <div className="relative">
                    <Train className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                     <TrainAutocomplete
        onTrainNumberChange={setTrainNumber}
        onTrainNameChange={setTrainName}
      />
                  </div>
                </div>
                
                 <div className="space-y-2">
                  <label htmlFor="date" className="text-sm font-medium text-green-700">Boarding Date</label>
                  <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal w-full border-green-300 bg-white text-gray-700 hover:bg-green-50",
                          !date && "text-gray-400"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                        {date ? format(date, "dd MMM yyyy") : "Choose a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => {
                          setDate(newDate);
                          setOpenCalendar(false);
                        }}
                        initialFocus
                        className="rounded-md border border-green-200"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button className="mt-2" onClick={(e)=>handleroute(e)}>Get Routes</Button>
                 </div>
              {routestations.length >0 &&
              <>
              
                <div className="flex justify-between gap-2 w-full">
                <div className="space-y-2">
                  <label htmlFor="station" className="text-sm font-medium text-green-700">Station</label>
                  <Select value={selectedStation} onValueChange={handleStationChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a station" />
        </SelectTrigger>
        <SelectContent>
          {routestations?.map((station:any) => (
            <SelectItem 
              key={station.code} 
              value={station.code}
            >
              {station.name} ({station.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
                </div>

                 <div className="space-y-2">
                  <label htmlFor="time" className="text-sm font-medium text-green-700">ETA</label>
                  <Input
                    id="time"
                    type="text"
                    value={time}
                    className="border-green-300 focus:border-green-500 focus:ring-green-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="coach" className="text-sm font-medium text-green-700">Coach</label>
                  <Input
                    id="coach"
                    placeholder="e.g. S4, B2, A1"
                    value={coachNumber}
                    onChange={(e) => setCoachNumber(e.target.value)}
                    className="border-green-300 focus:border-green-500 focus:ring-green-200"
                  />
                </div>
                
                
                <div className="space-y-2">
                  <label htmlFor="berth" className="text-sm font-medium text-green-700">Berth/Seat</label>
                  <Input
                    id="berth"
                    placeholder="e.g. 12, 24, 36"
                    value={berthNumber}
                    onChange={(e) => setBerthNumber(e.target.value)}
                    className="border-green-300 focus:border-green-500 focus:ring-green-200"
                  />
                </div>
                
               </div>
                <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 transition-colors py-2 text-white font-medium rounded-md"
                disabled={searchingRestaurants || !selectedStation || !coachNumber || !berthNumber}
              >
                {searchingRestaurants ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Find Food Options
                  </>
                )}
              </Button>
               </>
                }
             
              
             
            </form>
          </div>
          
          {/* Train Details Results - Two Column Layout */}
          {searchPerformed && (
            <div className="flex flex-col md:flex-row mt-4">
              {/* Restaurants Column - Left Side */}
              <div className="md:w-2/3 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-800">
                    Available Restaurants
                  </h3>
                  {selectedStation && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {selectedStationName} ({selectedStation})
                    </Badge>
                  )}
                </div>
                
                {searchingRestaurants ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="overflow-hidden border border-gray-200">
                        <CardHeader className="pb-2 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                        </CardHeader>
                        <CardContent className="pb-2">
                          <Skeleton className="h-4 w-1/2" />
                        </CardContent>
                        <CardFooter>
                          <Skeleton className="h-9 w-full" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : restaurants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {restaurants.map((restaurant:any) => 
                      renderRestaurantCard(restaurant)
                    )}
                  </div>
                ) : (
                  renderNoRestaurants(selectedStation, selectedStationName)
                )}
              </div>
              
              {/* Stations Info - Right Side */}
              <div className="md:w-1/3 p-4 border-l border-green-200 bg-white">
                <div className="bg-white rounded-lg border border-green-200 p-4 mb-4">
                  <h3 className="text-lg font-semibold text-green-800 flex items-center mb-3">
                    <Train className="h-5 w-5 mr-2 text-green-600" />
                    Journey Details
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-1 mr-2">
                        <Train className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Train Number</span>
                        <span className="font-medium">{trainNumber || "Not specified"}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-1 mr-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Station</span>
                        <span className="font-medium">{selectedStationName || "Not selected"} {selectedStation && `(${selectedStation})`}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-1 mr-2">
                        <CalendarIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Journey Date</span>
                        <span className="font-medium">{date ? format(date, "dd MMM yyyy") : "Not specified"}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-1 mr-2">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Expected Arrival</span>
                        <span className="font-medium">{time || "Not specified"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border border-green-200 p-4">
                  <h3 className="text-lg font-semibold text-green-800 flex items-center mb-3">
                    <Coffee className="h-5 w-5 mr-2 text-orange-500" />
                    Ordering Tips
                  </h3>
                  
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Order at least 2 hours before your journey for better availability</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Food will be delivered to your seat/berth at the selected station</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Pay online or choose cash on delivery at checkout</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Track your order status in real-time after placing the order</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      }
    </div>
  );

}