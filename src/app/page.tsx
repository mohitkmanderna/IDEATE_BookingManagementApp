"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { getLogoUrl } from "./actions";
import Image from "next/image";

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  room: {
    name: string;
  };
}

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    const url = await getLogoUrl();
    setLogoUrl(url || null);
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings?status=APPROVED");
      const data = await res.json();
      setBookings(data);
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    } finally {
      setLoading(false);
    }
  };

  const bookingsOnDate = bookings.filter((booking) => {
    if (!date) return false;
    const bookingDate = new Date(booking.startTime);
    return (
      bookingDate.getDate() === date.getDate() &&
      bookingDate.getMonth() === date.getMonth() &&
      bookingDate.getFullYear() === date.getFullYear()
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-zinc-900 dark:text-zinc-50">
            {logoUrl && (
              <div className="flex justify-center mb-6">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-16 object-contain"
                />
              </div>
            )}
            Booking Calendar
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            Check availability and book a room for your meeting.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/book">
              <Button size="lg" className="font-semibold">
                Book a Room
              </Button>
            </Link>
            <Link href="/track">
              <Button variant="outline" size="lg">
                Track Request
              </Button>
            </Link>

          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
              <CardTitle>Select a Date</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
              <CardTitle>
                Bookings for {date ? format(date, "MMMM do, yyyy") : "Selected Date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-zinc-500">Loading...</p>
              ) : bookingsOnDate.length > 0 ? (
                <ul className="space-y-4">
                  {bookingsOnDate.map((booking) => (
                    <li
                      key={booking.id}
                      className="flex flex-col p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {booking.room.name}
                        </span>
                        <Badge variant="secondary">Approved</Badge>
                      </div>
                      <div className="text-sm text-zinc-500 mt-1">
                        {format(new Date(booking.startTime), "h:mm a")} -{" "}
                        {format(new Date(booking.endTime), "h:mm a")}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500 italic">No bookings found for this date.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
