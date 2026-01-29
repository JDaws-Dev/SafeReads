"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Users,
  BookOpen,
  Shield,
  CreditCard,
  MessageCircle,
  Baby,
  BarChart3,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const isAdmin = useQuery(api.admin.isAdmin);
  const stats = useQuery(api.admin.getStats);
  const users = useQuery(api.admin.listUsers);

  useEffect(() => {
    if (isAdmin === false) {
      router.replace("/dashboard");
    }
  }, [isAdmin, router]);

  if (isAdmin === undefined) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-parchment-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-lg bg-parchment-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-ink-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-ink-500">SafeReads platform overview</p>

      {/* Stats Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Users"
          value={stats?.userCount ?? "-"}
        />
        <StatCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Active Subscribers"
          value={stats?.activeSubscribers ?? "-"}
          highlight
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Books Indexed"
          value={stats?.bookCount ?? "-"}
        />
        <StatCard
          icon={<Shield className="h-5 w-5" />}
          label="Analyses"
          value={stats?.analysisCount ?? "-"}
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="User Analyses Used"
          value={stats?.totalUserAnalyses ?? "-"}
        />
        <StatCard
          icon={<Baby className="h-5 w-5" />}
          label="Kids Profiles"
          value={stats?.kidCount ?? "-"}
        />
        <StatCard
          icon={<MessageCircle className="h-5 w-5" />}
          label="Conversations"
          value={stats?.conversationCount ?? "-"}
        />
      </div>

      {/* Verdict Breakdown */}
      {stats?.verdictCounts && (
        <div className="mt-8">
          <h2 className="font-serif text-lg font-bold text-ink-900">Verdict Breakdown</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <VerdictBadge label="Safe" count={stats.verdictCounts.safe} color="bg-verdict-safe" />
            <VerdictBadge label="Caution" count={stats.verdictCounts.caution} color="bg-verdict-caution" />
            <VerdictBadge label="Warning" count={stats.verdictCounts.warning} color="bg-verdict-warning" />
            <VerdictBadge label="No Verdict" count={stats.verdictCounts.no_verdict} color="bg-parchment-400" />
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="mt-8">
        <h2 className="font-serif text-lg font-bold text-ink-900">Recent Users</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-parchment-200">
          <table className="min-w-full divide-y divide-parchment-200">
            <thead className="bg-parchment-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-500">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-500">
                  Analyses
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-500">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-100 bg-white">
              {users?.map(user => (
                <tr key={user._id} className="hover:bg-parchment-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt=""
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-parchment-200 text-xs font-medium text-parchment-600">
                          {user.name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-ink-900">{user.name || "No name"}</p>
                        <p className="text-xs text-ink-400">{user.email || "No email"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {user.subscriptionStatus === "active" ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Pro
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-parchment-100 px-2 py-0.5 text-xs font-medium text-ink-600">
                        Free
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-600">
                    {user.analysisCount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-400">
                    {new Date(user._creationTime).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? "border-parchment-400 bg-parchment-100"
          : "border-parchment-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2 text-ink-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

function VerdictBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-parchment-200 bg-white px-3 py-1.5">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <span className="text-sm text-ink-400">{count}</span>
    </div>
  );
}
