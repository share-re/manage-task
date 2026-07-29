/**
 * 管理API（`/api/admin/users`）の「やらせない」判断。
 *
 * ルートの中に直書きされていて、走らせるには本物の管理者トークンと Supabase が
 * 要る＝テストできない形だった。判断だけを純関数に出す。
 * 呼ぶ側（ルート）が DB から材料（管理者の人数など）を取り、ここは決めるだけ。
 *
 * どれも「UIでボタンを隠す」ではなくサーバで止めることが要件（原則4）。
 */

/** 拒否するなら理由、許すなら null。 */
export type Denial = string | null;

/**
 * 自分自身への降格・無効化。
 *
 * どちらも内側から鍵を掛ける操作で、誤って実行した本人には戻せない。
 * 表示名の変更は自分でもできる（鍵にならないため）。
 */
export function denySelfLockout(input: {
  actorId: string;
  targetId: string;
  role?: unknown;
  banned?: unknown;
}): Denial {
  if (input.targetId !== input.actorId) return null;
  if (input.banned === true) return "自分のアカウントは無効化できません。";
  if (input.role === "admin" || input.role === "general")
    return "自分のロールは変更できません。ほかの管理者に依頼してください。";
  return null;
}

/** その操作が「管理者を減らす」ものか（降格 or 無効化）。 */
export function isDemotion(input: { role?: unknown; banned?: unknown }): boolean {
  return input.role === "general" || input.banned === true;
}

/**
 * 最後の管理者を降ろさせない。
 *
 * 全員が general になると、誰もロールを戻せずチーム全体が締め出される。
 * adminIds は DB から取った現在の管理者一覧。
 */
export function denyLastAdminChange(input: {
  targetId: string;
  adminIds: string[];
  action: "demote" | "delete";
}): Denial {
  const targetIsAdmin = input.adminIds.includes(input.targetId);
  if (!targetIsAdmin || input.adminIds.length > 1) return null;
  return input.action === "delete"
    ? "最後の管理者は削除できません。"
    : "最後の管理者は降格・無効化できません。";
}

/**
 * 管理者が触ってよい表示名か。
 *
 * 本人が自分で名乗ったあとは本人のもの。管理者が直せるのは、空のままか、
 * 管理者自身が入れた仮の名前だけ。
 */
export function canAdminEditName(target: {
  name?: string | null;
  /** その名前を管理者が仮に入れたか（profiles / user_metadata の印） */
  provisional?: boolean;
}): Denial {
  const has = typeof target.name === "string" && target.name.trim() !== "";
  if (!has) return null;
  if (target.provisional) return null;
  return "本人が設定した表示名は変更できません。";
}
