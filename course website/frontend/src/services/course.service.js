import { API_BASE } from '../config/constants';

const handleResponse = async (res) => {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned unexpected response (${res.status} ${res.statusText})`);
  }
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
};

export const courseService = {
  async fetchCourses() {
    const res = await fetch(`${API_BASE}/courses`);
    const data = await handleResponse(res);
    if (!data.success) throw new Error('Failed to fetch courses');
    return data.courses;
  },

  async fetchCourseById(courseId) {
    const res = await fetch(`${API_BASE}/courses/${courseId}`);
    const data = await handleResponse(res);
    if (!data.success) throw new Error('Course not found');
    return data.course;
  }
};
