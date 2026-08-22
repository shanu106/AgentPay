import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchCourseById } from '../api/payment';
import './CourseDetail.css';

function CourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCourseById(courseId);
      setCourse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="error-container">
        <h2>Course not found</h2>
        <p>{error || 'The course you are looking for does not exist.'}</p>
        <Link to="/" className="btn-retry">Back to Courses</Link>
      </div>
    );
  }

  const toggleSection = (index) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  return (
    <div className="course-detail-page">
      <Link to="/" className="back-link">← Back to Courses</Link>

      <div className="course-detail-header">
        <div className="course-detail-info">
          <span className="detail-category">{course.category}</span>
          <h1 className="detail-title">{course.title}</h1>
          <p className="detail-subtitle">{course.subtitle}</p>
          <div className="detail-meta">
            <span className="meta-item">⭐ {course.rating}</span>
            <span className="meta-item">👤 {course.studentsCount} students</span>
            <span className="meta-item">⏱ {course.duration}</span>
            <span className="meta-item">📚 {course.lessons} lessons</span>
          </div>
          <div className="detail-instructor">
            <div className="instructor-avatar-large">
              {course.instructor.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="instructor-name">{course.instructor}</p>
              <p className="instructor-role">{course.instructorRole}</p>
            </div>
          </div>
          <div className="detail-pricing">
            <span className="detail-current-price">{course.priceDisplay}</span>
            <span className="detail-original-price">{course.originalPrice}</span>
            <span className="detail-discount">{Math.round((1 - parseInt(course.priceDisplay.replace('₹','')) / parseInt(course.originalPrice.replace('₹','').replace(/,/g,''))) * 100)}% OFF</span>
          </div>
          <Link to={`/checkout/${course.id}`} className="btn-enroll">
            Enroll Now — {course.priceDisplay}
          </Link>
        </div>
        <div className="course-detail-image">
          <img src={course.image} alt={course.title} />
        </div>
      </div>

      <div className="course-detail-sections">
        <div className="detail-section">
          <h2>About This Course</h2>
          <p className="detail-description">{course.description}</p>
        </div>

        <div className="detail-section">
          <h2>What You'll Learn</h2>
          <div className="learning-grid">
            {course.learningObjectives.map((obj, i) => (
              <div key={i} className="learning-item">
                <span className="check-icon">✓</span>
                <span>{obj}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h2>Curriculum</h2>
          <div className="curriculum">
            {course.curriculum.map((section, index) => (
              <div key={index} className={`curriculum-item ${expandedSection === index ? 'expanded' : ''}`}>
                <button className="curriculum-header" onClick={() => toggleSection(index)}>
                  <span className="curriculum-icon">{expandedSection === index ? '▼' : '▶'}</span>
                  <span className="curriculum-title">{section.title}</span>
                  <span className="curriculum-meta">{section.duration}</span>
                </button>
                <div className="curriculum-content">
                  <p>{section.lessons} lessons</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;