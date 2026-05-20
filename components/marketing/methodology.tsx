import { CalendarClock, Layers, type LucideIcon, ScanSearch } from "lucide-react";
import { copy } from "@/lib/i18n/copy";

const ICONS: Record<string, LucideIcon> = {
	"scan-search": ScanSearch,
	layers: Layers,
	"calendar-clock": CalendarClock,
};

export function Methodology() {
	return (
		<section className="bg-bg px-4 py-20 sm:px-8 md:py-24">
			<div className="mx-auto max-w-5xl">
				<header className="max-w-2xl">
					<h2 className="text-xl font-semibold tracking-tight text-text md:text-2xl">
						{copy.methodology.heading}
					</h2>
					<p className="mt-3 text-base text-text-secondary md:text-lg">
						{copy.methodology.subhead}
					</p>
				</header>

				<div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
					{copy.methodology.columns.map((col) => {
						const Icon = ICONS[col.icon];
						return (
							<div key={col.icon} className="flex flex-col gap-3">
								{Icon && <Icon className="h-6 w-6 text-accent" strokeWidth={1.5} />}
								<h3 className="text-lg font-semibold text-text">{col.heading}</h3>
								<p className="text-base leading-7 text-text-secondary">{col.body}</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
