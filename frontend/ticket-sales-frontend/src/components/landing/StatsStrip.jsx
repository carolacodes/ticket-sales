const stats = [
    { value: "2M+", label: "Tickets Sold" },
    { value: "15K+", label: "Active Events" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" },
];

export function StatsStrip() {
    return (
        <section className="border-y border-white/10 bg-black/20">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
            {stats.map((s) => (
            <div key={s.label} className="text-center">
                <div className="text-2xl font-bold md:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs text-white/50">{s.label}</div>
            </div>
            ))}
        </div>
        </section>
    );
}
