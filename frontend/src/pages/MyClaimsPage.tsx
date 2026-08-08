import { useCallback, useEffect, useState } from "react";

import type { Identity, MyClaim } from "../api";
import { api } from "../api";

export default function MyClaimsPage({ identity }: { identity: Identity }) {
  const [claims, setClaims] = useState<MyClaim[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setClaims(await api.myClaims(identity));
    } catch (err) {
      setError(String(err));
    }
  }, [identity]);

  useEffect(() => {
    void load();
  }, [load]);

  async function refresh(submissionId: number) {
    try {
      await api.refreshSubmission(identity, submissionId);
      await load();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <section>
      <h2>My claims</h2>
      <p className="muted">Active claims for {identity.username}.</p>
      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Bounty</th>
            <th>Repo</th>
            <th>Status</th>
            <th>PR</th>
            <th>PR state</th>
            <th>CI</th>
            <th>Review</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.claim_id}>
              <td>{claim.bounty.title}</td>
              <td>{claim.bounty.repo_full_name}</td>
              <td>{claim.bounty.status}</td>
              <td>
                {claim.submission ? (
                  <a href={claim.submission.pr_url} target="_blank" rel="noreferrer">
                    #{claim.submission.pr_number}
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td>{claim.submission?.pr_state ?? "-"}</td>
              <td>{claim.submission?.ci_status ?? "-"}</td>
              <td>{claim.submission?.review_decision ?? "-"}</td>
              <td>
                {claim.submission && (
                  <button onClick={() => refresh(claim.submission!.id)}>Refresh</button>
                )}
              </td>
            </tr>
          ))}
          {claims.length === 0 && (
            <tr>
              <td colSpan={8} className="muted">
                No active claims.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
