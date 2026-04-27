"use client";

import { useEffect, useState, useRef } from "react";
import { resolveAdminNames } from "@/lib/admin-backend";

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
      try {
        const results = await resolveAdminNames(uniqueUsers, uniquePosts);
        if (!cancelled) {
          setUsers(results.users);
          setPosts(results.posts);
        }
      } catch (error) {
        console.error("resolveAdminNames error:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void resolve();
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
