"use client";

import { useState, useEffect } from "react";

const EDITIONS = ["Global", "India", "US", "Europe"] as const;

export function EditionSelector() {
    const [edition, setEdition] = useState<(typeof EDITIONS)[number]>("Global");

    useEffect(() => {
        const saved = localStorage.getItem("preferred-edition");
        if (saved && EDITIONS.includes(saved as any)) {
            setEdition(saved as any);
        }
    }, []);

    const handleSelect = (newEdition: (typeof EDITIONS)[number]) => {
        setEdition(newEdition);
        localStorage.setItem("preferred-edition", newEdition);
        // Visual only for now, so no page reload or fetch needed
    };

    return (
        <div className="relative group inline-block">
            <button className="font-sans text-[11px] uppercase tracking-widest font-medium text-[#6B6B6B] hover:text-[#111] flex items-center gap-1 transition-colors">
                Edition: <span className="text-[#111]">{edition}</span>
                <span className="text-[9px]">▼</span>
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-[#FFFFFF] border border-[#D9D9D9] shadow-lg py-1 min-w-[120px]">
                    {EDITIONS.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => handleSelect(opt)}
                            className={`block w-full text-left px-4 py-2 text-[11px] uppercase tracking-widest font-medium hover:bg-[#F7F6F2] ${edition === opt ? "text-[#111]" : "text-[#8A8A8A]"
                                }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
