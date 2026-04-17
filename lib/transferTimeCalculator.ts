/**
 * 乗り換え時間計算エンジン
 *
 * 計算式:
 *   水平移動時間 = distanceMeters / walkingSpeed
 *   階段時間     = floorsToClimb × stairSecondsPerFloor
 *   合計         = 水平 + 階段 + crowdLoss + buildingWalkExtra
 *
 * 注意: distanceFromExit 等の入力値は現地未測定の推定値です。
 *       実際の駅構内図に基づく補正を推奨します。
 */

interface StationParams {
  walkingSpeed: number;          // m/秒（駅内歩行速度）
  stairSecondsPerFloor: number;  // 1フロア分の階段昇降秒数
  crowdLoss: number;             // 秒（混雑・立ち止まりロス）
  buildingWalkExtra: number;     // 秒（ドア通過・エレベーター待ち等）
}

const STATION_PARAMS: Record<string, StationParams> = {
  // ecute大宮: 改札・店舗とも2F同フロア直結のため固定オーバーヘッドを抑制
  // crowdLoss=30s（通常の半分）+ buildingWalkExtra=15s = 計45s固定
  // → dist≤58m: 1分 / dist≥60m: 2分 の分岐が実現
  omiya: {
    walkingSpeed: 1.3,
    stairSecondsPerFloor: 40,
    crowdLoss: 30,
    buildingWalkExtra: 15,
  },
  default: {
    walkingSpeed: 1.3,
    stairSecondsPerFloor: 40,
    crowdLoss: 60,
    buildingWalkExtra: 30,
  },
};

export interface TransferTimeResult {
  minutes: number;
  range: string;
  breakdown: {
    horizontal: number;
    stairs: number;
    extra: number;
    crowd: number;
    totalSeconds: number;
  };
}

/**
 * 改札から施設までの乗り換え時間を計算する
 * @param distanceMeters  改札〜施設の水平距離（メートル）
 * @param floorsToClimb   上がる階数（0 = 同一フロア, 1 = 1フロア上）
 * @param stationId       駅ID（パラメータ選択用）
 */
export function calculateTransferTime(
  distanceMeters: number,
  floorsToClimb: number = 0,
  stationId: string = "default"
): TransferTimeResult {
  const p = STATION_PARAMS[stationId] ?? STATION_PARAMS.default;

  const horizontal = distanceMeters / p.walkingSpeed;
  const stairs = floorsToClimb * p.stairSecondsPerFloor;
  const extra = p.buildingWalkExtra;
  const crowd = p.crowdLoss;
  const totalSeconds = horizontal + stairs + extra + crowd;
  const minutes = Math.round(totalSeconds / 60);

  const minRange = Math.max(minutes - 1, 1);
  const maxRange = minutes + 1;

  return {
    minutes,
    range: `${minRange}〜${maxRange}分`,
    breakdown: {
      horizontal: Math.round(horizontal),
      stairs: Math.round(stairs),
      extra,
      crowd,
      totalSeconds: Math.round(totalSeconds),
    },
  };
}

/**
 * Facility の nearestExit / distanceFromExit / floorsToClimb から時間を計算するヘルパー
 */
export function calcFacilityTransferTime(
  distanceFromExit: number | undefined,
  floorsToClimb: number | undefined,
  stationId: string
): TransferTimeResult | null {
  if (distanceFromExit === undefined) return null;
  return calculateTransferTime(distanceFromExit, floorsToClimb ?? 0, stationId);
}
