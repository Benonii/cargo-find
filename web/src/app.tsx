import type { ReactNode } from 'react';
import { AgentPanel } from '@/components/agent-panel';
import { BenchmarkPanel } from '@/components/benchmark-panel';
import { PlanPanel } from '@/components/plan-panel';
import { SearchPanel } from '@/components/search-panel';

const repositoryUrl = 'https://github.com/Benonii/cargo-find';
const packageUrl = 'https://www.npmjs.com/package/cargo-find';

const SectionHeading = ({ title, detail }: { title: string; detail: string }) => (
  <div className="flex flex-col gap-1">
    <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
    <p className="text-[14px] text-ink-2">{detail}</p>
  </div>
);

const Section = ({ children, id }: { children: ReactNode; id: string }) => (
  <section id={id} className="flex min-w-0 scroll-mt-6 flex-col gap-4">
    {children}
  </section>
);

export const App = () => (
  <div className="relative min-h-screen overflow-x-clip">
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
      style={{ background: 'radial-gradient(60% 100% at 50% 0%, var(--brand-glow), transparent 70%)' }}
    />
    <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-14 px-4 pt-6 pb-12 sm:px-6">
      <nav className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-mono text-[15px] font-medium text-ink">
          <span aria-hidden className="size-2.5 rounded-full bg-brand" />
          cargo-find
        </span>
        <span className="flex items-center gap-4 text-[13px] text-ink-2">
          <a href="#benchmark" className="hidden hover:text-ink sm:inline">
            Benchmark
          </a>
          <a href="#connect" className="hidden hover:text-ink sm:inline">
            MCP
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
        <div className="flex flex-col gap-3 pt-4 sm:pt-10">
          <h1 className="max-w-3xl text-4xl leading-[1.1] font-semibold tracking-tight text-ink sm:text-5xl">
            Give your agent the exact <span className="text-green">Cargo</span> actions.
          </h1>
          <p className="max-w-2xl text-[16px] text-ink-2">
            cargo-find searches all 809 Cargo actions, extractors and tools in plain English. Connect it over MCP and
            the workflows your agent plans actually run. Try it: Cargo's own AI plans your goal twice, with and without
            it.
          </p>
        </div>
        <PlanPanel />
      </Section>

      <Section id="benchmark">
        <SectionHeading
          title="Finds the right action"
          detail="Plain-English questions, scored against Cargo's own action search."
        />
        <BenchmarkPanel />
      </Section>

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-8">
        <Section id="search">
          <SectionHeading title="Search it yourself" detail="Exact names rank first, then the integration you name." />
          <SearchPanel />
        </Section>
        <Section id="connect">
          <SectionHeading
            title="Connect your agent"
            detail="An MCP server with find_action and get_action. No sign-in, no key."
          />
          <AgentPanel />
        </Section>
      </div>

      <footer className="flex flex-col gap-1 border-t border-line pt-5 text-[12.5px] text-ink-3 sm:flex-row sm:justify-between">
        <span>Open source, MIT. Hosted on Cargo.</span>
        <span>Unofficial, not affiliated with Cargo.</span>
      </footer>
    </div>
  </div>
);
