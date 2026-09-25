import { Suspense } from 'react';
import { HeroBackdrop } from '@/components/HeroBackdrop';
import { DataProvider } from '@/lib/DataProvider';
import { Benchmark } from '@/sections/Benchmark';
import { Footer } from '@/sections/Footer';
import { Header } from '@/sections/Header';
import { Hero } from '@/sections/Hero';
import { Install } from '@/sections/Install';
import { Observed } from '@/sections/Observed';
import { SyntheticBanner } from '@/sections/SyntheticBanner';

/** Static sections render at once; data sections wait for summary.json. */
export function App() {
  return (
    <>
      <Suspense fallback={null}>
        <SyntheticBanner />
      </Suspense>
      {/* The backdrop sits behind the header and hero, and bleeds into the next section. */}
      <div className="relative isolate">
        <HeroBackdrop />
        <Header />
        <main>
          <Hero />
          <Suspense
            fallback={
              <p className="body-sm mx-auto max-w-6xl px-4 py-16 text-text-faint">
                loading benchmark…
              </p>
            }>
            <DataProvider>
              <Benchmark />
              <Observed />
            </DataProvider>
          </Suspense>
          <Install />
        </main>
      </div>
      <Footer />
    </>
  );
}
