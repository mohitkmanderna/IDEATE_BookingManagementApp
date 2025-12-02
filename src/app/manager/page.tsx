
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface Booking {
    id: string;
    userName: string;
    userEmail: string;
    room: { name: string };
    startTime: string;
    endTime: string;
    purpose: string;
    status: string;
    rejectionReason?: string | null;
    createdAt: string;
}

interface Room {
    id: string;
    name: string;
    description: string | null;
}

export default function ManagerPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
    const router = useRouter();

    // Selection State
    const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

    // Room Form State
    const [roomName, setRoomName] = useState("");
    const [roomDesc, setRoomDesc] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Alert Dialog State
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        description: string;
        action: () => Promise<void>;
    } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, roomsRes] = await Promise.all([
                fetch("/api/bookings"),
                fetch("/api/rooms"),
            ]);

            if (!bookingsRes.ok || !roomsRes.ok) {
                throw new Error("Failed to fetch data");
            }

            const bookingsData = await bookingsRes.json();
            const roomsData = await roomsRes.json();
            setBookings(bookingsData);
            setRooms(roomsData);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        // Clear cookie by setting it to expire immediately
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        router.push("/manager/login");
        toast.success("Logged out successfully");
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        }).format(new Date(dateString));
    };

    const handleStatusUpdate = async (id: string, status: "APPROVED" | "REJECTED" | "CANCELLED") => {
        setProcessingBookingId(id);
        const promise = fetch(`/api/bookings/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        }).then(async (res) => {
            if (!res.ok) throw new Error("Failed to update status");
            return res.json();
        });

        toast.promise(promise, {
            loading: `Updating status to ${status}...`,
            success: () => {
                fetchData();
                return `Booking ${status.toLowerCase()}`;
            },
            error: "Failed to update booking",
        });

        try {
            await promise;
        } finally {
            setProcessingBookingId(null);
        }
    };

    const handleAddRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        const promise = fetch("/api/rooms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: roomName, description: roomDesc }),
        }).then(async (res) => {
            if (!res.ok) throw new Error("Failed to create room");
            return res.json();
        });

        toast.promise(promise, {
            loading: "Adding room...",
            success: () => {
                setIsDialogOpen(false);
                setRoomName("");
                setRoomDesc("");
                fetchData();
                return "Room added successfully";
            },
            error: "Failed to add room",
        });
    };

    const toggleBookingSelection = (id: string) => {
        setSelectedBookingIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleAllBookings = () => {
        if (selectedBookingIds.length === bookings.length) {
            setSelectedBookingIds([]);
        } else {
            setSelectedBookingIds(bookings.map((b) => b.id));
        }
    };

    const toggleRoomSelection = (id: string) => {
        setSelectedRoomIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleAllRooms = () => {
        if (selectedRoomIds.length === rooms.length) {
            setSelectedRoomIds([]);
        } else {
            setSelectedRoomIds(rooms.map((r) => r.id));
        }
    };

    const deleteSelectedBookings = () => {
        setAlertConfig({
            title: "Delete Bookings?",
            description: `Are you sure you want to delete ${selectedBookingIds.length} bookings? This action cannot be undone.`,
            action: async () => {
                const promise = fetch("/api/bookings", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids: selectedBookingIds }),
                }).then(async (res) => {
                    if (!res.ok) throw new Error("Failed to delete bookings");
                    return res.json();
                });

                toast.promise(promise, {
                    loading: "Deleting bookings...",
                    success: () => {
                        setSelectedBookingIds([]);
                        fetchData();
                        return "Bookings deleted successfully";
                    },
                    error: "Failed to delete bookings",
                });
            }
        });
        setAlertOpen(true);
    };

    const deleteSelectedRooms = () => {
        setAlertConfig({
            title: "Delete Rooms?",
            description: `Are you sure you want to delete ${selectedRoomIds.length} rooms? This will also delete all associated bookings. This action cannot be undone.`,
            action: async () => {
                const promise = fetch("/api/rooms", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids: selectedRoomIds }),
                }).then(async (res) => {
                    if (!res.ok) throw new Error("Failed to delete rooms");
                    return res.json();
                });

                toast.promise(promise, {
                    loading: "Deleting rooms...",
                    success: () => {
                        setSelectedRoomIds([]);
                        fetchData();
                        return "Rooms deleted successfully";
                    },
                    error: "Failed to delete rooms",
                });
            }
        });
        setAlertOpen(true);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                        Manager Dashboard
                    </h1>
                    <div className="flex items-center gap-4">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>Add Room</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Room</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddRoom} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="roomName">Room Name</Label>
                                        <Input
                                            id="roomName"
                                            value={roomName}
                                            onChange={(e) => setRoomName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="roomDesc">Description</Label>
                                        <Textarea
                                            id="roomDesc"
                                            value={roomDesc}
                                            onChange={(e) => setRoomDesc(e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full">
                                        Save Room
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="bookings" className="w-full">
                    <TabsList>
                        <TabsTrigger value="bookings">Bookings</TabsTrigger>
                        <TabsTrigger value="rooms">Rooms</TabsTrigger>
                    </TabsList>

                    <TabsContent value="bookings">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Booking Requests</CardTitle>
                                {selectedBookingIds.length > 0 && (
                                    <Button variant="destructive" size="sm" onClick={deleteSelectedBookings}>
                                        Delete Selected ({selectedBookingIds.length})
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox
                                                    checked={bookings.length > 0 && selectedBookingIds.length === bookings.length}
                                                    onCheckedChange={toggleAllBookings}
                                                />
                                            </TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Room</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Purpose</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center">
                                                    Loading...
                                                </TableCell>
                                            </TableRow>
                                        ) : bookings.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center">
                                                    No bookings found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            bookings.map((booking) => (
                                                <TableRow key={booking.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedBookingIds.includes(booking.id)}
                                                            onCheckedChange={() => toggleBookingSelection(booking.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-medium">{booking.userName}</div>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <Info className="h-4 w-4 text-zinc-400 hover:text-zinc-600" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Created: {formatDate(booking.createdAt)}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                        <div className="text-sm text-zinc-500">
                                                            {booking.userEmail}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{booking.room.name}</TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {formatDate(booking.startTime)}
                                                        </div>
                                                        <div className="text-xs text-zinc-500">
                                                            Duration:{" "}
                                                            {(new Date(booking.endTime).getTime() -
                                                                new Date(booking.startTime).getTime()) /
                                                                (1000 * 60 * 60)}{" "}
                                                            hrs
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate">
                                                        {booking.purpose}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                booking.status === "APPROVED"
                                                                    ? "default"
                                                                    : booking.status === "REJECTED"
                                                                        ? "destructive"
                                                                        : "secondary"
                                                            }
                                                            className={
                                                                booking.status === "APPROVED"
                                                                    ? "bg-green-500 hover:bg-green-600"
                                                                    : booking.status === "PENDING"
                                                                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                                                        : booking.status === "CANCELLED"
                                                                            ? "bg-orange-500 hover:bg-orange-600 text-white"
                                                                            : ""
                                                            }
                                                        >
                                                            {booking.status}
                                                        </Badge>
                                                        {booking.status === "REJECTED" && booking.rejectionReason && (
                                                            <div className="text-xs text-red-500 mt-1">
                                                                {booking.rejectionReason}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-2">
                                                        {booking.status === "PENDING" && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                    onClick={() => handleStatusUpdate(booking.id, "APPROVED")}
                                                                    disabled={!!processingBookingId}
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => handleStatusUpdate(booking.id, "REJECTED")}
                                                                    disabled={!!processingBookingId}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        {booking.status === "APPROVED" && (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleStatusUpdate(booking.id, "CANCELLED")}
                                                                disabled={!!processingBookingId}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="rooms">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Rooms</CardTitle>
                                {selectedRoomIds.length > 0 && (
                                    <Button variant="destructive" size="sm" onClick={deleteSelectedRooms}>
                                        Delete Selected ({selectedRoomIds.length})
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox
                                                    checked={rooms.length > 0 && selectedRoomIds.length === rooms.length}
                                                    onCheckedChange={toggleAllRooms}
                                                />
                                            </TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>ID</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center">
                                                    Loading...
                                                </TableCell>
                                            </TableRow>
                                        ) : rooms.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center">
                                                    No rooms found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            rooms.map((room) => (
                                                <TableRow key={room.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedRoomIds.includes(room.id)}
                                                            onCheckedChange={() => toggleRoomSelection(room.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">{room.name}</TableCell>
                                                    <TableCell>{room.description || "-"}</TableCell>
                                                    <TableCell className="text-zinc-500 text-sm">{room.id}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>


            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertConfig?.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertConfig?.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            onClick={() => {
                                alertConfig?.action();
                                setAlertOpen(false);
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
