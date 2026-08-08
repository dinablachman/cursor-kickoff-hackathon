import { useEffect, useState } from "react";

import type { Identity } from "./api";
import { api } from "./api";
import BoardPage from "./pages/BoardPage";
import IdeasPage from "./pages/IdeasPage";
import MyClaimsPage from "./pages/MyClaimsPage";
import ReposPage from "./pages/ReposPage";
import ReviewsPage from "./pages/ReviewsPage";

const TABS = ["repos", "board", "claims", "reviews", "ideas"] as const;
type Tab = (typeof TABS)[number];

const STORAGE_KEY = "bounty-board-identity";

function loadIdentity(): Identity {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Identity;
  } catch {
    // fall through to the default identity
  }
  return { username: "student-lin", role: "student" };
}

export default function App() {
  const [identity, setIdentity] = useState<Identity>(loadIdentity);
  const [tab, setTab] = useState<Tab>("board");
  const [githubMode, setGithubMode] = useState<string>("...");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  }, [identity]);

  useEffect(() => {
    api
      .health()
      .then((data) => setGithubMode(data.github_mode))
      .catch(() => setGithubMode("backend unreachable"));
  }, []);

  return (
    <>
      <header className="identity">
        <strong>Bounty Board API harness</strong>
        <label>
          acting as{" "}
          <input
            value={identity.username}
            onChange={(event) => setIdentity({ ...identity, username: event.target.value })}
          />
        </label>
        <label>
          role{" "}
          <select
            value={identity.role}
            onChange={(event) =>
              setIdentity({ ...identity, role: event.target.value as Identity["role"] })
            }
          >
            <option value="student">student</option>
            <option value="maintainer">maintainer</option>
          </select>
        </label>
        <span className="muted">github: {githubMode}</span>
      </header>

      <nav>
        {TABS.map((name) => (
          <button key={name} aria-current={tab === name} onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
      </nav>

      <main>
        {tab === "repos" && <ReposPage identity={identity} />}
        {tab === "board" && <BoardPage identity={identity} />}
        {tab === "claims" && <MyClaimsPage identity={identity} />}
        {tab === "reviews" && <ReviewsPage identity={identity} />}
        {tab === "ideas" && <IdeasPage identity={identity} />}
      </main>
    </>
  );
}
