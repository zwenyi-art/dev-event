import {NextRequest,NextResponse} from "next/server";
import connectDB from "@/lib/mongodb";

export async function GET(){
    await connectDB();
    return NextResponse.json({message:"GET request received for events"});
}

export async function POST(req:NextRequest){
    console.log("POST request received for events");
    const body = await req.json();
    console.log("Request body:", body);
    return NextResponse.json({message:"POST request received for events", data: body});
}