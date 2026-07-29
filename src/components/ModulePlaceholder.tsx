export function ModulePlaceholder({ moduleName }: { moduleName: string }) {
  return (
    <section>
      <p className="eyebrow">Module placeholder</p>
      <h2>{moduleName}</h2>
      <p>This module is scaffolded for the next implementation phase.</p>
    </section>
  );
}
