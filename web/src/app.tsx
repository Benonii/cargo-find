import type { ReactNode } from 'react';
import { BenchmarkPanel } from '@/components/benchmark-panel';
import { TrySection } from '@/components/plan-panel';
import { SearchPanel } from '@/components/search-panel';

const repositoryUrl = 'https://github.com/Benonii/cargo-find';
const packageUrl = 'https://www.npmjs.com/package/cargo-find';

const SectionHeading = ({ title, detail }: { title: string; detail: string }) => (
  <div className="flex flex-col items-center gap-1 text-center">
    <h2 className="text-2xl font-semibold tracking-tight text-ink">{title}</h2>
    <p className="max-w-lg text-[14px] text-ink-2">{detail}</p>
  </div>
);

const Section = ({ children, id }: { children: ReactNode; id: string }) => (
  <section id={id} className="flex min-w-0 scroll-mt-6 flex-col gap-6">
    {children}
  </section>
);

export const App = () => (
  <div className="min-h-screen overflow-x-clip">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 pt-6 pb-12 sm:px-6">
      <nav className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-mono text-[15px] font-medium text-ink">
          <span aria-hidden className="size-2.5 bg-brand" />
          cargo-find
        </span>
        <span className="flex items-center gap-4 text-[13px] text-ink-2">
          <a href="#benchmark" className="hidden hover:text-ink sm:inline">
            Benchmark
          </a>
          <a href="#search" className="hidden hover:text-ink sm:inline">
            Search
          </a>
          <a href={repositoryUrl} className="hover:text-ink">
            GitHub
          </a>
          <a href={packageUrl} className="hover:text-ink">
            npm
          </a>
        </span>
      </nav>

      <Section id="try">
        <div className="pt-6 sm:pt-12">
          <TrySection />
        </div>
      </Section>

      <Section id="benchmark">
        <SectionHeading
          title="It finds the right tool"
          detail="We asked both searches for the same go-to-market jobs in plain English and checked whether a correct Cargo tool came back."
        />
        <BenchmarkPanel />
      </Section>

      <Section id="search">
        <SectionHeading
          title="Search it yourself"
          detail="Type a job or a tool name. Exact names rank first, then the integration you name, then meaning."
        />
        <SearchPanel />
      </Section>

      <footer className="flex flex-col gap-1 border-t border-line pt-5 text-[12.5px] text-ink-3 sm:flex-row sm:justify-between">
        <span>Open source, MIT. Runs on Cargo.</span>
        <span>Unofficial, not affiliated with Cargo.</span>
      </footer>
    </div>
  </div>
);
