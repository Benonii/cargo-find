import { serviceOrigin } from '@/api';
import { CodeBlock } from '@/components/code-block';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';

const agentPrompt = (mcpUrl: string) => `You are working with Cargo (getcargo.ai), the GTM platform driven by the cargo-ai CLI.
Before you write any integration code for a GTM job, find the Cargo action that already does it:
1. Call the find_action tool on the cargo-find MCP server (${mcpUrl}) with the job in plain English.
2. Call get_action on the best result to read every input field and the credit price.
3. Run the result's cargo-ai command with --dry-run first. It is free and checks your inputs.
4. Only run it for real, on 1 to 3 records, after the dry run passes. Report credits spent.
If find_action returns nothing relevant, say so before writing custom code.`;

export const AgentPanel = () => {
  const origin = serviceOrigin();
  const mcpUrl = `${origin}/mcp`;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Use it from your agent</h2>
      <p className="text-sm text-muted-foreground">
        Same search, as an MCP server with two tools: find_action and get_action. No sign-in, no API key.
      </p>
      <Tabs defaultValue="claude">
        <TabsList className="flex-wrap">
          <TabsTab value="claude">Claude Code</TabsTab>
          <TabsTab value="cursor">Cursor</TabsTab>
          <TabsTab value="prompt">Prompt</TabsTab>
          <TabsTab value="api">HTTP</TabsTab>
          <TabsTab value="cli">CLI</TabsTab>
        </TabsList>
        <TabsPanel value="claude" className="flex flex-col gap-2">
          <CodeBlock code={`claude mcp add --transport http cargo-find ${mcpUrl}`} />
        </TabsPanel>
        <TabsPanel value="cursor" className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Add to .cursor/mcp.json</p>
          <CodeBlock code={JSON.stringify({ mcpServers: { 'cargo-find': { url: mcpUrl } } }, null, 2)} />
        </TabsPanel>
        <TabsPanel value="prompt" className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Paste into your agent's instructions or AGENTS.md.</p>
          <CodeBlock code={agentPrompt(mcpUrl)} label="Copy prompt" />
        </TabsPanel>
        <TabsPanel value="api" className="flex flex-col gap-2">
          <CodeBlock code={`curl "${origin}/api/search?q=sync+accounts+to+hubspot&limit=3"`} />
          <CodeBlock code={`curl "${origin}/api/actions/hubspot.upsertRecords"`} />
        </TabsPanel>
        <TabsPanel value="cli" className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Works offline: the index ships inside the package.</p>
          <CodeBlock code={'npx cargo-find "sync accounts to hubspot"\nnpx cargo-find mcp'} />
        </TabsPanel>
      </Tabs>
    </section>
  );
};
