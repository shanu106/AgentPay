import React from 'react';
import { Link } from 'react-router-dom';
import './CourseCard.css';

function CourseCard({ course }) {
  const badgeColors = {
    'Web Development': '#6c63ff',
    'Data Science': '#00b894',
    'Backend Development': '#fd79a8',
    'AI & ML': '#e17055',
    'Full Stack': '#00cec9'
  };

  const badgeColor = badgeColors[course.category] || '#6c63ff';

  return (
    <div className="course-card">
      <div className="course-card-image">
        <img src={course.image} alt={course.title} />
        <span className="course-level" style={{ background: badgeColor }}>
          {course.level}
        </span>
      </div>
      <div className="course-card-body">
        <span className="course-category" style={{ color: badgeColor }}>{course.category}</span>
        <h3 className="course-title">{course.title}</h3>
        <p className="course-subtitle">{course.subtitle}</p>
        <div className="course-instructor">
          <div className="instructor-avatar">
            {course.instructor.split(' ').map(n => n[0]).join('')}
          </div>
          <span>{course.instructor}</span>
        </div>
        <div className="course-stats">
          <span className="stat">⭐ {course.rating}</span>
          <span className="stat">👤 {course.studentsCount}</span>
          <span className="stat">⏱ {course.duration}</span>
        </div>
        <div className="course-price-row">
          <div className="course-pricing">
            <span className="current-price">{course.priceDisplay}</span>
            <span className="original-price">{course.originalPrice}</span>
          </div>
          <Link to={`/course/${course.id}`} className="btn-view">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CourseCard;