'use client';

import { MatchEntry } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldCheck, Clock } from 'lucide-react';

export function MatchStatisticsTable({ matchHistory }: { matchHistory: MatchEntry[] }) {
  const totals = matchHistory.reduce((acc, m) => ({
    apps: acc.apps + (Number(m.apps) || 0),
    minutes: acc.minutes + (Number(m.minutes) || 0),
    ratingSum: acc.ratingSum + ((Number(m.rating) || 0) * (Number(m.apps) || 0)),
    goals: acc.goals + (Number(m.goals) || 0),
    assists: acc.assists + (Number(m.assists) || 0),
    shots: acc.shots + (Number(m.shots) || 0),
    duels: acc.duels + (Number(m.duelsWon) || 0),
    fouls: acc.fouls + (Number(m.fouls) || 0),
    saves: acc.saves + (Number(m.saves) || 0),
    yellows: acc.yellows + (Number(m.yellowCards) || 0),
    reds: acc.reds + (Number(m.redCards) || 0)
  }), { apps: 0, minutes: 0, ratingSum: 0, goals: 0, assists: 0, shots: 0, duels: 0, fouls: 0, saves: 0, yellows: 0, reds: 0 });

  const avgRating = totals.apps > 0 ? (totals.ratingSum / totals.apps).toFixed(2) : '--';

  return (
    <div className="rounded-xl border bg-background overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="font-black text-[10px] uppercase tracking-widest">Comp</TableHead>
            <TableHead className="text-center font-black text-[10px] uppercase tracking-widest">Apps</TableHead>
            <TableHead className="text-center font-black text-[10px] uppercase tracking-widest">Min</TableHead>
            <TableHead className="text-center font-black text-[10px] uppercase tracking-widest text-primary">Rating</TableHead>
            <TableHead className="text-center font-black text-[10px] uppercase tracking-widest">G</TableHead>
            <TableHead className="text-center font-black text-[10px] uppercase tracking-widest">A</TableHead>
            <TableHead className="text-center font-black text-[10px] uppercase tracking-widest">Sh</TableHead>
            <TableHead className="text-center font-black text-[10px] uppercase tracking-widest">Dwon</TableHead>
            <TableHead className="text-center font-black text-[10px] uppercase tracking-widest">Sav</TableHead>
            <TableHead className="text-center font-black text-[10px] uppercase tracking-widest text-red-500">Y/R</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matchHistory.map((m) => (
            <TableRow key={m.id} className="hover:bg-muted/30">
              <TableCell className="font-bold text-xs">{m.competition}</TableCell>
              <TableCell className="text-center text-xs font-mono">{Number(m.apps) || 0}</TableCell>
              <TableCell className="text-center text-xs font-mono">{Number(m.minutes) || 0}</TableCell>
              <TableCell className="text-center text-xs font-black text-primary">{(Number(m.rating) || 0).toFixed(1)}</TableCell>
              <TableCell className="text-center text-xs font-mono">{Number(m.goals) || 0}</TableCell>
              <TableCell className="text-center text-xs font-mono">{Number(m.assists) || 0}</TableCell>
              <TableCell className="text-center text-xs font-mono">{Number(m.shots) || 0}</TableCell>
              <TableCell className="text-center text-xs font-mono">{Number(m.duelsWon) || 0}</TableCell>
              <TableCell className="text-center text-xs font-mono">{Number(m.saves) || 0}</TableCell>
              <TableCell className="text-center text-xs font-mono font-bold">{(Number(m.yellowCards) || 0)}/{(Number(m.redCards) || 0)}</TableCell>
              <TableCell className="text-right">
                {m.isVerified ? <ShieldCheck className="w-3 h-3 text-green-500 inline" /> : <Clock className="w-3 h-3 text-muted-foreground inline" />}
              </TableCell>
            </TableRow>
          ))}
          
          <TableRow className="bg-neutral-950 text-white font-bold hover:bg-neutral-900 border-none">
            <TableCell className="uppercase text-[10px] tracking-widest">All Time</TableCell>
            <TableCell className="text-center font-mono">{totals.apps}</TableCell>
            <TableCell className="text-center font-mono">{totals.minutes}</TableCell>
            <TableCell className="text-center font-black text-primary">{avgRating}</TableCell>
            <TableCell className="text-center font-mono">{totals.goals}</TableCell>
            <TableCell className="text-center font-mono">{totals.assists}</TableCell>
            <TableCell className="text-center font-mono">{totals.shots}</TableCell>
            <TableCell className="text-center font-mono">{totals.duels}</TableCell>
            <TableCell className="text-center font-mono">{totals.saves}</TableCell>
            <TableCell className="text-center font-mono text-red-400">{totals.yellows}/{totals.reds}</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}