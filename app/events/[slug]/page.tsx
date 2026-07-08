import EventDetail from "@/components/EventDetail";
import { Suspense } from "react";
type PageProps = {
    params:Promise< {
        slug: string;
    }>
};

const page = async({ params }: PageProps) => {
    const {slug} = await params;
  return (
    <main>
        <Suspense fallback={<div>Loading...</div>}>
            <EventDetail slug={slug}></EventDetail>
        </Suspense>
    </main>
  )
}

export default page