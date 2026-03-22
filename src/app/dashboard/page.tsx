
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { getContacts, getEntries } from "@/lib/actions"
import { MobileDashboard } from "@/components/MobileDashboard"

export default async function DashboardPage() {
    const skipAuth = process.env.SKIP_AUTH === "true"
    const session = skipAuth ? null : await auth()
    if (!skipAuth && !session) redirect("/")

    const contacts = await getContacts()
    const entries = await getEntries()
    const allTags = [...new Set(entries.flatMap(e => e.tags))].sort()

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            {/* Navigation Bar */}
            <nav className="border-b border-white/10 backdrop-blur-md bg-black/50 sticky top-0 z-50">
                <div className="max-w-2xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-sm">
                                OB
                            </div>
                            <span className="font-semibold text-lg tracking-tight">Orbit</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <form action={async () => {
                                'use server';
                                await signOut();
                            }}>
                                <button className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Sign Out
                                </button>
                            </form>
                            {session?.user?.image && (
                                <img
                                    src={session.user.image}
                                    alt="Profile"
                                    className="h-8 w-8 rounded-full border border-white/10"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <MobileDashboard contacts={contacts} entries={entries} allTags={allTags} />
        </div>
    )
}
