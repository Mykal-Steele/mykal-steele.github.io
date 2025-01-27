const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");

// Create a Post (Protected route)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const newPost = new Post({
      title,
      content,
      user: req.user.id, // Get user ID from JWT
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get all Posts (example)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", ["username"]) // Populate user who created the post
      .populate("likes", ["username"]); // Populate likes with user details

    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Show a single Post with Likes and Comments populated
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", ["username"]) // Populate user who created the post
      .populate("likes", ["username"]) // Populate likes with user details
      .populate("comments.user", ["username"]); // Populate comment authors

    if (!post) {
      return res.status(404).json("Post not found");
    }

    res.status(200).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Like & Unlike (Protected route)
router.put("/:id/like", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json("Post not found");
    }

    // Check if the user already liked the post
    if (post.likes.includes(req.user.id)) {
      // Unlike the post
      post.likes.pull(req.user.id);
    } else {
      // Like the post
      post.likes.push(req.user.id);
    }

    await post.save();

    // Fetch the updated post and populate likes and user fields
    const updatedPost = await Post.findById(req.params.id)
      .populate("user", ["username"])
      .populate("likes", ["username"]); // Populate likes with user details
    res.status(200).json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Create a Comment (Protected route)
router.post("/:id/comment", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json("Post not found");
    }

    const newComment = {
      text: req.body.text,
      user: req.user.id,
    };

    post.comments.push(newComment);
    await post.save();

    // Fetch the updated post with populated likes
    const updatedPost = await Post.findById(req.params.id)
      .populate("user", ["username"])
      .populate("likes", ["username"]) // Populate likes with user details
      .populate("comments.user", ["username"]); // Populate comment authors
    res.status(200).json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
