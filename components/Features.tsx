import FeatureCard from "./FeatureCard"
import { Palette, Globe, Users } from "lucide-react"

export default function Features() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">BSlap Features and Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Palette}
            title="Urban Art Mastery"
            description="Each BSlap NFT is a digital masterpiece, blending street art styles with AI-generated creativity."
          />
          <FeatureCard
            icon={Globe}
            title="Global Street Culture"
            description="Own a piece of worldwide urban art culture, with influences from diverse street scenes across the globe."
          />
          <FeatureCard
            icon={Users}
            title="Exclusive Community"
            description="Join the BSlap collective, gaining access to virtual galleries, street art events, and future collaborative projects."
          />
        </div>
      </div>
    </section>
  )
}

