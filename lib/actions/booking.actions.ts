'use server';
import  Booking  from "@/database/booking.model";
import connectDB from "@/lib/mongodb";
interface BookingParams {
    eventId: string;
    slug: string;
    email: string;
}

export const createBooking = async({ eventId, slug, email }:BookingParams)=>{
    try {
        await connectDB();
        await Booking.create({ eventId, slug, email });
        return { success: true };
    } catch (error) {
        console.error('create booking failed', error);
        return { success: false };
    }
}