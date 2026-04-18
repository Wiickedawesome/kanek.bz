"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

type NameMap = Record<string, string>;

/**
 * Batch-resolves user UUIDs → display names and post UUIDs → post titles.
 * Returns lookup maps so admin pages can show human-readable labels instead of raw hashes.
 */
export function useResolveNames(
  userIds: string[],
  postIds: string[] = []
): { userName: (id: string | null) => string; postTitle: (id: string | null) => string; loading: boolean } {
  const [users, setUsers] = useState<NameMap>({});
  const [posts, setPosts] = useState<NameMap>({});
  const [loading, setLoading] = useState(false);
  const prevKey = useRef("");

  useEffect(() => {
    const uniqueUsers = [...new Set(userIds.filter(Boolean))];
    const uniquePosts = [...new Set(postIds.filter(Boolean))];
    const key = uniqueUsers.sort().join(",") + "|" + uniquePosts.sort().join(",");
    if (key === prevKey.current || (uniqueUsers.length === 0 && uniquePosts.length === 0)) return;
    prevKey.current = key;

    let cancelled = false;
    async function resolve() {
      setLoading(true);
      const results: [NameMap, NameMap] = [{}, {}];

      // Resolve users in batches of 50 (Supabase .in() limit)
      for (let i = 0; i < uniqueUsers.length; i += 50) {
        const batch = uniqueUsers.slice(i, i + 50);
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", batch);
        if (data) {
          for (const p of data) {
            results[0][p.id] = p.full_name || p.email || p.id.slice(0, 8);
          }
        }
      }

      // Resolve posts in batches of 50
      for (let i = 0; i < uniquePosts.length; i += 50) {
        const batch = uniquePosts.slice(i, i + 50);
        const { data } = await supabase
          .from("posts")
          .select("id, title")
          .in("id", batch);
        if (data) {
          for (const p of data) {
            results[1][p.id] = p.title || p.id.slice(0, 8);
          }
        }
      }

      if (!cancelled) {
        setUsers(results[0]);
        setPosts(results[1]);
        setLoading(false);
      }
    }
    resolve();
    return () => { cancelled = true; };
  }, [userIds, postIds]);

  const userName = (id: string | null) => {
    if (!id) return "—";
    return users[id] || id.slice(0, 8);
  };

  const postTitle = (id: string | null) => {
    if (!id) return "—";
    return posts[id] || id.slice(0, 8);
  };

  return { userName, postTitle, loading };
}
