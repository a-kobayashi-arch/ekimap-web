"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Station } from "@/types";

interface SearchBarProps {
  stations: Station[];
}

export default function SearchBar({ stations }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const filtered = query.trim()
    ? stations.filter((s) => s.name.includes(query) || s.nameEn.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="flex items-center gap-2 bg-white border-2 border-blue-400 rounded-full px-4 py-3 shadow-md focus-within:border-blue-600 transition-colors">
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="駅名を検索..."
          className="flex-1 outline-none text-gray-700 bg-transparent placeholder-gray-400"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {filtered.length > 0 && (
        <ul className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => { router.push(`/station/${s.slug}`); setQuery(""); }}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3"
              >
                <span className="text-lg">🚉</span>
                <div>
                  <div className="font-medium text-gray-800">{s.name}</div>
                  <div className="text-sm text-gray-400">{s.lines.map((l) => l.name).join(" / ")}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim() && filtered.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 text-gray-400 text-sm z-10">
          「{query}」に一致する駅は見つかりませんでした
        </div>
      )}
    </div>
  );
}
