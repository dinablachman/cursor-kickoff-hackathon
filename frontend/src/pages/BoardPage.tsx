import { useCallback, useEffect, useState } from "react";

import type { Bounty, Identity, Repo } from "../api";
import { api } from "../api";

export default function BoardPage({ identity }: { identity: Identity }) {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [filters, setFilters] = useState({ repo_id: "", difficulty: "", status: "" });
  const [selected, setSelected] = useState<Bounty | null>(null);
  const [prUrl, setPrUrl] = useState("");
  const [newBounty, setNewBounty] = useState({ title: "", description: "", difficulty: "medium" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [bountyList, repoList] = await Promise.all([
        api.listBounties(identity, filters),
        api.listRepos(identity),
      ]);
      setBounties(bountyList);
      setRepos(repoList);
    } catch (err) {
      setError(String(err));
    }
  }, [identity, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<unknown>, message: string) {
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      await load();
      if (selected) setSelected(await api.getBounty(identity, selected.id));
    } catch (err) {
      setError(String(err));
    }
  }

  async function createBounty(event: React.FormEvent) {
    event.preventDefault();
    const repoId = Number(filters.repo_id);
    if (!repoId) {
      setError("Pick a repo in the filter above to post a manual bounty");
      return;
    }
    await run(
      () =>
        api.createBounty(identity, {
          repo_id: repoId,
          title: newBounty.title,
          description: newBounty.description || undefined,
          difficulty: newBounty.difficulty,
        }),
      "Bounty posted",
    );
    setNewBounty({ title: "", description: "", difficulty: "medium" });
  }

  return (
    <section>
      <h2>Board</h2>

      <form className="row" onSubmit={(event) => event.preventDefault()}>
        <select
          value={filters.repo_id}
          onChange={(event) => setFilters({ ...filters, repo_id: event.target.value })}
        >
          <option value="">all repos</option>
          {repos.map((repo) => (
            <option key={repo.id} value={repo.id}>
              {repo.full_name}
            </option>
          ))}
        </select>
        <select
          value={filters.difficulty}
          onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })}
        >
          <option value="">any difficulty</option>
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>
        <select
          value={filters.status}
          onChange={(event) => setFilters({ ...filters, status: event.target.value })}
        >
          <option value="">any status</option>
          <option value="open">open</option>
          <option value="claimed">claimed</option>
          <option value="in_review">in_review</option>
          <option value="completed">completed</option>
        </select>
      </form>

      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Repo</th>
            <th>Difficulty</th>
            <th>Status</th>
            <th>Claimed by</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {bounties.map((bounty) => (
            <tr key={bounty.id}>
              <td>{bounty.title}</td>
              <td>{bounty.repo_full_name}</td>
              <td>{bounty.difficulty}</td>
              <td>{bounty.status}</td>
              <td>{bounty.active_claim?.user.github_username ?? "-"}</td>
              <td>
                <button onClick={() => setSelected(bounty)}>Open</button>
              </td>
            </tr>
          ))}
          {bounties.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                No bounties match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {identity.role === "maintainer" && (
        <form className="row" onSubmit={createBounty}>
          <input
            placeholder="manual bounty title"
            value={newBounty.title}
            onChange={(event) => setNewBounty({ ...newBounty, title: event.target.value })}
            required
          />
          <input
            placeholder="description"
            value={newBounty.description}
            onChange={(event) => setNewBounty({ ...newBounty, description: event.target.value })}
          />
          <select
            value={newBounty.difficulty}
            onChange={(event) => setNewBounty({ ...newBounty, difficulty: event.target.value })}
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
          <button type="submit">Post bounty to selected repo filter</button>
        </form>
      )}

      {selected && (
        <div className="detail">
          <h3>{selected.title}</h3>
          <p>
            <span className="badge">{selected.repo_full_name}</span>
            <span className="badge">{selected.difficulty}</span>
            <span className="badge">{selected.status}</span>
            <span className="badge">{selected.source}</span>
          </p>
          <p style={{ whiteSpace: "pre-wrap" }}>{selected.description ?? "No description."}</p>
          {selected.github_issue_url && (
            <p>
              <a href={selected.github_issue_url} target="_blank" rel="noreferrer">
                GitHub issue #{selected.github_issue_number}
              </a>
            </p>
          )}
          {selected.latest_submission && (
            <p className="muted">
              Latest submission: {selected.latest_submission.pr_url} (PR{" "}
              {selected.latest_submission.pr_state}, CI {selected.latest_submission.ci_status},
              review {selected.latest_submission.review_decision})
            </p>
          )}

          <div className="row">
            <button onClick={() => run(() => api.claimBounty(identity, selected.id), "Claimed")}>
              Claim
            </button>
            <button onClick={() => run(() => api.releaseBounty(identity, selected.id), "Released")}>
              Release
            </button>
            <button onClick={() => setSelected(null)}>Close</button>
          </div>

          <form
            className="row"
            onSubmit={async (event) => {
              event.preventDefault();
              await run(() => api.submitPr(identity, selected.id, prUrl), "PR submitted");
              setPrUrl("");
            }}
          >
            <input
              placeholder="https://github.com/owner/repo/pull/123"
              value={prUrl}
              onChange={(event) => setPrUrl(event.target.value)}
              size={48}
              required
            />
            <button type="submit">Submit PR</button>
          </form>
        </div>
      )}
    </section>
  );
}
