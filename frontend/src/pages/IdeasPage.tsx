import { useCallback, useEffect, useState } from "react";

import type { Idea, IdeaDetail, Identity, Repo } from "../api";
import { api } from "../api";

export default function IdeasPage({ identity }: { identity: Identity }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [filters, setFilters] = useState({ category: "", status: "", sort: "top" });
  const [selected, setSelected] = useState<IdeaDetail | null>(null);
  const [draft, setDraft] = useState({ title: "", description: "", category: "feature", repo_id: "" });
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [ideaList, repoList] = await Promise.all([
        api.listIdeas(identity, filters),
        api.listRepos(identity),
      ]);
      setIdeas(ideaList);
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
      if (selected) setSelected(await api.getIdea(identity, selected.id));
    } catch (err) {
      setError(String(err));
    }
  }

  async function open(ideaId: number) {
    setError("");
    try {
      setSelected(await api.getIdea(identity, ideaId));
    } catch (err) {
      setError(String(err));
    }
  }

  async function submitIdea(event: React.FormEvent) {
    event.preventDefault();
    await run(
      () =>
        api.createIdea(identity, {
          title: draft.title,
          description: draft.description || undefined,
          category: draft.category,
          repo_id: draft.repo_id ? Number(draft.repo_id) : null,
        }),
      "Idea posted",
    );
    setDraft({ title: "", description: "", category: "feature", repo_id: "" });
  }

  return (
    <section>
      <h2>Ideas</h2>

      <form className="row" onSubmit={(event) => event.preventDefault()}>
        <select
          value={filters.category}
          onChange={(event) => setFilters({ ...filters, category: event.target.value })}
        >
          <option value="">all categories</option>
          <option value="feature">feature</option>
          <option value="new-app">new-app</option>
        </select>
        <select
          value={filters.status}
          onChange={(event) => setFilters({ ...filters, status: event.target.value })}
        >
          <option value="">any status</option>
          <option value="open">open</option>
          <option value="planned">planned</option>
          <option value="done">done</option>
        </select>
        <select
          value={filters.sort}
          onChange={(event) => setFilters({ ...filters, sort: event.target.value })}
        >
          <option value="top">top</option>
          <option value="new">newest</option>
        </select>
      </form>

      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      <table>
        <thead>
          <tr>
            <th>Score</th>
            <th>Title</th>
            <th>Category</th>
            <th>Repo</th>
            <th>Status</th>
            <th>By</th>
            <th>Vote</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {ideas.map((idea) => (
            <tr key={idea.id}>
              <td>{idea.score}</td>
              <td>{idea.title}</td>
              <td>{idea.category}</td>
              <td>{idea.repo_full_name ?? "-"}</td>
              <td>{idea.status}</td>
              <td>{idea.author.github_username}</td>
              <td>
                <button
                  onClick={() =>
                    run(
                      () => api.voteIdea(identity, idea.id, idea.my_vote === 1 ? 0 : 1),
                      "Vote updated",
                    )
                  }
                >
                  {idea.my_vote === 1 ? "un-upvote" : "upvote"}
                </button>
                <button
                  onClick={() =>
                    run(
                      () => api.voteIdea(identity, idea.id, idea.my_vote === -1 ? 0 : -1),
                      "Vote updated",
                    )
                  }
                >
                  {idea.my_vote === -1 ? "un-downvote" : "downvote"}
                </button>
              </td>
              <td>
                <button onClick={() => open(idea.id)}>Open</button>
              </td>
            </tr>
          ))}
          {ideas.length === 0 && (
            <tr>
              <td colSpan={8} className="muted">
                No ideas yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <form className="row" onSubmit={submitIdea}>
        <input
          placeholder="idea title"
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          required
        />
        <input
          placeholder="description"
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
        <select
          value={draft.category}
          onChange={(event) =>
            setDraft({
              ...draft,
              category: event.target.value,
              repo_id: event.target.value === "new-app" ? "" : draft.repo_id,
            })
          }
        >
          <option value="feature">feature</option>
          <option value="new-app">new-app</option>
        </select>
        <select
          value={draft.repo_id}
          disabled={draft.category === "new-app"}
          onChange={(event) => setDraft({ ...draft, repo_id: event.target.value })}
        >
          <option value="">no repo</option>
          {repos.map((repo) => (
            <option key={repo.id} value={repo.id}>
              {repo.full_name}
            </option>
          ))}
        </select>
        <button type="submit">Post idea</button>
      </form>

      {selected && (
        <div className="detail">
          <h3>{selected.title}</h3>
          <p>
            <span className="badge">score {selected.score}</span>
            <span className="badge">{selected.category}</span>
            <span className="badge">{selected.status}</span>
            {selected.repo_full_name && <span className="badge">{selected.repo_full_name}</span>}
          </p>
          <p style={{ whiteSpace: "pre-wrap" }}>{selected.description ?? "No description."}</p>

          {identity.role === "maintainer" && (
            <div className="row">
              <button
                onClick={() => run(() => api.setIdeaStatus(identity, selected.id, "planned"), "Marked planned")}
              >
                Mark planned
              </button>
              <button
                onClick={() => run(() => api.setIdeaStatus(identity, selected.id, "done"), "Marked done")}
              >
                Mark done
              </button>
              <button
                onClick={() => run(() => api.convertIdea(identity, selected.id), "Converted to bounty")}
              >
                Convert to bounty
              </button>
            </div>
          )}

          <h4>Comments</h4>
          <ul>
            {selected.comments.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.author.github_username}</strong>: {entry.body}
              </li>
            ))}
            {selected.comments.length === 0 && <li className="muted">No comments yet.</li>}
          </ul>

          <form
            className="row"
            onSubmit={async (event) => {
              event.preventDefault();
              await run(() => api.commentOnIdea(identity, selected.id, comment), "Comment added");
              setComment("");
            }}
          >
            <input
              placeholder="add a comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              size={48}
              required
            />
            <button type="submit">Comment</button>
          </form>

          <button onClick={() => setSelected(null)}>Close</button>
        </div>
      )}
    </section>
  );
}
