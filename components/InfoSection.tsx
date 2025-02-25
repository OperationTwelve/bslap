interface InfoSectionProps {
  title: string
  content: string
}

export default function InfoSection({ title, content }: InfoSectionProps) {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-lg">{content}</p>
      </div>
    </section>
  )
}

