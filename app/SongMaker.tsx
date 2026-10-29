"use client";

import { useEffect, useRef, useState } from "react";
import { SDGS, getSdg, type Sdg } from "@/lib/sdgs";
import { GENRES, INSTRUMENTS, LENGTHS, LYRIC_MOODS, MOODS, TEMPOS, VOCALS } from "@/lib/options";
import type { SongStatus } from "@/lib/suno";

type Draft = {
  step: number;
  sdgId: number | null;
  message: string;
  keywords: string[];
  story: string;
  lyricMood: string;
  length: "short" | "medium" | "long";
  title: string;
  lyrics: string;
  genre: string;
  vocal: "m" | "f";
  mood: string;
  tempo: string;
  instruments: string[];
};

const EMPTY: Draft = {
  step: 0,
  sdgId: null,
  message: "",
  keywords: [],
  story: "",
  lyricMood: LYRIC_MOODS[0],
  length: "medium",
  title: "",
  lyrics: "",
  genre: GENRES[0].value,
  vocal: "f",
  mood: MOODS[0].value,
  tempo: TEMPOS[1].value,
  instruments: [],
};

const STEPS = ["주제 고르기", "아이디어 정리", "가사 다듬기", "노래 설정", "노래 듣기"];
const DRAFT_KEY = "sdgs-song-draft";
const CODE_KEY = "sdgs-class-code";

type Config = { needsClassCode: boolean; lyricsDemo: boolean; songDemo: boolean };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export default function SongMaker() {
  const [d, setD] = useState<Draft>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [classCode, setClassCode] = useState("");

  useEffect(() => {
    setD(load(DRAFT_KEY, EMPTY));
    try {
      setClassCode(localStorage.getItem(CODE_KEY) ?? "");
    } catch {}
    setLoaded(true);
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {}
  }, [d, loaded]);

  const update = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));
  const goto = (step: number) => {
    update({ step });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const sdg = d.sdgId ? getSdg(d.sdgId) : undefined;

  const saveCode = (v: string) => {
    setClassCode(v);
    try {
      localStorage.setItem(CODE_KEY, v);
    } catch {}
  };

  const api = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-class-code": classCode },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
    return json;
  };

  const reset = () => {
    if (confirm("처음부터 다시 만들까요? 지금까지 쓴 내용이 지워져요.")) setD(EMPTY);
  };

  return (
    <main className="wrap">
      <header className="top">
        <h1>
          <span className="logo">🎵</span> SDGs 노래 만들기
        </h1>
        <p className="sub">지속가능발전목표 17개 중 하나를 골라, 세상을 바꾸는 나만의 노래를 만들어 봐요!</p>
        {config?.needsClassCode && (
          <label className="code">
            수업 코드
            <input value={classCode} onChange={(e) => saveCode(e.target.value)} placeholder="선생님이 알려준 코드" />
          </label>
        )}
        {config && (config.lyricsDemo || config.songDemo) && (
          <p className="demo-banner">
            데모 모드: {config.lyricsDemo && "가사는 예시로 만들어지고"}
            {config.lyricsDemo && config.songDemo && ", "}
            {config.songDemo && "노래는 실제로 만들어지지 않아요"}. (선생님: README의 API 키 설정을 확인하세요)
          </p>
        )}
      </header>

      <nav className="steps" aria-label="진행 단계">
        {STEPS.map((label, i) => (
          <button
            key={label}
            className={`step ${i === d.step ? "on" : ""} ${i < d.step ? "done" : ""}`}
            disabled={i > d.step}
            onClick={() => goto(i)}
          >
            <span className="num">{i < d.step ? "✓" : i + 1}</span>
            <span className="label">{label}</span>
          </button>
        ))}
      </nav>

      {d.step === 0 && <PickGoal selected={d.sdgId} onPick={(id) => { update({ sdgId: id, keywords: [] }); goto(1); }} />}
      {d.step === 1 && sdg && <Brainstorm d={d} sdg={sdg} update={update} api={api} onDone={() => goto(2)} />}
      {d.step === 2 && sdg && <EditLyrics d={d} sdg={sdg} update={update} api={api} onBack={() => goto(1)} onDone={() => goto(3)} />}
      {d.step === 3 && <Settings d={d} update={update} onBack={() => goto(2)} onDone={() => goto(4)} />}
      {d.step === 4 && <Generate d={d} api={api} onBack={() => goto(3)} />}

      <footer className="foot">
        <button className="link" onClick={reset}>처음부터 다시 만들기</button>
      </footer>
    </main>
  );
}

type Api = (url: string, body: unknown) => Promise<any>;
type Update = (patch: Partial<Draft>) => void;

/* 1단계: SDG 고르기 */
function PickGoal({ selected, onPick }: { selected: number | null; onPick: (id: number) => void }) {
  return (
    <section>
      <h2>1. 노래의 주제가 될 목표를 하나 골라요</h2>
      <div className="grid">
        {SDGS.map((s) => (
          <button
            key={s.id}
            className={`goal ${selected === s.id ? "picked" : ""}`}
            style={{ background: s.color }}
            onClick={() => onPick(s.id)}
          >
            <span className="goal-num">{s.id}</span>
            <span className="goal-emoji">{s.emoji}</span>
            <span className="goal-title">{s.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* 2단계: 추천 내용을 보며 아이디어 정리 */
function Brainstorm({ d, sdg, update, api, onDone }: { d: Draft; sdg: Sdg; update: Update; api: Api; onDone: () => void }) {
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = (k: string) =>
    update({ keywords: d.keywords.includes(k) ? d.keywords.filter((x) => x !== k) : [...d.keywords, k] });
  const addCustom = () => {
    const k = custom.trim();
    if (k && !d.keywords.includes(k)) update({ keywords: [...d.keywords, k] });
    setCustom("");
  };

  // 메시지, 낱말, 이야기를 얼마나 채웠는지로 "어느 정도 완성"을 판단
  const filled = [d.message.trim().length >= 10, d.keywords.length >= 2, d.story.trim().length >= 10];
  const score = filled.filter(Boolean).length;
  const ready = filled[0] && score >= 2;

  const make = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await api("/api/lyrics", {
        sdgId: sdg.id,
        message: d.message,
        keywords: d.keywords,
        story: d.story,
        mood: d.lyricMood,
        length: d.length,
      });
      update({ title: r.title, lyrics: r.lyrics });
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <div className="goal-head" style={{ borderColor: sdg.color }}>
        <span className="badge" style={{ background: sdg.color }}>
          {sdg.emoji} SDG {sdg.id}
        </span>
        <h2>{sdg.title}</h2>
        <p className="muted">{sdg.short}</p>
        <p>{sdg.description}</p>
      </div>

      <div className="cols">
        <div className="card">
          <h3>📖 알아두면 좋은 내용</h3>
          <ul>{sdg.facts.map((f) => <li key={f}>{f}</li>)}</ul>
        </div>
        <div className="card">
          <h3>💡 이런 노래는 어때요?</h3>
          <ul>
            {sdg.ideas.map((i) => (
              <li key={i}>
                <button className="link" onClick={() => update({ story: d.story ? `${d.story}\n${i}` : i })}>
                  {i} ＋
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>🤔 생각해 볼 질문</h3>
          <ul>{sdg.questions.map((q) => <li key={q}>{q}</li>)}</ul>
        </div>
      </div>

      <div className="card form">
        <h3>✏️ 나의 노래 아이디어</h3>

        <label>
          <span>노래로 전하고 싶은 메시지 <span className="req">필수</span></span>
          <textarea
            rows={3}
            value={d.message}
            onChange={(e) => update({ message: e.target.value })}
            placeholder="예) 바다에 버려진 쓰레기 때문에 아파하는 바다 생물을 지켜 주고 싶어요."
          />
        </label>

        <div className="field">
          <span>가사에 넣고 싶은 낱말 (눌러서 고르거나 직접 써 보세요)</span>
          <div className="chips">
            {[...sdg.keywords, ...d.keywords.filter((k) => !sdg.keywords.includes(k))].map((k) => (
              <button key={k} className={`chip ${d.keywords.includes(k) ? "on" : ""}`} onClick={() => toggle(k)}>
                {k}
              </button>
            ))}
          </div>
          <div className="row">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && addCustom()}
              placeholder="나만의 낱말 추가"
            />
            <button className="btn ghost" onClick={addCustom}>추가</button>
          </div>
        </div>

        <label>
          노래에 담고 싶은 이야기나 장면
          <textarea
            rows={3}
            value={d.story}
            onChange={(e) => update({ story: e.target.value })}
            placeholder="예) 여름 방학에 가족과 바닷가에서 쓰레기를 주웠던 날"
          />
        </label>

        <div className="row wrap-row">
          <label>
            가사 분위기
            <select value={d.lyricMood} onChange={(e) => update({ lyricMood: e.target.value })}>
              {LYRIC_MOODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>
          <label>
            노래 길이
            <select value={d.length} onChange={(e) => update({ length: e.target.value as Draft["length"] })}>
              {LENGTHS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </label>
        </div>

        <div className="meter">
          <div className="meter-bar"><div style={{ width: `${(score / 3) * 100}%`, background: sdg.color }} /></div>
          <span className="muted">
            {ready ? "좋아요! 가사를 만들 준비가 됐어요." : "메시지를 10자 이상 쓰고, 낱말 2개 이상이나 이야기를 채워 주세요."}
          </span>
        </div>

        {error && <p className="error">{error}</p>}
        <button className="btn primary big" disabled={!ready || busy} onClick={make}>
          {busy ? "가사를 쓰는 중이에요… ✍️" : "가사 만들기 ✨"}
        </button>
      </div>
    </section>
  );
}

/* 3단계: 생성된 가사 수정 */
function EditLyrics({ d, sdg, update, api, onBack, onDone }: { d: Draft; sdg: Sdg; update: Update; api: Api; onBack: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const regenerate = async () => {
    if (!confirm("가사를 새로 만들까요? 고친 내용은 사라져요.")) return;
    setBusy(true);
    setError("");
    try {
      const r = await api("/api/lyrics", {
        sdgId: sdg.id, message: d.message, keywords: d.keywords, story: d.story, mood: d.lyricMood, length: d.length,
      });
      update({ title: r.title, lyrics: r.lyrics });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const tooLong = d.lyrics.length > 3000;
  return (
    <section>
      <h2>3. 가사를 내 마음대로 고쳐 봐요</h2>
      <p className="muted">
        AI가 쓴 가사는 초안이에요. 내 생각이 더 잘 드러나도록 낱말이나 문장을 바꿔 보세요.
        <br />
        [Verse]는 노래의 이야기 부분, [Chorus]는 반복되는 후렴, [Bridge]는 분위기가 바뀌는 부분이에요. 이 표시는 지우지 말고 남겨 두세요.
      </p>
      <div className="card form">
        <label>
          노래 제목
          <input value={d.title} onChange={(e) => update({ title: e.target.value })} maxLength={80} />
        </label>
        <label>
          가사
          <textarea className="lyrics" rows={20} value={d.lyrics} onChange={(e) => update({ lyrics: e.target.value })} />
        </label>
        <p className={tooLong ? "error" : "muted"}>{d.lyrics.length} / 3000자</p>
        {error && <p className="error">{error}</p>}
        <div className="row between">
          <button className="btn ghost" onClick={onBack}>← 아이디어 고치기</button>
          <button className="btn ghost" onClick={regenerate} disabled={busy}>{busy ? "다시 쓰는 중…" : "가사 새로 만들기 🔄"}</button>
          <button className="btn primary" disabled={!d.lyrics.trim() || !d.title.trim() || tooLong} onClick={onDone}>
            노래 설정하기 →
          </button>
        </div>
      </div>
    </section>
  );
}

/* 4단계: 노래 생성 설정 */
function Settings({ d, update, onBack, onDone }: { d: Draft; update: Update; onBack: () => void; onDone: () => void }) {
  const toggleInst = (v: string) =>
    update({ instruments: d.instruments.includes(v) ? d.instruments.filter((x) => x !== v) : [...d.instruments, v].slice(0, 3) });

  return (
    <section>
      <h2>4. 어떤 노래로 만들까요?</h2>
      <div className="card form">
        <div className="field">
          <span>장르</span>
          <div className="options">
            {GENRES.map((g) => (
              <button key={g.value} className={`opt ${d.genre === g.value ? "on" : ""}`} onClick={() => update({ genre: g.value })}>
                <span className="opt-emoji">{g.emoji}</span>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>목소리</span>
          <div className="options two">
            {VOCALS.map((v) => (
              <button key={v.value} className={`opt ${d.vocal === v.value ? "on" : ""}`} onClick={() => update({ vocal: v.value as Draft["vocal"] })}>
                <span className="opt-emoji">{v.emoji}</span>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>분위기</span>
          <div className="chips">
            {MOODS.map((m) => (
              <button key={m.value} className={`chip ${d.mood === m.value ? "on" : ""}`} onClick={() => update({ mood: m.value })}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>빠르기</span>
          <div className="chips">
            {TEMPOS.map((t) => (
              <button key={t.value} className={`chip ${d.tempo === t.value ? "on" : ""}`} onClick={() => update({ tempo: t.value })}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>강조하고 싶은 악기 (최대 3개, 선택)</span>
          <div className="chips">
            {INSTRUMENTS.map((i) => (
              <button key={i.value} className={`chip ${d.instruments.includes(i.value) ? "on" : ""}`} onClick={() => toggleInst(i.value)}>
                {i.label}
              </button>
            ))}
          </div>
        </div>

        <div className="row between">
          <button className="btn ghost" onClick={onBack}>← 가사 고치기</button>
          <button className="btn primary big" onClick={onDone}>노래 만들기 🎶</button>
        </div>
      </div>
    </section>
  );
}

/* 5단계: 노래 생성과 감상 */
function Generate({ d, api, onBack }: { d: Draft; api: Api; onBack: () => void }) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<SongStatus | null>(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(false);

  const start = async () => {
    setError("");
    setStatus(null);
    setElapsed(0);
    try {
      const r = await api("/api/song", {
        title: d.title, lyrics: d.lyrics, genre: d.genre, vocal: d.vocal, mood: d.mood, tempo: d.tempo, instruments: d.instruments,
      });
      setTaskId(r.taskId);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!taskId) return;
    let stop = false;
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    const poll = async () => {
      while (!stop) {
        try {
          const res = await fetch(`/api/song/${encodeURIComponent(taskId)}`);
          const s: SongStatus & { error?: string } = await res.json();
          if (!res.ok) throw new Error(s.error);
          if (stop) return;
          setStatus(s);
          if (s.status === "done" || s.status === "failed") break;
        } catch (e) {
          setError((e as Error).message || "상태를 확인하지 못했어요.");
          break;
        }
        await new Promise((r) => setTimeout(r, 5000));
      }
      clearInterval(tick);
    };
    poll();
    return () => {
      stop = true;
      clearInterval(tick);
    };
  }, [taskId]);

  const finished = status?.status === "done" || status?.status === "failed" || !!error;
  const playable = status?.tracks.filter((t) => t.audioUrl || t.streamUrl) ?? [];

  return (
    <section>
      <h2>5. 나의 노래 「{d.title}」</h2>
      <div className="card">
        {!finished && (
          <div className="loading">
            <div className="spinner" />
            <p>
              {status?.status === "streaming" ? "거의 다 됐어요! 먼저 들어볼 수 있어요." : "노래를 만들고 있어요. 보통 1~3분 정도 걸려요."}
              <br />
              <span className="muted">{elapsed}초 지남</span>
            </p>
          </div>
        )}
        {error && <p className="error">{error}</p>}
        {status?.status === "failed" && <p className="error">{status.message}</p>}

        {playable.map((t, i) => (
          <div key={t.id || i} className="track">
            {t.imageUrl && <img src={t.imageUrl} alt="" />}
            <div className="track-body">
              <strong>버전 {i + 1}</strong>
              <audio controls src={t.audioUrl || t.streamUrl} preload="none" />
              {t.audioUrl && (
                <a className="link" href={t.audioUrl} target="_blank" rel="noreferrer" download>
                  MP3 내려받기
                </a>
              )}
            </div>
          </div>
        ))}

        <details className="lyrics-view">
          <summary>가사 보기</summary>
          <pre>{d.lyrics}</pre>
        </details>

        <div className="row between">
          <button className="btn ghost" onClick={onBack}>← 설정 바꾸기</button>
          {finished && (
            <button className="btn primary" onClick={() => { setTaskId(null); start(); }}>
              다시 만들기 🔄
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
