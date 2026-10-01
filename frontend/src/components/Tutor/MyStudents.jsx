import React from 'react';
import { Users } from 'lucide-react';
import ArrangementPanel from '../Relationships/ArrangementPanel';

/*
 * The students a tutor is teaching, and the ones they used to.
 *
 * The dashboard previously reported a count and nothing else, so managing a
 * student meant going somewhere else to find them.
 */
export default function MyStudents({
  darkMode,
  students,
  pastStudents,
  loading,
  searchQuery,
  onMessage,
  onRemove,
  onOpenProfile,
  onRated,
  onScheduled,
}) {
  return (
    <ArrangementPanel
      darkMode={darkMode}
      anchorId="my-students"
      title="My Students"
      idKey="student_id"
      current={students}
      past={pastStudents}
      loading={loading}
      searchQuery={searchQuery}
      reviewDirection="tutor_to_student"
      labels={{
        currentTab: 'Current',
        pastTab: 'Past',
        sinceWord: 'Teaching since',
        rateTitle: 'Rate this student',
        removeTitle: 'Stop teaching this student',
        confirmButton: 'Yes, stop teaching',
        emptyIcon: Users,
        noMatch: 'No students match that search.',
        currentEmpty: 'No active students yet. Accept a tuition request to start teaching.',
        pastEmpty: 'Nobody here yet. Students you stop teaching are kept here.',
        confirmCopy: (name) =>
          `Stop teaching ${name}? Your conversation closes, and they still count towards students taught.`,
      }}
      onMessage={onMessage}
      onRemove={onRemove}
      onOpenProfile={onOpenProfile}
      onRated={onRated}
      onScheduled={onScheduled}
    />
  );
}
