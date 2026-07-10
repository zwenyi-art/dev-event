import connectDB from "@/lib/mongodb";
import {NextRequest,NextResponse} from "next/server";
import { Event, IEvent } from "@/database";
type RouteParams = {
    params:Promise<{slug:string;}>
};
export async function GET(req:NextRequest,{params}:RouteParams):Promise<NextResponse>{
    try {
        await connectDB();
        const {slug} = await params;
        if (!slug || typeof slug !== 'string' || slug.trim() === '') {
          return NextResponse.json(
            { message: 'Invalid or missing slug parameter' },{ status: 400 }
          );}
        const sanitizedSlug = slug.trim().toLowerCase();
        const event:IEvent = await Event.findOne({ slug: sanitizedSlug }).lean();
        
         // Handle events not found
        if (!event) {
          return NextResponse.json(
            { message: `Event with slug '${sanitizedSlug}' not found` },
            { status: 404 }
          );
        }

        return NextResponse.json({ message: 'Event fetched successfully', event }, { status: 200 });
    } catch (error) {
         // Handle specific error types
    if (error instanceof Error) {
      // Handle database connection errors
      if (error.message.includes('MONGODB_URI')) {
        return NextResponse.json(
          { message: 'Database configuration error' },
          { status: 500 }
        );
      }

      // Return generic error with error message
      return NextResponse.json(
        { message: 'Failed to fetch event', error: error.message },
        { status: 500 }
      );
    }

    // Handle unknown errors
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
    }
    
}