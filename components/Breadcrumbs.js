import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items }) {
    // Schema.org Structured Data
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.label,
            "item": item.href ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ecalc.ro'}${item.href}` : undefined
        }))
    };

    return (
        <nav aria-label="Breadcrumb" className="flex justify-end">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <ol className="flex items-center space-x-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <li>
                    <Link href="/" className="hover:text-blue-600 flex items-center transition-colors">
                        <Home className="h-3 w-3" />
                        <span className="sr-only">Acasa</span>
                    </Link>
                </li>

                {items.map((item, index) => (
                    <li key={index} className="flex items-center">
                        <ChevronRight className="h-3 w-3 mx-1 text-slate-400" />
                        {item.href ? (
                            <Link
                                href={item.href}
                                className={`hover:text-blue-600 transition-colors ${item.className || ''}`}
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className={`font-medium text-slate-700 ${item.className || ''}`}>
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
