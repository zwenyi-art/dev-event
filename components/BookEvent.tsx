"use client";
import React, { useState } from 'react'
import { createBooking } from '@/lib/actions/booking.actions';
import { AlertCircleIcon } from "lucide-react"
import {Alert,AlertDescription,AlertTitle} from "@/components/ui/alert";
type BookingStatus = 'idle' | 'submitting' | 'success' | 'error';


export function AlertDestructive() {
  return (
    <Alert variant="destructive" className="max-w-md">
      <AlertCircleIcon />
      <AlertTitle>Booking failed</AlertTitle>
      <AlertDescription>
        Your booking could not be processed. Please check your information
        and try again.
      </AlertDescription>
    </Alert>
  )
}

const BookEvent = ({eventId,slug}:{eventId:string;slug:string;}) => {
    const [email, setEmail] = useState<string>('');
    const [submitted, setSubmitted] = useState<BookingStatus>("idle");
    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const { success } = await createBooking({ eventId, slug, email });
        if(success) {
            setSubmitted("success");
            // posthog.capture('event_booked', { eventId, slug, email })
        } else {
            // console.error('Booking creation failed')
            setSubmitted("error");
            // posthog.captureException('Booking creation failed')
        }
    }
     
    function  renderContent():React.ReactNode {
        switch(submitted){
            case "success":
                return(<p className="text-sm">Thank you for signing up!</p>);
            case "error":
                return <AlertDestructive />;
            default:
                return (<form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            id="email"
                            placeholder="Enter your email address"
                        />
                    </div>

                    <button type="submit" className="button-submit">Submit</button>
                </form>);
        }
    }

  return (
        <div id="book-event">
            {renderContent()}
        </div>
    )
}

export default BookEvent