import { AreasSection } from '@/components/AreasSection';
import { FeaturedEvents } from '@/components/FeaturedEvents';
import { Filters } from '@/components/Filters';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { Navbar } from '@/components/Navbar';
import { Newsletter } from '@/components/Newsletter';

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <FeaturedEvents />
      <Filters />
      <AreasSection />
      <Newsletter />
      <Footer />
    </main>
  );
}
