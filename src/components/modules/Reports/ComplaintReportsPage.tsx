import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { olfService } from '@/utils/axiosInstance';

// --- TypeScript Interfaces for API Data ---

// For /reports/complaints/stat
interface ComplaintStat {
  station_name: string;
  station_code: string;
  outlet_name: string;
  complaint_count: string;
}

// For /reports/complaints/feedback
interface FeedbackStat {
  station_name: string;
  station_code: string;
  outlet_name: string;
  positive_feedback_count: string;
}

// --- Main Component ---

export function ComplaintReportsPage() {
  // --- Data Fetching using React Query ---

  // 1. Fetch Total Complaints
  const {
    data: totalComplaints,
    isPending: isTotalPending,
    error: totalError,
  } = useQuery({
    queryKey: ['totalComplaints'],
    queryFn: () =>
      olfService.get('/reports/complaints/total-complaints').then((res) => {
        if (res.data.status !== 1) throw new Error('Failed to fetch total complaints');
        // Return the first row's total, or '0' if no data
        return res.data.data.rows[0]?.total_complaints || '0';
      }),
  });

  // 2. Fetch Complaint Statistics
  const {
    data: complaintStats = [],
    isPending: isStatsPending,
    error: statsError,
  } = useQuery<ComplaintStat[]>({
    queryKey: ['complaintStats'],
    queryFn: () =>
      olfService.get('/reports/complaints/stats').then((res) => {
        if (res.data.status !== 1) throw new Error('Failed to fetch complaint stats');
        return res.data.data.rows || [];
      }),
  });

  // 3. Fetch Feedback Statistics
  const {
    data: feedbackStats = [],
    isPending: isFeedbackPending,
    error: feedbackError,
  } = useQuery<FeedbackStat[]>({
    queryKey: ['feedbackStats'],
    queryFn: () =>
      olfService.get('/reports/complaints/feedback').then((res) => {
        if (res.data.status !== 1) throw new Error('Failed to fetch feedback stats');
        return res.data.data.rows || [];
      }),
  });

  // --- Loading and Error States ---

  const isLoading = isTotalPending || isStatsPending || isFeedbackPending;
  const queryError = totalError || statsError || feedbackError;

  if (isLoading) {
    return <ComplaintReportsSkeleton />;
  }

  if (queryError) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-destructive bg-red-50 p-8 text-destructive">
        <div className="text-center">
          <h2 className="text-xl font-bold">Failed to load report data</h2>
          <p className="mt-2 text-sm">{queryError.message}</p>
        </div>
      </div>
    );
  }

  // --- Rendered JSX ---

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Complaint Reports</h1>
        <p className="text-muted-foreground">
          An overview of customer complaints and feedback.
        </p>
      </header>

      {/* Summary Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalComplaints}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outlets with Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {complaintStats.filter((s) => parseInt(s.complaint_count, 10) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              out of {complaintStats.length} total outlets
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outlets with Positive Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {feedbackStats.filter((f) => parseInt(f.positive_feedback_count, 10) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              out of {feedbackStats.length} total outlets
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Data Tables */}
      <main className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Complaint Stats Table */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Complaint Statistics by Outlet</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead className="text-right">Complaints</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaintStats.length > 0 ? (
                  complaintStats.map((stat, index) => (
                    <TableRow key={`${stat.station_code}-${stat.outlet_name}-${index}`}>
                      <TableCell className="font-medium">{stat.outlet_name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{stat.station_name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{stat.station_code}</div>
                      </TableCell>
                      <TableCell className="text-right font-bold">{stat.complaint_count}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No complaint data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableCaption>A list of complaints per outlet.</TableCaption>
            </Table>
          </Card>
        </div>

        {/* Feedback Stats Table */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Positive Feedback by Outlet</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead className="text-right">Positive Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbackStats.length > 0 ? (
                  feedbackStats.map((stat, index) => (
                    <TableRow key={`${stat.station_code}-${stat.outlet_name}-${index}`}>
                      <TableCell className="font-medium">{stat.outlet_name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{stat.station_name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{stat.station_code}</div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {stat.positive_feedback_count}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No feedback data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableCaption>A list of positive feedback per outlet.</TableCaption>
            </Table>
          </Card>
        </div>
      </main>
    </div>
  );
}

// --- Skeleton Component for Loading State ---

function ComplaintReportsSkeleton() {
  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8">
      <header>
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="mt-2 h-5 w-1/2" />
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-1/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </CardContent>
        </Card>
      </section>

      <main className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Card>
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-8 rounded-full" />
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Card>
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-8 rounded-full" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}