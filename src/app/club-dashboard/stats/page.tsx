'use client';

import React, { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Trophy, Users, Activity, TrendingUp, Target, Loader2 } from 'lucide-react';
import type { ClubMatch, ClubMember, AthleteProfile } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function StatisticsHubPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

    const clubMemberQuery = useMemoFirebase(() => (
        firestore && user ? query(collection(firestore, 'club_members'), where('userId', '==', user.uid)) : null
    ), [firestore, user]);
    const { data: userMemberships } = useCollection<ClubMember>(clubMemberQuery);
    const clubId = userMemberships?.[0]?.clubId;

    const matchesQuery = useMemoFirebase(() => (
        firestore && clubId ? query(collection(firestore, 'matches'), where('clubId', '==', clubId)) : null
    ), [firestore, clubId]);
    const { data: matches } = useCollection<ClubMatch>(matchesQuery);

    const athletesQuery = useMemoFirebase(() => (
        firestore && clubId ? query(collection(firestore, 'athletes'), where('affiliatedClubId', '==', clubId)) : null
    ), [firestore, clubId]);
    const { data: athletes } = useCollection<AthleteProfile>(athletesQuery);

    const teamStats = useMemo(() => {
        if (!matches) return { W: 0, L: 0, D: 0, GS: 0, GC: 0 };
        return matches.reduce((acc, m) => {
            if (m.result === 'W') acc.W++;
            if (m.result === 'L') acc.L++;
            if (m.result === 'D') acc.D++;
            // Simple score parsing "2-1"
            const parts = m.score?.split('-') || ['0', '0'];
            acc.GS += Number(parts[0]) || 0;
            acc.GC += Number(parts[1]) || 0;
            return acc;
        }, { W: 0, L: 0, D: 0, GS: 0, GC: 0 });
    }, [matches]);

    const athletePerformance = selectedAthleteId ? athletes?.find(a => a.uid === selectedAthleteId) : null;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">Statistics Hub</h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Organization-wide data aggregates</p>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-background border p-1 h-10 mb-8">
                    <TabsTrigger value="overview" className="text-[10px] font-black uppercase px-6">Team Overview</TabsTrigger>
                    <TabsTrigger value="leaderboard" className="text-[10px] font-black uppercase px-6">Player Ranks</TabsTrigger>
                    <TabsTrigger value="individual" className="text-[10px] font-black uppercase px-6">Player Breakdown</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <StatCard label="Matches Won" value={teamStats.W} icon={Trophy} sub="Institutional Success" />
                        <StatCard label="Matches Lost" value={teamStats.L} icon={Target} sub="Performance Gap" />
                        <StatCard label="Drawn" value={teamStats.D} icon={Activity} sub="Neutral Output" />
                        <StatCard label="Goals Scored" value={teamStats.GS} icon={TrendingUp} sub="Total Attack" color="text-green-600" />
                        <StatCard label="Conceded" value={teamStats.GC} icon={Activity} sub="Defensive Load" color="text-red-600" />
                    </div>

                    <Card className="border-none shadow-xl bg-background overflow-hidden">
                        <CardHeader className="bg-neutral-50 border-b">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Win/Loss Ratio</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="flex items-center gap-2 h-8 w-full rounded-2xl overflow-hidden bg-muted">
                                <div className="h-full bg-green-600" style={{ width: `${(teamStats.W / (matches?.length || 1)) * 100}%` }} />
                                <div className="h-full bg-neutral-400" style={{ width: `${(teamStats.D / (matches?.length || 1)) * 100}%` }} />
                                <div className="h-full bg-red-600" style={{ width: `${(teamStats.L / (matches?.length || 1)) * 100}%` }} />
                            </div>
                            <div className="flex justify-between mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <span>Win Rate: {Math.round((teamStats.W / (matches?.length || 1)) * 100)}%</span>
                                <span>Total Sample: {matches?.length || 0} Games</span>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="leaderboard">
                    <Card className="border-none shadow-2xl bg-background overflow-hidden">
                        <CardHeader className="bg-neutral-900 text-white">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Institutional Leaderboard</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-neutral-50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[9px] font-black uppercase">Athlete</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-center">Goals</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-center">Assists</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-center">Avg Rating</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase text-right">CSI</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {athletes?.sort((a,b) => (b.compositeScoutingIndex || 0) - (a.compositeScoutingIndex || 0)).map(a => {
                                        const career = a.matchHistory || [];
                                        const goals = career.reduce((acc, m) => acc + (Number(m.goals) || 0), 0);
                                        const assists = career.reduce((acc, m) => acc + (Number(m.assists) || 0), 0);
                                        const ratingSum = career.reduce((acc, m) => acc + ((Number(m.rating) || 0) * (Number(m.apps) || 0)), 0);
                                        const totalApps = career.reduce((acc, m) => acc + (Number(m.apps) || 0), 0);
                                        const avg = totalApps > 0 ? (ratingSum / totalApps).toFixed(1) : '--';

                                        return (
                                            <TableRow key={a.uid} className="hover:bg-muted/30">
                                                <TableCell className="font-black uppercase text-xs">{a.firstName} {a.lastName}</TableCell>
                                                <TableCell className="text-center font-mono text-xs">{goals}</TableCell>
                                                <TableCell className="text-center font-mono text-xs">{assists}</TableCell>
                                                <TableCell className="text-center font-black text-primary text-xs">{avg}</TableCell>
                                                <TableCell className="text-right font-black text-primary">{a.compositeScoutingIndex || '--'}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="individual">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Squad Member</h3>
                            <div className="divide-y bg-background border rounded-xl overflow-hidden">
                                {athletes?.map(a => (
                                    <div key={a.uid} onClick={() => setSelectedAthleteId(a.uid)} className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${selectedAthleteId === a.uid ? 'bg-primary/5 border-l-4 border-primary' : ''}`}>
                                        <p className="text-xs font-black uppercase">{a.firstName} {a.lastName}</p>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{a.position}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:col-span-3">
                            {athletePerformance ? (
                                <Card className="border-none shadow-2xl bg-background overflow-hidden">
                                    <CardHeader className="bg-neutral-50 border-b p-8">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <CardTitle className="text-2xl font-black uppercase tracking-tight">{athletePerformance.firstName} {athletePerformance.lastName}</CardTitle>
                                                <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mt-1">{athletePerformance.readinessTier || 'Developing'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-5xl font-black tracking-tighter leading-none">{athletePerformance.compositeScoutingIndex || '--'}</p>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Institutional Rating</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="grid grid-cols-2 md:grid-cols-4 border-b">
                                            <MetricItem label="Efficiency" value={athletePerformance.efficiencyIndex} />
                                            <MetricItem label="Consistency" value={athletePerformance.consistencyIndex} />
                                            <MetricItem label="Risk Index" value={athletePerformance.riskIndex} />
                                            <MetricItem label="Performance" value={athletePerformance.performanceIndex} />
                                        </div>
                                        <Table>
                                            <TableHeader className="bg-neutral-50/50">
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="text-[9px] font-black uppercase">Competition</TableHead>
                                                    <TableHead className="text-[9px] font-black uppercase text-center">Mins</TableHead>
                                                    <TableHead className="text-[9px] font-black uppercase text-center">G/A</TableHead>
                                                    <TableHead className="text-[9px] font-black uppercase text-right">Rating</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {athletePerformance.matchHistory?.map((m, i) => (
                                                    <TableRow key={i} className="hover:bg-muted/30">
                                                        <TableCell className="text-xs font-bold uppercase">{m.competition}</TableCell>
                                                        <TableCell className="text-center font-mono text-xs">{m.minutes}</TableCell>
                                                        <TableCell className="text-center font-mono text-xs">{m.goals}/{m.assists}</TableCell>
                                                        <TableCell className="text-right font-black text-primary text-xs">{Number(m.rating || 0).toFixed(1)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground bg-muted/10 rounded-3xl border-4 border-dashed">
                                    <Activity className="w-16 h-16 mb-4 opacity-10" />
                                    <p className="font-black uppercase tracking-widest">Select an athlete to view performance breakdown</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, sub, color }: any) {
    return (
        <Card className="border-none shadow-sm bg-background">
            <CardHeader className="p-4 pb-2 space-y-0 flex flex-row items-center justify-between">
                <CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</CardTitle>
                <Icon className="w-3 h-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className={`text-2xl font-black ${color || 'text-foreground'}`}>{value}</div>
                <p className="text-[8px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">{sub}</p>
            </CardContent>
        </Card>
    );
}

function MetricItem({ label, value }: { label: string, value?: number }) {
    return (
        <div className="p-6 text-center border-r last:border-0 hover:bg-muted/20 transition-colors">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-black">{value || '--'}</p>
        </div>
    );
}