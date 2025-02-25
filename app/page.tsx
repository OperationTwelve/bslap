import Navbar from "@/components/Navbar"
import Hero from "@/components/Hero"
import InfoSection from "@/components/InfoSection"
import Features from "@/components/Features"

export default function Home() {
  return (
    <div className="bg-background text-foreground">
      <main className="min-h-screen">
        <Navbar />
        <div className="pt-16">
          {" "}
          {/* Add padding to account for fixed navbar */}
          <Hero />
          <InfoSection
            title="About BSlap NFTs"
            content="BSlap NFTs are unique digital artworks that capture the essence of street culture and urban art. Each piece is a one-of-a-kind creation, representing the fusion of bold artistic expression with cutting-edge digital technology."
          />
          <InfoSection
            title="BSlap Creation Process"
            content="When you click 'Create and Claim BSlap', our advanced AI algorithm generates a unique piece inspired by global urban aesthetics. The algorithm considers various style parameters, ensuring that each BSlap NFT is a distinct masterpiece of digital street art."
          />
          <Features />
        </div>
      </main>
    </div>
  )
}

