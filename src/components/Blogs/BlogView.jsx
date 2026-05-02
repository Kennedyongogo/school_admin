import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  CalendarToday,
  Star,
  Article,
  Visibility,
  ThumbUp,
  AccessTime,
} from "@mui/icons-material";

const BlogView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buildImageUrl = (path) => {
    if (!path) return null;
    const normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    if (normalized.startsWith("/")) return normalized;
    return `/${normalized}`;
  };

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load blog");

      const normalized = {
        ...data.data,
        tags: Array.isArray(data.data?.tags)
          ? data.data.tags
          : typeof data.data?.tags === "string"
          ? data.data.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };

      setBlog(normalized);
    } catch (err) {
      setError(err.message || "Failed to load blog");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !blog) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Blog not found"}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/blogs")}
        >
          Back to Blogs
        </Button>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)",
        p: { xs: 0.5, sm: 0.5, md: 0.5 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: 0.5 }}>
        <Box
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            p: 3,
            color: "white",
            borderRadius: 2,
            position: "relative",
            overflow: "hidden",
            mb: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={2} position="relative" zIndex={1}>
            <IconButton
              onClick={() => navigate("/blogs")}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Article sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {blog.title}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Blog details
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/blogs/${blog.id}/edit`)}
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                }}
              >
                Edit
              </Button>
            </Box>
          </Box>
        </Box>

        <Stack spacing={1.5}>
          <Card
            sx={{
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
              borderLeft: "6px solid #B85C38",
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
                Meta
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
                <Chip
                  label={`Status: ${blog.status || "—"}`}
                  color={blog.status === "published" ? "success" : "warning"}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  icon={<Star sx={{ color: blog.featured ? "#B85C38" : "inherit" }} />}
                  label={blog.featured ? "Featured" : "Not Featured"}
                  variant={blog.featured ? "filled" : "outlined"}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
                <Chip label={`Priority: ${blog.priority ?? 0}`} size="small" />
                <Chip label={`Slug: ${blog.slug || "—"}`} variant="outlined" size="small" />
                <Chip label={`Category: ${blog.category || "—"}`} variant="outlined" size="small" />
              </Box>

              {(blog.metaTitle || blog.metaDescription) && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 0.5 }}>
                    SEO
                  </Typography>
                  {blog.metaTitle && (
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{blog.metaTitle}</Typography>
                  )}
                  {blog.metaDescription && (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>{blog.metaDescription}</Typography>
                  )}
                </Box>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Publish Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDate(blog.publishDate || blog.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Read Time
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 0.75 }}>
                    <AccessTime fontSize="small" />
                    {blog.readTime ? `${blog.readTime} min` : "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Status
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {blog.status || "—"}
                  </Typography>
                </Grid>
              </Grid>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                  gap: 1.5,
                  mt: 2,
                  p: 1.5,
                  backgroundColor: "#faf6f2",
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Visibility fontSize="small" sx={{ color: "#B85C38" }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Views
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {blog.views ?? 0}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ThumbUp fontSize="small" sx={{ color: "#B85C38" }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Likes
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {blog.likes ?? 0}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Star fontSize="small" sx={{ color: "#B85C38" }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Priority
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {blog.priority ?? 0}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Share (FB)
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {blog.shareCountFacebook ?? 0}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Share (X)
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {blog.shareCountTwitter ?? 0}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Share (LinkedIn)
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {blog.shareCountLinkedIn ?? 0}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {(blog.createdAt || blog.updatedAt) && (
                <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #eee" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Created {formatDate(blog.createdAt)}
                    {blog.updatedAt && blog.updatedAt !== blog.createdAt && ` · Updated ${formatDate(blog.updatedAt)}`}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
                <Avatar
                  src={buildImageUrl(blog.authorImage)}
                  alt={blog.authorName || "Author"}
                  sx={{ width: 40, height: 40 }}
                />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {blog.authorName || "Unknown author"}
                  </Typography>
                  {blog.authorBio ? (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {blog.authorBio}
                    </Typography>
                  ) : null}
                </Box>
              </Box>
              <Typography variant="body2">
                Publish Date: {formatDate(blog.publishDate || blog.createdAt)}
              </Typography>
              <Typography variant="body2">
                Read Time: {blog.readTime ? `${blog.readTime} min` : "—"}
              </Typography>
            </CardContent>
          </Card>

          <Card
            sx={{
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
              borderLeft: "6px solid #6B4E3D",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Article sx={{ color: "#6B4E3D" }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Content
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#faf6f2",
                  border: "1px dashed #e0d6c8",
                }}
              >
                <Typography variant="body1" sx={{ color: "text.secondary", whiteSpace: "pre-wrap" }}>
                  {blog.content || "No content provided."}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card
            sx={{
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
              borderLeft: "6px solid #6B4E3D",
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                Tags
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                Categorize and discoverability
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {Array.isArray(blog.tags) && blog.tags.length ? (
                  blog.tags.map((tag, idx) => (
                    <Chip
                      key={idx}
                      label={tag}
                      size="small"
                      color="primary"
                      variant={idx % 2 === 0 ? "filled" : "outlined"}
                      sx={{
                        fontWeight: 600,
                        backgroundColor: idx % 2 === 0 ? "#f3e7dd" : "transparent",
                        color: "#6B4E3D",
                        borderColor: "#d8c7b6",
                      }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    None
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          {blog.excerpt && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
                borderLeft: "6px solid #6B4E3D",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
                  Excerpt
                </Typography>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#faf6f2",
                    border: "1px dashed #e0d6c8",
                  }}
                >
                  <Typography variant="body2">{blog.excerpt}</Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {Array.isArray(blog.relatedPostIds) && blog.relatedPostIds.length > 0 && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
                borderLeft: "6px solid #6B4E3D",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
                  Related posts
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {blog.relatedPostIds.map((postId) => (
                    <Chip key={postId} label={postId} size="small" variant="outlined" sx={{ fontFamily: "monospace", fontSize: "0.7rem" }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {buildImageUrl(blog.featuredImage) && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
                borderLeft: "6px solid #6B4E3D",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
                  Featured Image
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                  Hero visual shown on listing and detail pages
                  {blog.heroAltText && ` · Alt: ${blog.heroAltText}`}
                </Typography>
                <Box
                  component="img"
                  src={buildImageUrl(blog.featuredImage)}
                  alt={blog.heroAltText || blog.title}
                  sx={{
                    width: "100%",
                    maxHeight: 440,
                    objectFit: "cover",
                    borderRadius: 2.5,
                    border: "1px solid #eee",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                  }}
                />
              </CardContent>
            </Card>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default BlogView;
