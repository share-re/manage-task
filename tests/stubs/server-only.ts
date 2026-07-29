// vitest 用のダミー。本物の "server-only" は Client Component から import された
// ときに投げるためのもので、テスト実行時は素通りさせたい（API ルートを直接
// import して権限ガードを確かめるため）。アプリ側の解決には影響しない。
export {};
