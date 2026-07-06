import { createClient } from "@supabase/supabase-js";

// ============================================================
// Supabase への接続クライアント。
// ------------------------------------------------------------
// 接続に必要な2つの情報（URL と anon キー）は、
// リポジトリ直下の .env.local ファイルから読み込む。
//   - .env.local は .gitignore で除外済み（GitHubには上がらない＝秘密が守られる）
//   - NEXT_PUBLIC_ で始まる名前にすると、ブラウザ側からも読めるようになる
//
// 使うときは:  import { supabase } from "@/lib/supabaseClient";
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
