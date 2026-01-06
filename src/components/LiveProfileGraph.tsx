"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

// Dynamic import for 3D graph (SSR issues)
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-lg">
      <span className="text-white/60 text-xs">Loading...</span>
    </div>
  ),
});

interface ProfileItem {
  id?: number;
  item_type: string;
  value: string;
  metadata?: { job_title?: string; company_url?: string };
  confirmed: boolean;
}

interface GraphNode {
  id: string;
  name: string;
  type: "user" | "location" | "role" | "company" | "skill" | "industry";
  val: number;
}

interface GraphLink {
  source: string;
  target: string;
}

interface LiveProfileGraphProps {
  userId?: string;
  userName?: string;
  refreshTrigger?: number;
}

// Type labels for display
const TYPE_LABELS: Record<string, string> = {
  location: "Location",
  role_preference: "Target Role",
  role: "Target Role",
  company: "Company",
  skill: "Skill",
  industry: "Industry",
  experience: "Experience",
};

// Type colors
const TYPE_COLORS: Record<string, string> = {
  location: "#22C55E",
  role_preference: "#3B82F6",
  role: "#3B82F6",
  company: "#F97316",
  skill: "#A855F7",
  industry: "#EC4899",
};

export function LiveProfileGraph({ userId, userName, refreshTrigger }: LiveProfileGraphProps) {
  const [profileItems, setProfileItems] = useState<ProfileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const fetchData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/user-profile?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          setProfileItems(data.items);
          console.log("📊 Profile items:", data.items.length);
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchData();
    }
  }, [refreshTrigger, fetchData]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [userId, fetchData]);

  // Visual pulse when data updates
  const [justUpdated, setJustUpdated] = useState(false);

  // Delete item
  const handleDelete = async (item: ProfileItem) => {
    if (!userId || !item.id) return;

    // Optimistic update
    setProfileItems(prev => prev.filter(p => p.id !== item.id));

    try {
      await fetch(`/api/user-profile?userId=${userId}&itemId=${item.id}`, {
        method: 'DELETE',
      });
      console.log("🗑️ Deleted:", item.value);
    } catch (e) {
      console.error("Failed to delete:", e);
      fetchData(); // Revert on error
    }
  };

  // Trigger pulse animation when items change
  useEffect(() => {
    if (profileItems.length > 0) {
      setJustUpdated(true);
      const timer = setTimeout(() => setJustUpdated(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [profileItems.length]);

  // Save edit
  const handleSaveEdit = async (item: ProfileItem) => {
    if (!userId || !item.id || !editValue.trim()) return;

    try {
      await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          itemType: item.item_type,
          value: editValue.trim(),
          confirmed: true,
          metadata: item.metadata,
        })
      });
      setEditingId(null);
      setEditValue("");
      fetchData();
    } catch (e) {
      console.error("Failed to save:", e);
    }
  };

  // Build graph data
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [
      { id: "user", name: userName || "You", type: "user", val: 20 },
    ];
    const links: GraphLink[] = [];

    profileItems.forEach((item, i) => {
      const label = item.item_type === "company" && item.metadata?.job_title
        ? `${item.value}`
        : item.value;

      const nodeId = `item_${i}`;
      let nodeType: GraphNode["type"] = "skill";
      if (item.item_type === "location") nodeType = "location";
      else if (item.item_type === "role_preference" || item.item_type === "role") nodeType = "role";
      else if (item.item_type === "company") nodeType = "company";
      else if (item.item_type === "industry") nodeType = "industry";

      nodes.push({
        id: nodeId,
        name: label,
        type: nodeType,
        val: item.confirmed ? 16 : 12,
      });
      links.push({ source: "user", target: nodeId });
    });

    return { nodes, links };
  }, [profileItems, userName]);

  const getNodeColor = useCallback((node: GraphNode) => {
    const colors: Record<string, string> = {
      user: "#FFD700",
      location: "#22C55E",
      role: "#3B82F6",
      company: "#F97316",
      skill: "#A855F7",
      industry: "#EC4899",
    };
    return colors[node.type] || "#6B7280";
  }, []);

  if (!userId) {
    return (
      <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 text-center border border-white/10">
        <p className="text-white/60">Sign in to see your profile</p>
      </div>
    );
  }

  return (
    <div className={`bg-black/40 backdrop-blur-md rounded-xl overflow-hidden border shadow-xl transition-all duration-500 ${
      justUpdated ? 'border-green-400/50 shadow-green-400/20 shadow-lg' : 'border-white/10'
    }`}>
      {/* Header with user name */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-lg">●</span>
            <span className="text-white font-medium">{userName || "Your Profile"}</span>
            {isLoading && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
            {justUpdated && !isLoading && (
              <span className="text-green-400 text-xs animate-pulse">Updated!</span>
            )}
          </div>
          <span className="text-white/50 text-xs">{profileItems.length} items</span>
        </div>
      </div>

      {/* Main content - Graph + List side by side */}
      <div className="flex">
        {/* Left: 3D Graph */}
        <div className="w-[200px] h-[280px] border-r border-white/10">
          {profileItems.length > 0 ? (
            <ForceGraph3D
              graphData={graphData}
              width={200}
              height={280}
              backgroundColor="rgba(0,0,0,0)"
              nodeColor={(node: unknown) => getNodeColor(node as GraphNode)}
              nodeLabel={(node: unknown) => (node as GraphNode).name}
              nodeVal={(node: unknown) => (node as GraphNode).val}
              linkColor={() => "rgba(255,255,255,0.15)"}
              linkWidth={1}
              enableNodeDrag={false}
              enableNavigationControls={false}
              showNavInfo={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-white/40 text-xs text-center px-4">
                Chat to build profile
              </p>
            </div>
          )}
        </div>

        {/* Right: Text list (Blade Runner style) */}
        <div className="flex-1 p-3 max-h-[280px] overflow-y-auto">
          {profileItems.length === 0 ? (
            <div className="text-white/40 text-sm">
              <p className="mb-2">No profile data yet.</p>
              <p className="text-xs">Try saying:</p>
              <ul className="text-xs text-white/30 mt-1 space-y-1">
                <li>"I'm based in London"</li>
                <li>"I'm interested in CMO roles"</li>
                <li>"I work at Sony"</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-2">
              {profileItems.map((item) => (
                <div
                  key={item.id || `${item.item_type}-${item.value}`}
                  className="flex items-start gap-2 group"
                >
                  {/* Color dot */}
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: TYPE_COLORS[item.item_type] || "#6B7280" }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white/50 text-[10px] uppercase tracking-wide">
                      {TYPE_LABELS[item.item_type] || item.item_type}
                    </div>

                    {editingId === item.id ? (
                      <div className="flex gap-1 mt-0.5">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 bg-white/10 text-white text-sm px-2 py-0.5 rounded border border-white/20"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(item)}
                          className="text-green-400 text-xs px-1"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditValue(""); }}
                          className="text-red-400 text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm truncate">
                          {item.value}
                          {item.item_type === "company" && item.metadata?.job_title && (
                            <span className="text-white/50"> ({item.metadata.job_title})</span>
                          )}
                        </span>

                        {/* Edit/Delete buttons - show on hover */}
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                          <button
                            onClick={() => { setEditingId(item.id || null); setEditValue(item.value); }}
                            className="text-white/40 hover:text-white text-xs"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-white/40 hover:text-red-400 text-xs"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Confirmed badge */}
                        {item.confirmed && (
                          <span className="text-green-400 text-[10px]">✓</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-white/10 flex flex-wrap gap-3 text-white/60">
        <span className="text-xs flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Location
        </span>
        <span className="text-xs flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> Role
        </span>
        <span className="text-xs flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" /> Company
        </span>
        <span className="text-xs flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500" /> Skill
        </span>
      </div>
    </div>
  );
}
