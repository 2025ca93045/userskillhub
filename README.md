# UserSkillHub

A web-based platform that connects learners with instructors for skill development and course management. UserSkillHub enables users to showcase their skills, browse available skills from other users, request mentoring sessions, and manage courses.

## Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Development Guidelines](#development-guidelines)

## Features

### For Stakeholders

#### 🎓 Core Functionality
- **User Management**: Role-based authentication system supporting students and instructors
- **Skill Marketplace**: Browse and discover skills offered by other users in the community
- **Course Management**: Instructors can create and manage courses with associated skills
- **Session Requests**: Students can request learning sessions for specific courses
- **Mentoring System**: Direct skill-based mentoring requests between learners and mentors

#### 👨‍🎓 Student Features
- Create and manage personal skill portfolio with proficiency levels (Beginner, Intermediate, Advanced)
- Browse all available skills in the platform with detailed descriptions
- Request course enrollment from instructors
- Send mentoring requests to skill experts
- Track session request status (pending, accepted, rejected)
- View and manage received mentoring requests from other learners

#### 👨‍🏫 Instructor Features
- Create and manage courses
- Associate required skills with courses
- Review and approve/reject student session requests
- Respond to mentoring requests from students
- Track all session requests for their courses

#### 🔍 Skill Discovery
- Browse all user skills with filtering capabilities
- View skill proficiency levels and descriptions
- See contact information for potential mentors
- Request mentoring from skilled users directly

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite3
- **Authentication**: bcrypt for password hashing, express-session for session management
- **Frontend**: Vanilla HTML, CSS, and JavaScript

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd userskillhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**
   ```bash
   node init_db.js
   ```
   
   This will create the SQLite database with sample data including:
   - Test users (instructors and students)
   - Sample courses
   - Sample skills and skill associations
   - Default password: `password123`

4. **Start the server**
   ```bash
   npm start
   ```
   
   The application will be available at `http://localhost:3000`

### Default Test Accounts

After running the database initialization script, you can use these test accounts:

- **Instructor**: `instructor@example.com` / `password123`
- **Student**: `student@example.com` / `password123`

## Project Structure

```
userskillhub/
├── server.js           # Main Express server with API routes
├── db.js              # Database schema definition
├── init_db.js         # Database initialization with sample data
├── package.json       # Project dependencies and scripts
├── userskillhub.db   # SQLite database file (created after init)
└── public/           # Frontend static files
    ├── auth.html          # Login and registration page
    ├── dashboard.html     # Student dashboard
    ├── instructor.html    # Instructor dashboard
    └── browse-skills.html # Skill browsing interface
```

## API Documentation

### Authentication Endpoints

#### POST `/register`
Register a new user
- **Body**: `{ email, password, role }` (role: "user" or "instructor")
- **Response**: Redirects to login page

#### POST `/login`
Authenticate user
- **Body**: `{ email, password }`
- **Response**: Redirects to appropriate dashboard

#### GET `/me`
Get current user session
- **Response**: User object or null

### Course Endpoints

#### GET `/courses`
List all available courses
- **Response**: Array of courses with instructor information

#### GET `/courses/:id/skills`
Get skills associated with a specific course
- **Response**: Array of skill objects

#### POST `/courses/:id/skills`
Add a skill to a course (instructors only)
- **Body**: `{ skill_id }`
- **Response**: Created course-skill association

#### DELETE `/courses/:id/skills/:skillId`
Remove a skill from a course (instructors only)

### Session Request Endpoints

#### POST `/request`
Request a session for a course
- **Body**: `{ course_id }`
- **Response**: Confirmation message

#### GET `/student-sessions`
Get all session requests for the current student
- **Response**: Array of session requests with status

#### GET `/requests`
Get session requests for instructor's courses (instructors only)
- **Response**: Array of pending session requests

#### POST `/requests/:id/:status`
Update session request status (instructors only)
- **Params**: `status` = "accepted" or "rejected"
- **Response**: Update confirmation

### Skill Endpoints

#### GET `/skills`
List all available skills
- **Response**: Array of skill objects

#### POST `/skills`
Create a new skill
- **Body**: `{ name }`
- **Response**: Created skill object

#### GET `/browse-skills`
Browse all user skills with associated user information
- **Response**: Array of user skills with proficiency levels

### User Skills Endpoints

#### GET `/user-skills`
Get skills for the current user
- **Response**: Array of user's skills with levels

#### POST `/user-skills`
Add a skill to user's profile
- **Body**: `{ name, level, description }`
- **Response**: Created user skill object

#### PUT `/user-skills/:id`
Update a user's skill
- **Body**: `{ level, description }`
- **Response**: Update confirmation

#### DELETE `/user-skills/:id`
Remove a skill from user's profile
- **Response**: Delete confirmation

### Mentoring Request Endpoints

#### POST `/skill-request`
Request mentoring from another user
- **Body**: `{ mentor_id, skill_id }`
- **Response**: Created mentoring request

#### GET `/skill-requests-received`
Get mentoring requests received by current user
- **Response**: Array of incoming mentoring requests

#### GET `/skill-requests-sent`
Get mentoring requests sent by current user
- **Response**: Array of outgoing mentoring requests

#### POST `/skill-requests/:id/:status`
Respond to a mentoring request (accept/reject)
- **Params**: `status` = "accepted" or "rejected"
- **Response**: Update confirmation

## Contributing

We welcome contributions from the community! Here's how you can help:

### How to Contribute

1. **Fork the Repository**
   - Click the 'Fork' button at the top of the repository
   - Clone your forked repository locally

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments where necessary

4. **Test Your Changes**
   - Ensure the application runs without errors
   - Test all affected features
   - Verify database operations work correctly

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add: Brief description of your changes"
   ```

6. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Submit a Pull Request**
   - Go to the original repository
   - Click 'New Pull Request'
   - Provide a clear description of your changes

### Contribution Guidelines

- **Code Style**: Use consistent indentation (2 spaces) and ES6+ syntax
- **Commit Messages**: Use clear, descriptive commit messages
- **Documentation**: Update README if you add new features
- **Testing**: Test your changes thoroughly before submitting
- **API Changes**: Document any new API endpoints or modifications

## Development Guidelines

### Setting Up Development Environment

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Development**
   - Use `init_db.js` to reset the database during development
   - Modify `db.js` to update schema
   - Run `node init_db.js` to apply changes

3. **Server Development**
   - The server runs on port 3000 by default
   - Modify `server.js` to add new routes or middleware
   - Restart the server after making changes

### Code Organization

- **Routes**: Organized by feature (authentication, courses, skills, etc.)
- **Database**: Schema defined in `db.js`, initialization in `init_db.js`
- **Frontend**: Static HTML files in `public/` directory
- **Sessions**: Express-session for user authentication

### Adding New Features

When adding new features, consider:
1. **Database Changes**: Update schema in `db.js` and `init_db.js`
2. **API Endpoints**: Add routes in `server.js` with proper authentication
3. **Frontend**: Create or modify HTML files in `public/`
4. **Documentation**: Update this README with new features and endpoints

### Security Considerations

- Passwords are hashed using bcrypt
- Session-based authentication with express-session
- Input validation on API endpoints
- SQL injection prevention using parameterized queries
- Role-based access control for instructor endpoints

### Database Schema

The application uses the following main tables:
- **users**: User accounts with roles
- **courses**: Course information
- **skills**: Global skill definitions
- **user_skills**: User skill proficiency associations
- **course_skills**: Course-skill associations
- **session_requests**: Course enrollment requests
- **skill_requests**: Mentoring requests

### Future Enhancement Ideas

- Email notifications for request status updates
- Real-time chat between mentors and learners
- Calendar integration for scheduling sessions
- Skill endorsements and ratings
- Advanced search and filtering
- User profiles with detailed information
- Progress tracking for learners
- Certificate generation upon course completion

## License

This project is available for educational purposes.

## Support

For questions or issues, please open an issue in the repository or contact the development team.

---

**Happy Learning! 🚀**
