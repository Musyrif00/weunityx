export const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    username: "johndoe",
    avatar: "https://i.pravatar.cc/150?img=1",
    verified: true,
    followers: 1234,
    following: 567,
    bio: "Tech enthusiast and coffee lover ☕",
  },
  {
    id: 2,
    name: "Jane Smith",
    username: "janesmith",
    avatar: "https://i.pravatar.cc/150?img=2",
    verified: false,
    followers: 890,
    following: 234,
    bio: "Designer & Photographer 📸",
  },
];

export const mockPosts = [
  {
    id: 1,
    userId: 1,
    content: "Beautiful sunset today! 🌅",
    image: "https://picsum.photos/400/300?random=1",
    likes: 45,
    comments: 12,
    timestamp: new Date("2023-11-15T18:30:00"),
    location: "Central Park, NY",
  },
  {
    id: 2,
    userId: 2,
    content: "Working on a new design project. What do you think?",
    image: "https://picsum.photos/400/300?random=2",
    likes: 78,
    comments: 23,
    timestamp: new Date("2023-11-15T14:20:00"),
  },
];

// Events removed - mockEvents was here

export const mockMessages = [
  {
    id: 1,
    senderId: 1,
    receiverId: 2,
    message: "Hey! How are you doing?",
    timestamp: new Date("2023-11-15T16:30:00"),
    read: true,
  },
  {
    id: 2,
    senderId: 2,
    receiverId: 1,
    message: "I'm good! Working on some new designs. You?",
    timestamp: new Date("2023-11-15T16:35:00"),
    read: true,
  },
];
