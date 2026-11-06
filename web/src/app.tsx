import { AgentPanel } from '@/components/agent-panel';
import { BenchmarkPanel } from '@/components/benchmark-panel';
import { PlanPanel } from '@/components/plan-panel';
import { SearchPanel } from '@/components/search-panel';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';

export const App = () => (
  <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-10">
    <header className="flex flex-col gap-2">
      <h1 className="font-mono text-2xl font-semibold">cargo-find</h1>
      <p className="text-base">
        Tell an agent what you want done in Cargo. cargo-find gives it the exact actions, so it builds a
        workflow that runs instead of guessing.
      </p>
      <p className="text-xs text-muted-foreground">
        Unofficial and open source, built on the Cargo CLI catalog: connector actions, extractors, native
        workflow steps and preset tools. Exact names always rank first.
      </p>
    </header>
    <Tabs defaultValue="plan">
      <TabsList className="max-w-full overflow-x-auto">
        <TabsTab value="plan">Try it</TabsTab>
        <TabsTab value="search">Search</TabsTab>
        <TabsTab value="agents">MCP</TabsTab>
        <TabsTab value="benchmark">Benchmark</TabsTab>
      </TabsList>
      <TabsPanel value="plan" className="pt-4">
        <PlanPanel />
      </TabsPanel>
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
      Ranking order: exact name, then actions of an integration you name, then keywords, then similar meaning.
      Not affiliated with Cargo.
    </footer>
  </div>
);
