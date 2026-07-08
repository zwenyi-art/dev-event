'use server';

import Event from '@/database/event.model';
import connectDB from "@/lib/mongodb";

export const getSimilarEventsBySlug = async (_id: string) => {
    try {
        // console.log('Fetching similar events for ID:', _id); // Debugging line
        await connectDB();
       // Debugging line
        const event = await Event.findById(_id).lean();  
        if (!event) {
            console.log(`Event with ID '${_id}' not found`); // Debugging line
            return [];
        }
        return await Event.find({ _id: { $ne: event._id },tags: { $in: event.tags } }).lean();
    } catch (error) {
        console.error('Error fetching similar events:', error);
        return [];
    }
}