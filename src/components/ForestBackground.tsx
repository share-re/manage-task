"use client";

import { useSkyPhase, type SkyPhase } from "@/lib/skyPhase";

/**
 * 植林（/forest）トーンの装飾背景。
 * 空・太陽（夜は月）・雲・鳥・丘・草・茂み・木・蝶・星で構成する。
 * 進捗カード（SkyHero）と同じ時間帯（朝／昼／夕方／夜）で色が変わる。
 * 装飾なので操作対象から外す（aria-hidden / pointer-events-none）。
 *
 * 使い方: 親要素に `relative` を付けて、その中に置く。
 */

type ForestPalette = {
  skyFrom: string; // 空の上部
  skyMid: string; // 空の中ほど
  skyTo: string; // 空の下部（丘に溶ける色）
  orb: string; // 太陽／月の本体（radial-gradient）
  orbGlow: string; // 太陽／月のまわりの光
  cloud: string; // 雲
  hillFarFrom: string;
  hillFarTo: string;
  hillNearFrom: string;
  hillNearTo: string;
  grass: string; // 最下部の縦じま
  bush: string; // 茂み
  leaf: string; // 木の葉
  trunk: string; // 木の幹
  bird: [string, string, string]; // 鳥3羽の色（手前→奥）
  stars: boolean; // 星を出すか（夜だけ）
};

// 時間帯ごとの色。SkyHero の SKY と同じ考え方で、落ち着いたトーンに揃える。
const PALETTE: Record<SkyPhase, ForestPalette> = {
  dawn: {
    skyFrom: "#FBE3C6",
    skyMid: "#F6EDDF",
    skyTo: "#E6F0FB",
    orb: "radial-gradient(circle at 40% 40%, #FFF3DC, #F7C57C 70%, #EFA95F)",
    orbGlow: "0 0 60px 20px rgba(247, 197, 124, 0.35)",
    cloud: "rgba(255,255,255,0.85)",
    hillFarFrom: "#D9E8C4",
    hillFarTo: "#BBD79C",
    hillNearFrom: "#BBD79C",
    hillNearTo: "#9BC177",
    grass: "rgba(90,120,50,0.35)",
    bush: "rgba(126,168,80,0.9)",
    leaf: "#6F9C42",
    trunk: "#8B5E34",
    bird: ["#5b5b63", "#6e6e77", "#84848d"],
    stars: false,
  },
  day: {
    skyFrom: "#bae6fd",
    skyMid: "#e0f2fe",
    skyTo: "#bbf7d0",
    orb: "radial-gradient(circle at 40% 40%, #fef9c3, #fde047 70%, #facc15)",
    orbGlow: "0 0 60px 20px rgba(250, 204, 21, 0.35)",
    cloud: "rgba(255,255,255,0.85)",
    hillFarFrom: "#bbf7d0",
    hillFarTo: "#86efac",
    hillNearFrom: "#86efac",
    hillNearTo: "#4ade80",
    grass: "rgba(21,128,61,0.35)",
    bush: "rgba(34,197,94,0.9)",
    leaf: "#16a34a",
    trunk: "#92400e",
    bird: ["#3f3f46", "#52525b", "#71717a"],
    stars: false,
  },
  dusk: {
    skyFrom: "#F3CDA9",
    skyMid: "#E4C6C6",
    skyTo: "#D6C4E4",
    orb: "radial-gradient(circle at 40% 40%, #FDD9A6, #F09E57 70%, #DE7B3C)",
    orbGlow: "0 0 70px 24px rgba(240, 158, 87, 0.4)",
    cloud: "rgba(255,240,235,0.75)",
    hillFarFrom: "#B7C79B",
    hillFarTo: "#8DA478",
    hillNearFrom: "#8DA478",
    hillNearTo: "#657C55",
    grass: "rgba(45,70,35,0.4)",
    bush: "rgba(96,126,72,0.9)",
    leaf: "#4E7038",
    trunk: "#6B4526",
    bird: ["#3a3a45", "#4a4a55", "#5c5c68"],
    stars: false,
  },
  night: {
    skyFrom: "#2A375D",
    skyMid: "#33436F",
    skyTo: "#3D5A55",
    orb: "radial-gradient(circle at 40% 40%, #FFFFFF, #E9EDF7 70%, #C9D2E6)",
    orbGlow: "0 0 50px 16px rgba(233, 237, 247, 0.28)",
    cloud: "rgba(190,200,225,0.28)",
    hillFarFrom: "#2F4A44",
    hillFarTo: "#243A36",
    hillNearFrom: "#243A36",
    hillNearTo: "#1A2B29",
    grass: "rgba(10,25,20,0.45)",
    bush: "rgba(35,70,60,0.9)",
    leaf: "#2C5245",
    trunk: "#3B2A1E",
    bird: ["#1f2433", "#262c3d", "#2d3446"],
    stars: true,
  },
};

// 星の位置（夜のみ）。毎回ランダムだとサーバーとブラウザで描画がズレるので固定値にする。
const STARS = [
  { top: "6%", left: "12%", size: 2, dur: 3.1, delay: 0 },
  { top: "11%", left: "31%", size: 3, dur: 4.2, delay: 0.6 },
  { top: "4%", left: "52%", size: 2, dur: 3.6, delay: 1.2 },
  { top: "16%", left: "63%", size: 2, dur: 4.8, delay: 0.3 },
  { top: "8%", left: "78%", size: 3, dur: 3.3, delay: 1.8 },
  { top: "20%", left: "18%", size: 2, dur: 5.1, delay: 2.1 },
  { top: "23%", left: "45%", size: 2, dur: 3.9, delay: 0.9 },
  { top: "14%", left: "88%", size: 2, dur: 4.5, delay: 1.5 },
  { top: "27%", left: "70%", size: 2, dur: 3.4, delay: 2.4 },
  { top: "19%", left: "5%", size: 3, dur: 4.1, delay: 1.1 },
  { top: "30%", left: "36%", size: 2, dur: 4.7, delay: 0.4 },
  { top: "25%", left: "94%", size: 2, dur: 3.8, delay: 1.9 },
];

export default function ForestBackground() {
  const phase = useSkyPhase();
  const p = PALETTE[phase];
  const isNight = phase === "night";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ transition: "background 1.5s ease" }}
    >
      {/* アニメーション定義：雲の漂い・木の揺れ・鳥の飛行/上下/羽ばたき・蝶のひらひら/羽ばたき・星のまたたき。
          端末が「動きを減らす」設定なら .anim のアニメを止める（体調・酔い対策）。 */}
      <style>{`
        @keyframes floatCloud { 0%,100% { transform: translateX(0); } 50% { transform: translateX(24px); } }
        @keyframes sway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
        @keyframes flyAcross { 0% { transform: translate(-10vw,0); } 100% { transform: translate(110vw,0); } }
        @keyframes flyAcross2 { 0% { transform: translate(110vw,0) scaleX(-1); } 100% { transform: translate(-10vw,0) scaleX(-1); } }
        @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes flap { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(.4); } }
        @keyframes flutter { 0% { transform: translate(0,0) rotate(0deg); } 25% { transform: translate(30px,-24px) rotate(8deg); } 50% { transform: translate(64px,6px) rotate(-6deg); } 75% { transform: translate(30px,26px) rotate(6deg); } 100% { transform: translate(0,0) rotate(0deg); } }
        @keyframes flutter2 { 0% { transform: translate(0,0) rotate(0deg); } 33% { transform: translate(-40px,20px) rotate(-8deg); } 66% { transform: translate(-70px,-18px) rotate(8deg); } 100% { transform: translate(0,0) rotate(0deg); } }
        @keyframes wingL { 0%,100% { transform: rotateY(0deg); } 50% { transform: rotateY(70deg); } }
        @keyframes wingR { 0%,100% { transform: rotateY(0deg); } 50% { transform: rotateY(-70deg); } }
        @keyframes twinkle { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .anim { animation: none !important; } }
      `}</style>

      {/* 空のグラデーション（上=空 → 下=地面の色に溶ける） */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${p.skyFrom}, ${p.skyMid} 50%, ${p.skyTo})`,
          transition: "background 1.5s ease",
        }}
      />

      {/* 星（夜だけ。ゆっくりまたたく） */}
      {p.stars &&
        STARS.map((s, i) => (
          <div
            key={`star-${i}`}
            className="anim absolute rounded-full bg-white"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animation: `twinkle ${s.dur}s ease-in-out infinite ${s.delay}s`,
            }}
          />
        ))}

      {/* 太陽（夜は月）。右上でぼんやり光る */}
      <div
        className="absolute h-24 w-24 rounded-full"
        style={{
          top: "6%",
          right: "6%",
          background: p.orb,
          boxShadow: p.orbGlow,
          transition: "background 1.5s ease, box-shadow 1.5s ease",
        }}
      />

      {/* 雲（ゆっくり左右に漂う） */}
      {[
        { top: "9%", left: "9%", w: 112, h: 36, dur: 13, delay: 0 },
        { top: "17%", left: "26%", w: 80, h: 28, dur: 17, delay: 2 },
        { top: "7%", left: "44%", w: 96, h: 30, dur: 15, delay: 1 },
        { top: "13%", left: "72%", w: 88, h: 30, dur: 19, delay: 3 },
      ].map((c, i) => (
        <div
          key={i}
          className="anim absolute rounded-full blur-[1px]"
          style={{
            top: c.top,
            left: c.left,
            width: c.w,
            height: c.h,
            background: p.cloud,
            animation: `floatCloud ${c.dur}s ease-in-out infinite ${c.delay}s`,
            transition: "background 1.5s ease",
          }}
        />
      ))}

      {/* 鳥（画面を横切る。上下に揺れつつ羽ばたく。rtl=trueは右→左）。夜は寝ているので出さない。 */}
      {!isNight &&
        [
          { top: 120, size: 34, dur: 26, delay: 0, bob: 3, flap: 0.5, rtl: false },
          { top: 180, size: 26, dur: 34, delay: 4, bob: 3.6, flap: 0.6, rtl: false },
          { top: 220, size: 22, dur: 40, delay: 8, bob: 4, flap: 0.55, rtl: true },
        ].map((b, i) => (
          <div
            key={i}
            className="anim absolute"
            style={{
              top: b.top,
              left: b.rtl ? undefined : 0,
              right: b.rtl ? 0 : undefined,
              animation: `${b.rtl ? "flyAcross2" : "flyAcross"} ${b.dur}s linear infinite ${b.delay}s`,
            }}
          >
            <div className="anim" style={{ animation: `bob ${b.bob}s ease-in-out infinite` }}>
              <svg
                viewBox="0 0 40 20"
                width={b.size}
                height={b.size / 2}
                style={{ color: p.bird[i] }}
              >
                <path
                  d="M2 12 Q10 2 20 12 Q30 2 38 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  className="anim"
                  style={{ transformOrigin: "center", animation: `flap ${b.flap}s ease-in-out infinite` }}
                />
              </svg>
            </div>
          </div>
        ))}

      {/* 奥の丘（薄い緑・高め）：奥行きを出しつつ、空の余白を減らす */}
      <div
        className="absolute inset-x-0 bottom-0 h-[34vh]"
        style={{
          background: `linear-gradient(180deg, ${p.hillFarFrom}, ${p.hillFarTo})`,
          borderRadius: "50% 50% 0 0 / 90px 90px 0 0",
          transition: "background 1.5s ease",
        }}
      />
      {/* 手前の丘（濃い緑・全幅） */}
      <div
        className="absolute inset-x-0 bottom-0 h-[26vh]"
        style={{
          background: `linear-gradient(180deg, ${p.hillNearFrom}, ${p.hillNearTo})`,
          borderRadius: "50% 50% 0 0 / 56px 56px 0 0",
          transition: "background 1.5s ease",
        }}
      />

      {/* 草の質感（最下部の細い縦じま） */}
      <div
        className="absolute inset-x-0 bottom-0 h-12"
        style={{
          background: `repeating-linear-gradient(90deg, transparent 0 14px, ${p.grass} 14px 16px)`,
          transition: "background 1.5s ease",
        }}
      />

      {/* 茂み（丘の裾を埋める小さな緑のかたまり） */}
      {[
        { left: "3%", w: 72, h: 38 },
        { left: "12%", w: 54, h: 30 },
        { left: "21%", w: 84, h: 42 },
        { left: "31%", w: 58, h: 32 },
        { left: "64%", w: 64, h: 34 },
        { left: "72%", w: 90, h: 44 },
        { left: "81%", w: 56, h: 30 },
        { left: "89%", w: 76, h: 40 },
        { left: "96%", w: 60, h: 32 },
      ].map((b, i) => (
        <div
          key={`bush-${i}`}
          className="absolute rounded-[50%]"
          style={{
            bottom: "20vh",
            left: b.left,
            width: b.w,
            height: b.h,
            background: p.bush,
            transition: "background 1.5s ease",
          }}
        />
      ))}

      {/* 木（大きめ＆多め。左右の空きをしっかり埋める。葉がゆっくり揺れる） */}
      {[
        { bottom: "22vh", left: "1%", leaf: 92, trunk: 42 },
        { bottom: "18vh", left: "8%", leaf: 66, trunk: 30 },
        { bottom: "24vh", left: "15%", leaf: 118, trunk: 50 },
        { bottom: "17vh", left: "23%", leaf: 58, trunk: 26 },
        { bottom: "24vh", left: "74%", leaf: 112, trunk: 48 },
        { bottom: "18vh", left: "83%", leaf: 70, trunk: 32 },
        { bottom: "22vh", left: "90%", leaf: 96, trunk: 42 },
        { bottom: "17vh", left: "96%", leaf: 56, trunk: 24 },
      ].map((t, i) => (
        <div
          key={`tree-${i}`}
          className="absolute flex flex-col items-center"
          style={{ bottom: t.bottom, left: t.left }}
        >
          <div
            className="anim rounded-full"
            style={{
              width: t.leaf,
              height: t.leaf,
              background: p.leaf,
              transformOrigin: "bottom center",
              animation: `sway ${4 + (i % 4)}s ease-in-out infinite`,
              transition: "background 1.5s ease",
            }}
          />
          <div
            className="-mt-1 rounded-sm"
            style={{
              width: Math.max(8, Math.round(t.leaf / 8)),
              height: t.trunk,
              background: p.trunk,
              transition: "background 1.5s ease",
            }}
          />
        </div>
      ))}

      {/* 蝶（丘のあたりをひらひら。左右の羽が羽ばたく）。夜は出さない。 */}
      {!isNight &&
        [
          { bottom: 160, left: "18%", right: undefined, dur: 9, delay: 0, w: 12, h: 16, wing: 0.35, from: "#fb923c", to: "#f97316", flut: "flutter" },
          { bottom: 200, left: undefined, right: "26%", dur: 11, delay: 0, w: 11, h: 15, wing: 0.4, from: "#a3e635", to: "#65a30d", flut: "flutter2" },
          { bottom: 130, left: "52%", right: undefined, dur: 13, delay: 2, w: 10, h: 13, wing: 0.3, from: "#fcd34d", to: "#f59e0b", flut: "flutter" },
        ].map((bf, i) => (
          <div
            key={i}
            className="anim absolute"
            style={{
              bottom: bf.bottom,
              left: bf.left,
              right: bf.right,
              animation: `${bf.flut} ${bf.dur}s ease-in-out infinite ${bf.delay}s`,
            }}
          >
            <div className="flex" style={{ perspective: 120 }}>
              <div
                className="anim"
                style={{
                  width: bf.w,
                  height: bf.h,
                  borderRadius: "60% 20% 60% 20%",
                  background: `linear-gradient(135deg, ${bf.from}, ${bf.to})`,
                  transformOrigin: "right center",
                  animation: `wingL ${bf.wing}s ease-in-out infinite`,
                }}
              />
              <div
                className="anim"
                style={{
                  width: bf.w,
                  height: bf.h,
                  borderRadius: "20% 60% 20% 60%",
                  background: `linear-gradient(225deg, ${bf.from}, ${bf.to})`,
                  transformOrigin: "left center",
                  animation: `wingR ${bf.wing}s ease-in-out infinite`,
                }}
              />
            </div>
          </div>
        ))}
    </div>
  );
}
