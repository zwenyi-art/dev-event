import {NextRequest,NextResponse} from "next/server";

export async function GET(){
    return NextResponse.json({message:"GET request received for events"});
}

export async function POST(req:NextRequest){
    console.log("POST request received for events");
    const body = await req.json();
    console.log("Request body:", body);
    return NextResponse.json({message:"POST request received for events", data: body});
}