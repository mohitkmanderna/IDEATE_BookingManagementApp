"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";

interface Booking {
    id: string;
    userName: string;
    room: { name: string };
    startTime: string;
    endTime: string;
    status: string;
    rejectionReason?: string | null;
}

function TrackContent() {
    const searchParams = useSearchParams();
    const initialId = searchParams.get("id") || "";
    const [bookingId, setBookingId] = useState(initialId);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialId) {
            handleTrack(initialId);
        }
    }, [initialId]);

    const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions) => {
        return new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Kolkata",
            ...options,
        }).format(new Date(dateString));
    };

    const handleTrack = async (id: string) => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/bookings/${id}`);
            if (!res.ok) {
                setBooking(null);
                if (res.status === 404) {
                    toast.error("Booking not found");
                } else {
                    toast.error("Failed to fetch booking");
                }
                return;
            }
            const data = await res.json();
            setBooking(data);
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleTrack(bookingId);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Track Booking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            placeholder="Enter Booking ID"
                            value={bookingId}
                            onChange={(e) => setBookingId(e.target.value)}
                            required
                        />
                        <Button type="submit" disabled={loading}>
                            {loading ? "Tracking..." : "Track"}
                        </Button>
                    </form>

                    {booking && (
                        <div className="space-y-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                    Status
                                </span>
                                <Badge
                                    className={
                                        booking.status === "APPROVED"
                                            ? "bg-green-500"
                                            : booking.status === "REJECTED"
                                                ? "bg-red-500"
                                                : "bg-yellow-500"
                                    }
                                >
                                    {booking.status}
                                </Badge>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Room:</span>
                                    <span className="font-medium">{booking.room.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Date:</span>
                                    <span className="font-medium">
                                        {formatDate(booking.startTime, {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            weekday: "long",
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Time:</span>
                                    <span className="font-medium">
                                        {formatDate(booking.startTime, {
                                            hour: "numeric",
                                            minute: "numeric",
                                            hour12: true,
                                        })}{" "}
                                        -{" "}
                                        {formatDate(booking.endTime, {
                                            hour: "numeric",
                                            minute: "numeric",
                                            hour12: true,
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Name:</span>
                                    <span className="font-medium">{booking.userName}</span>
                                </div>
                                {booking.status === "REJECTED" && booking.rejectionReason && (
                                    <div className="flex justify-between text-red-600 dark:text-red-400">
                                        <span className="font-semibold">Reason:</span>
                                        <span className="font-medium">{booking.rejectionReason}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function TrackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TrackContent />
        </Suspense>
    )
}
