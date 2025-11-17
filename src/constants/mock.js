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

export const mockEvents = [
  {
    id: 1,
    title: "Tech Meetup 2023",
    description: "Join us for an evening of networking and tech talks",
    date: new Date("2023-12-20T19:00:00"),
    location: "Tech Hub, Downtown",
    attendees: 45,
    image: "https://picsum.photos/400/200?random=3",
    createdBy: 1,
  },
  {
    id: 2,
    title: "Photography Workshop",
    description: "Learn the basics of portrait photography",
    date: new Date("2023-12-15T10:00:00"),
    location: "Creative Studio",
    attendees: 12,
    image: "https://picsum.photos/400/200?random=4",
    createdBy: 2,
  },
];

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
