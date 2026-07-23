"use client";

// UchidaAvatar3D — three.js port of the confirmed design in
// design_handoff_uchida_avatar_3d/reference/"Uchida Avatar 3D.html".
// All geometry / material / animation numbers are copied verbatim from the
// reference (do not tweak proportions or colors here).
//
// Usage: <UchidaAvatar3D size={280} talking={loading} />
//   size    — square size in px, or "fill" to fill the parent box
//   talking — true while the reply is being generated/typed (mouth flaps)

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  size?: number | "fill";
  talking?: boolean;
  className?: string;
};

// Builds the whole character. Returns the group plus the parts the
// animation loop needs to move every frame.
function buildAvatar() {
  const M = {
    skin: new THREE.MeshStandardMaterial({ name: "skin", color: 0xe8b88f, roughness: 0.9 }),
    wrinkle: new THREE.MeshStandardMaterial({ name: "wrinkle", color: 0xc99b72, roughness: 0.9 }),
    hair: new THREE.MeshStandardMaterial({ name: "hair", color: 0x9aa3ab, roughness: 0.9 }),
    cardigan: new THREE.MeshStandardMaterial({ name: "cardigan", color: 0x46698a, roughness: 0.9 }),
    shirt: new THREE.MeshStandardMaterial({ name: "shirt", color: 0xffffff, roughness: 0.9 }),
    pants: new THREE.MeshStandardMaterial({ name: "pants", color: 0x5c6670, roughness: 0.9 }),
    shoe: new THREE.MeshStandardMaterial({ name: "shoe", color: 0x8a6f53, roughness: 0.8 }),
    frame: new THREE.MeshStandardMaterial({ name: "frame", color: 0x39424e, roughness: 0.5, metalness: 0.2 }),
    eye: new THREE.MeshStandardMaterial({ name: "eye", color: 0x39424e, roughness: 0.4 }),
    mouth: new THREE.MeshStandardMaterial({ name: "mouth", color: 0xc08a63, roughness: 0.8 }),
  };
  const mesh = (name: string, geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    return m;
  };

  const avatar = new THREE.Group();
  avatar.name = "uchida";

  // ---- legs: capsules tucked up into the torso, shoes overlapping the ankles ----
  const legGeo = new THREE.CapsuleGeometry(0.055, 0.2, 8, 20);
  for (const s of [-1, 1]) {
    const leg = mesh(s < 0 ? "leg_L" : "leg_R", legGeo, M.pants);
    leg.position.set(0.08 * s, 0.22, 0); // top end buried in torso bottom
    avatar.add(leg);
    const shoe = mesh(s < 0 ? "shoe_L" : "shoe_R", new THREE.SphereGeometry(0.07, 24, 16), M.shoe);
    shoe.scale.set(1, 0.6, 1.6);
    shoe.position.set(0.08 * s, 0.055, 0.03); // swallows the leg bottom
    avatar.add(shoe);
  }

  // ---- body ----
  const body = new THREE.Group();
  body.name = "body";
  avatar.add(body);
  const torso = mesh("torso", new THREE.SphereGeometry(0.21, 32, 24), M.cardigan);
  torso.scale.set(1, 1.15, 0.82);
  torso.position.y = 0.5;
  body.add(torso);
  // shoulders: cardigan spheres bridging torso and sleeves
  for (const s of [-1, 1]) {
    const sh = mesh(s < 0 ? "shoulder_L" : "shoulder_R", new THREE.SphereGeometry(0.065, 24, 16), M.cardigan);
    sh.position.set(0.165 * s, 0.645, 0);
    body.add(sh);
  }
  // neck: skin cylinder linking head and collar
  const neck = mesh("neck", new THREE.CylinderGeometry(0.07, 0.08, 0.12, 20), M.skin);
  neck.position.y = 0.73;
  body.add(neck);
  const neckband = mesh("neckband", new THREE.CylinderGeometry(0.093, 0.105, 0.05, 24), M.shirt);
  neckband.position.y = 0.705;
  body.add(neckband);
  for (const s of [-1, 1]) {
    const col = mesh(s < 0 ? "collar_L" : "collar_R", new THREE.BoxGeometry(0.07, 0.01, 0.055), M.shirt);
    col.position.set(0.05 * s, 0.695, 0.115);
    col.rotation.z = -0.35 * s;
    col.rotation.x = -0.95;
    body.add(col);
  }

  // ---- arms: capsule sleeves whose top ends sit inside the shoulders ----
  const arms = {} as { L: THREE.Group; R: THREE.Group };
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = side < 0 ? "arm_L" : "arm_R";
    pivot.position.set(0.175 * side, 0.655, 0); // pivot at shoulder core
    const arm = mesh("sleeve", new THREE.CapsuleGeometry(0.048, 0.18, 8, 20), M.cardigan);
    arm.position.y = -0.1;
    pivot.add(arm);
    const hand = mesh("hand", new THREE.SphereGeometry(0.048, 20, 16), M.skin);
    hand.position.y = -0.225; // overlaps sleeve end
    pivot.add(hand);
    pivot.rotation.z = 0.32 * side;
    body.add(pivot);
    arms[side < 0 ? "L" : "R"] = pivot;
  }

  // ---- head ----
  const head = new THREE.Group();
  head.name = "head";
  head.position.y = 0.78;
  body.add(head);
  const skull = mesh("face", new THREE.SphereGeometry(0.26, 32, 24), M.skin);
  skull.scale.set(0.96, 1, 0.9);
  skull.position.y = 0.19;
  head.add(skull);

  // hair: dome fitted onto the skull (clearance kept above the forehead)
  const hairCap = mesh(
    "hair_top",
    new THREE.SphereGeometry(0.268, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.46),
    M.hair,
  );
  hairCap.position.set(0, 0.205, -0.005);
  hairCap.scale.set(0.98, 1, 0.945);
  hairCap.rotation.x = -0.22; // lift the fringe off the forehead
  head.add(hairCap);
  const backHair = mesh(
    "hair_back",
    new THREE.SphereGeometry(0.262, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.72),
    M.hair,
  );
  backHair.position.set(0, 0.2, -0.055);
  backHair.rotation.x = -0.5;
  backHair.scale.set(1, 1, 0.92);
  head.add(backHair);

  // ears: half-buried in the skull
  for (const s of [-1, 1]) {
    const ear = mesh(s < 0 ? "ear_L" : "ear_R", new THREE.SphereGeometry(0.045, 16, 12), M.skin);
    ear.position.set(0.238 * s, 0.16, 0);
    ear.scale.set(0.7, 1, 0.8);
    head.add(ear);
  }

  // eyes
  const eyeGeo = new THREE.SphereGeometry(0.018, 16, 12);
  const eyeL = mesh("eye_L", eyeGeo, M.eye);
  eyeL.position.set(-0.085, 0.178, 0.214);
  const eyeR = mesh("eye_R", eyeGeo, M.eye);
  eyeR.position.set(0.085, 0.178, 0.214);
  head.add(eyeL, eyeR);
  // brows
  for (const s of [-1, 1]) {
    const brow = mesh(s < 0 ? "brow_L" : "brow_R", new THREE.CapsuleGeometry(0.01, 0.045, 6, 10), M.hair);
    brow.rotation.z = Math.PI / 2 + 0.15 * s;
    brow.position.set(0.085 * s, 0.243, 0.207);
    head.add(brow);
  }
  // forehead lines + laugh lines (wrinkles)
  const lineGeo = new THREE.TorusGeometry(0.05, 0.0045, 8, 20, Math.PI * 0.5);
  for (const [i, y] of [
    [0, 0.285],
    [1, 0.31],
  ]) {
    const line = mesh("forehead_" + i, lineGeo, M.wrinkle);
    line.rotation.z = Math.PI / 2 - Math.PI * 0.25;
    line.rotation.x = -0.35;
    line.position.set(0, y - 0.045, 0.195);
    line.scale.set(1, 0.55, 0.5);
    head.add(line);
  }
  for (const s of [-1, 1]) {
    const fold = mesh(
      s < 0 ? "fold_L" : "fold_R",
      new THREE.TorusGeometry(0.035, 0.004, 8, 20, Math.PI * 0.45),
      M.wrinkle,
    );
    fold.position.set(0.055 * s, 0.105, 0.22);
    fold.rotation.z = s < 0 ? Math.PI * 0.55 : Math.PI * 0.9;
    fold.scale.set(1, 1, 0.4);
    head.add(fold);
  }

  // glasses: rims joined by bridge, temples reaching the ears
  const rimGeo = new THREE.TorusGeometry(0.055, 0.009, 12, 32);
  for (const s of [-1, 1]) {
    const rim = mesh(s < 0 ? "rim_L" : "rim_R", rimGeo, M.frame);
    rim.position.set(0.085 * s, 0.183, 0.226);
    head.add(rim);
    const temple = mesh(
      s < 0 ? "temple_L" : "temple_R",
      new THREE.CylinderGeometry(0.007, 0.007, 0.24, 10),
      M.frame,
    );
    temple.rotation.x = Math.PI / 2;
    temple.position.set(0.16 * s, 0.185, 0.09); // back end reaches the ear
    temple.rotation.z = 0.28 * s;
    head.add(temple);
  }
  const bridge = mesh("bridge", new THREE.CylinderGeometry(0.007, 0.007, 0.062, 10), M.frame);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0.188, 0.23);
  head.add(bridge);

  // nose + mouth
  const nose = mesh("nose", new THREE.SphereGeometry(0.024, 16, 12), M.skin);
  nose.scale.set(0.85, 1.3, 1);
  nose.position.set(0, 0.135, 0.238);
  head.add(nose);
  const mouth = mesh("mouth", new THREE.TorusGeometry(0.035, 0.008, 10, 24, Math.PI * 0.8), M.mouth);
  mouth.rotation.z = Math.PI + Math.PI * 0.1;
  mouth.position.set(0, 0.085, 0.218);
  mouth.scale.set(1, 1, 0.4);
  head.add(mouth);
  const mouthOpen = mesh("mouth_open", new THREE.SphereGeometry(0.028, 16, 12), M.mouth);
  mouthOpen.position.set(0, 0.08, 0.222);
  mouthOpen.visible = false;
  head.add(mouthOpen);

  return { avatar, body, head, arms, eyeL, eyeR, mouth, mouthOpen };
}

export default function UchidaAvatar3D({ size = 240, talking = false, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  // The animation loop lives outside React's render cycle, so it reads the
  // latest `talking` through a ref instead of a closure over a stale prop.
  const talkingRef = useRef(talking);
  useEffect(() => {
    talkingRef.current = talking;
  }, [talking]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    const scene = new THREE.Scene(); // background stays null = transparent

    // Fixed front camera, slightly above eye level (per handoff README).
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 50);
    camera.position.set(0.05, 0.79, 2.48);
    camera.lookAt(0, 0.55, 0);

    // Lighting matched to the reference viewer: hemisphere wash + key + fill.
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0002;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xfff4e6, 0.5);
    fill.position.set(-5, 3, -4);
    scene.add(fill);

    // Soft ground shadow so the character does not float.
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.ShadowMaterial({ opacity: 0.18 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const { avatar, body, head, arms, eyeL, eyeR, mouth, mouthOpen } = buildAvatar();
    avatar.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    scene.add(avatar);

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    // ---- animation: idle bob + wave + blink + talk (numbers from reference) ----
    const clock = new THREE.Clock();
    let nextBlink = 2;
    let blinkT = -1;
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const isTalking = talkingRef.current;
      // slight stoop + calm idle
      body.rotation.x = 0.06 + Math.sin(t * 2.2 + 1) * 0.006;
      body.position.y = Math.sin(t * 1.8) * 0.008;
      body.rotation.z = Math.sin(t * 0.9) * 0.015;
      head.rotation.z = Math.sin(t * 1.1 + 0.6) * 0.04;
      head.rotation.y = Math.sin(t * 0.55) * 0.1;
      // wave: first 2.2s of every 6s cycle, right arm up with easing
      const cycle = t % 6;
      if (cycle < 2.2) {
        const k = Math.min(1, cycle / 0.4) * Math.min(1, (2.2 - cycle) / 0.4);
        arms.R.rotation.z = 0.32 + k * (2.2 + Math.sin(t * 9) * 0.22 - 0.32);
      } else {
        arms.R.rotation.z += (0.32 - arms.R.rotation.z) * 0.15;
      }
      arms.L.rotation.z = -0.32 + Math.sin(t * 2.2) * 0.03;
      // talk: swap closed/open mouth on a two-sine gate
      if (isTalking) {
        const open = (Math.sin(t * 14) + Math.sin(t * 9.3)) * 0.5 > 0;
        mouthOpen.visible = open;
        mouth.visible = !open;
        mouthOpen.scale.y = 0.7 + Math.abs(Math.sin(t * 14)) * 0.5;
        head.rotation.x = Math.sin(t * 6) * 0.03;
      } else {
        mouthOpen.visible = false;
        mouth.visible = true;
        head.rotation.x *= 0.9;
      }
      // blink: quick close/open every 1.8–4.3s
      if (blinkT < 0 && t > nextBlink) blinkT = t;
      if (blinkT >= 0) {
        const p = (t - blinkT) / 0.22;
        if (p >= 1) {
          blinkT = -1;
          nextBlink = t + 1.8 + Math.random() * 2.5;
          eyeL.scale.y = eyeR.scale.y = 1;
        } else {
          const s = Math.max(0.08, Math.abs(Math.cos(p * Math.PI)));
          eyeL.scale.y = eyeR.scale.y = s;
        }
      }
      renderer.render(scene, camera);
    };

    // prefers-reduced-motion: freeze in the resting pose (no wave/bob/blink).
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreference = () => {
      cancelAnimationFrame(raf);
      if (media.matches) {
        body.rotation.set(0.06, 0, 0);
        body.position.y = 0;
        head.rotation.set(0, 0, 0);
        arms.L.rotation.z = -0.32;
        arms.R.rotation.z = 0.32;
        eyeL.scale.y = eyeR.scale.y = 1;
        mouth.visible = true;
        mouthOpen.visible = false;
        renderer.render(scene, camera);
      } else {
        animate();
      }
    };
    media.addEventListener("change", applyMotionPreference);
    applyMotionPreference();

    return () => {
      cancelAnimationFrame(raf);
      media.removeEventListener("change", applyMotionPreference);
      ro.disconnect();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={className}
      style={size === "fill" ? { width: "100%", height: "100%" } : { width: size, height: size }}
      role="img"
      aria-label="AI内田さんの3Dアバター"
    />
  );
}
