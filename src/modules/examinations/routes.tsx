import React, { useState } from 'react';
import { ExamsPage } from './pages/ExamsPage';
import { ClassMarksEntryPage } from './pages/ClassMarksEntryPage';

export const ExaminationsContainer: React.FC = () => {
  const [view, setView] = useState<'EXAMS_LIST' | 'MARKS_ENTRY'>('EXAMS_LIST');

  if (view === 'MARKS_ENTRY') {
    return <ClassMarksEntryPage onBack={() => setView('EXAMS_LIST')} />;
  }

  return <ExamsPage onNavigateToMarksEntry={() => setView('MARKS_ENTRY')} />;
};

export const routes = [{ path: 'examinations/*', element: <ExaminationsContainer /> }];
