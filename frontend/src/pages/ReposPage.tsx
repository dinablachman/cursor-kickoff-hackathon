import { useCallback, useEffect, useState } from "react";

import type { Identity, Repo } from "../api";
import { api } from "../api";

export default function ReposPage({ identity }: { identity: Identity }) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [fullName, setFullName] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      setRepos(await api.listRepos(identity));
    } catch (err) {
      setError(String(err));
    }
  }, [identity]);

  useEffect(() => {
    void load();
  }, [load]);

  async function register(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const repo = await api.registerRepo(identity, fullName, label);
      setNotice(`Registered ${repo.full_name}`);
      setFullName("");
      await load();
    } catch (err) {
      setError(String(err));
    }
  }

  async function sync(repoId: number) {
    setError("");
    setNotice("");
    try {
      const result = await api.syncRepo(identity, repoId);
      setNotice(
        `Synced from ${result.source}: ${result.created} new, ${result.updated} updated, ${result.total_issues} labeled issues`,
      );
      await load();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <section>
      <h2>Repos</h2>
      <p className="muted">Registering and syncing require the maintainer role.</p>

      <form className="row" onSubmit={register}>
        <input
          placeholder="owner/name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
        <input
          placeholder="bounty label (default: bounty)"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <button type="submit">Register repo</button>
      </form>

      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      <table>
        <thead>
          <tr>
            <th>Repo</th>
            <th>Label</th>
            <th>Maintainer</th>
            <th>Open bounties</th>
            <th>Last synced</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {repos.map((repo) => (
            <tr key={repo.id}>
              <td>{repo.full_name}</td>
              <td>{repo.bounty_label}</td>
              <td>{repo.maintainer.github_username}</td>
              <td>{repo.open_bounties}</td>
              <td>{repo.last_synced_at ? new Date(repo.last_synced_at).toLocaleString() : "never"}</td>
              <td>
                <button onClick={() => sync(repo.id)}>Sync now</button>
              </td>
            </tr>
          ))}
          {repos.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                No repos registered yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
