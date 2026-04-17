import Link from "next/link";
import type { Station } from "@/types";
import OperatorBadges from "./OperatorBadges";

interface StationCardProps {
  station: Station;
}

export default function StationCard({ station }: StationCardProps) {
  return (
    <Link href={`/station/${station.slug}`} className="block">
      <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-100 hover:border-blue-200">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-800">{station.name}</h2>
              {station.brand && station.brandColor && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${station.brandColor}22`,
                    color: station.brandColor,
                  }}
                >
                  {station.brand.toUpperCase()}
                </span>
              )}
            </div>
            {station.building && (
              <p className="text-sm text-gray-500 mt-0.5">{station.building}</p>
            )}
          </div>
          <span className="text-3xl">🚉</span>
        </div>

        {/* 路線 / 事業者バッジ */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {station.operators ? (
            <OperatorBadges operators={station.operators} />
          ) : (
            station.lines.map((line) => (
              <span
                key={line.name}
                className="text-xs font-semibold text-white px-2.5 py-1 rounded-full"
                style={{ backgroundColor: line.color }}
              >
                {line.name}
              </span>
            ))
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{station.facilities.length}件の施設</span>
          <span className="text-blue-500 font-medium">詳細を見る →</span>
        </div>
      </div>
    </Link>
  );
}
