/**
 * 匿名ユーザーID管理
 * - 初回アクセス時に crypto.randomUUID() で UUID を生成
 * - localStorage の "ekimap_user_id" キーに保存して永続化
 * - 個人情報は一切収集しない（UUIDのみ）
 */
export function getUserId(): string {
  if (typeof window === "undefined") return "";
  const KEY = "ekimap_user_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    try {
      localStorage.setItem(KEY, id);
    } catch {
      // localStorage が使えない環境（プライベートブラウジング等）ではセッション限定
    }
  }
  return id;
}
