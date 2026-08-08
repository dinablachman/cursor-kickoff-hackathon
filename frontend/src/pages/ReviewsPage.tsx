import { useCallback, useEffect, useState } from "react";

import type { Identity, Submission } from "../api";
import { api } from "../api";

export default function ReviewsPage({ identity }: { identity: Identity }) {
  const [queue, setQueue] = useState<Submission[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setQueue(await api.reviewQueue(identity));
    } catch (err) {
      setError(String(err));
    }
  }, [identity]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(submission: Submission, decision: string) {
    setError("");
    setNotice("");
    try {
      await api.review(identity, submission.id, decision, notes[submission.id]);
      setNotice(`Recorded ${decision} for PR #${submission.pr_number}`);
      await load();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <section>
      <h2>Review queue</h2>
      <p className="muted">
        Maintainer-only. Approving requires the PR to be merged on GitHub; code review itself
        happens on GitHub.
      </p>
      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      {queue.map((submission) => (
        <div className="detail" key={submission.id}>
          <h3>{submission.bounty_title}</h3>
          <p>
            <span className="badge">{submission.repo_full_name}</span>
            <span className="badge">by {submission.submitter.github_username}</span>
            <span className="badge">PR {submission.pr_state}</span>
            <span className="badge">CI {submission.ci_status ?? "unknown"}</span>
          </p>
          {submission.ci_status !== "success" && (
            <p className="error">
              {submission.ci_status === "none"
                ? "No CI configured on this repo — review manually."
                : `CI is ${submission.ci_status}.`}
            </p>
          )}
          <p>
            <a href={submission.pr_url} target="_blank" rel="noreferrer">
              {submission.pr_url}
            </a>
          </p>
          <div className="row">
            <input
              placeholder="review note (optional)"
              value={notes[submission.id] ?? ""}
              onChange={(event) => setNotes({ ...notes, [submission.id]: event.target.value })}
              size={40}
            />
            <button onClick={() => decide(submission, "approve")}>Approve</button>
            <button onClick={() => decide(submission, "request_changes")}>Request changes</button>
            <button onClick={() => decide(submission, "reject")}>Reject</button>
          </div>
        </div>
      ))}

      {queue.length === 0 && !error && <p className="muted">Nothing pending review.</p>}
    </section>
  );
}
