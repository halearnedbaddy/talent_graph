'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, addDoc, doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trophy, Megaphone } from 'lucide-react';
import type { ClubMatch, ClubMember, ScoutConnection, ClubProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function MatchManagementPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [isInviting, setIsInviting] = useState<string | null>(null);

    // 1. Context Data
    const clubMemberQuery = useMemoFirebase(() => (
        firestore && user ? query(collection(firestore, 'club_members'), where('userId', '==', user.uid)) : null
    ), [firestore, user]);
    const { data: userMemberships } = useCollection<ClubMember>(clubMemberQuery);
    const clubId = userMemberships?.[0]?.clubId;

    const clubRef = useMemoFirebase(() => (firestore && clubId ? doc(firestore, 'clubs', clubId) : null), [firestore, clubId]);
    const { data: clubProfile } = useDoc<ClubProfile>(clubRef);

    const matchesQuery = useMemoFirebase(() => (
        firestore && clubId ? query(collection(firestore, 'matches'), where('clubId', '==', clubId)) : null
    ), [firestore, clubId]);
    const { data: matches, isLoading: matchesLoading } = useCollection<ClubMatch>(matchesQuery);

    // 2. Get athletes connected to this club via scouts
    const connectionsQuery = useMemoFirebase(() => (
        firestore && clubId ? query(collection(firestore, 'scout_connections'), where('clubId', '==', clubId), where('status', '==', 'accepted')) : null
    ), [firestore, clubId]);
    const { data: connections } = useCollection<ScoutConnection>(connectionsQuery);
    const athleteIds = Array.from(new Set(connections?.map(c => c.athleteId) || []));

    const [newMatch, setNewMatch] = useState({
        competition: '',
        opponent: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        result: 'W' as 'W' | 'L' | 'D',
        score: ''
    });

    const handleAddMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !clubId) return;
        setIsAdding(true);
        try {
            await addDoc(collection(firestore, 'matches'), {
                ...newMatch,
                clubId,
                createdAt: new Date().toISOString()
            });
            toast({ title: 'Match Arranged', description: 'Institutional fixture created.' });
            setNewMatch({ competition: '', opponent: '', date: new Date().toISOString().split('T')[0], location: '', result: 'W', score: '' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create match.' });
        } finally {
            setIsAdding(false);
        }
    };

    const handleNotifySquad = async (match: ClubMatch) => {
        if (!firestore || !athleteIds.length) {
            toast({ variant: 'destructive', title: 'No Squad Members', description: 'You need accepted athlete connections to send notifications.' });
            return;
        }
        setIsInviting(match.id);
        
        try {
            const invitePromises = athleteIds.map(athleteId => {
                const inviteId = `${match.id}_${athleteId}`;
                return setDoc(doc(firestore, 'match_invitations', inviteId), {
                    id: inviteId,
                    athleteId,
                    matchId: match.id,
                    clubId: match.clubId,
                    status: 'pending',
                    matchData: {
                        competition: match.competition,
                        opponent: match.opponent,
                        date: match.date,
                        location: match.location
                    },
                    createdAt: new Date().toISOString()
                });
            });

            await Promise.all(invitePromises);
            toast({ title: 'Squad Notified', description: `Invitations sent to ${athleteIds.length} players.` });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send notifications.' });
        } finally {
            setIsInviting(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <Card className="border-none shadow-xl bg-background overflow-hidden">
                    <CardHeader className="bg-neutral-900 text-white">
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                            <Plus className="w-4 h-4 text-primary" /> Arrange New Match
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleAddMatch} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Competition</Label>
                                <Select value={newMatch.competition} onValueChange={v => setNewMatch({...newMatch, competition: v})}>
                                    <SelectTrigger className="h-9 font-bold">
                                        <SelectValue placeholder="Select Competition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clubProfile?.settings?.competitions?.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                        {!clubProfile?.settings?.competitions?.length && (
                                            <p className="p-2 text-xs text-muted-foreground">No competitions defined in Settings.</p>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Opponent</Label>
                                <Input value={newMatch.opponent} onChange={e => setNewMatch({...newMatch, opponent: e.target.value})} className="h-9 font-bold" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</Label>
                                    <Input type="date" value={newMatch.date} onChange={e => setNewMatch({...newMatch, date: e.target.value})} className="h-9 font-bold" required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Result</Label>
                                    <Select value={newMatch.result} onValueChange={(v: any) => setNewMatch({...newMatch, result: v})}>
                                        <SelectTrigger className="h-9 font-bold"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="W">WIN</SelectItem>
                                            <SelectItem value="L">LOSS</SelectItem>
                                            <SelectItem value="D">DRAW</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-10 font-black uppercase tracking-widest" disabled={isAdding}>
                                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Record'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" /> Active Fixtures
                </h3>
                
                {matchesLoading ? (
                    <div className="flex h-32 items-center justify-center"><Loader2 className="animate-spin" /></div>
                ) : matches?.length ? (
                    <div className="grid gap-4">
                        {matches.sort((a,b) => b.date.localeCompare(a.date)).map(m => (
                            <Card key={m.id} className="border-none shadow-sm bg-background hover:shadow-md transition-all">
                                <div className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center font-black text-muted-foreground">
                                            {m.opponent[0]}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">{m.competition}</p>
                                            <h3 className="text-lg font-black uppercase mt-0.5">vs {m.opponent}</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                {format(new Date(m.date), 'PPPP')} &bull; {m.location || 'Stadium'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        className="gap-2 font-black text-[10px] uppercase tracking-widest h-10 px-6"
                                        onClick={() => handleNotifySquad(m)}
                                        disabled={isInviting === m.id}
                                    >
                                        {isInviting === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Megaphone className="w-3.5 h-3.5" />}
                                        Notify Squad
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed rounded-3xl opacity-20">
                        <Trophy className="w-12 h-12 mb-2" />
                        <p className="font-black uppercase text-xs tracking-widest">No scheduled matches</p>
                    </div>
                )}
            </div>
        </div>
    );
}