// components/Navbar.tsx
import Link from "next/link"
import WalletButton from "@/components/WalletButton"
import ClientOnly from "@/components/ClientOnly"

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-primary">BSlap Awards</div>
        <div className="flex space-x-4 items-center">
          <Link href="/" className="text-primary">Home</Link>
          <Link href="/contactus" className="text-primary">Contact Us</Link>
          <ClientOnly>
            <WalletButton />
          </ClientOnly>
        </div>
      </div>
    </nav>
  )
}