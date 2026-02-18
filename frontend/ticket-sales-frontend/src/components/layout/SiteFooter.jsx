import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
    return (
        <footer className="border-t border-white/10 bg-black/30">
        <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2 text-white/80">
                <div className="h-6 w-6 rounded-md bg-violet-600/20 ring-1 ring-violet-500/30" />
                <span className="font-semibold">EVENTSAAS</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
                <a href="#" className="hover:text-white">Privacy Policy</a>
                <a href="#" className="hover:text-white">Terms of Service</a>
                <a href="#" className="hover:text-white">Contact Support</a>
            </div>

            <div className="flex items-center gap-3 text-white/50">
                <div className="h-9 w-9 rounded-full bg-white/5" />
                <div className="h-9 w-9 rounded-full bg-white/5" />
                <div className="h-9 w-9 rounded-full bg-white/5" />
            </div>
            </div>

            <Separator className="my-8 bg-white/10" />

            <p className="text-center text-xs text-white/40">
            © {new Date().getFullYear()} EventSaaS. All rights reserved.
            </p>
        </div>
        </footer>
    );
}
