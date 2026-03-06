'use client';
import { useState, useEffect } from 'react';

export interface TeacherProfile {
  id: string;
  name: string;
}

const KEY = 'al_teacher';

export function useTeacherAuth() {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setTeacher(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const login = async (name: string) => {
    const res = await fetch('/api/adaptive-learning/teacher/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Login failed');
    const profile: TeacherProfile = { id: data.teacher_id, name };
    localStorage.setItem(KEY, JSON.stringify(profile));
    setTeacher(profile);
    return profile;
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    setTeacher(null);
  };

  return { teacher, loading, login, logout };
}
