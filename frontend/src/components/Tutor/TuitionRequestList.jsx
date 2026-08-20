import React from 'react';
import {
  Layers,
  FunctionSquare,
  Terminal,
  Atom,
  Cpu,
  Database,
} from 'lucide-react';

import TuitionRequestCard from './TuitionRequestCard';

const initialRequests = [
  {
    id: 1,
    name: 'Saifur Rahman',
    email: 'saifur.rahman@aust.edu',
    subject: 'Data Structures',
    level: 'University Level',
    description:
      'Need help understanding linked lists, stacks, queues and time complexity.',
    time: '2 hours ago',
    status: 'New',
    initials: 'SA',
    icon: Layers,
    iconColor: 'text-indigo-500 bg-indigo-500/10',
  },
  {
    id: 2,
    name: 'Meher Afroz',
    email: 'meher.afroz@aust.edu',
    subject: 'Discrete Mathematics',
    level: 'University Level',
    description:
      'Need help with relations, functions and proof techniques.',
    time: '5 hours ago',
    status: 'New',
    initials: 'AF',
    icon: FunctionSquare,
    iconColor: 'text-purple-500 bg-purple-500/10',
  },
  {
    id: 3,
    name: 'Rafi Ahmed',
    email: 'rafi.ahmed@aust.edu',
    subject: 'C Programming',
    level: 'University Level',
    description:
      'Having trouble in pointers and function implementation.',
    time: '1 day ago',
    status: 'New',
    initials: 'RA',
    icon: Terminal,
    iconColor: 'text-emerald-500 bg-emerald-500/10',
  },
  {
    id: 4,
    name: 'Tasnim Anika',
    email: 'tasnim.anika@aust.edu',
    subject: 'Physics',
    level: 'University Level',
    description:
      'Need concept clearing on mechanics (Newton’s laws and friction).',
    time: '2 days ago',
    status: 'Viewed',
    initials: 'TA',
    icon: Atom,
    iconColor: 'text-cyan-500 bg-cyan-500/10',
  },
  {
    id: 5,
    name: 'Mahin Jannat',
    email: 'mahin.jannat@aust.edu',
    subject: 'Calculus',
    level: 'University Level',
    description:
      'Help needed with differentiation and integration techniques.',
    time: '3 days ago',
    status: 'Viewed',
    initials: 'MJ',
    icon: Cpu,
    iconColor: 'text-amber-500 bg-amber-500/10',
  },
  {
    id: 6,
    name: 'Hasibur Rahman',
    email: 'hasib.rahman@aust.edu',
    subject: 'Database Systems',
    level: 'University Level',
    description:
      'Need help with ER diagrams and normalization.',
    time: '5 days ago',
    status: 'Accepted',
    initials: 'HR',
    icon: Database,
    iconColor: 'text-rose-500 bg-rose-500/10',
  },
];

export default function TuitionRequestList({
  darkMode,
  requests,
  onAccept,
  onViewDetails,
}) {
  return (
    <div
      className={`p-6 rounded-2xl border shadow-sm space-y-4 ${
        darkMode
          ? 'bg-[#1f2937] border-slate-800'
          : 'bg-white border-slate-100'
      }`}
    >
      {requests.map((request) => (
        <TuitionRequestCard
          key={request.id}
          request={request}
          darkMode={darkMode}
          onAccept={onAccept}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}

export { initialRequests };