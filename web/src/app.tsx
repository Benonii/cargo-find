import { AgentPanel } from '@/components/agent-panel';
import { BenchmarkPanel } from '@/components/benchmark-panel';
import { SearchPanel } from '@/components/search-panel';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';

export const App = () => (
  <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10">
    <header className="flex flex-col gap-2">
      <h1 className="font-mono text-2xl font-semibold">cargo-find</h1>
      <p className="text-base">
        Find the right Cargo action for a GTM job, in plain English. Built for coding agents, try it here first.
      </p>
      <p className="text-xs text-muted-foreground">
        Unofficial and open source, built on the Cargo CLI catalog: connector actions, extractors, native workflow
        steps and preset tools. Exact names always rank first.
      </p>
    </header>
    <Tabs defaultValue="search">
      <TabsList>
        <TabsTab value="search">Search</TabsTab>
        <TabsTab value="agents">For agents</TabsTab>
        <TabsTab value="benchmark">Benchmark</TabsTab>
      </TabsList>
      <TabsPanel value="search" className="pt-4">
        <SearchPanel />
      </TabsPanel>
      <TabsPanel value="agents" className="pt-4">
        <AgentPanel />
      </TabsPanel>
      <TabsPanel value="benchmark" className="pt-4">
        <BenchmarkPanel />
      </TabsPanel>
    </Tabs>
    <footer className="mt-auto border-t pt-4 text-xs text-muted-foreground">
      Ranking order: exact name, then actions of an integration you name, then keywords, then similar meaning. Not
      affiliated with Cargo.
    </footer>
  </div>
);
