# 🎬 VideoTube Backend

A fully featured backend API for a YouTube-like video sharing platform.  
Includes authentication, channels, videos, playlists, posts, comments, likes, subscriptions, and activity tracking.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Environment Variables](#-environment-variables)
- [Installation and Setup](#-installation-and-setup)
- [API Endpoints](#-api-endpoints)
- [File Uploads](#-file-uploads)
- [Security](#-security)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Features

### 🔐 Authentication & User Management
- Register / Login / Logout
- JWT-based authentication (Access & Refresh Tokens)
- Suspended / banned account protection
- Update account details
- Change password
- Soft-delete account
- Fully secured HTTP-only cookies

### 👤 Profiles
- Public profile (username-based lookup)
- Avatar & cover image upload
- Social links, bio, location
- Subscribed channels list

### 📺 Channels
- Create / Update / Delete channel
- Unique channel handle
- Banner image update
- Dashboard analytics
- Channel metadata
- Subscriber count auto-update

### 🎥 Videos
- Upload video + thumbnail (via Cloudinary)
- Publish / Unpublish
- Edit title, description, thumbnail
- Delete video
- Fetch all public videos
- Fetch video by ID (with channel details)
- Category & search support
- View count auto-increment

### 🎞️ Playlists
- Create playlist
- Add video to playlist (ordered)
- Remove video from playlist
- Update playlist details
- Delete playlist
- Visibility support: `PUBLIC` | `PRIVATE` | `UNLISTED`

### 📝 Posts (Community)
- Create post (text + media)
- Like post
- Comment on post
- Visibility: `PUBLIC` | `PRIVATE` | `UNLISTED`

### 💬 Comments
- Add comment to video/post
- Reply to comment (nested threading)
- Like comment
- Delete comment
- Pin comment (for creators)
- Pagination support

### 👍 Likes
- Like / Unlike: Videos, Posts, Comments
- Auto-update like count
- Prevent duplicate likes (unique index)

### 🔔 Subscriptions
- Subscribe / Unsubscribe to a channel
- Fetch subscriber list
- Fetch subscribed channels
- Auto-update subscriber count

### 🧾 Activity Tracking
- Tracks: Watch, Like, Comment, Post creation
- Enables future analytics (Phase 2)

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM for MongoDB |
| **Cloudinary** | Media storage & delivery |
| **JWT** | Authentication tokens |
| **Multer** | File upload handling |
| **bcrypt** | Password hashing |

---

## 🗂 Folder Structure

```
└── src/
    ├── app.js                
    ├── constants.js           
    ├── index.js               
    │
    ├── controllers/
    │   ├── activity.controller.js
    │   ├── channel.controller.js
    │   ├── comment.controller.js
    │   ├── like.controller.js
    │   ├── playlist.controller.js
    │   ├── post.controller.js
    │   ├── profile.controller.js
    │   ├── subscription.controller.js
    │   ├── user.controller.js
    │   └── video.controller.js
    │
    ├── db/
    │   └── index.js           
    │
    ├── middlewares/
    │   ├── auth.middleware.js
    │   ├── errorHandler.middleware.js
    │   └── multer.middleware.js
    │
    ├── models/
    │   ├── activity.model.js
    │   ├── channel.model.js
    │   ├── comment.model.js
    │   ├── like.model.js
    │   ├── playlist.model.js
    │   ├── post.model.js
    │   ├── profile.model.js
    │   ├── subscription.model.js
    │   ├── user.model.js
    │   └── video.model.js
    │
    ├── routes/
    │   ├── activity.route.js
    │   ├── channel.route.js
    │   ├── comment.route.js
    │   ├── like.route.js
    │   ├── playlist.route.js
    │   ├── post.route.js
    │   ├── profile.route.js
    │   ├── subscription.route.js
    │   ├── user.route.js
    │   └── video.route.js
    │
    └── utils/
        ├── ApiError.js        
        ├── ApiResponse.js     
        ├── asyncHandler.js    
        └── cloudinary.js      
```

---

## ⚙ Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=4000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Tokens
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=30d

# Security
SALT_ROUNDS=10
```

---

## ▶ Installation and Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Cloudinary account

### 1. Clone the repository
```bash
git clone https://github.com/ranjankr73/videotube.git
cd videotube
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env
# Edit .env with your configuration
```

### 4. Start MongoDB
```bash
mongod
```

### 5. Run the development server
```bash
npm run dev
```

Server runs at: `http://localhost:4000`

---

## 📡 API Endpoints

### 🔐 Users `/api/v1/users`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/register` | Register new user | ❌ |
| `POST` | `/login` | Login user | ❌ |
| `POST` | `/refresh-token` | Refresh access token | ❌ |
| `POST` | `/logout` | Logout user | ✅ |
| `POST` | `/change-password` | Change password | ✅ |
| `GET` | `/current-user` | Get current user | ✅ |
| `PATCH` | `/update-account` | Update account details | ✅ |
| `DELETE` | `/delete-account` | Delete account | ✅ |

### 👤 Profiles `/api/v1/profiles`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/:username` | Get public profile | ❌ |
| `GET` | `/me` | Get own profile | ✅ |
| `PATCH` | `/` | Update profile | ✅ |
| `PATCH` | `/avatar` | Update avatar | ✅ |
| `PATCH` | `/cover-image` | Update cover image | ✅ |

### 📺 Channels `/api/v1/channels`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/u/:handle` | Get channel by handle | ❌ |
| `POST` | `/` | Create channel | ✅ |
| `PATCH` | `/` | Update channel details | ✅ |
| `DELETE` | `/` | Delete channel | ✅ |
| `GET` | `/stats` | Get channel stats | ✅ |
| `PATCH` | `/banner` | Update channel banner | ✅ |

### 🎥 Videos `/api/v1/videos`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | Get all videos | ❌ |
| `GET` | `/:videoId` | Get video by ID | ❌ |
| `POST` | `/` | Publish a video | ✅ |
| `PATCH` | `/:videoId` | Update video | ✅ |
| `DELETE` | `/:videoId` | Delete video | ✅ |
| `PATCH` | `/toggle/publish/:videoId` | Toggle publish status | ✅ |

### 🔔 Subscriptions `/api/v1/subscriptions`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/c/:channelId` | Get channel subscribers | ✅ |
| `POST` | `/c/:channelId` | Toggle subscription | ✅ |
| `GET` | `/u/:subscriberId` | Get subscribed channels | ✅ |

### 🎞️ Playlists `/api/v1/playlists`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/:playlistId` | Get playlist by ID | ❌ |
| `GET` | `/u/:userId` | Get user's playlists | ❌ |
| `POST` | `/` | Create playlist | ✅ |
| `GET` | `/me` | Get current user's playlists | ✅ |
| `PATCH` | `/:playlistId` | Update playlist | ✅ |
| `DELETE` | `/:playlistId` | Delete playlist | ✅ |
| `POST` | `/:playlistId/videos` | Add video to playlist | ✅ |
| `DELETE` | `/:playlistId/videos/:videoId` | Remove video from playlist | ✅ |

### 📝 Posts `/api/v1/posts`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/:postId` | Get post by ID | ❌ |
| `GET` | `/channel/:handle` | Get channel posts | ❌ |
| `POST` | `/` | Create post | ✅ |
| `PATCH` | `/:postId` | Update post | ✅ |
| `DELETE` | `/:postId` | Delete post | ✅ |
| `PATCH` | `/toggle/publish/:postId` | Toggle post publish status | ✅ |

### 💬 Comments `/api/v1/comments`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/video/:videoId` | Get comments for video | ❌ |
| `GET` | `/post/:postId` | Get comments for post | ❌ |
| `POST` | `/video/:videoId` | Add comment to video | ✅ |
| `POST` | `/post/:postId` | Add comment to post | ✅ |
| `POST` | `/reply/:commentId` | Reply to comment | ✅ |
| `PATCH` | `/:commentId` | Update comment | ✅ |
| `DELETE` | `/:commentId` | Delete comment | ✅ |
| `PATCH` | `/pin/:commentId` | Pin comment | ✅ |

### 👍 Likes `/api/v1/likes`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/video/:videoId` | Toggle video like | ✅ |
| `POST` | `/post/:postId` | Toggle post like | ✅ |
| `POST` | `/comment/:commentId` | Toggle comment like | ✅ |
| `GET` | `/videos` | Get liked videos | ✅ |
| `GET` | `/posts` | Get liked posts | ✅ |
| `GET` | `/comments` | Get liked comments | ✅ |

### 🧾 Activities `/api/v1/activities`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/me` | Get my activity | ✅ |
| `POST` | `/watch/:videoId` | Log watch activity | ✅ |
| `POST` | `/like` | Log like activity | ✅ |
| `POST` | `/comment/:commentId` | Log comment activity | ✅ |
| `POST` | `/post/:postId` | Log post activity | ✅ |
| `DELETE` | `/:activityId` | Delete activity | ✅ |


---

## ☁ File Uploads

Videos and thumbnails are uploaded to Cloudinary using utility functions:

```javascript
uploadOnCloudinary(localFilePath)   
deleteFromCloudinary(publicId)      
```

Ensure your Cloudinary credentials are configured in `.env`.

---

## 🔒 Security

- ✅ HTTP-only cookies for tokens
- ✅ CSRF-safe implementation
- ✅ Rate limiting ready
- ✅ Input sanitization
- ✅ Model-level validation
- ✅ Error isolation & handling
- ✅ Password hashing with bcrypt

---

## 📈 Roadmap

### Phase 2 (Upcoming)
- [ ] Watch history
- [ ] Notification system
- [ ] Recommendation engine
- [ ] Advanced analytics dashboard
- [ ] Video processing queue
- [ ] Monetization features

---

## 🧪 API Testing

You can test the API using:

- [Postman](https://www.postman.com/)
- [Thunder Client](https://www.thunderclient.com/)
- [Hoppscotch](https://hoppscotch.io/)

All endpoints return structured responses via `ApiResponse` class.  
Error handling is managed through `ApiError` class.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please follow the existing code style and project structure.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**

- GitHub: [@ranjankr73](https://github.com/ranjankr73)
- LinkedIn: [ranjankr73](https://www.linkedin.com/in/ranjankr73/)

---

<p align="center">
  Made with ❤️ by VideoTube Team
</p>

