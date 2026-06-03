import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    AlertTriangle, BadgeCheck, Calendar, ChevronDown, CircleDashed, CircleDollarSign,
    Clock, Filter, Loader2, MessageSquare, MessageSquareWarning, PackageSearch, PackageX,
    RotateCw, Send, SortAsc, SortDesc, User, UtensilsCrossed
} from 'lucide-react';

// Assuming you have a configured axios instance like this
import { olfService } from '@/utils/axiosInstance'; // Adjust path as needed

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- TYPE DEFINITIONS ---
type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
type ComplaintType = 'Wrong Item' | 'Late Delivery' | 'Food Quality' | 'Damaged Item' | 'Other';

interface Complaint {
    id: number; // comp_id is a number
    orderId: number; // order_id is a number
    customerName: string;
    complaintDate: string; // ISO string format for easy sorting
    type: ComplaintType;
    description: string;
    orderAmount: number; // Assuming we get this from somewhere, mocking for now
    status: ComplaintStatus;
    // NEW: Add conversations field
    conversations: {
        chat: Array<{
            sender: number; // 1 for customer, 0 for admin
            message: string;
            timestamp?: string; // Add timestamp if available
        }>;
    };
}

// UPDATED: Type for a single chat message
interface ChatMessage {
    id: number;
    text: string;
    sender: 'agent' | 'customer';
}

// --- MAPPINGS & CONSTANTS ---

// Map numeric API status to string status
const API_STATUS_MAP: Record<number, ComplaintStatus> = {
    0: 'Pending',
    1: 'In Progress',
    2: 'Resolved',
    3: 'Rejected',
};

// Map numeric API reason to string type
const API_REASON_MAP: Record<number, ComplaintType> = {
    1: 'Wrong Item',
    2: 'Late Delivery',
    3: 'Food Quality',
    4: 'Damaged Item',
    5: 'Other', // Assuming '5' maps to 'Other'
};

const complaintTypeDetails: Record<ComplaintType, { icon: React.ElementType; color: string }> = {
    'Food Quality': { icon: UtensilsCrossed, color: 'text-orange-500' },
    'Late Delivery': { icon: Clock, color: 'text-red-500' },
    'Wrong Item': { icon: PackageSearch, color: 'text-blue-500' },
    'Damaged Item': { icon: PackageX, color: 'text-purple-500' },
    'Other': { icon: MessageSquareWarning, color: 'text-gray-500' },
};

const complaintStatusDetails: Record<ComplaintStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', color: string }> = {
    'Pending': { variant: 'default', color: 'bg-yellow-500 hover:bg-yellow-600' },
    'In Progress': { variant: 'default', color: 'bg-blue-500 hover:bg-blue-600' },
    'Resolved': { variant: 'default', color: 'bg-green-600 hover:bg-green-700' },
    'Rejected': { variant: 'destructive', color: '' },
};

// --- DATE SEPARATOR COMPONENT ---
const DateSeparator = ({ date }: { date: string }) => {
    const formatDate = (dateStr: string) => {
        const dateObj = new Date(dateStr);
        return dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    };
    return (
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300" /></div>
            <div className="relative flex justify-center"><span className="bg-gray-50 px-3 text-sm font-medium text-gray-700 flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-500" />{formatDate(date)}</span></div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function CustomerComplaintsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [typeFilter, setTypeFilter] = useState<ComplaintType | 'All'>('All');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

    // Dialog states
    const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
    const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);

    // Chat-specific state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // --- DATA FETCHING with useQuery ---
    const { data: complaints = [], isPending, error } = useQuery<Complaint[]>({
        queryKey: ['customerComplaints'],
        queryFn: async () => {
            const res = await olfService.get('/complaints');
            if (res.data.status !== 1) throw new Error(res.data.info || 'Failed to fetch complaints.');
            const apiRows = res.data.data.rows;
            return apiRows.map((c: any): Complaint => ({
                id: c.comp_id,
                orderId: c.order_id,
                customerName: `${c.first_name} ${c.last_name}`,
                complaintDate: c.created_at,
                type: API_REASON_MAP[c.reason] || 'Other',
                description: c.complaint,
                orderAmount: Math.floor(Math.random() * (1000 - 100 + 1) + 100),
                status: API_STATUS_MAP[c.status] || 'Pending',
                conversations: c.conversations, // Include conversations from API
            }));
        },
    });

    // --- FETCH COMPLAINT DETAILS (for chat) ---
    const { data: complaintDetails } = useQuery<Complaint>({
        queryKey: ['complaintDetails', selectedComplaint?.id],
        queryFn: async () => {
            if (!selectedComplaint?.id) throw new Error('No complaint selected');
            const res = await olfService.get(`/complaints/${selectedComplaint.id}`);
            if (res.data.status !== 1) throw new Error(res.data.info || 'Failed to fetch complaint details.');
            const c = res.data.data.rows[0];
            return {
                id: c.comp_id,
                orderId: c.order_id,
                customerName: `${c.first_name} ${c.last_name}`,
                complaintDate: c.created_at,
                type: API_REASON_MAP[c.reason] || 'Other',
                description: c.complaint,
                orderAmount: Math.floor(Math.random() * (1000 - 100 + 1) + 100),
                status: API_STATUS_MAP[c.status] || 'Pending',
                conversations: c.conversations,
            };
        },
        enabled: !!selectedComplaint?.id && isChatDialogOpen,
    });

    // --- DATA MUTATION with useMutation ---
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: number }) => {
            return olfService.put(`/complaint/${id}`, { status });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customerComplaints'] }),
    });

    const refundMutation = useMutation({
        mutationFn: (complaint: Complaint) => {
            console.log(`Refunding order ${complaint.orderId}`);
            return olfService.post(`/orders/${complaint.orderId}/refund`, { amount: complaint.orderAmount });
        },
        onSuccess: (_, variables) => {
            updateStatusMutation.mutate({ id: variables.id, status: 2 });
            setIsRefundDialogOpen(false);
            setSelectedComplaint(null);
        },
    });

    // NEW: Send message mutation
    const sendMessageMutation = useMutation({
        // The mutation now expects the full payload object.
        mutationFn: ({ complaintId, payload }: {
            complaintId: number;
            payload: { conversations: { chat: Array<{ sender: number; message: string; timestamp?: string }> } }
        }) => {
            return olfService.put(`/complaint/${complaintId}`, payload);
        },
        // Use onSettled to refetch data after the mutation succeeds or fails.
        // This is more robust than onSuccess.
        onSettled: (data, error, variables) => {
            console.log(data, error);
            // Invalidate queries to get the latest state from the server.
            // This updates both the chat dialog and the message count badge on the main list.
            queryClient.invalidateQueries({ queryKey: ['customerComplaints'] });
            queryClient.invalidateQueries({ queryKey: ['complaintDetails', variables.complaintId] });
        },
        onError: (error) => {
            // Optional: You can add user-facing error handling here, like a toast message.
            console.error("Failed to send message:", error);
            // The UI will be corrected automatically by the invalidation in onSettled.
        }
    });

    // Auto-scroll chat to bottom
    useEffect(() => {
        const viewport = chatContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }, [chatMessages]);

    // Update chat messages when complaint details change
    useEffect(() => {
        if (complaintDetails?.conversations?.chat) {
            const messages: ChatMessage[] = complaintDetails.conversations.chat.map((msg, index) => ({
                id: index,
                text: msg.message,
                sender: msg.sender === 1 ? 'customer' : 'agent',
                timestamp: msg.timestamp, // <-- ADD THIS LINE to pass the timestamp to UI state
            }));
            setChatMessages(messages);
        }
    }, [complaintDetails]);

    // --- EVENT HANDLERS ---
    const handleStatusChange = (id: number, newStatus: number) => {
        updateStatusMutation.mutate({ id, status: newStatus });
    };

    const handleInitiateRefund = (complaint: Complaint) => {
        setSelectedComplaint(complaint);
        setIsRefundDialogOpen(true);
    };

    const handleConfirmRefund = () => {
        if (!selectedComplaint) return;
        refundMutation.mutate(selectedComplaint);
    };

    // UPDATED: Chat Handlers
    const handleOpenChat = (complaint: Complaint) => {
        // 1. Immediately populate the chat from the data we already have from the main list.
        // This makes the dialog feel instant and fixes the "no messages" bug.
        if (complaint.conversations?.chat) {
            const initialMessages: ChatMessage[] = complaint.conversations.chat.map((msg, index) => ({
                id: index, // Using index as a key is fine for a static list display
                text: msg.message,
                sender: msg.sender === 1 ? 'customer' : 'agent',
                timestamp: msg.timestamp, // Pass the timestamp if you have it
            }));
            setChatMessages(initialMessages);
        } else {
            // If the clicked complaint has no messages, ensure we start with an empty array.
            setChatMessages([]);
        }

        // 2. Set the state to open the dialog and trigger the detailed background fetch.
        // The `useQuery` for `complaintDetails` will now run to get the freshest data.
        setSelectedComplaint(complaint);
        setIsChatDialogOpen(true);
    };

const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentMessage.trim() || !selectedComplaint) return;

        // 1. Convert the current UI chat state back to the API format.
        const existingMessagesForAPI = chatMessages.map(msg => ({
            sender: msg.sender === 'customer' ? 1 : 0,
            message: msg.text,
        }));

        // 2. Create the new message in the API format.
        const newMessageForAPI = {
            sender: 0, // 0 represents the agent/admin
            message: currentMessage.trim(),
            timestamp: new Date().toISOString(), // Add a new timestamp
        };

        // 3. Combine them to create the complete, new conversation list.
        const updatedChatList = [...existingMessagesForAPI, newMessageForAPI];

        // 4. Construct the final payload for the PUT request.
        const payload = {
            conversations: {
                chat: updatedChatList,
            },
        };

        // 5. Call the mutation with the complaint ID and the complete payload.
        sendMessageMutation.mutate({
            complaintId: selectedComplaint.id,
            payload: payload
        });
        
        // 6. Optimistically update the UI for an instant response.
        // This makes the app feel much faster.
        const newMessageForUI: ChatMessage = {
            id: Date.now(), // Use a temporary unique ID for React's key
            text: currentMessage.trim(),
            sender: 'agent',
        };
        setChatMessages(prevMessages => [...prevMessages, newMessageForUI]);
        setCurrentMessage('');
    };

    // --- MEMOIZED FILTERING AND SORTING ---
    const filteredAndSortedComplaints = useMemo(() => {
        return complaints
            .filter((c) => {
                const statusMatch = statusFilter === 'All' || c.status === statusFilter;
                const typeMatch = typeFilter === 'All' || c.type === typeFilter;
                return statusMatch && typeMatch;
            })
            .sort((a, b) => {
                const dateA = new Date(a.complaintDate).getTime();
                const dateB = new Date(b.complaintDate).getTime();
                return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
            });
    }, [complaints, statusFilter, typeFilter, sortBy]);

    const groupedComplaints = useMemo(() => {
        return filteredAndSortedComplaints.reduce((acc, complaint) => {
            const date = new Date(complaint.complaintDate).toDateString();
            if (!acc[date]) acc[date] = [];
            acc[date].push(complaint);
            return acc;
        }, {} as Record<string, Complaint[]>);
    }, [filteredAndSortedComplaints]);

    // --- RENDER LOGIC ---
    if (isPending) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading complaints...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600">Error loading complaints: {error.message}</p>
                </div>
            </div>
        );
    }

    const complaintTypes: ComplaintType[] = ['Food Quality', 'Late Delivery', 'Wrong Item', 'Damaged Item', 'Other'];

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customer Complaints</h1>
                    <p className="text-lg text-gray-600 mt-1">Review, manage, and resolve customer issues efficiently.</p>
                </div>

                {/* Filters Toolbar */}
                <Card className="mb-6 p-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:items-center lg:justify-between gap-4">
                        <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-1">
                            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                                <TabsList>
                                    <TabsTrigger value="All">All</TabsTrigger>
                                    <TabsTrigger value="Pending">Pending</TabsTrigger>
                                    <TabsTrigger value="In Progress">In Progress</TabsTrigger>
                                    <TabsTrigger value="Resolved">Resolved</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <div className="flex items-center gap-4">
                            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ComplaintType | 'All')}>
                                <SelectTrigger className="w-full sm:w-[200px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter by type..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Types</SelectItem>
                                    {complaintTypes.map(type => {
                                        const { icon: Icon, color } = complaintTypeDetails[type];
                                        return (<SelectItem key={type} value={type}><div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${color}`} />{type}</div></SelectItem>);
                                    })}
                                </SelectContent>
                            </Select>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="outline">{sortBy === 'newest' ? <SortDesc className="mr-2 h-4 w-4" /> : <SortAsc className="mr-2 h-4 w-4" />}Sort by Date</Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setSortBy('newest')}><SortDesc className="mr-2 h-4 w-4" />Newest First</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortBy('oldest')}><SortAsc className="mr-2 h-4 w-4" />Oldest First</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </Card>

                {/* Complaints List */}
                <div className="space-y-4">
                    {Object.keys(groupedComplaints).length > 0 ? (
                        Object.entries(groupedComplaints).map(([date, complaintsOnDate]) => (
                            <div key={date}>
                                <DateSeparator date={date} />
                                <div className="space-y-4 mt-4">
                                    {complaintsOnDate.map((complaint: Complaint) => {
                                        const { icon: ComplaintIcon, color: iconColor } = complaintTypeDetails[complaint.type];
                                        const { variant: statusVariant, color: statusColor } = complaintStatusDetails[complaint.status];
                                        const hasMessages = complaint.conversations?.chat?.length > 0;

                                        return (
                                            <Card key={complaint.id} className="overflow-hidden p-0">
                                                <CardHeader className="flex flex-row items-start justify-between gap-4 p-4 bg-white">
                                                    <div>
                                                        <CardTitle className="text-lg">Order #{complaint.orderId}</CardTitle>
                                                        <CardDescription className="flex items-center gap-2 mt-1"><User className="h-4 w-4" />{complaint.customerName}</CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {hasMessages && (
                                                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                                                                {complaint.conversations.chat.length} message{complaint.conversations.chat.length !== 1 ? 's' : ''}
                                                            </Badge>
                                                        )}
                                                        <Badge variant={statusVariant} className={statusColor}>{complaint.status}</Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 border-t">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="md:col-span-2 space-y-3">
                                                            <div className="flex items-center gap-3"><ComplaintIcon className={`h-5 w-5 ${iconColor}`} /><span className="font-semibold text-gray-800">{complaint.type}</span></div>
                                                            <p className="text-sm text-gray-600">{complaint.description}</p>
                                                        </div>
                                                        <div className="md:col-span-1 space-y-2 text-sm text-gray-700">
                                                            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-500" /><span>{new Date(complaint.complaintDate).toLocaleString('en-IN')}</span></div>
                                                            <div className="flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-gray-500" /><span className='font-medium'>Order Amount: ₹{complaint.orderAmount.toFixed(2)}</span></div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                                <CardFooter className="bg-gray-50 p-3 flex justify-end gap-2 border-t">
                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenChat(complaint)}>
                                                        <MessageSquare className="mr-2 h-4 w-4" />
                                                        {hasMessages ? 'View Chat' : 'Start Chat'}
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleInitiateRefund(complaint)}><CircleDollarSign className="mr-2 h-4 w-4 text-green-600" />Refund Order</Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="outline" size="sm" disabled={updateStatusMutation.isPending}>
                                                            {updateStatusMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                            Change Status <ChevronDown className="ml-2 h-4 w-4" />
                                                        </Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleStatusChange(complaint.id, 0)}><CircleDashed className="mr-2 h-4 w-4 text-yellow-500" /> Pending</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleStatusChange(complaint.id, 1)}><RotateCw className="mr-2 h-4 w-4 text-blue-500" /> In Progress</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleStatusChange(complaint.id, 2)}><BadgeCheck className="mr-2 h-4 w-4 text-green-600" /> Resolved</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleStatusChange(complaint.id, 3)}><AlertTriangle className="mr-2 h-4 w-4 text-red-500" /> Rejected</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </CardFooter>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16"><PackageSearch className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-lg font-medium text-gray-900">No Complaints Found</h3><p className="mt-1 text-sm text-gray-500">Try adjusting your filters to find what you're looking for.</p></div>
                    )}
                </div>

                {/* Refund Confirmation Dialog */}
                <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle className="flex items-center gap-2"><CircleDollarSign className="h-6 w-6 text-green-600" />Confirm Refund</DialogTitle><DialogDescription className="pt-2">Are you sure you want to process a full refund of <strong className="text-gray-800">₹{selectedComplaint?.orderAmount.toFixed(2)}</strong> for Order <strong className="text-gray-800">#{selectedComplaint?.orderId}</strong>? This action will also mark the complaint as 'Resolved'.</DialogDescription></DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>Cancel</Button>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={handleConfirmRefund} disabled={refundMutation.isPending}>
                                {refundMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Yes, Confirm Refund
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Chat Dialog */}
                <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
                    <DialogContent className="sm:max-w-2xl p-0 flex flex-col h-[70vh]">
                        <DialogHeader className="p-4 border-b">
                            <DialogTitle className="flex items-center gap-3">
                                <MessageSquare className="h-6 w-6 text-blue-600" />
                                Chat with {selectedComplaint?.customerName}
                            </DialogTitle>
                            <DialogDescription>
                                Regarding Order #{selectedComplaint?.orderId} - {selectedComplaint?.type}
                            </DialogDescription>
                        </DialogHeader>

                        <ScrollArea className="flex-grow max-h-90" ref={chatContainerRef}>
                            <div className="space-y-4 p-4">
                                {chatMessages.length > 0 ? (
                                    chatMessages.map((message) => (
                                        <div key={message.id} className={`flex items-end gap-2 ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                            {message.sender === 'customer' && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{selectedComplaint?.customerName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={`rounded-lg px-3 py-2 max-w-sm ${message.sender === 'agent' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                                <p className="text-sm">{message.text}</p>
                                            </div>
                                            {message.sender === 'agent' && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-blue-500 text-white">S</AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
                            <div className="relative">
                                <Input
                                    value={currentMessage}
                                    onChange={(e) => setCurrentMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="pr-12"
                                    disabled={sendMessageMutation.isPending}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8"
                                    disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                                >
                                    {sendMessageMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Send</span>
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    );
}