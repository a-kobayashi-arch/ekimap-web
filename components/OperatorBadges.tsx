import type { Operator } from "@/types";
import { summarizeOperator } from "@/lib/operatorUtils";

interface OperatorBadgesProps {
  operators: Operator[];
}

/**
 * 事業者バッジ一覧（コンパクト表示）
 * - StationCard / 駅詳細ヘッダーで使用
 * - 事業者名 + 路線サマリーを1バッジに凝縮
 */
export default function OperatorBadges({ operators }: OperatorBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {operators.map((op) => {
        const summary = summarizeOperator(op);
        return (
          <span
            key={op.name}
            className="inline-flex items-center gap-1 text-xs font-semibold text-white px-2.5 py-1 rounded-full"
            style={{ backgroundColor: op.color }}
          >
            {op.name}
            {summary && (
              <span className="font-normal opacity-90 border-l border-white/30 pl-1.5 ml-0.5">
                {summary}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
