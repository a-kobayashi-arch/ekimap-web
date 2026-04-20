import { notFound } from "next/navigation";
import Link from "next/link";
import { getStationBySlug, getAllStations } from "@/lib/stations";
import FacilityTabs from "@/components/FacilityTabs";
import OperatorBadges from "@/components/OperatorBadges";
import OperatorSection from "@/components/OperatorSection";
import StationCheckinButton from "@/components/StationCheckinButton";

export function generateStaticParams() {
  return getAllStations().map((s) => ({ slug: s.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StationPage({ params }: Props) {
  const { slug } = await params;
  const station = getStationBySlug(slug);
  if (!station) notFound();

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        ← 駅一覧へ
      </Link>

      {/* Station header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-800">{station.name}</h1>
              {station.brand && station.brandColor && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
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
          <span className="text-4xl">🚉</span>
        </div>

        {/* 路線 / 事業者バッジ */}
        <div className="flex flex-wrap gap-1.5 mt-3">
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

        <p className="text-sm text-gray-400 mt-2">
          乗換駅 • {station.facilities.length}件の施設
        </p>
      </div>

      {/* 駅チェックインボタン（層1：駅スタンプ） */}
      <StationCheckinButton stationSlug={station.slug} stationName={station.name} />

      {/* 路線・事業者セクション（operators が定義された駅のみ） */}
      {station.operators && station.operators.length > 0 && (
        <OperatorSection operators={station.operators} />
      )}

      {/* Facilities */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-3">施設一覧</h2>
        <FacilityTabs
          facilities={station.facilities}
          stationId={station.id}
          exits={station.exits}
          buildings={station.buildings}
        />
      </section>
    </div>
  );
}
