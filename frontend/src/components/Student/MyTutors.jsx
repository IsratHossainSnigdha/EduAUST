import React from 'react';
import { GraduationCap } from 'lucide-react';
import ArrangementPanel from '../Relationships/ArrangementPanel';

/*
 * The tutors teaching this student, and the ones who used to.
 *
 * The mirror of the tutor's My Students panel. A student could previously see
 * a count of tutors and nothing else, so acting on one meant hunting for them
 * in the message list.
 */
export default function MyTutors({
  darkMode,
  tutors,
  pastTutors,
  loading,
  searchQuery,
  onMessage,
  onRemove,
  onOpenProfile,
  onRated,
}) {
  return (
    <ArrangementPanel
      darkMode={darkMode}
      anchorId="my-tutors"
      title="My Tutors"
      idKey="tutor_id"
      current={tutors}
      past={pastTutors}
      loading={loading}
      searchQuery={searchQuery}
      reviewDirection="student_to_tutor"
      labels={{
        currentTab: 'Current',
        pastTab: 'Past',
        sinceWord: 'Learning since',
        rateTitle: 'Rate this tutor',
        removeTitle: 'Stop learning from this tutor',
        confirmButton: 'Yes, end tutoring',
        emptyIcon: GraduationCap,
        noMatch: 'No tutors match that search.',
        currentEmpty: 'No tutors yet. Send a request and one appears here once it is accepted.',
        pastEmpty: 'Nobody here yet. Tutors you stop working with are kept here.',
        confirmCopy: (name) =>
          `Stop learning from ${name}? Your conversation closes, and you can send a new request later if you change your mind.`,
      }}
      onMessage={onMessage}
      onRemove={onRemove}
      onOpenProfile={onOpenProfile}
      onRated={onRated}
    />
  );
}
