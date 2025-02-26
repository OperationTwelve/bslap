import NFTSlideshow from "./NFTSlideshow"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/2">
          <NFTSlideshow />
        </div>
        <div className="w-full md:w-1/2 space-y-4">
          <h1 className="text-4xl font-bold">Create Your Award</h1>
          <p className="text-xl">Generate and mint your own exclusive Award.</p>
          <Link href="/generate">
            <Button size="lg">Create and Claim Award</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

