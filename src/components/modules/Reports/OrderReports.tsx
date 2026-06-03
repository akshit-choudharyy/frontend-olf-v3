import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, AlertCircle, Train } from 'lucide-react';
import { olfService } from '@/utils/axiosInstance';

// --- TYPES (can be moved to a separate file) ---
interface TopStation {
  station_name: string;
  station_code: string;
  order_count: string;
  outlets: string[];
}

interface LowOrderStationOutlet {
  station_name: string;
  station_code: string;
  outlet_name: string;
  order_count: string;
}

// Type for the grouped low-order stations data
interface GroupedLowOrderStation {
    station_name: string;
    station_code: string;
    outlets: { name: string; order_count: string }[];
}

// --- MAIN COMPONENT ---
export function OrderReports() {
  // 1. Fetch Top Performing Stations
  const {
    data: topStations,
    isPending: isTopStationsPending,
    error: topStationsError,
  } = useQuery({
    queryKey: ['topStations'],
    queryFn: () =>
      olfService.get('/reports/orders/top-stations').then((res) => {
        if (res.data.status !== 1) {
          throw new Error('API returned an error for top stations');
        }
        return (res.data.data.rows || []) as TopStation[];
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // 2. Fetch Low/Zero Order Stations
  const {
    data: lowOrderStations,
    isPending: isLowStationsPending,
    error: lowStationsError,
  } = useQuery({
    queryKey: ['lowOrderStations'],
    queryFn: () =>
      olfService.get('/reports/orders/low-order-stations').then((res) => {
        if (res.data.status !== 1) {
          throw new Error('API returned an error for low order stations');
        }
        return (res.data.data.rows || []) as LowOrderStationOutlet[];
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // 3. Fetch Active Stations Count
  const {
    data: activeStationsCount,
    isPending: isActiveCountPending,
    error: activeCountError,
  } = useQuery({
    queryKey: ['activeStationsCount'],
    queryFn: () =>
      olfService.get('/reports/orders/active-stations-count').then((res) => {
        if (res.data.status !== 1) {
          throw new Error('API returned an error for active stations count');
        }
        return res.data.data.total_stations_with_orders as string;
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Data Transformation: Group low order stations by station for a cleaner table display
  const groupedLowOrderStations = useMemo(() => {
    if (!lowOrderStations) return [];
    
    const stationMap: Record<string, GroupedLowOrderStation> = {};
    
    lowOrderStations.forEach(outlet => {
      if (!stationMap[outlet.station_code]) {
        stationMap[outlet.station_code] = {
          station_code: outlet.station_code,
          station_name: outlet.station_name,
          outlets: [],
        };
      }
      stationMap[outlet.station_code].outlets.push({
        name: outlet.outlet_name,
        order_count: outlet.order_count,
      });
    });

    return Object.values(stationMap);
  }, [lowOrderStations]);


  const anyError = topStationsError || lowStationsError || activeCountError;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 bg-muted/20 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Order Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Live data overview of station performance.
        </p>
      </header>

      {anyError && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">An Error Occurred</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              Failed to fetch some report data. Please try refreshing the page.
            </p>
            <pre className="mt-2 text-xs text-destructive/80 bg-destructive/10 p-2 rounded">
                {topStationsError?.message}
                {lowStationsError?.message}
                {activeCountError?.message}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* --- Summary Cards --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stations</CardTitle>
            <Train className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isActiveCountPending ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">{activeStationsCount || '0'}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total stations currently receiving orders.
            </p>
          </CardContent>
        </Card>
        {/* You can add more summary cards here if needed */}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* --- Top Stations Card --- */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <CardTitle>Top Performing Stations</CardTitle>
            </div>
            <CardDescription>Stations with the highest order volume.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead>Active Outlets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTopStationsPending ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : topStations && topStations.length > 0 ? (
                  topStations.map((station, index) => (
                    <TableRow key={station.station_code}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{station.station_name}</div>
                        <div className="text-sm text-muted-foreground">{station.station_code}</div>
                      </TableCell>
                      <TableCell className="text-right font-bold">{station.order_count}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {station.outlets.map(outlet => (
                            <Badge key={outlet} variant="secondary">{outlet}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">No data available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* --- Low/Zero Order Stations Card --- */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <CardTitle>Low/Zero Order Stations</CardTitle>
            </div>
            <CardDescription>Stations and outlets with minimal or no orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead>Outlets (Order Count)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLowStationsPending ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : groupedLowOrderStations.length > 0 ? (
                  groupedLowOrderStations.map((station) => (
                    <TableRow key={station.station_code}>
                      <TableCell>
                        <div className="font-medium">{station.station_name}</div>
                        <div className="text-sm text-muted-foreground">{station.station_code}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 items-start">
                          {station.outlets.map(outlet => (
                            <div key={outlet.name} className="flex items-center gap-2">
                               <Badge variant={outlet.order_count === "0" ? "destructive" : "outline"}>
                                {outlet.order_count}
                               </Badge>
                               <span>{outlet.name}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center">No data available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}