import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}

import { format } from "date-fns";

export function getManagerEmailHtml(booking: any) {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`;
    const formattedDate = format(new Date(booking.startTime), "MMM d, yyyy");
    return `
        <h2>New Booking Request</h2>
        <p><strong>User:</strong> ${booking.userName} (${booking.userEmail})</p>
        <p><strong>Room:</strong> ${booking.room.name}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${new Date(booking.startTime).toLocaleTimeString()} - ${new Date(booking.endTime).toLocaleTimeString()}</p>
        <p><strong>Purpose:</strong> ${booking.purpose}</p>
        <br/>
        <p>
            <a href="${dashboardUrl}" style="padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
        </p>
    `;
}

export function getUserCreationEmailHtml(booking: any) {
    const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/track?id=${booking.id}`;
    const formattedDate = format(new Date(booking.startTime), "MMM d, yyyy");
    return `
        <h2>Booking Request Received</h2>
        <p>Hi ${booking.userName},</p>
        <p>We have received your booking request for <strong>${booking.room.name}</strong>.</p>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${new Date(booking.startTime).toLocaleTimeString()} - ${new Date(booking.endTime).toLocaleTimeString()}</p>
        <p><strong>Purpose:</strong> ${booking.purpose}</p>
        <p><strong>Status:</strong> PENDING</p>
        <br/>
        <p>You can track the status of your request here:</p>
        <p>
            <a href="${trackUrl}" style="padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Track Request</a>
        </p>
    `;
}

export function getUserEmailHtml(booking: any, status: string) {
    const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/track?id=${booking.id}`;
    const formattedDate = format(new Date(booking.startTime), "MMM d, yyyy");
    let color = "black";
    if (status === "APPROVED") color = "green";
    if (status === "REJECTED") color = "red";
    if (status === "CANCELLED") color = "orange";

    return `
        <h2>Booking Update</h2>
        <p>Hi ${booking.userName},</p>
        <p>Your booking request for <strong>${booking.room.name}</strong> has been <strong style="color: ${color}">${status}</strong>.</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${new Date(booking.startTime).toLocaleTimeString()} - ${new Date(booking.endTime).toLocaleTimeString()}</p>
        <br/>
        <p>
            <a href="${trackUrl}" style="padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">View Booking</a>
        </p>
    `;
}

export async function getManagerEmail() {
    const config = await prisma.static.findUnique({
        where: { key: "MANAGER_EMAIL" },
    });
    return config?.value || "mohit.mk2809@gmail.com";
}
