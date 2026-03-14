'use client';
import { useState, useEffect } from 'react';

export interface StudentProfile {
  id: string;
  name: string;
  class_name: string;
  grade: string;
  language: 'EN' | 'ZH';
}

const KEY = 'al_student';

export function useStudentAuth() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setStudent(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const login = async (name: string, className: string, grade: string, language: 'EN' | 'ZH') => {
    // Pilot: create/fetch user via API
    const res = await fetch('/api/adaptive-learning/student/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, class_name: className, grade, language }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Login failed');
    const profile: StudentProfile = { id: data.student_id, name, class_name: className, grade, language };
    localStorage.setItem(KEY, JSON.stringify(profile));
    setStudent(profile);
    return profile;
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    localStorage.removeItem('al_session');
    setStudent(null);
  };

  return { student, loading, login, logout };
}
