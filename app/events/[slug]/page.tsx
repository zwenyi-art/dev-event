import EventDetail from "@/components/EventDetail";
import { Suspense } from "react";
type PageProps = {
    params:Promise< {
        slug: string;
    }>
};

const page = async({ params }: PageProps) => { 
  return (
    <main>
        <Suspense fallback={<div>Loading...</div>}>
            <EventDetail params={params}></EventDetail>
        </Suspense>
    </main>
  )
}

export default page