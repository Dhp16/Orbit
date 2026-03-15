
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { getContacts, getEntries, createContact } from "@/lib/actions"
import { NewEntryForm } from "@/components/NewEntryForm"
import { DashboardTabs } from "@/components/DashboardTabs"
import Link from "next/link"

export default async function DashboardPage() {
    const skipAuth = process.env.SKIP_AUTH === "true"
    const session = skipAuth ? null : await auth()
    if (!skipAuth && !session) redirect("/")

    const contacts = await getContacts()
    const entries = await getEntries()

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            {/* Navigation Bar */}
            <nav className="border-b border-white/10 backdrop-blur-md bg-black/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-sm">
                                OB
                            </div>
                            <span className="font-semibold text-lg tracking-tight">Orbit</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Online
                            </div>
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* New Entry Form */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="text-purple-400">✦</span> New Entry
                            </h2>
                            <NewEntryForm contacts={contacts} />
                        </div>

                        {/* New Contact Form */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="text-purple-400">+</span> New Person
                            </h2>
                            <form action={createContact} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Name</label>
                                    <input type="text" name="name" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all" placeholder="Jane Doe" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Email</label>
                                    <input type="email" name="email" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all" placeholder="jane@example.com" />
                                </div>
                                <button type="submit" className="w-full py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors">
                                    Add to Orbit
                                </button>
                            </form>
                        </div>

                        {/* Chat Placeholder */}
                        <Link href="/dashboard/chat" className="block group">
                            <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
                                <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-blue-300">
                                    Chat with Orbit &rarr;
                                </h3>
                                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                                    Ask questions about your contacts and get instant insights.
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        <DashboardTabs entries={entries} contacts={contacts} />
                    </div>
                </div>
            </main>
        </div>
    )
}
