import { getAllStations } from "@/lib/stations";
import SearchBar from "@/components/SearchBar";
import StationCard from "@/components/StationCard";

export default function HomePage() {
  const stations = getAllStations();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3 pt-4">
        <h1 className="text-3xl font-bold text-gray-800">駅ナカマップ</h1>
        <p className="text-gray-500 text-sm">駅の施設をチェックインしてスタンプを集めよう</p>
      </div>

      {/* Search */}
      <SearchBar stations={stations} />

      {/* Station list */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          駅を選ぶ
        </h2>
        <div className="flex flex-col gap-4">
          {stations.map((station) => (
            <StationCard key={station.id} station={station} />
          ))}
        </div>
      </section>
    </div>
  );
}
