import {
  Award,
  BookOpen,
  ChefHat,
  ChevronLeft,
  Coins,
  Flame,
  Home,
  Medal,
  Package,
  Play,
  ShoppingBasket,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Wrench,
} from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { categoryLabels, ingredients } from "./data/ingredients";
import { upgrades } from "./data/upgrades";
import { gameEvents } from "./game/events";
import { generateChallenge } from "./systems/challenge";
import {
  ingredientPrice,
  scoreTray,
  trayItems,
  trayNutrition,
  traySpent,
} from "./systems/scoring";
import {
  applyReward,
  loadSave,
  unlockedIngredientIds,
  writeSave,
  xpForNextLevel,
} from "./store/save";
import type {
  Category,
  Challenge,
  Ingredient,
  RewardSummary,
  SaveState,
  ScoreResult,
  Tray,
} from "./types/game";

type Screen =
  | "menu"
  | "challenge"
  | "shop"
  | "kitchen"
  | "cooking"
  | "serve"
  | "results"
  | "upgrades"
  | "leaderboard"
  | "book";

const categories: Category[] = [
  "carb",
  "protein",
  "vegetable",
  "fruit",
  "drink",
];
const PhaserStage = lazy(() => import("./components/PhaserStage"));
const BASE_SECONDS = 135;

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [challenge, setChallenge] = useState<Challenge>(() =>
    generateChallenge(),
  );
  const [save, setSave] = useState<SaveState>(() => loadSave());
  const [tray, setTray] = useState<Tray>({});
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [lastReward, setLastReward] = useState<RewardSummary | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(BASE_SECONDS);
  const [cookingTotalMs, setCookingTotalMs] = useState(0);
  const [cookingMsLeft, setCookingMsLeft] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [crt, setCrt] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const cookingIntervalRef = useRef<number | null>(null);
  const cookingTimeoutRef = useRef<number | null>(null);
  const cookingPulseRefs = useRef<number[]>([]);

  const unlocked = useMemo(() => {
    const ids = unlockedIngredientIds(save);
    return ingredients.filter((item) => ids.has(item.id));
  }, [save]);
  const nextUnlocks = useMemo(
    () =>
      ingredients
        .filter((item) => item.unlockLevel === save.level + 1)
        .slice(0, 4),
    [save.level],
  );
  const spent = traySpent(tray, challenge);
  const nutrition = trayNutrition(tray);
  const missionSwitchText =
    "Misi, kondisi, dan siswa berubah setiap klik Play / Main Lagi.";
  const xpNeeded = xpForNextLevel(save.level);
  const speedLevel = save.upgrades["kompor-cepat"] ?? 0;
  const boxLevel = save.upgrades["kotak-bekal"] ?? 0;
  const roundSeconds = BASE_SECONDS + speedLevel * 8;
  const budgetAllowance = boxLevel * 300;
  const cookLimit = challenge.budget + budgetAllowance;
  const isOverBudget = spent > challenge.budget;
  const isOverCookLimit = spent > cookLimit;
  const cookingPct =
    cookingTotalMs > 0
      ? Math.min(100, ((cookingTotalMs - cookingMsLeft) / cookingTotalMs) * 100)
      : 0;

  useEffect(() => {
    writeSave(save);
  }, [save]);

  useEffect(() => {
    gameEvents.emit("challengeChanged", challenge);
  }, [challenge]);

  useEffect(() => {
    gameEvents.emit("trayChanged", tray);
  }, [tray]);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (
      screen !== "shop" &&
      screen !== "kitchen" &&
      screen !== "cooking" &&
      screen !== "serve"
    )
      return;
    const timer = window.setInterval(
      () => setSecondsLeft((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => () => clearCookingTimers(), []);

  function clearCookingTimers() {
    if (cookingIntervalRef.current) {
      window.clearInterval(cookingIntervalRef.current);
      cookingIntervalRef.current = null;
    }
    if (cookingTimeoutRef.current) {
      window.clearTimeout(cookingTimeoutRef.current);
      cookingTimeoutRef.current = null;
    }
    cookingPulseRefs.current.forEach((timer) => window.clearTimeout(timer));
    cookingPulseRefs.current = [];
  }

  function newDay() {
    const next = generateChallenge();
    setChallenge(next);
    setTray({});
    setResult(null);
    setLastReward(null);
    clearCookingTimers();
    setCookingTotalMs(0);
    setCookingMsLeft(0);
    setSecondsLeft(BASE_SECONDS + (save.upgrades["kompor-cepat"] ?? 0) * 8);
    setScreen("challenge");
  }

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setToast(next ? "Audio dapur dinyalakan." : "Audio dapur dimatikan.");
    if (next) beep(660, 0.05);
  }

  function toggleIngredient(item: Ingredient) {
    const next = { ...tray };
    if (next[item.category]?.id === item.id) delete next[item.category];
    else next[item.category] = item;
    const nextSpent = traySpent(next, challenge);
    if (nextSpent > challenge.budget) {
      setToast(
        `Budget lewat Rp${(nextSpent - challenge.budget).toLocaleString("id-ID")}. Skor hemat turun.`,
      );
    }
    setTray(next);
  }

  function cook() {
    if (trayItems(tray).length < 3) return;
    if (isOverCookLimit) {
      setToast(
        `Belanja terlalu mahal. Maksimal masak: Rp${cookLimit.toLocaleString("id-ID")}.`,
      );
      return;
    }
    if (isOverBudget)
      setToast(
        "Tray over budget: boleh lanjut, tapi skor budget kena penalti.",
      );
    clearCookingTimers();
    const plan = getCookingPlan(tray, spent, challenge.budget, speedLevel);
    setCookingTotalMs(plan.durationMs);
    setCookingMsLeft(plan.durationMs);
    if (soundOn) beep(420, 0.08);
    gameEvents.emit("cookPulse", plan.steps[0]);
    cookingPulseRefs.current = plan.steps.slice(1).map((step, index) =>
      window.setTimeout(
        () => {
          gameEvents.emit("cookPulse", step);
          if (soundOn) beep(360 + index * 90, 0.05);
        },
        ((index + 1) / plan.steps.length) * plan.durationMs,
      ),
    );
    const start = Date.now();
    cookingIntervalRef.current = window.setInterval(() => {
      setCookingMsLeft(Math.max(0, plan.durationMs - (Date.now() - start)));
    }, 100);
    cookingTimeoutRef.current = window.setTimeout(() => {
      clearCookingTimers();
      setCookingMsLeft(0);
      gameEvents.emit("cookPulse", "Siap!");
      if (soundOn) beep(620, 0.09);
      setScreen("serve");
    }, plan.durationMs);
    setScreen("cooking");
  }

  function serve() {
    const nextResult = scoreTray(tray, challenge, secondsLeft, save.upgrades);
    const applied = applyReward(save, nextResult);
    setResult(nextResult);
    setLastReward(applied.reward);
    setSave(applied.save);
    gameEvents.emit("resultReady", nextResult);
    if (soundOn) beep(740, 0.12);
    setScreen("results");
  }

  function buyUpgrade(id: string) {
    const upgrade = upgrades.find((item) => item.id === id);
    if (!upgrade) return;
    const level = save.upgrades[id] ?? 0;
    const cost = upgrade.baseCost * (level + 1);
    if (save.level < upgrade.requiredLevel) {
      setToast(`${upgrade.name} terbuka di Level ${upgrade.requiredLevel}.`);
      return;
    }
    if (level >= upgrade.max) {
      setToast(`${upgrade.name} sudah level maksimal.`);
      return;
    }
    if (save.coins < cost) {
      setToast(`Koin kurang. Butuh ${cost} koin, kamu punya ${save.coins}.`);
      return;
    }
    setSave({
      ...save,
      coins: save.coins - cost,
      upgrades: { ...save.upgrades, [id]: level + 1 },
    });
    setToast(`${upgrade.name} naik ke Level ${level + 1}!`);
  }

  function requestInstall() {
    installPrompt?.prompt?.();
    setInstallPrompt(null);
  }

  function goBack() {
    if (screen === "challenge") setScreen("menu");
    if (screen === "shop") setScreen("challenge");
    if (screen === "kitchen") setScreen("shop");
    if (screen === "cooking") {
      clearCookingTimers();
      setCookingTotalMs(0);
      setCookingMsLeft(0);
      setToast("Masak dibatalkan. Kamu kembali ke dapur.");
      setScreen("kitchen");
    }
    if (screen === "serve") setScreen("kitchen");
    if (screen === "results") setScreen("menu");
    if (
      screen === "upgrades" ||
      screen === "leaderboard" ||
      screen === "book"
    ) {
      setScreen("menu");
    }
  }

  return (
    <main className={crt ? "app crt" : "app"}>
      <section className="phone-shell">
        {toast && <div className="toast">{toast}</div>}
        <header className="topbar">
          <button
            className="icon-btn"
            onClick={() => setScreen("menu")}
            aria-label="Home"
          >
            <Home size={18} />
          </button>
          <div>
            <p className="eyebrow">Makanan Bergizi Gems</p>
            <h1>Budget 10.000</h1>
          </div>
          <button
            className={soundOn ? "icon-btn" : "icon-btn muted"}
            onClick={toggleSound}
            aria-label={soundOn ? "Mute audio" : "Unmute audio"}
            title={soundOn ? "Mute audio" : "Unmute audio"}
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </header>

        <Suspense
          fallback={
            <div className="pixel-stage loading-stage">Loading dapur...</div>
          }
        >
          <PhaserStage challenge={challenge} tray={tray} />
        </Suspense>

        <div className="hud">
          <Badge icon={<Coins size={14} />} label={`${save.coins} koin`} />
          <Badge icon={<Award size={14} />} label={`Lv ${save.level}`} />
          <Badge icon={<Flame size={14} />} label={`${secondsLeft}s`} />
        </div>
        <div className="xp-strip">
          <span>
            XP {save.xp}/{xpNeeded}
          </span>
          <i
            style={{ width: `${Math.min(100, (save.xp / xpNeeded) * 100)}%` }}
          />
        </div>

        {screen !== "menu" && (
          <button className="back-step" onClick={goBack}>
            <ChevronLeft size={18} />
            <span>{screen === "results" ? "Menu" : "Kembali"}</span>
          </button>
        )}

        {screen === "menu" && (
          <Panel>
            <div className="hero-copy">
              <h2>Dapur MBGems, gizi serius, budget ketat.</h2>
              <p>
                Bantu rakit menu sekolah yang enak, realistis, dan tetap ramah
                anggaran.
              </p>
            </div>
            <div className="level-card">
              <b>Level {save.level}</b>
              <span>
                Naik level dari skor hasil serving. Level baru membuka bahan dan
                upgrade dapur.
              </span>
              {nextUnlocks.length > 0 && (
                <small>
                  Level {save.level + 1}:{" "}
                  {nextUnlocks.map((item) => item.name).join(", ")}
                </small>
              )}
            </div>
            <div className="grid-actions">
              <Action icon={<Play />} label="Mulai" onClick={newDay} />
              <Action
                icon={<Wrench />}
                label="Upgrade"
                onClick={() => setScreen("upgrades")}
              />
              <Action
                icon={<Trophy />}
                label="Leaderboard"
                onClick={() => setScreen("leaderboard")}
              />
              <Action
                icon={<BookOpen />}
                label="Koleksi"
                onClick={() => setScreen("book")}
              />
            </div>
            <div className="toggles">
              <label>
                <input
                  type="checkbox"
                  checked={crt}
                  onChange={(event) => setCrt(event.target.checked)}
                />{" "}
                Filter CRT
              </label>
              {installPrompt && (
                <button className="mini-btn" onClick={requestInstall}>
                  Install PWA
                </button>
              )}
            </div>
          </Panel>
        )}

        {screen === "challenge" && (
          <Panel>
            <ScreenTitle icon={<Sparkles />} title="Daily Challenge" />
            <div className="challenge-box">
              <strong>{challenge.mission}</strong>
              <span>Budget Rp{challenge.budget.toLocaleString("id-ID")}</span>
              {speedLevel > 0 && (
                <small>Kompor cepat aktif: waktu masak {roundSeconds}s.</small>
              )}
              {boxLevel > 0 && (
                <small>
                  Kotak bekal aktif: toleransi belanja +Rp
                  {budgetAllowance.toLocaleString("id-ID")}.
                </small>
              )}
              <small>{missionSwitchText}</small>
            </div>
            {challenge.conditions.map((condition) => (
              <div className="condition" key={condition.id}>
                <b>{condition.title}</b>
                <span>{condition.description}</span>
                <small>{condition.effect}</small>
              </div>
            ))}
            <Action
              icon={<ShoppingBasket />}
              label="Belanja Bahan"
              onClick={() => {
                setSecondsLeft(roundSeconds);
                setScreen("shop");
              }}
            />
          </Panel>
        )}

        {screen === "shop" && (
          <Panel>
            <ScreenTitle icon={<ShoppingBasket />} title="Ingredient Shop" />
            <BudgetBar spent={spent} budget={challenge.budget} />
            <BudgetNotice
              spent={spent}
              budget={challenge.budget}
              cookLimit={cookLimit}
            />
            <div className="ingredient-list">
              {categories.map((category) => (
                <div key={category}>
                  <h3>{categoryLabels[category]}</h3>
                  <div className="cards">
                    {unlocked
                      .filter((item) => item.category === category)
                      .map((item) => (
                        <button
                          className={
                            tray[category]?.id === item.id
                              ? "ingredient selected"
                              : "ingredient"
                          }
                          key={item.id}
                          onClick={() => toggleIngredient(item)}
                        >
                          <span
                            className="food-pixel"
                            style={{ background: item.color }}
                          />
                          <b>{item.name}</b>
                          <small>
                            Rp
                            {ingredientPrice(item, challenge).toLocaleString(
                              "id-ID",
                            )}
                          </small>
                          <small>
                            P{item.nutrition.protein} V{item.nutrition.vitamin}{" "}
                            F{item.nutrition.fiber}
                          </small>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            <Action
              icon={<ChefHat />}
              label="Ke Dapur"
              onClick={() => setScreen("kitchen")}
            />
          </Panel>
        )}

        {screen === "kitchen" && (
          <Panel>
            <ScreenTitle icon={<ChefHat />} title="Kitchen Screen" />
            <BudgetBar spent={spent} budget={challenge.budget} />
            <BudgetNotice
              spent={spent}
              budget={challenge.budget}
              cookLimit={cookLimit}
            />
            <UpgradeEffects upgrades={save.upgrades} />
            <NutritionGrid nutrition={nutrition} />
            <div className="tray-slots">
              {categories.map((category) => (
                <TraySlot
                  key={category}
                  category={category}
                  item={tray[category]}
                />
              ))}
            </div>
            <Action
              icon={<Flame />}
              label="Masak & Sajikan"
              onClick={cook}
              disabled={trayItems(tray).length < 3 || isOverCookLimit}
            />
          </Panel>
        )}

        {screen === "cooking" && (
          <Panel>
            <ScreenTitle icon={<Flame />} title="Cooking Rush" />
            <div className="cook-card">
              <b>
                {getCookingMood(
                  trayItems(tray).length,
                  spent,
                  challenge.budget,
                )}
              </b>
              <span>
                {trayItems(tray).length} bahan di tray. Kompor cepat Lv{" "}
                {speedLevel} mengurangi waktu masak.
              </span>
              <div className="cook-progress">
                <i style={{ width: `${cookingPct}%` }} />
                <span>{Math.ceil(cookingMsLeft / 1000)}s</span>
              </div>
              <small>
                Ompreng lengkap memberi variasi tinggi, tapi makin banyak bahan
                membuat antrean dapur lebih tegang.
              </small>
            </div>
            <div className="tray-slots">
              {categories.map((category) => (
                <TraySlot
                  key={category}
                  category={category}
                  item={tray[category]}
                />
              ))}
            </div>
          </Panel>
        )}

        {screen === "serve" && (
          <Panel>
            <ScreenTitle icon={<Package />} title="Serving Area" />
            <div className="students">
              {challenge.students.map((student) => (
                <div className="student" key={student.id}>
                  <b>{student.name}</b>
                  <span>{student.personality}</span>
                  <small>
                    Fav:{" "}
                    {
                      ingredients.find((item) => item.id === student.favorite)
                        ?.name
                    }
                  </small>
                  {student.allergy && (
                    <small>
                      Alergi:{" "}
                      {
                        ingredients.find((item) => item.id === student.allergy)
                          ?.name
                      }
                    </small>
                  )}
                </div>
              ))}
            </div>
            <Action icon={<Medal />} label="Serve Students" onClick={serve} />
          </Panel>
        )}

        {screen === "results" && result && (
          <Panel>
            <ScreenTitle icon={<Trophy />} title="Results" />
            <div className="score-total">{result.total}</div>
            <ResultRows result={result} />
            {lastReward && <RewardBox reward={lastReward} />}
            <div className="reactions">
              {result.reactions.map((reaction) => (
                <span key={reaction.student.id}>
                  {reaction.student.name}: {reaction.label}
                </span>
              ))}
            </div>
            <Action icon={<Play />} label="Main Lagi" onClick={newDay} />
          </Panel>
        )}

        {screen === "upgrades" && (
          <Panel>
            <ScreenTitle icon={<Wrench />} title="Upgrade Shop" />
            {upgrades.map((upgrade) => {
              const level = save.upgrades[upgrade.id] ?? 0;
              const cost = upgrade.baseCost * (level + 1);
              const locked = save.level < upgrade.requiredLevel;
              return (
                <button
                  className={locked ? "upgrade locked-upgrade" : "upgrade"}
                  key={upgrade.id}
                  onClick={() => buyUpgrade(upgrade.id)}
                >
                  <b>
                    {upgrade.name} Lv {level}/{upgrade.max}
                  </b>
                  <span>{upgrade.description}</span>
                  <span>{upgradeEffectText(upgrade.id, level)}</span>
                  <small>
                    {locked
                      ? `Buka di Level ${upgrade.requiredLevel}`
                      : level >= upgrade.max
                        ? "MAX"
                        : `${cost} koin`}
                  </small>
                </button>
              );
            })}
          </Panel>
        )}

        {screen === "leaderboard" && (
          <Panel>
            <ScreenTitle icon={<Trophy />} title="Leaderboard" />
            {(save.leaderboard.length ? save.leaderboard : []).map(
              (entry, index) => (
                <div className="leader" key={`${entry.total}-${index}`}>
                  <b>
                    #{index + 1} {entry.total}
                  </b>
                  <span>
                    Gizi {entry.nutrition} | Hemat {entry.budget} | Cepat{" "}
                    {entry.time}
                  </span>
                </div>
              ),
            )}
            {!save.leaderboard.length && (
              <p className="empty">
                Belum ada skor. Satu hari lagi dan papan ini mulai hidup.
              </p>
            )}
          </Panel>
        )}

        {screen === "book" && (
          <Panel>
            <ScreenTitle icon={<BookOpen />} title="Collection Book" />
            <div className="book-grid">
              {ingredients.map((item) => (
                <div
                  className={
                    unlocked.some((owned) => owned.id === item.id)
                      ? "book-item"
                      : "book-item locked"
                  }
                  key={item.id}
                >
                  <span
                    className="food-pixel"
                    style={{ background: item.color }}
                  />
                  <b>{item.name}</b>
                  <small>
                    {unlocked.some((owned) => owned.id === item.id)
                      ? `${categoryLabels[item.category]} Terbuka`
                      : `${categoryLabels[item.category]} Lv ${item.unlockLevel}`}
                  </small>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </section>
    </main>
  );
}

function beep(frequency: number, duration: number) {
  const audioWindow = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextClass =
    window.AudioContext || audioWindow.webkitAudioContext;
  if (!AudioContextClass) return;
  const audio = new AudioContextClass();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = "square";
  gain.gain.value = 0.035;
  oscillator.connect(gain);
  gain.connect(audio.destination);
  const play = () => {
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
    oscillator.onended = () => {
      if (audio.state !== "closed") {
        audio.close().catch(() => undefined);
      }
    };
  };
  if (audio.state === "suspended") {
    audio
      .resume()
      .then(play)
      .catch(() => undefined);
    return;
  }
  if (audio.state !== "closed") play();
}

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="panel">{children}</section>;
}

function ScreenTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="screen-title">
      {icon}
      <h2>{title}</h2>
    </div>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="badge">
      {icon}
      {label}
    </span>
  );
}

function Action({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button className="action" onClick={onClick} disabled={disabled}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const pct = Math.min(120, (spent / budget) * 100);
  return (
    <div className={spent > budget ? "budget over" : "budget"}>
      <span>
        Rp{spent.toLocaleString("id-ID")} / Rp{budget.toLocaleString("id-ID")}
      </span>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

function BudgetNotice({
  spent,
  budget,
  cookLimit,
}: {
  spent: number;
  budget: number;
  cookLimit: number;
}) {
  if (spent <= budget)
    return (
      <div className="budget-note good">
        Sisa budget Rp{(budget - spent).toLocaleString("id-ID")}.
      </div>
    );
  if (spent <= cookLimit) {
    return (
      <div className="budget-note warn">
        Over budget Rp{(spent - budget).toLocaleString("id-ID")}. Masih bisa
        dimasak, tapi skor hemat dan gizi kena penalti.
      </div>
    );
  }
  return (
    <div className="budget-note danger">
      Terlalu mahal untuk dapur. Kurangi bahan sampai maksimal Rp
      {cookLimit.toLocaleString("id-ID")}.
    </div>
  );
}

function UpgradeEffects({ upgrades }: { upgrades: SaveState["upgrades"] }) {
  const active = Object.entries(upgrades).filter(([, level]) => level > 0);
  if (!active.length)
    return (
      <div className="upgrade-effects">
        Belum ada upgrade aktif. Upgrade dapur membuat run berikutnya lebih
        kuat.
      </div>
    );
  return (
    <div className="upgrade-effects">
      {active.map(([id, level]) => (
        <span key={id}>{upgradeEffectText(id, level)}</span>
      ))}
    </div>
  );
}

function upgradeEffectText(id: string, level: number) {
  if (id === "kompor-cepat") return `Kompor cepat: +${level * 8}s waktu`;
  if (id === "rak-segar") return `Rak segar: +${level * 2} skor gizi`;
  if (id === "bumbu-racik") return `Bumbu racik: +${level * 4} reaksi siswa`;
  if (id === "dekor-dapur") return `Dekor dapur: +${level * 3} mood siswa`;
  if (id === "kotak-bekal")
    return `Kotak bekal: +Rp${(level * 300).toLocaleString("id-ID")} toleransi`;
  return `Efek aktif Lv ${level}`;
}

function getCookingPlan(
  tray: Tray,
  spent: number,
  budget: number,
  speedLevel: number,
) {
  const count = trayItems(tray).length;
  const sugar = trayNutrition(tray).sugar;
  const overBudgetMs =
    spent > budget ? Math.min(1400, (spent - budget) * 0.35) : 0;
  const complexityMs = 1400 + count * 620 + Math.max(0, sugar - 12) * 90;
  const speedReduction = speedLevel * 360;
  const durationMs = Math.max(
    1800,
    Math.round(complexityMs + overBudgetMs - speedReduction),
  );
  const steps =
    count >= 5
      ? ["Cincang!", "Tumis!", "Cek rasa!", "Plating!", "Sajikan!"]
      : count >= 4
        ? ["Cincang!", "Tumis!", "Plating!", "Sajikan!"]
        : ["Cincang!", "Tumis!", "Sajikan!"];

  return { durationMs, steps };
}

function getCookingMood(count: number, spent: number, budget: number) {
  if (spent > budget) return "Dapur lagi tegang: budget lewat!";
  if (count >= 5) return "Ompreng lengkap, prep lebih ramai.";
  if (count >= 4) return "Masak seimbang, ritme dapur stabil.";
  return "Menu simpel, masaknya cepat.";
}

function NutritionGrid({
  nutrition,
}: {
  nutrition: ReturnType<typeof trayNutrition>;
}) {
  return (
    <div className="nutrition">
      {Object.entries(nutrition).map(([key, value]) => (
        <span key={key}>
          <b>{value}</b>
          {key}
        </span>
      ))}
    </div>
  );
}

function TraySlot({
  category,
  item,
}: {
  category: Category;
  item?: Ingredient;
}) {
  return (
    <div className="slot">
      <small>{categoryLabels[category]}</small>
      {item ? (
        <>
          <span className="food-pixel" style={{ background: item.color }} />
          <b>{item.name}</b>
        </>
      ) : (
        <em>Kosong</em>
      )}
    </div>
  );
}

function ResultRows({ result }: { result: ScoreResult }) {
  const rows = [
    ["Nutrition", result.nutrition],
    ["Budget", result.budget],
    ["Satisfaction", result.satisfaction],
    ["Variety", result.variety],
    ["Time", result.time],
  ];
  return (
    <div className="result-rows">
      {rows.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}

function RewardBox({ reward }: { reward: RewardSummary }) {
  return (
    <div className="reward-box">
      <div>
        <span>Koin</span>
        <b>+{reward.coinsGained}</b>
      </div>
      <div>
        <span>XP</span>
        <b>+{reward.xpGained}</b>
      </div>
      <div>
        <span>Level</span>
        <b>
          {reward.previousLevel} -&gt; {reward.newLevel}
        </b>
      </div>
      {reward.leveledUp && (
        <strong>Level up! Bahan dan upgrade baru terbuka.</strong>
      )}
      {reward.newUnlocks.length > 0 && (
        <small>
          Unlock:{" "}
          {reward.newUnlocks
            .map((id) => ingredients.find((item) => item.id === id)?.name ?? id)
            .join(", ")}
        </small>
      )}
    </div>
  );
}
