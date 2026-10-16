import { useEffect, useState } from 'react';
import { GITHUB_USER } from '../data/universe.js';

// Live repo stats (stars, language, last push). One unauthenticated request per
// visit, cached in sessionStorage; the site works unchanged if it fails.
export default function useGithubRepos() {
  const [repos, setRepos] = useState({});
  useEffect(() => {
    const key = `gh-repos-${GITHUB_USER}`;
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        setRepos(JSON.parse(cached));
        return;
      }
    } catch { /* storage unavailable */ }
    let cancelled = false;
    fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return;
        const map = {};
        for (const r of list) {
          map[r.name] = { stars: r.stargazers_count, language: r.language, pushed: r.pushed_at, forks: r.forks_count };
        }
        setRepos(map);
        try { sessionStorage.setItem(key, JSON.stringify(map)); } catch { /* ignore */ }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return repos;
}
